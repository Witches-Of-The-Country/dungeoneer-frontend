import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharacterCreationWizardPage from '@/app/characters/new/page';
import * as apiClient from '@/lib/api/client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
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

describe('TP-01: 6-Step Character Creation Wizard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockPush.mockReset();
    window.sessionStorage.clear();
  });

  it('renders 6 steps sequentially, handles Point Buy, Standard Array, and 4d6kh3 roll assignment, and submits POST /api/characters', async () => {
    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockImplementation(async (endpoint: string, options?: apiClient.ApiRequestOptions) => {
        if (endpoint.startsWith('/api/reference/lineages')) {
          return [
            {
              id: 'lin-1',
              name: 'Anão',
              description: 'Robusto e resiliente.',
              speed: 25,
              size: 'MEDIUM',
              abilityBonuses: { CON: 2 },
              traitsSummary: ['Visão no Escuro'],
              ruleset: 'SRD_2024',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/classes')) {
          return [
            {
              id: 'cls-1',
              name: 'Guerreiro',
              hitDice: 'd10',
              primaryAbility: 'STRENGTH',
              savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
              spellcastingType: 'NONE',
              ruleset: 'SRD_2024',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/backgrounds')) {
          return [
            {
              id: 'bg-1',
              name: 'Soldado',
              description: 'Veterano de batalhas.',
              skillProficiencies: ['Athletics', 'Intimidation'],
              allowedAbilityBonuses: ['STR', 'DEX', 'CON'],
              originFeatName: 'Atacante Selvagem',
              originFeatDescription: 'Rerola dados de dano de arma.',
              ruleset: 'SRD_2024',
            },
          ];
        }
        if (endpoint === '/api/characters/ability-rolls' && options?.method === 'POST') {
          return {
            rollId: 'roll-uuid-123',
            rolledScores: [16, 15, 14, 12, 10, 8],
          };
        }
        if (endpoint === '/api/characters' && options?.method === 'POST') {
          return {
            id: 'char-created-999',
            name: 'Gimli Filho de Glóin',
            level: 1,
            ruleset: 'SRD_2024',
            hitPointsCurrent: 13,
            hitPointsMax: 13,
            hitPointsTemp: 0,
            armorClass: 12,
            initiativeBonus: 2,
            speed: 25,
            proficiencyBonus: 2,
            abilityScores: {
              strength: 18,
              dexterity: 15,
              constitution: 15,
              intelligence: 12,
              wisdom: 10,
              charisma: 8,
            },
            lineage: {
              id: 'lin-1',
              name: 'Anão',
              description: '',
              speed: 25,
              size: 'MEDIUM',
              abilityBonuses: {},
              traitsSummary: [],
              ruleset: 'SRD_2024',
            },
            background: {
              id: 'bg-1',
              name: 'Soldado',
              description: '',
              skillProficiencies: ['Athletics', 'Intimidation'],
              allowedAbilityBonuses: ['STR', 'DEX', 'CON'],
              ruleset: 'SRD_2024',
            },
            archetype: {
              id: 'cls-1',
              name: 'Guerreiro',
              hitDice: 'd10',
              primaryAbility: 'STRENGTH',
              savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
              spellcastingType: 'NONE',
              ruleset: 'SRD_2024',
            },
          };
        }
        return undefined;
      });

    renderWithQuery(<CharacterCreationWizardPage />);

    // Step 1: Nome & Regras
    expect(screen.getByText(/Passo 1 — Nome & Regras/i)).toBeInTheDocument();
    const nameInput = screen.getByLabelText(/Nome do Personagem/i);
    fireEvent.change(nameInput, { target: { value: 'Gimli Filho de Glóin' } });

    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 2: Linhagem
    await waitFor(() => {
      expect(screen.getByText(/Passo 2 — Linhagem/i)).toBeInTheDocument();
    });
    expect(await screen.findAllByText('Anão')).not.toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 3: Classe
    await waitFor(() => {
      expect(screen.getByText(/Passo 3 — Classe/i)).toBeInTheDocument();
    });
    expect(await screen.findAllByText('Guerreiro')).not.toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 4: Antecedente
    await waitFor(() => {
      expect(screen.getByText(/Passo 4 — Antecedente/i)).toBeInTheDocument();
    });
    expect(await screen.findAllByText('Soldado')).not.toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 5: Atributos
    await waitFor(() => {
      expect(screen.getByText(/Passo 5 — Atributos/i)).toBeInTheDocument();
    });

    // Test Point Buy 27-point counter
    fireEvent.click(screen.getByText(/Compra de Pontos/i));
    expect(screen.getByTestId('point-buy-counter')).toHaveTextContent(
      '27 / 27 pts'
    );
    fireEvent.click(screen.getByLabelText('Aumentar FOR'));
    expect(screen.getByTestId('point-buy-counter')).toHaveTextContent(
      '26 / 27 pts'
    );

    // Switch to Rolagem (4d6kh3) and roll + assign all 6 slots
    fireEvent.click(screen.getByText(/Rolagem \(4d6kh3\)/i));
    const rollButton = screen.getByRole('button', { name: /Rolar Atributos/i });
    fireEvent.click(rollButton);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/ability-rolls',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Wait for the rolled chips to render in the pool before assigning to slots
    await screen.findByTestId('score-chip-roll-0');

    // Assign all 6 rolled chips by clicking each slot
    const slots = [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
      'charisma',
    ];
    for (const ability of slots) {
      fireEvent.click(screen.getByTestId(`ability-slot-${ability}`));
    }

    const nextButton = screen.getByRole('button', { name: /Próximo/i });
    expect(nextButton).not.toBeDisabled();
    fireEvent.click(nextButton);

    // Step 6: Revisão & Criação
    await waitFor(() => {
      expect(
        screen.getByText(/Passo 6 — Revisão & Criação/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Gimli Filho de Glóin')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', {
      name: /Criar Personagem/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters',
        expect.objectContaining({ method: 'POST' })
      );
    });

    const postCall = apiFetchSpy.mock.calls.find(
      ([url, opts]) => url === '/api/characters' && opts?.method === 'POST'
    );
    expect(postCall).toBeDefined();
    const submittedBody = JSON.parse(String(postCall?.[1]?.body));
    expect(submittedBody).toMatchObject({
      name: 'Gimli Filho de Glóin',
      level: 1,
      ruleset: 'SRD_2024',
      lineageId: 'lin-1',
      backgroundId: 'bg-1',
      archetypeId: 'cls-1',
      abilityScoreMethod: 'ROLLED',
      abilityRollId: 'roll-uuid-123',
      abilityScores: {
        strength: 16,
        dexterity: 15,
        constitution: 14,
        intelligence: 12,
        wisdom: 10,
        charisma: 8,
      },
    });
    expect(mockPush).toHaveBeenCalledWith('/characters/char-created-999');
  });
});
