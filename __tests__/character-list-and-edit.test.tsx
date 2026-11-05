import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharactersPage from '@/app/characters/page';
import EditCharacterPage from '@/app/characters/[id]/edit/page';
import * as apiClient from '@/lib/api/client';
import type { CharacterResponse } from '@/lib/api/characters';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'char-202' }),
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('TP-03: Character List, Delete Confirmation Modal & Edit Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
  });

  it('renders character card grid from API and invokes DELETE /api/characters/{id} upon modal confirmation', async () => {
    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockImplementation(async (endpoint: string, options?: apiClient.ApiRequestOptions) => {
        if (endpoint === '/api/characters') {
          return [
            {
              id: 'char-202',
              name: 'Boromir de Gondor',
              level: 5,
              ruleset: 'SRD_2014',
              className: 'Guerreiro',
              lineageName: 'Humano',
              backgroundName: 'Nobre',
              hitPointsCurrent: 44,
              hitPointsMax: 44,
              armorClass: 18,
              updatedAt: '2026-10-30T12:00:00Z',
            },
          ];
        }
        if (endpoint === '/api/characters/char-202' && options?.method === 'DELETE') {
          return undefined;
        }
        return undefined;
      });

    renderWithQuery(<CharactersPage />);

    expect(
      await screen.findByText('Boromir de Gondor')
    ).toBeInTheDocument();
    expect(screen.getByText(/44 \/ 44 PV/i)).toBeInTheDocument();

    // Click Excluir button on card
    fireEvent.click(
      screen.getByRole('button', { name: /Excluir Boromir de Gondor/i })
    );

    // Confirmation dialog appears
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Confirmar Exclusão/i })
    );

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-202',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('loads character data into Edit form and submits PUT /api/characters/{id}', async () => {
    const existingChar: CharacterResponse = {
      id: 'char-202',
      name: 'Boromir de Gondor',
      level: 5,
      hitPointsCurrent: 44,
      hitPointsMax: 44,
      hitPointsTemp: 0,
      armorClass: 18,
      initiativeBonus: 1,
      speed: 30,
      proficiencyBonus: 3,
      ruleset: 'SRD_2014',
      notes: 'Portador da Trombeta de Gondor.',
      abilityScores: {
        strength: 18,
        dexterity: 12,
        constitution: 16,
        intelligence: 10,
        wisdom: 11,
        charisma: 14,
      },
      lineage: {
        id: 'lin-h',
        name: 'Humano',
        description: '',
        speed: 30,
        size: 'MEDIUM',
        abilityBonuses: {},
        traitsSummary: [],
        ruleset: 'SRD_2014',
      },
      background: {
        id: 'bg-n',
        name: 'Nobre',
        description: '',
        skillProficiencies: ['History', 'Persuasion'],
        allowedAbilityBonuses: [],
        ruleset: 'SRD_2014',
      },
      archetype: {
        id: 'cls-f',
        name: 'Guerreiro',
        hitDice: 'd10',
        primaryAbility: 'STRENGTH',
        savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
        spellcastingType: 'NONE',
        ruleset: 'SRD_2014',
      },
    };

    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockImplementation(async (endpoint: string, options?: apiClient.ApiRequestOptions) => {
        if (endpoint === '/api/characters/char-202' && (!options?.method || options.method === 'GET')) {
          return existingChar;
        }
        if (endpoint === '/api/characters/char-202' && options?.method === 'PUT') {
          return {
            ...existingChar,
            name: 'Capitão Boromir',
            hitPointsCurrent: 35,
          };
        }
        return undefined;
      });

    renderWithQuery(<EditCharacterPage />);

    const nameInput = await screen.findByLabelText(/Nome do Personagem/i);
    await waitFor(() => {
      expect(nameInput).toHaveValue('Boromir de Gondor');
    });

    fireEvent.change(nameInput, { target: { value: 'Capitão Boromir' } });

    const hpInput = screen.getByLabelText(/Pontos de Vida Atuais/i);
    fireEvent.change(hpInput, { target: { value: '35' } });

    fireEvent.click(
      screen.getByRole('button', { name: /Salvar Alterações/i })
    );

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-202',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    const putCall = apiFetchSpy.mock.calls.find(
      ([url, opts]) => url === '/api/characters/char-202' && opts?.method === 'PUT'
    );
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual({
      name: 'Capitão Boromir',
      hitPointsCurrent: 35,
      hitPointsTemp: 0,
    });

    expect(mockPush).toHaveBeenCalledWith('/characters/char-202');
  });

  it('allows rerolling ability scores when character is not bound to a campaign', async () => {
    const existingChar: Partial<CharacterResponse> = {
      id: 'char-202',
      name: 'Boromir de Gondor',
      level: 5,
      campaignId: null,
      ruleset: 'SRD_2014',
      hitPointsCurrent: 44,
      hitPointsMax: 44,
      armorClass: 18,
      abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 11, charisma: 13 },
      lineage: { id: 'lin-1', name: 'Humano' } as any,
      background: { id: 'bg-1', name: 'Nobre' } as any,
      archetype: { id: 'cls-1', name: 'Guerreiro' } as any,
    };

    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockImplementation(async (endpoint: string, options?: apiClient.ApiRequestOptions) => {
        if (endpoint === '/api/characters/char-202') {
          return existingChar;
        }
        if (endpoint === '/api/characters/char-202/reroll-ability-scores' && options?.method === 'POST') {
          return {
            ...existingChar,
            abilityScores: { strength: 18, dexterity: 14, constitution: 16, intelligence: 10, wisdom: 11, charisma: 13 },
          };
        }
        return undefined;
      });

    renderWithQuery(<EditCharacterPage />);

    const rerollButton = await screen.findByTestId('reroll-ability-scores-button');
    expect(rerollButton).toBeInTheDocument();
    fireEvent.click(rerollButton);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-202/reroll-ability-scores',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('renders locked badge when character is in a campaign without DM authorization', async () => {
    const existingChar: Partial<CharacterResponse> = {
      id: 'char-202',
      name: 'Boromir de Gondor',
      level: 5,
      campaignId: 'camp-123',
      allowAbilityReroll: false,
      ruleset: 'SRD_2014',
      hitPointsCurrent: 44,
      hitPointsMax: 44,
      armorClass: 18,
      abilityScores: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 11, charisma: 13 },
      lineage: { id: 'lin-1', name: 'Humano' } as any,
      background: { id: 'bg-1', name: 'Nobre' } as any,
      archetype: { id: 'cls-1', name: 'Guerreiro' } as any,
    };

    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (endpoint: string) => {
      if (endpoint === '/api/characters/char-202') {
        return existingChar;
      }
      return undefined;
    });

    renderWithQuery(<EditCharacterPage />);

    const lockedBadge = await screen.findByTestId('reroll-locked-badge');
    expect(lockedBadge).toBeInTheDocument();
    expect(screen.queryByTestId('reroll-ability-scores-button')).not.toBeInTheDocument();
  });
});
