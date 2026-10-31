import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import CharactersPage from '@/app/characters/page';
import * as useAuthHook from '@/lib/hooks/use-auth';
import * as charactersApi from '@/lib/api/characters';

describe('Main Dashboard Integration (/characters)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TP-06: renders both character section and encyclopedia section on main dashboard', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'u1', email: 'aragorn@lotr.com', nickname: 'Passolargo', roles: ['PLAYER'] },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      isDM: false,
      isPlayer: true,
      logout: vi.fn(),
      syncAuth: vi.fn(),
    });

    vi.spyOn(charactersApi, 'useCharacters').mockReturnValue({
      data: [
        {
          id: 'char-1',
          userId: 'u1',
          name: 'Aragorn II',
          level: 5,
          className: 'Ranger',
          lineageName: 'Human',
          hitPointsCurrent: 44,
          hitPointsMax: 44,
          temporaryHitPoints: 0,
          armorClass: 16,
          ruleset: 'SRD_2024',
          createdAt: '2026-10-31T00:00:00Z',
          updatedAt: '2026-10-31T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(charactersApi, 'useDeleteCharacter').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    render(<CharactersPage />);

    // Section 1: Characters
    expect(screen.getByRole('heading', { level: 1, name: /heróis de passolargo/i })).toBeInTheDocument();
    expect(screen.getByText('Aragorn II')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /criar personagem/i })).toHaveAttribute('href', '/characters/new');

    // Section 2: Encyclopedia & References
    expect(screen.getByRole('heading', { level: 2, name: /enciclopédia & referências/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /arquétipos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /magias/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /talentos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /itens/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /linhagens/i })).toBeInTheDocument();

    // Since isDM=false, Monsters & NPCs should not be shown
    expect(screen.queryByRole('heading', { name: /monstros/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /npcs/i })).not.toBeInTheDocument();
  });

  it('TP-06b: shows DM encyclopedia categories on dashboard when user is DUNGEON_MASTER', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'dm1', email: 'dm@lotr.com', nickname: 'MestreGandalf', roles: ['DUNGEON_MASTER'] },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      isDM: true,
      isPlayer: false,
      logout: vi.fn(),
      syncAuth: vi.fn(),
    });

    vi.spyOn(charactersApi, 'useCharacters').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(charactersApi, 'useDeleteCharacter').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    render(<CharactersPage />);

    // Character section empty state
    expect(screen.getByText(/nenhum aventureiro forjado ainda/i)).toBeInTheDocument();

    // Encyclopedia section with DM cards
    expect(screen.getByRole('heading', { level: 2, name: /enciclopédia & referências/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /monstros/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /npcs/i })).toBeInTheDocument();
  });
});
