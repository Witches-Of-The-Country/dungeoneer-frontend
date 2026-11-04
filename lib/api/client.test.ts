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

    const msgSpringBoot500 = formatProblemDetailMessage({
      status: 500,
      title: 'Internal Server Error',
      detail: 'Internal Server Error (/api/reference/items)',
      instance: '/api/reference/items',
    });
    expect(msgSpringBoot500).toContain('Erro interno no servidor ao processar /api/reference/items');

    const msgFeatConflict = formatProblemDetailMessage({
      status: 409,
      title: 'Conflito de Integridade de Dados',
      detail: 'duplicate key value violates unique constraint "uq_character_feat"',
    });
    expect(msgFeatConflict).toContain('Este personagem já possui o talento selecionado.');
  });

  it('correctly extracts spring boot error and path when apiFetch fails with 500', async () => {
    const errorPayload = {
      timestamp: '2026-11-01T04:24:49.085Z',
      status: 500,
      error: 'Internal Server Error',
      path: '/api/reference/items',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(errorPayload), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(apiFetch('/api/reference/items')).rejects.toThrow(
      'Erro interno no servidor ao processar /api/reference/items. Tente novamente mais tarde.'
    );
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
