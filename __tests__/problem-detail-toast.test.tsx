import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import { apiFetch, ApiError } from '@/lib/api/client';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('TE-02: RFC 7807 ProblemDetail Error Toast in pt-BR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers a user-facing toast in pt-BR when backend returns 409 Conflict ProblemDetail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'https://dungeoneer.app/errors/conflict',
          title: 'Conflict',
          status: 409,
          detail: 'Roll already exists and has already been consumed.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/problem+json' },
        }
      )
    );

    await expect(
      apiFetch('/api/characters/ability-rolls', { method: 'POST' })
    ).rejects.toThrow(ApiError);

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/rolagem de atributos já foi realizada/i)
    );
  });

  it('triggers a user-facing toast in pt-BR when backend returns 422 Unprocessable Entity ProblemDetail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          type: 'https://dungeoneer.app/errors/validation',
          title: 'Unprocessable Entity',
          status: 422,
          detail: 'Point Buy total cost must be 27 points.',
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/problem+json' },
        }
      )
    );

    await expect(
      apiFetch('/api/characters', {
        method: 'POST',
        body: JSON.stringify({ name: 'Teste' }),
      })
    ).rejects.toThrow(ApiError);

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/27 pontos/i)
    );
  });
});
