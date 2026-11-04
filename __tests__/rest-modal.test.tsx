import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RestModal } from '@/components/character-sheet/rest-modal';
import * as apiClient from '@/lib/api/client';
import type { CharacterResponse } from '@/lib/api/characters';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockLivingCharacter: CharacterResponse = {
  id: 'char-101',
  name: 'Gimli',
  level: 4,
  hitPointsCurrent: 18,
  hitPointsMax: 36,
  hitPointsTemp: 5,
  armorClass: 17,
  initiativeBonus: 0,
  speed: 25,
  proficiencyBonus: 2,
  ruleset: 'SRD_2024',
  exhaustion: 2,
  abilityScores: {
    strength: 16,
    dexterity: 10,
    constitution: 16, // +3 mod
    intelligence: 10,
    wisdom: 12,
    charisma: 8,
    constitutionModifier: 3,
  },
  classes: [
    {
      classProgressionId: 'cp-fighter-1',
      className: 'Guerreiro',
      subclassName: 'Campeão',
      classLevel: 4,
      hitDie: 'D10',
      hitDiceSpent: 1,
      availableHitDice: 3,
    },
  ],
  lineage: {
    id: 'lin-dwarf',
    name: 'Anão da Montanha',
    description: 'Robusto.',
    speed: 25,
    size: 'MEDIUM',
    abilityBonuses: {},
    traitsSummary: [],
    ruleset: 'SRD_2024',
  },
  background: {
    id: 'bg-soldier',
    name: 'Soldado',
    description: 'Guerreiro.',
    skillProficiencies: ['Athletics'],
    allowedAbilityBonuses: [],
    ruleset: 'SRD_2024',
  },
  archetype: {
    id: 'cls-fighter',
    name: 'Guerreiro',
    hitDice: 'd10',
    primaryAbility: 'STRENGTH',
    savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
    spellcastingType: 'NONE',
    ruleset: 'SRD_2024',
  },
};

const mockDeadCharacter: CharacterResponse = {
  ...mockLivingCharacter,
  hitPointsCurrent: 0,
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('TP-05: RestModal Component & Interactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders RestModal with Short Rest tab active by default and displays character vitals', () => {
    renderWithQuery(
      <RestModal
        isOpen={true}
        onClose={vi.fn()}
        character={mockLivingCharacter}
        initialMode="SHORT"
      />
    );

    expect(screen.getByText('Descanso e Recuperação')).toBeInTheDocument();
    expect(screen.getByTestId('tab-short-rest')).toBeInTheDocument();
    expect(screen.getByTestId('tab-long-rest')).toBeInTheDocument();

    // Check CON modifier preview (+3 PV)
    expect(screen.getByText('+3 PV por dado')).toBeInTheDocument();
    // Check Hit Dice available
    expect(screen.getByText(/Disponíveis: 3 de 4/)).toBeInTheDocument();

    // Button should be disabled initially (0 dice selected)
    const confirmBtn = screen.getByTestId('confirm-short-rest-btn');
    expect(confirmBtn).toBeDisabled();
  });

  it('allows incrementing/decrementing hit dice and dispatches short rest payload', async () => {
    const apiFetchSpy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      ...mockLivingCharacter,
      hitPointsCurrent: 28,
    });

    const onClose = vi.fn();

    renderWithQuery(
      <RestModal
        isOpen={true}
        onClose={onClose}
        character={mockLivingCharacter}
        initialMode="SHORT"
      />
    );

    // Increase dice spend
    const plusBtn = screen.getByLabelText('Aumentar dados de Guerreiro');
    fireEvent.click(plusBtn);

    expect(screen.getByTestId('dice-count-0')).toHaveTextContent('1');
    expect(screen.getByTestId('total-dice-selected')).toHaveTextContent('1');

    const confirmBtn = screen.getByTestId('confirm-short-rest-btn');
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-101/rest',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            restType: 'SHORT',
            hitDiceSpends: [{ classProgressionId: 'cp-fighter-1', count: 1 }],
          }),
        })
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('switches to Long Rest mode, shows benefits, and dispatches long rest payload', async () => {
    const apiFetchSpy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValue({
      ...mockLivingCharacter,
      hitPointsCurrent: 36,
      exhaustion: 1,
    });

    const onClose = vi.fn();

    renderWithQuery(
      <RestModal
        isOpen={true}
        onClose={onClose}
        character={mockLivingCharacter}
        initialMode="LONG"
      />
    );

    expect(screen.getByTestId('long-rest-content')).toBeInTheDocument();
    expect(screen.getByText(/Restaura ao valor máximo \(36 PV\)/)).toBeInTheDocument();
    expect(screen.getByText(/Preservados \(5 PV mantidos\)/)).toBeInTheDocument();
    expect(screen.getByText(/Reduz 1 nível \(2 → 1\)/)).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-long-rest-btn');
    expect(confirmBtn).toBeEnabled();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-101/rest',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            restType: 'LONG',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('blocks resting when character is dead or unconscious (0 HP) and displays alert', () => {
    renderWithQuery(
      <RestModal
        isOpen={true}
        onClose={vi.fn()}
        character={mockDeadCharacter}
        initialMode="SHORT"
      />
    );

    // Warning is rendered
    expect(screen.getByTestId('rest-dead-warning')).toBeInTheDocument();
    expect(
      screen.getByText('Personagem Inconsciente ou Morto (0 PV)')
    ).toBeInTheDocument();

    // Short rest button disabled
    expect(screen.getByTestId('confirm-short-rest-btn')).toBeDisabled();

    // Switch to long rest
    fireEvent.click(screen.getByTestId('tab-long-rest'));
    expect(screen.getByTestId('confirm-long-rest-btn')).toBeDisabled();
  });
});
