import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InventoryTab } from '@/components/character-sheet/inventory-tab';
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

const mockCharacterWithEquipment: CharacterResponse = {
  id: 'char-slots-test',
  name: 'Grom Ironclad',
  level: 3,
  hitPointsCurrent: 28,
  hitPointsMax: 28,
  hitPointsTemp: 0,
  armorClass: 18,
  initiativeBonus: 0,
  speed: 30,
  proficiencyBonus: 2,
  ruleset: 'SRD_2024',
  hasPendingLevelChoices: false,
  abilityScores: {
    strength: 16,
    dexterity: 10,
    constitution: 16,
    intelligence: 8,
    wisdom: 12,
    charisma: 10,
  },
  lineage: {
    id: 'lin-dwarf',
    name: 'Anão',
    description: 'Resistente.',
    speed: 25,
    size: 'MEDIUM',
    abilityBonuses: {},
    traitsSummary: [],
    ruleset: 'SRD_2024',
  },
  background: {
    id: 'bg-soldier',
    name: 'Soldado',
    description: 'Guerreiro veterano.',
    skillProficiencies: ['Athletics'],
    allowedAbilityBonuses: ['STR', 'CON'],
    ruleset: 'SRD_2024',
  },
  inventory: [
    {
      id: 'ci-plate',
      characterId: 'char-slots-test',
      itemId: 'item-plate',
      name: 'Armadura de Placas',
      itemCategory: 'ARMOR',
      itemType: 'Armadura Pesada',
      rarity: 'Comum',
      attunement: false,
      quantity: 1,
      equipped: true,
      equippedSlot: 'CHEST',
      attuned: false,
    },
    {
      id: 'ci-shield',
      characterId: 'char-slots-test',
      itemId: 'item-shield',
      name: 'Escudo',
      itemCategory: 'ARMOR',
      itemType: 'Escudo',
      rarity: 'Comum',
      attunement: false,
      quantity: 1,
      equipped: true,
      equippedSlot: 'LEFT_HAND',
      attuned: false,
    },
    {
      id: 'ci-longsword',
      characterId: 'char-slots-test',
      itemId: 'item-longsword',
      name: 'Espada Longa',
      itemCategory: 'WEAPON',
      itemType: 'Arma Marcial',
      rarity: 'Comum',
      attunement: false,
      quantity: 1,
      equipped: false,
      equippedSlot: null,
      attuned: false,
    },
  ],
};

describe('InventoryTab — Equipment Slots Grid', () => {
  let apiFetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchSpy = vi.spyOn(apiClient, 'apiFetch').mockResolvedValue(mockCharacterWithEquipment);
  });

  it('TR-01: renders the 12 equipment slots and shows occupied vs empty state', () => {
    renderWithQuery(<InventoryTab character={mockCharacterWithEquipment} />);

    // Check header
    expect(screen.getByText('Slots de Equipamento (12 Slots)')).toBeInTheDocument();
    expect(screen.getByText('2 / 12 ocupados')).toBeInTheDocument();

    // Check CHEST occupied with Armadura de Placas
    const chestSlot = screen.getByTestId('equipment-slot-chest');
    expect(chestSlot).toHaveTextContent('Peito');
    expect(chestSlot).toHaveTextContent('Armadura de Placas');

    // Check LEFT_HAND occupied with Escudo
    const leftHandSlot = screen.getByTestId('equipment-slot-left_hand');
    expect(leftHandSlot).toHaveTextContent('Mão Esquerda');
    expect(leftHandSlot).toHaveTextContent('Escudo');

    // Check HELMET is empty
    const helmSlot = screen.getByTestId('equipment-slot-helmet');
    expect(helmSlot).toHaveTextContent('Capacete');
    expect(helmSlot).toHaveTextContent('Vazio');

    // Check TRINKET is empty
    const trinketSlot = screen.getByTestId('equipment-slot-trinket');
    expect(trinketSlot).toHaveTextContent('Acessório / Cinto');
    expect(trinketSlot).toHaveTextContent('Vazio');
  });

  it('allows unequipping an item from the slot overview', async () => {
    renderWithQuery(<InventoryTab character={mockCharacterWithEquipment} />);

    const tirabtn = screen.getAllByRole('button', { name: /Tirar/i })[0];
    fireEvent.click(tirabtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/characters/char-slots-test/items/ci-plate'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ equipped: false, equippedSlot: null }),
        })
      );
    });
  });

  it('equips an unequipped weapon into default hand slot', async () => {
    renderWithQuery(<InventoryTab character={mockCharacterWithEquipment} />);

    const equipBtn = screen.getByRole('button', { name: /^Equipar$/i });
    fireEvent.click(equipBtn);

    await waitFor(() => {
      expect(apiFetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/api/characters/char-slots-test/items/ci-longsword'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ equipped: true, equippedSlot: 'RIGHT_HAND' }),
        })
      );
    });
  });
});
