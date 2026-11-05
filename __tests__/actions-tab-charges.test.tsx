import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActionsTab } from '@/components/character-sheet/actions-tab';
import * as apiClient from '@/lib/api/client';
import type { CharacterResponse } from '@/lib/api/characters';

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

const mockCharacterWithChargedActions: CharacterResponse = {
  id: 'char-bard-cleric',
  name: 'Scanlan & Pike',
  level: 5,
  hitPointsCurrent: 35,
  hitPointsMax: 35,
  hitPointsTemp: 0,
  armorClass: 17,
  initiativeBonus: 3,
  speed: 30,
  proficiencyBonus: 3,
  ruleset: 'SRD_2024',
  hasPendingLevelChoices: false,
  abilityScores: {
    strength: 10,
    dexterity: 16,
    constitution: 14,
    intelligence: 12,
    wisdom: 16,
    charisma: 18,
  },
  lineage: {
    id: 'lin-gnome',
    name: 'Gnomo',
    description: 'Povo engenhoso.',
    speed: 30,
    size: 'SMALL',
    abilityBonuses: {},
    traitsSummary: [],
    ruleset: 'SRD_2024',
  },
  background: {
    id: 'bg-entertainer',
    name: 'Artista',
    description: 'Músico.',
    skillProficiencies: ['Performance'],
    allowedAbilityBonuses: ['DEX', 'CHA'],
    ruleset: 'SRD_2024',
  },
  archetype: {
    id: 'cls-bard',
    name: 'Bardo',
    hitDice: 'd8',
    primaryAbility: 'CHARISMA',
    savingThrowProficiencies: ['DEXTERITY', 'CHARISMA'],
    spellcastingType: 'FULL',
    ruleset: 'SRD_2024',
  },
  actions: [
    {
      id: 'feat-bardic-inspiration',
      name: 'Inspiração Bárdica',
      actionType: 'BONUS_ACTION',
      category: 'FEAT',
      sourceType: 'FEAT',
      attackBonus: null,
      damageRolls: [
        {
          diceFormula: '1d6',
          damageType: 'FORCE',
        },
      ],
      maxUses: 3,
      usesRemaining: 3,
      maxCharges: 3,
      currentCharges: 3,
      description: 'Inspira um aliado com um dado 1d6.',
    },
    {
      id: 'feat-channel-divinity',
      name: 'Canalizar Divindade',
      actionType: 'ACTION',
      category: 'FEAT',
      sourceType: 'FEAT',
      attackBonus: null,
      damageRolls: [],
      maxUses: 2,
      usesRemaining: 2,
      maxCharges: 2,
      currentCharges: 2,
      description: 'Canaliza energia divina para produzir efeitos sagrados.',
    },
  ],
};

describe('TR-04: ActionsTab & DiceRollerModal Charged Feat Actions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders both Gastar and Rolar for rollable charged feats (Bardic Inspiration) and Gastar for non-rollable charged feats (Channel Divinity)', () => {
    renderWithQuery(<ActionsTab character={mockCharacterWithChargedActions} />);

    expect(screen.getByText('Inspiração Bárdica')).toBeInTheDocument();
    expect(screen.getByText('3 / 3 usos')).toBeInTheDocument();

    expect(screen.getByText('Canalizar Divindade')).toBeInTheDocument();
    expect(screen.getByText('2 / 2 usos')).toBeInTheDocument();

    const gastarButtons = screen.getAllByRole('button', { name: 'Gastar' });
    expect(gastarButtons).toHaveLength(2);

    const rolarButton = screen.getByRole('button', { name: 'Rolar' });
    expect(rolarButton).toBeInTheDocument();
  });

  it('consumes 1 charge via useFeatMutation when rolling Bardic Inspiration in DiceRollerModal', async () => {
    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockResolvedValue({ ...mockCharacterWithChargedActions });

    renderWithQuery(<ActionsTab character={mockCharacterWithChargedActions} />);

    // Open DiceRollerModal for Inspiração Bárdica
    const rolarButton = screen.getByRole('button', { name: 'Rolar' });
    fireEvent.click(rolarButton);

    // Click "Rolar Dano" inside DiceRollerModal
    const rollEffectBtn = await screen.findByRole('button', { name: 'Rolar Dano' });
    fireEvent.click(rollEffectBtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-bard-cleric/feats/feat-bardic-inspiration/use',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    // Clicking Rolar Dano a second time in the same modal session does not double-spend charges
    fireEvent.click(rollEffectBtn);
    expect(apiFetchSpy).toHaveBeenCalledTimes(1);
  });

  it('consumes 1 charge directly when clicking Gastar on Channel Divinity', async () => {
    const apiFetchSpy = vi
      .spyOn(apiClient, 'apiFetch')
      .mockResolvedValue({ ...mockCharacterWithChargedActions });

    renderWithQuery(<ActionsTab character={mockCharacterWithChargedActions} />);

    const gastarButtons = screen.getAllByRole('button', { name: 'Gastar' });
    // Second Gastar button belongs to Canalizar Divindade
    fireEvent.click(gastarButtons[1]);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        '/api/characters/char-bard-cleric/feats/feat-channel-divinity/use',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });
});
