import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EncyclopediaMenu } from '@/components/encyclopedia-menu';
import * as useAuthHook from '@/lib/hooks/use-auth';

describe('EncyclopediaMenu Component (Category Rendering & Role Gating)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('TP-03: renders all 5 base player categories for standard player (isDM=false)', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'p1', email: 'p@test.com', nickname: 'Aventureiro', roles: ['PLAYER'] },
      token: 'valid',
      isAuthenticated: true,
      isLoading: false,
      isDM: false,
      isPlayer: true,
      logout: vi.fn(),
      syncAuth: vi.fn(),
    });

    render(<EncyclopediaMenu />);

    // 5 public categories must be present
    expect(screen.getByRole('heading', { name: /arquétipos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /magias/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /talentos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /itens/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /linhagens/i })).toBeInTheDocument();

    // DM categories must NOT be present
    expect(screen.queryByRole('heading', { name: /monstros/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /npcs/i })).not.toBeInTheDocument();
  });

  it('TP-04: renders all 7 categories including Monsters and NPCs with "Mestre" badge when isDM=true', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'dm1', email: 'dm@test.com', nickname: 'Mestre', roles: ['DUNGEON_MASTER'] },
      token: 'valid',
      isAuthenticated: true,
      isLoading: false,
      isDM: true,
      isPlayer: false,
      logout: vi.fn(),
      syncAuth: vi.fn(),
    });

    render(<EncyclopediaMenu />);

    // Base categories present
    expect(screen.getByRole('heading', { name: /arquétipos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /magias/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /talentos/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /itens/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /linhagens/i })).toBeInTheDocument();

    // DM categories present
    expect(screen.getByRole('heading', { name: /monstros/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /npcs/i })).toBeInTheDocument();

    // Mestre badges for DM categories
    const dmBadges = screen.getAllByText('Mestre');
    expect(dmBadges.length).toBeGreaterThanOrEqual(2);
  });

  it('TE-02: links have correct route hrefs for navigation', () => {
    vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
      user: { id: 'dm1', email: 'dm@test.com', nickname: 'Mestre', roles: ['DUNGEON_MASTER'] },
      token: 'valid',
      isAuthenticated: true,
      isLoading: false,
      isDM: true,
      isPlayer: false,
      logout: vi.fn(),
      syncAuth: vi.fn(),
    });

    render(<EncyclopediaMenu />);

    expect(screen.getByRole('link', { name: /arquétipos/i })).toHaveAttribute('href', '/encyclopedia/classes');
    expect(screen.getByRole('link', { name: /magias/i })).toHaveAttribute('href', '/encyclopedia/spells');
    expect(screen.getByRole('link', { name: /talentos/i })).toHaveAttribute('href', '/encyclopedia/feats');
    expect(screen.getByRole('link', { name: /itens/i })).toHaveAttribute('href', '/encyclopedia/items');
    expect(screen.getByRole('link', { name: /linhagens/i })).toHaveAttribute('href', '/encyclopedia/lineages');
    expect(screen.getByRole('link', { name: /monstros/i })).toHaveAttribute('href', '/encyclopedia/monsters');
    expect(screen.getByRole('link', { name: /npcs/i })).toHaveAttribute('href', '/encyclopedia/npcs');
  });
});
