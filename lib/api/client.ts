import { toast } from 'sonner';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9090';

export const AUTH_TOKEN_KEY = 'dungeoneer_auth_token';
export const AUTH_USER_KEY = 'dungeoneer_auth_user';

export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string> | Array<{ field?: string; message?: string }>;
}

export class ApiError extends Error {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string> | Array<{ field?: string; message?: string }>;

  constructor(problem: ProblemDetail) {
    const message = formatProblemDetailMessage(problem);
    super(message);
    this.name = 'ApiError';
    this.status = problem.status;
    this.title = problem.title ?? 'Erro na requisição';
    this.detail = message;
    this.errors = problem.errors;
  }
}

const DEFAULT_PT_BR_MESSAGES: Record<number, string> = {
  400: 'Dados inválidos enviados na requisição.',
  401: 'Sua sessão expirou ou as credenciais são inválidas. Faça login novamente.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'Recurso não encontrado.',
  409: 'Conflito: o registro já existe ou o estado atual impede esta operação.',
  422: 'Não foi possível processar os dados enviados. Verifique os campos informados.',
  500: 'Erro interno no servidor. Tente novamente mais tarde.',
};

export function formatProblemDetailMessage(problem: ProblemDetail): string {
  if (problem.errors) {
    if (Array.isArray(problem.errors) && problem.errors.length > 0) {
      const details = problem.errors
        .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
        .filter(Boolean)
        .join('; ');
      if (details) {
        return problem.detail ? `${problem.detail} (${details})` : details;
      }
    } else if (typeof problem.errors === 'object') {
      const entries = Object.entries(problem.errors);
      if (entries.length > 0) {
        const details = entries.map(([k, v]) => `${k}: ${v}`).join('; ');
        return problem.detail ? `${problem.detail} (${details})` : details;
      }
    }
  }

  if (problem.detail && problem.detail.trim().length > 0) {
    return translateCommonBackendDetail(problem.detail, problem.status, problem.instance);
  }

  if (
    problem.title &&
    problem.title.trim().length > 0 &&
    problem.title !== 'Bad Request' &&
    problem.title !== 'Conflict' &&
    problem.title !== 'Unprocessable Entity' &&
    problem.title !== 'Not Found' &&
    problem.title !== 'Unauthorized' &&
    problem.title !== 'Internal Server Error'
  ) {
    return problem.title;
  }

  return (
    DEFAULT_PT_BR_MESSAGES[problem.status] ??
    'Ocorreu um erro inesperado ao comunicar com o servidor.'
  );
}

function translateCommonBackendDetail(detail: string, status: number, instance?: string): string {
  const lower = detail.toLowerCase();
  if (lower.includes('already rolled') || lower.includes('roll already exists') || lower.includes('already consumed')) {
    return 'A rolagem de atributos já foi realizada para esta criação de personagem.';
  }
  if (lower.includes('invalid credentials') || lower.includes('bad credentials')) {
    return 'E-mail ou senha inválidos.';
  }
  if (lower.includes('email already') || lower.includes('already registered')) {
    return 'Este endereço de e-mail já está cadastrado.';
  }
  if (lower.includes('point buy') || lower.includes('27 points')) {
    return 'A distribuição de pontos de atributo excede ou é inválida para o limite de 27 pontos.';
  }
  if (status === 401 && lower.includes('unauthorized')) {
    return DEFAULT_PT_BR_MESSAGES[401];
  }
  if (lower.includes('uq_character_feat') || (lower.includes('duplicate') && lower.includes('character_feat'))) {
    return 'Este personagem já possui o talento selecionado.';
  }
  if (lower.includes('internal server error') && (lower.includes('/api/') || instance)) {
    const path = instance || (detail.includes('(') ? detail.slice(detail.indexOf('(') + 1, detail.indexOf(')')) : '');
    return `Erro interno no servidor ao processar ${path || 'a requisição'}. Tente novamente mais tarde.`;
  }
  return detail;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      window.localStorage.getItem(AUTH_TOKEN_KEY) ||
      window.localStorage.getItem('dungeoneer_token') ||
      getCookie(AUTH_TOKEN_KEY) ||
      getCookie('dungeoneer_token')
    );
  } catch {
    return null;
  }
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  suppressErrorToast?: boolean;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth = false, suppressErrorToast = false, headers, ...rest } = options;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has('Content-Type') && rest.body && typeof rest.body === 'string') {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (!requestHeaders.has('Accept')) {
    requestHeaders.set('Accept', 'application/json, application/problem+json');
  }

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
    });
  } catch {
    const networkProblem: ProblemDetail = {
      status: 0,
      title: 'Falha de conexão',
      detail: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
    };
    const apiErr = new ApiError(networkProblem);
    if (!suppressErrorToast) {
      toast.error(apiErr.detail);
    }
    throw apiErr;
  }

  if (!response.ok) {
    let problem: ProblemDetail = {
      status: response.status,
      title: response.statusText,
    };

    try {
      const text = await response.text();
      if (text) {
        const parsed = JSON.parse(text);
        const fallbackDetail =
          parsed.detail ??
          parsed.message ??
          (parsed.error && parsed.path
            ? `${parsed.error} (${parsed.path})`
            : parsed.error);

        problem = {
          status: parsed.status ?? response.status,
          title: parsed.title ?? response.statusText,
          detail: fallbackDetail,
          type: parsed.type,
          instance: parsed.instance ?? parsed.path,
          errors: parsed.errors ?? parsed.fieldErrors,
        };
      }
    } catch {
      // Fallback to status-based default message
    }

    const apiErr = new ApiError(problem);

    if (response.status === 401 && !skipAuth) {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(AUTH_TOKEN_KEY);
          window.localStorage.removeItem('dungeoneer_token');
          window.localStorage.removeItem(AUTH_USER_KEY);
          window.localStorage.removeItem('dungeoneer_user');
          document.cookie = `${AUTH_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
          document.cookie = `dungeoneer_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
          document.cookie = `${AUTH_USER_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
          document.cookie = `dungeoneer_user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
          window.dispatchEvent(new Event('auth-state-change'));
        } catch {
          // ignore storage errors
        }
        if (
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          window.location.assign('/login');
        }
      }
    }

    if (!suppressErrorToast) {
      toast.error(apiErr.detail);
    }

    throw apiErr;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('problem+json')) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
