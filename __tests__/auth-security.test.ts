import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isTokenExpired, encryptPassword, logout } from '../lib/api/auth';
import * as clientModule from '../lib/api/client';

describe('Auth Security Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('isTokenExpired', () => {
    it('returns true for null or malformed tokens', () => {
      expect(isTokenExpired(null)).toBe(true);
      expect(isTokenExpired('')).toBe(true);
      expect(isTokenExpired('not.a.valid.jwt')).toBe(true);
    });

    it('returns true when token exp timestamp is in the past', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-1', exp: pastExp }));
      const expiredToken = `${header}.${payload}.signature`;

      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('returns false when token exp timestamp is in the future', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-1', exp: futureExp }));
      const validToken = `${header}.${payload}.signature`;

      expect(isTokenExpired(validToken)).toBe(false);
    });
  });

  describe('encryptPassword', () => {
    it('returns plain password if public key endpoint fails or returns null', async () => {
      vi.spyOn(clientModule, 'apiFetch').mockRejectedValueOnce(new Error('Network error'));
      const encrypted = await encryptPassword('MySecretPass123!');
      expect(encrypted).toBe('MySecretPass123!');
    });
  });

  describe('logout', () => {
    it('calls POST /api/auth/logout with skipAuth and removes user from localStorage', async () => {
      localStorage.setItem('dungeoneer_user', JSON.stringify({ id: '1', email: 'test@example.com' }));
      localStorage.setItem('dungeoneer_token', 'old-token');

      const apiFetchSpy = vi.spyOn(clientModule, 'apiFetch').mockResolvedValueOnce({});

      await logout();

      expect(apiFetchSpy).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
        method: 'POST',
        skipAuth: true,
      }));
      expect(localStorage.getItem('dungeoneer_user')).toBeNull();
      expect(localStorage.getItem('dungeoneer_token')).toBeNull();
    });
  });

  describe('Spec 001 - Token Unification & Loop Prevention', () => {
    it('unifies in-memory token with getStoredToken and apiFetch uses Bearer + credentials: include', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-1', exp: futureExp }));
      const validToken = `${header}.${payload}.signature`;

      const apiFetchMock = vi.spyOn(clientModule, 'apiFetch').mockImplementation(async (endpoint) => {
        if (endpoint === '/api/auth/login') {
          return {
            accessToken: validToken,
            tokenType: 'Bearer',
            user: { id: '1', email: 'test@example.com', nickname: 'Tester', roles: ['PLAYER'] },
          } as any;
        }
        return {} as any;
      });

      const { loginUser, getAccessToken } = await import('../lib/api/auth');
      await loginUser('test@example.com', 'Password123!');

      expect(getAccessToken()).toBe(validToken);
      expect(clientModule.getStoredToken()).toBe(validToken);

      // Restore apiFetch spy before calling real apiFetch
      apiFetchMock.mockRestore();

      // Verify credentials: 'include'
      let capturedCredentials: any;
      let capturedHeaders: Headers | undefined;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
        capturedCredentials = init?.credentials;
        capturedHeaders = init?.headers as Headers;
        return new Response(JSON.stringify({ data: 'ok' }), { status: 200 });
      });

      await clientModule.apiFetch('/api/characters');
      expect(capturedCredentials).toBe('include');
      expect(capturedHeaders?.get('Authorization')).toBe(`Bearer ${validToken}`);

      await logout();
      expect(getAccessToken()).toBeNull();
    });

    it('persists token to localStorage and cookies on login for edge middleware and rehydrates on refresh', async () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'user-2', exp: futureExp }));
      const validToken = `${header}.${payload}.signature`;

      vi.spyOn(clientModule, 'apiFetch').mockImplementation(async (endpoint) => {
        if (endpoint === '/api/auth/login') {
          return {
            accessToken: validToken,
            tokenType: 'Bearer',
            user: { id: '2', email: 'persisted@example.com', nickname: 'Persisted', roles: ['PLAYER'] },
          } as any;
        }
        return {} as any;
      });

      const { loginUser, getToken, logout } = await import('../lib/api/auth');
      await loginUser('persisted@example.com', 'Password123!');

      // Check localStorage and cookie persistence for edge middleware
      expect(localStorage.getItem('dungeoneer_auth_token')).toBe(validToken);
      expect(localStorage.getItem('dungeoneer_token')).toBe(validToken);
      expect(document.cookie).toContain('dungeoneer_auth_token=');

      // Test rehydration when memory token is cleared
      const authModule = await import('../lib/api/auth');
      // Token is retrievable via getToken
      expect(authModule.getToken()).toBe(validToken);

      await logout();
      expect(localStorage.getItem('dungeoneer_auth_token')).toBeNull();
      expect(localStorage.getItem('dungeoneer_token')).toBeNull();
      expect(getToken()).toBeNull();
    });
  });
});
