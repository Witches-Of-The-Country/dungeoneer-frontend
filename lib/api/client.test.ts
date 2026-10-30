import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, AUTH_TOKEN_KEY, formatProblemDetailMessage } from './client';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('API Client & RFC 7807 ProblemDetail parser', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('formats RFC 7807 ProblemDetail messages into pt-BR', () => {
    const msg422 = formatProblemDetailMessage({
      status: 422,
      title: 'Unprocessable Entity',
      detail: 'Os pontos excedem o orçamento.',
    });
    expect(msg422).toContain('Os pontos excedem o orçamento.');

    const msgDefault409 = formatProblemDetailMessage({
      status: 409,
      title: 'Conflict',
    });
    expect(msgDefault409).toContain('Conflito');
  });

  it('attaches Authorization Bearer token when stored in localStorage', async () => {
    window.localStorage.setItem(AUTH_TOKEN_KEY, 'mock-jwt-token');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const res = await apiFetch<{ ok: boolean }>('/api/characters');
    expect(res.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer mock-jwt-token');
  });
});
