import { apiFetch, AUTH_TOKEN_KEY, AUTH_USER_KEY } from './client';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  birthdate?: string;
  roles?: string[];
}

export interface AuthResponse {
  accessToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  nickname: string;
  birthdate: string;
  password: string;
  roles?: string[];
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function persistAuthSession(data: AuthResponse) {
  if (typeof window === 'undefined') return;
  const token = data.accessToken;
  const userJson = JSON.stringify(data.user);

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem('dungeoneer_token', token);
  window.localStorage.setItem(AUTH_USER_KEY, userJson);
  window.localStorage.setItem('dungeoneer_user', userJson);

  setCookie(AUTH_TOKEN_KEY, token);
  setCookie('dungeoneer_token', token);
  setCookie(AUTH_USER_KEY, userJson);
  setCookie('dungeoneer_user', userJson);

  window.dispatchEvent(new Event('auth-state-change'));
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
    skipAuth: true,
  });
  persistAuthSession(data);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return login({ email, password });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
  persistAuthSession(data);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return register(payload);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token =
    window.localStorage.getItem(AUTH_TOKEN_KEY) ||
    window.localStorage.getItem('dungeoneer_token') ||
    getCookie(AUTH_TOKEN_KEY) ||
    getCookie('dungeoneer_token');
  if (!token) return null;
  if (isTokenExpired(token)) {
    logout();
    return null;
  }
  return token;
}

export const getStoredToken = getToken;

export function getUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const token = getToken();
  if (!token) return null;
  const userStr =
    window.localStorage.getItem(AUTH_USER_KEY) ||
    window.localStorage.getItem('dungeoneer_user') ||
    getCookie(AUTH_USER_KEY) ||
    getCookie('dungeoneer_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as UserProfile;
  } catch {
    return null;
  }
}

export const getStoredUser = getUser;

export async function selfPromoteToDm(): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/me/roles/promote-dm', {
    method: 'POST',
  });
  persistAuthSession(response);
  return response;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    window.localStorage.removeItem('dungeoneer_token');
    window.localStorage.removeItem(AUTH_USER_KEY);
    window.localStorage.removeItem('dungeoneer_user');

    deleteCookie(AUTH_TOKEN_KEY);
    deleteCookie('dungeoneer_token');
    deleteCookie(AUTH_USER_KEY);
    deleteCookie('dungeoneer_user');

    window.dispatchEvent(new Event('auth-state-change'));
  }
}

export const clearAuth = logout;
