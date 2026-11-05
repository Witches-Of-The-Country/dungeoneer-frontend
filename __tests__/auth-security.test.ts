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
});
