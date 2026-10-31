import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import MonstersPage from '@/app/encyclopedia/monsters/page';
import NPCsPage from '@/app/encyclopedia/npcs/page';
import * as useAuthHook from '@/lib/hooks/use-auth';

describe('Encyclopedia Placeholders (Monsters & NPCs)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Monsters Page (/encyclopedia/monsters)', () => {
    it('TP-05: renders "Em breve" empty state for DUNGEON_MASTER', () => {
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

      render(<MonstersPage />);

      expect(screen.getByRole('heading', { level: 1, name: /bestiário & monstros/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /o bestiário está sendo forjado/i })).toBeInTheDocument();
      expect(screen.getByText(/bestiário completo de criaturas e monstros do srd/i)).toBeInTheDocument();
      expect(screen.getAllByText('Em breve').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /voltar ao dashboard/i })[0]).toHaveAttribute('href', '/characters');
    });

    it('TE-02: blocks access and displays restricted warning for PLAYER', () => {
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        user: { id: 'p1', email: 'player@test.com', nickname: 'Guerreiro', roles: ['PLAYER'] },
        token: 'valid',
        isAuthenticated: true,
        isLoading: false,
        isDM: false,
        isPlayer: true,
        logout: vi.fn(),
        syncAuth: vi.fn(),
      });

      render(<MonstersPage />);

      expect(screen.getByText(/acesso restrito ao mestre do jogo/i)).toBeInTheDocument();
      expect(screen.queryByText(/bestiário completo de criaturas e monstros do srd/i)).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /voltar ao dashboard/i })).toHaveAttribute('href', '/characters');
    });
  });

  describe('NPCs Page (/encyclopedia/npcs)', () => {
    it('TP-05b: renders "Em breve" empty state for DUNGEON_MASTER', () => {
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

      render(<NPCsPage />);

      expect(screen.getByRole('heading', { level: 1, name: /galeria de npcs/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2, name: /a galeria de npcs está sendo preparada/i })).toBeInTheDocument();
      expect(screen.getByText(/ferramenta de consulta e gestão de npcs/i)).toBeInTheDocument();
      expect(screen.getAllByText('Em breve').length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /voltar ao dashboard/i })[0]).toHaveAttribute('href', '/characters');
    });

    it('TE-02b: blocks access and displays restricted warning for PLAYER', () => {
      vi.spyOn(useAuthHook, 'useAuth').mockReturnValue({
        user: { id: 'p1', email: 'player@test.com', nickname: 'Guerreiro', roles: ['PLAYER'] },
        token: 'valid',
        isAuthenticated: true,
        isLoading: false,
        isDM: false,
        isPlayer: true,
        logout: vi.fn(),
        syncAuth: vi.fn(),
      });

      render(<NPCsPage />);

      expect(screen.getByText(/acesso restrito ao mestre do jogo/i)).toBeInTheDocument();
      expect(screen.queryByText(/ferramenta de consulta e gestão de npcs/i)).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /voltar ao dashboard/i })).toHaveAttribute('href', '/characters');
    });
  });
});
