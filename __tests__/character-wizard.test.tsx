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

  it('requests and renders strictly ORIGIN feats in the wizard, passing featTypes=ORIGIN', async () => {
    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockImplementation(async (endpoint: string) => {
        if (endpoint.startsWith('/api/reference/feats')) {
          return {
            items: [
              {
                id: 'feat-origin-1',
                ruleset: 'SRD_2024',
                slug: 'alert',
                name: 'Alerta',
                nameEn: 'Alert',
                featType: 'ORIGIN',
                description: 'Iniciativa aumentada',
                source: 'SRD',
              },
              {
                id: 'feat-general-1',
                ruleset: 'SRD_2024',
                slug: 'war-caster',
                name: 'Conjurador de Guerra',
                nameEn: 'War Caster',
                featType: 'GENERAL',
                description: 'Vantagem em concentraÃ§Ã£o',
                source: 'SRD',
              },
            ],
            nextCursor: null,
          };
        }
        return [];
      });

    renderWithQuery(<CharacterCreationWizardPage />);

    await waitFor(() => {
      const featCalls = apiFetchSpy.mock.calls.filter(([url]) =>
        url.startsWith('/api/reference/feats')
      );
      expect(featCalls.length).toBeGreaterThan(0);
      for (const [url] of featCalls) {
        expect(url).toContain('featTypes=ORIGIN');
      }
    });
  });

  it('TR-04: allows clearing and typing 20 in the level input without premature clamping', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (endpoint: string) => {
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
      return [];
    });

    renderWithQuery(<CharacterCreationWizardPage />);

    // Step 1: Nome
    const nameInput = screen.getByLabelText(/Nome do Personagem/i);
    fireEvent.change(nameInput, { target: { value: 'Arthas' } });
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 2: Linhagem
    await waitFor(() => {
      expect(screen.getByText(/Passo 2 — Linhagem/i)).toBeInTheDocument();
    });
    expect(await screen.findAllByText('Anão')).not.toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 3: Classe & Nível
    await waitFor(() =>
      expect(screen.getByLabelText(/Nível Alvo do Personagem/i)).toBeInTheDocument()
    );
    const levelInput = screen.getByLabelText(/Nível Alvo do Personagem/i);
    expect(levelInput).toHaveValue(1);

    // Clear the field (backspace) -> must become empty and NOT clamp back to 1
    fireEvent.change(levelInput, { target: { value: '' } });
    expect(levelInput).toHaveValue(null);

    // Type '20'
    fireEvent.change(levelInput, { target: { value: '20' } });
    expect(levelInput).toHaveValue(20);

    // Blur -> remains 20
    fireEvent.blur(levelInput);
    expect(levelInput).toHaveValue(20);
    expect(screen.getAllByText(/Nível 20/i)[0]).toBeInTheDocument();
  });

  it('TR-05: keeps user-selected origin feat from reverting to background default feat when changed in dropdown', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (endpoint: string) => {
      if (endpoint.startsWith('/api/reference/lineages')) {
        return [
          {
            id: 'lin-1',
            name: 'Anão',
            description: 'Robusto.',
            speed: 25,
            size: 'MEDIUM',
            abilityBonuses: { CON: 2 },
            traitsSummary: [],
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
            description: 'Treinado em armas.',
            skillProficiencies: ['Athletics', 'Intimidation'],
            originFeatName: 'Atacante Selvagem',
            allowedAbilityBonuses: ['STR', 'DEX', 'CON'],
            ruleset: 'SRD_2024',
          },
        ];
      }
      if (endpoint.startsWith('/api/reference/feats')) {
        return {
          items: [
            {
              id: 'feat-savage-attacker',
              name: 'Atacante Selvagem',
              nameEn: 'Savage Attacker',
              featType: 'ORIGIN',
              description: 'Rola dano de arma duas vezes.',
              ruleset: 'SRD_2024',
            },
            {
              id: 'feat-alert',
              name: 'Alerta',
              nameEn: 'Alert',
              featType: 'ORIGIN',
              description: 'Iniciativa aumentada.',
              ruleset: 'SRD_2024',
            },
          ],
          nextCursor: null,
          hasNext: false,
          pageSize: 2,
        };
      }
      return [];
    });

    renderWithQuery(<CharacterCreationWizardPage />);

    // Step 1: Nome
    fireEvent.change(screen.getByLabelText(/Nome do Personagem/i), { target: { value: 'Conan' } });
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 2: Linhagem
    await waitFor(() => expect(screen.getByText(/Passo 2 — Linhagem/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 3: Classe
    await waitFor(() => expect(screen.getByText(/Passo 3 — Classe/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Step 4: Antecedente
    await waitFor(() => expect(screen.getByText(/Passo 4 — Antecedente/i)).toBeInTheDocument());
    const select = await screen.findByTestId('origin-feat-select');

    // Should initially have preselected the background's origin feat (Atacante Selvagem)
    expect(select).toHaveValue('feat-savage-attacker');

    // Change dropdown to 'Alerta'
    fireEvent.change(select, { target: { value: 'feat-alert' } });

    // Must NOT revert back to feat-savage-attacker!
    expect(select).toHaveValue('feat-alert');
    expect(screen.getByText('Iniciativa aumentada.')).toBeInTheDocument();
  });

  it('TR-06: allows re-rolling attributes in Step 5 during character creation', async () => {
    const rollCallUrls: string[] = [];
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(async (endpoint: string, options?: apiClient.ApiRequestOptions) => {
      if (endpoint.startsWith('/api/reference/lineages')) {
        return [{ id: 'lin-1', name: 'Humano', speed: 30, size: 'MEDIUM', ruleset: 'SRD_2024' }];
      }
      if (endpoint.startsWith('/api/reference/classes')) {
        return [{ id: 'cls-1', name: 'Guerreiro', hitDice: 'd10', ruleset: 'SRD_2024' }];
      }
      if (endpoint.startsWith('/api/reference/backgrounds')) {
        return [{ id: 'bg-1', name: 'Soldado', ruleset: 'SRD_2024' }];
      }
      if (endpoint.startsWith('/api/reference/feats')) {
        return { items: [{ id: 'feat-1', name: 'Alerta', featType: 'ORIGIN', ruleset: 'SRD_2024' }] };
      }
      if (endpoint.startsWith('/api/characters/ability-rolls') && options?.method === 'POST') {
        rollCallUrls.push(endpoint);
        return {
          rollId: `roll-${rollCallUrls.length}`,
          rolledScores: [16, 14, 13, 12, 10, 8],
        };
      }
      return [];
    });

    renderWithQuery(<CharacterCreationWizardPage />);

    // Step 1 to Step 5
    fireEvent.change(screen.getByLabelText(/Nome do Personagem/i), { target: { value: 'Thor' } });
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 2 — Linhagem/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 3 — Classe/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 4 — Antecedente/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 5 — Atributos/i);

    // Switch to Rolagem
    fireEvent.click(screen.getByText(/Rolagem \(4d6kh3\)/i));

    // First roll
    fireEvent.click(screen.getByRole('button', { name: /Rolar Atributos/i }));
    await waitFor(() => expect(rollCallUrls.length).toBe(1));
    expect(rollCallUrls[0]).toBe('/api/characters/ability-rolls');

    // Reroll button must be visible and clickable
    const rerollButton = await screen.findByTestId('reroll-wizard-button');
    expect(rerollButton).toBeInTheDocument();
    fireEvent.click(rerollButton);

    await waitFor(() => expect(rollCallUrls.length).toBe(2));
    expect(rollCallUrls[1]).toContain('forceNew=true');
  });
});
