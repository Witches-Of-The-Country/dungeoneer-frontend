const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:8082";

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  birthdate: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Falha na autenticação. Verifique seu email e senha.");
  }

  const data: AuthResponse = await res.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("dungeoneer_token", data.accessToken);
    localStorage.setItem("dungeoneer_user", JSON.stringify(data.user));
    setCookie("dungeoneer_token", data.accessToken);
    setCookie("dungeoneer_user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("auth-state-change"));
  }
  return data;
}

export async function registerUser(payload: {
  email: string;
  nickname: string;
  birthdate: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.detail || "Falha ao registrar aventureiro.");
  }

  const data: AuthResponse = await res.json();
  if (typeof window !== "undefined") {
    localStorage.setItem("dungeoneer_token", data.accessToken);
    localStorage.setItem("dungeoneer_user", JSON.stringify(data.user));
    setCookie("dungeoneer_token", data.accessToken);
    setCookie("dungeoneer_user", JSON.stringify(data.user));
    window.dispatchEvent(new Event("auth-state-change"));
  }
  return data;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dungeoneer_token") || getCookie("dungeoneer_token");
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("dungeoneer_user") || getCookie("dungeoneer_user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("dungeoneer_token");
    localStorage.removeItem("dungeoneer_user");
    deleteCookie("dungeoneer_token");
    deleteCookie("dungeoneer_user");
    window.dispatchEvent(new Event("auth-state-change"));
  }
}
