import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CharacterCreationWizardPage from '@/app/characters/new/page';
import * as apiClient from '@/lib/api/client';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
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

describe('TE-01: Wizard Single-Chance Roll Guard & Slot Validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('disables Rolar Atributos button after a single roll and blocks advancing to Step 6 until all 6 ability slots are assigned', async () => {
    let rollCallCount = 0;
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(
      async (endpoint: string, options?: apiClient.ApiRequestOptions) => {
        if (endpoint.startsWith('/api/reference/lineages')) {
          return [
            {
              id: 'lin-1',
              name: 'Humano',
              description: 'Versátil.',
              speed: 30,
              size: 'MEDIUM',
              abilityBonuses: {},
              traitsSummary: [],
              ruleset: 'SRD_2024',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/classes')) {
          return [
            {
              id: 'cls-1',
              name: 'Mago',
              hitDice: 'd6',
              primaryAbility: 'INTELLIGENCE',
              savingThrowProficiencies: ['INTELLIGENCE', 'WISDOM'],
              spellcastingType: 'FULL',
              subclassLevel: 3,
              ruleset: 'SRD_2024',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/backgrounds')) {
          return [
            {
              id: 'bg-1',
              name: 'Sábio',
              description: 'Estudioso.',
              skillProficiencies: ['Arcana', 'History'],
              allowedAbilityBonuses: ['INT', 'WIS', 'CHA'],
              ruleset: 'SRD_2024',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/feats')) {
          return {
            items: [
              {
                id: 'feat-magic-initiate',
                name: 'Iniciado em Magia',
                nameEn: 'Magic Initiate',
                featType: 'ORIGIN',
                description: 'Aprende truques e magia de 1º círculo.',
                ruleset: 'SRD_2024',
              },
            ],
            nextCursor: null,
            hasNext: false,
            pageSize: 1,
          };
        }
        if (endpoint === '/api/characters/ability-rolls' && options?.method === 'POST') {
          rollCallCount += 1;
          return {
            rollId: 'roll-guard-001',
            rolledScores: [17, 15, 13, 12, 10, 9],
          };
        }
        return undefined;
      }
    );

    renderWithQuery(<CharacterCreationWizardPage />);

    // Advance from Step 1 to Step 5
    fireEvent.change(screen.getByLabelText(/Nome do Personagem/i), {
      target: { value: 'Gandalf' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i })); // -> Step 2
    await screen.findByText(/Passo 2 — Linhagem/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i })); // -> Step 3
    await screen.findByText(/Passo 3 — Classe/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i })); // -> Step 4
    await screen.findByText(/Passo 4 — Antecedente/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i })); // -> Step 5

    await screen.findByText(/Passo 5 — Atributos/i);

    // Switch to Rolagem (4d6kh3)
    fireEvent.click(screen.getByText(/Rolagem \(4d6kh3\)/i));

    const nextButton = screen.getByRole('button', { name: /Próximo/i });
    expect(nextButton).toBeDisabled();

    const rollButton = screen.getByRole('button', { name: /Rolar Atributos/i });
    expect(rollButton).not.toBeDisabled();

    fireEvent.click(rollButton);

    await waitFor(() => {
      expect(rollCallCount).toBe(1);
    });

    await screen.findByTestId('score-chip-roll-0');

    const lockedRollButton = screen.getByRole('button', {
      name: /Atributos Rolados/i,
    });
    expect(lockedRollButton).toBeDisabled();
    fireEvent.click(lockedRollButton);
    expect(rollCallCount).toBe(1);

    for (const ability of [
      'strength',
      'dexterity',
      'constitution',
      'intelligence',
      'wisdom',
    ]) {
      fireEvent.click(screen.getByTestId(`ability-slot-${ability}`));
    }
    expect(nextButton).toBeDisabled();

    fireEvent.click(screen.getByTestId('ability-slot-charisma'));
    expect(nextButton).not.toBeDisabled();
  });

  it('Step 3 & Step 4: configures Target Level > 1 guided progression notice, career HP method lock, Level 1 Subclass (when subclassLevel === 1), Origin Feat, and skill collision detection', async () => {
    vi.spyOn(apiClient, 'apiFetch').mockImplementation(
      async (endpoint: string) => {
        if (endpoint.startsWith('/api/reference/lineages')) {
          return [
            {
              id: 'lin-1',
              name: 'Humano',
              description: 'Versátil.',
              speed: 30,
              size: 'MEDIUM',
              abilityBonuses: {},
              traitsSummary: [],
              ruleset: 'SRD_2024',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/classes')) {
          return [
            {
              id: 'cls-fighter-1',
              name: 'Guerreiro',
              hitDice: 'd10',
              primaryAbility: 'STRENGTH',
              savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
              spellcastingType: 'NONE',
              subclassLevel: 3,
              ruleset: 'SRD_2024',
            },
            {
              id: 'cls-cleric-1',
              name: 'Clérigo',
              hitDice: 'd8',
              primaryAbility: 'WISDOM',
              savingThrowProficiencies: ['WISDOM', 'CHARISMA'],
              spellcastingType: 'FULL',
              subclassLevel: 1,
              ruleset: 'SRD_2014',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/subclasses')) {
          return [
            {
              id: 'sub-life-1',
              archetypeId: 'cls-cleric-1',
              name: 'Domínio da Vida',
              nameEn: 'Life Domain',
              description: 'Cura divina.',
              ruleset: 'SRD_2014',
              source: 'SRD',
            },
          ];
        }
        if (endpoint.startsWith('/api/reference/backgrounds')) {
          return [
            {
              id: 'bg-1',
              name: 'Soldado',
              description: 'Veterano.',
              skillProficiencies: ['Athletics', 'Intimidation'],
              allowedAbilityBonuses: ['STR', 'DEX', 'CON'],
              originFeatName: 'Atacante Selvagem',
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
                description: 'Rerola dados de dano de arma uma vez por turno.',
                ruleset: 'SRD_2024',
              },
            ],
            nextCursor: null,
            hasNext: false,
            pageSize: 1,
          };
        }
        return undefined;
      }
    );

    renderWithQuery(<CharacterCreationWizardPage />);

    // Step 1
    fireEvent.change(screen.getByLabelText(/Nome do Personagem/i), {
      target: { value: 'Conan' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 2 — Linhagem/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 3 — Classe/i);

    // Career HP method is visible even at Level 1!
    expect(screen.getByTestId('hp-method-AVERAGE')).toBeInTheDocument();
    expect(screen.getByTestId('hp-method-ROLLED')).toBeInTheDocument();
    expect(screen.getByTestId('hp-method-MAX')).toBeInTheDocument();

    // Select Clérigo (subclassLevel === 1) -> Level 1 Subclass select appears!
    fireEvent.click(await screen.findByRole('button', { name: /Clérigo/i }));
    expect(await screen.findByTestId('level-1-subclass-select')).toBeInTheDocument();

    // Switch back to Guerreiro (subclassLevel === 3) -> Level 1 Subclass select hides!
    fireEvent.click(await screen.findByRole('button', { name: /Guerreiro/i }));
    expect(screen.queryByTestId('level-1-subclass-select')).not.toBeInTheDocument();

    // Set Target Level to 5 -> Guided Level-by-Level Progression notice appears with 6.500 XP
    const levelInput = screen.getByLabelText(/Nível Alvo do Personagem/i);
    fireEvent.change(levelInput, { target: { value: '5' } });
    expect(await screen.findByTestId('higher-level-creation-notice')).toBeInTheDocument();

    // Select ROLLED career HP method
    fireEvent.click(screen.getByTestId('hp-method-ROLLED'));

    // Select Atletismo skill
    const skillCounter = screen.getByTestId('class-skills-counter');
    expect(skillCounter).toHaveTextContent('0 / 2 selecionada(s)');
    fireEvent.click(screen.getByRole('button', { name: 'Atletismo' }));
    expect(skillCounter).toHaveTextContent('1 / 2 selecionada(s)');

    // Advance to Step 4
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 4 — Antecedente/i);

    // Step 4 collision detection & SRD 2024 Origin Feat selector
    expect(await screen.findByText(/Colisão de Perícias Detectada/i)).toBeInTheDocument();
    expect(await screen.findByTestId('origin-feat-select')).toBeInTheDocument();
  });
});
