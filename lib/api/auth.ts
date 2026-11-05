import { apiFetch, AUTH_TOKEN_KEY, AUTH_USER_KEY, setTokenProvider } from './client';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  birthdate?: string;
  roles?: string[];
  avatarUrl?: string | null;
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

export interface PublicKeyResponse {
  publicKey: string;
  algorithm: string;
  hash: string;
}

let inMemoryToken: string | null = null;
let cachedPublicKey: CryptoKey | null = null;

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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/\s+/g, ''));
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function fetchPublicKey(): Promise<CryptoKey | null> {
  if (cachedPublicKey) return cachedPublicKey;
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
  try {
    const res = await apiFetch<PublicKeyResponse>('/api/auth/public-key', { skipAuth: true });
    if (!res?.publicKey) return null;
    const der = base64ToArrayBuffer(res.publicKey);
    cachedPublicKey = await window.crypto.subtle.importKey(
      'spki',
      der,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
    return cachedPublicKey;
  } catch (err) {
    console.warn('Failed to fetch public key for password encryption:', err);
    return null;
  }
}

export async function encryptPassword(plainPassword: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    return plainPassword;
  }
  try {
    const key = await fetchPublicKey();
    if (!key) return plainPassword;
    const encoded = new TextEncoder().encode(plainPassword);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      key,
      encoded
    );
    return `rsa:${arrayBufferToBase64(encryptedBuffer)}`;
  } catch (err) {
    console.warn('RSA-OAEP encryption failed, sending raw credentials:', err);
    return plainPassword;
  }
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
  inMemoryToken = data.accessToken;
  const userJson = JSON.stringify(data.user);

  // Eliminate JWT storage in localStorage and client document.cookie (SEC-HIGH-02)
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem('dungeoneer_token');
  deleteCookie(AUTH_TOKEN_KEY);
  deleteCookie('dungeoneer_token');

  // Persist only non-sensitive user profile for UI rendering
  window.localStorage.setItem(AUTH_USER_KEY, userJson);
  window.localStorage.setItem('dungeoneer_user', userJson);
  setCookie(AUTH_USER_KEY, userJson);
  setCookie('dungeoneer_user', userJson);

  window.dispatchEvent(new Event('auth-state-change'));
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const encryptedPassword = await encryptPassword(credentials.password);
  const data = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: encryptedPassword,
    }),
    skipAuth: true,
  });
  persistAuthSession(data);
  return data;
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return login({ email, password });
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const encryptedPassword = await encryptPassword(payload.password);
  const data = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      password: encryptedPassword,
    }),
    skipAuth: true,
  });
  persistAuthSession(data);
  return data;
}

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return register(payload);
}

export function getToken(): string | null {
  if (inMemoryToken) {
    if (isTokenExpired(inMemoryToken)) {
      inMemoryToken = null;
      return null;
    }
    return inMemoryToken;
  }
  return null;
}

export const getAccessToken = getToken;
export const getStoredToken = getToken;

if (typeof window !== 'undefined') {
  setTokenProvider(getAccessToken);
}

export function getUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
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

export async function toggleDmRole(): Promise<AuthResponse> {
  const response = await apiFetch<AuthResponse>('/api/auth/me/roles/toggle-dm', {
    method: 'POST',
  });
  persistAuthSession(response);
  return response;
}

export async function updateAvatar(avatarUrl: string): Promise<UserProfile> {
  const response = await apiFetch<UserProfile>('/api/auth/me/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatarUrl }),
  });
  const storedUser = getUser();
  if (storedUser && typeof window !== 'undefined') {
    const updated = { ...storedUser, avatarUrl: response.avatarUrl };
    window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('auth-state-change'));
  }
  return response;
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST', skipAuth: true });
  } catch {
    // Ignore network error on logout
  }

  inMemoryToken = null;
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
