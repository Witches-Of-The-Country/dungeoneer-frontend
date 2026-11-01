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
    // Before rolling or assigning, Next button must be disabled
    expect(nextButton).toBeDisabled();

    const rollButton = screen.getByRole('button', { name: /Rolar Atributos/i });
    expect(rollButton).not.toBeDisabled();

    fireEvent.click(rollButton);

    await waitFor(() => {
      expect(rollCallCount).toBe(1);
    });

    await screen.findByTestId('score-chip-roll-0');

    // After rolling once, the button is permanently disabled and cannot trigger a second roll
    const lockedRollButton = screen.getByRole('button', {
      name: /Atributos Rolados/i,
    });
    expect(lockedRollButton).toBeDisabled();
    fireEvent.click(lockedRollButton);
    expect(rollCallCount).toBe(1);

    // Assign only 5 of 6 slots — Next button must still remain disabled
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

    // Assign the 6th slot — Next button becomes enabled
    fireEvent.click(screen.getByTestId('ability-slot-charisma'));
    expect(nextButton).not.toBeDisabled();
  });

  it('Step 3: manages Initial Level, HP rolling with per-class cache, multiclass distribution, and class skills selection', async () => {
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
              id: 'cls-fighter-1',
              name: 'Guerreiro',
              hitDice: 'd10',
              primaryAbility: 'STRENGTH',
              savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
              spellcastingType: 'NONE',
              ruleset: 'SRD_2024',
            },
            {
              id: 'cls-wizard-2',
              name: 'Mago',
              hitDice: 'd6',
              primaryAbility: 'INTELLIGENCE',
              savingThrowProficiencies: ['INTELLIGENCE', 'WISDOM'],
              spellcastingType: 'FULL',
              ruleset: 'SRD_2024',
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
        if (endpoint === '/api/characters/hp-rolls' && options?.method === 'POST') {
          const body = JSON.parse(String(options.body));
          if (body.archetypeId === 'cls-fighter-1') {
            return {
              rollId: 'hp-roll-fighter',
              rolledHpPerLevel: [8, 7],
            };
          }
          return {
            rollId: 'hp-roll-wizard',
            rolledHpPerLevel: [4, 5],
          };
        }
        return undefined;
      }
    );

    renderWithQuery(<CharacterCreationWizardPage />);

    // In Step 1, enter name and proceed
    fireEvent.change(screen.getByLabelText(/Nome do Personagem/i), {
      target: { value: 'Conan' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 2 — Linhagem/i);
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 3 — Classe/i);

    // In Step 3: Set level to 3
    const levelInput = screen.getByLabelText(/Nível Inicial/i);
    fireEvent.change(levelInput, { target: { value: '3' } });

    // Select Guerreiro class
    fireEvent.click(await screen.findByRole('button', { name: /Guerreiro/i }));

    // Select ROLLED HP calculation method
    fireEvent.click(screen.getByRole('button', { name: 'Rolado' }));

    // Trigger HP roll for Guerreiro
    const hpRollButton = screen.getByTestId('hp-roll-button');
    expect(hpRollButton).not.toBeDisabled();
    fireEvent.click(hpRollButton);
    expect(await screen.findByText(/Rolagens: \[8, 7\]/i)).toBeInTheDocument();

    // Switch class to Mago: Guerreiro roll is preserved in cache, Mago needs roll
    fireEvent.click(await screen.findByRole('button', { name: /Mago/i }));
    expect(screen.queryByText(/Rolagens: \[8, 7\]/i)).not.toBeInTheDocument();

    // Switch back to Guerreiro: Roll is restored from cache!
    fireEvent.click(await screen.findByRole('button', { name: /Guerreiro/i }));
    expect(await screen.findByText(/Rolagens: \[8, 7\]/i)).toBeInTheDocument();

    // Test Class Skills selection
    const skillCounter = screen.getByTestId('class-skills-counter');
    expect(skillCounter).toHaveTextContent('0 / 2 selecionada(s)');

    // Select Atletismo (Athletics)
    const athleticsBtn = screen.getByRole('button', { name: 'Atletismo' });
    fireEvent.click(athleticsBtn);
    expect(skillCounter).toHaveTextContent('1 / 2 selecionada(s)');

    // Test Multiclass level distribution
    const addMulticlassBtn = screen.getByRole('button', { name: /Adicionar Classe Secundária/i });
    fireEvent.click(addMulticlassBtn);

    // Initial multiclass allocation: primary = 2, secondary = 1 (sum = 3)
    const levelsBadge = screen.getByTestId('multiclass-levels-badge');
    expect(levelsBadge).toHaveTextContent('Soma: 3 / 3');

    // Tamper primary level to 1 (sum becomes 2 != 3)
    const primaryLvlInput = screen.getByLabelText(/Nível da classe principal/i);
    fireEvent.change(primaryLvlInput, { target: { value: '1' } });
    expect(levelsBadge).toHaveTextContent('Soma: 2 / 3');

    // Attempting to advance when sum != 3 must block advancement
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    expect(screen.queryByText(/Passo 4 — Antecedente/i)).not.toBeInTheDocument();

    // Restore sum to 3 (primary = 2, secondary = 1)
    fireEvent.change(primaryLvlInput, { target: { value: '2' } });
    expect(levelsBadge).toHaveTextContent('Soma: 3 / 3');

    // Trigger HP roll for secondary class (Mago)
    const secHpRollButton = screen.getByTestId('hp-roll-secondary-cls-wizard-2');
    expect(secHpRollButton).not.toBeDisabled();
    fireEvent.click(secHpRollButton);
    expect(await screen.findByText(/\[4, 5\]/i)).toBeInTheDocument();

    // Advancing now succeeds into Step 4
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await screen.findByText(/Passo 4 — Antecedente/i);

    // Step 4 collision detection: 'Athletics' (Atletismo) was selected in class and also in Soldado background!
    expect(await screen.findByText(/Colisão de Perícias Detectada/i)).toBeInTheDocument();
  });
});
