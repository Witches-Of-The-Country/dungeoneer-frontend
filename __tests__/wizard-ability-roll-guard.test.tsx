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

  it('Bug 1: blocks HP rolling in Step 1 when level > 1 and method is ROLLED until class is selected', async () => {
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
          ];
        }
        if (endpoint.startsWith('/api/reference/backgrounds')) {
          return [];
        }
        if (endpoint === '/api/characters/hp-rolls' && options?.method === 'POST') {
          return {
            rollId: 'hp-roll-001',
            rolledHpPerLevel: [8, 7],
          };
        }
        return undefined;
      }
    );

    renderWithQuery(<CharacterCreationWizardPage />);

    // In Step 1, set level to 3
    fireEvent.change(screen.getByLabelText(/Nível \(1 a 20\)/i), {
      target: { value: '3' },
    });

    // Select ROLLED HP calculation method
    fireEvent.click(screen.getByRole('button', { name: /Rolar Dados/i }));

    // Verify HP roll button is disabled and warning message is present
    const hpRollButton = screen.getByTestId('hp-roll-button');
    expect(hpRollButton).toBeDisabled();

    const warning = screen.getByTestId('hp-roll-warning');
    expect(warning).toHaveTextContent(/Selecione uma classe primeiro/i);
  });
});
