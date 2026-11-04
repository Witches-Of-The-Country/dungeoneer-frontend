import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ItemCatalogModal } from '@/components/character-sheet/item-catalog-modal';
import type { CharacterResponse } from '@/lib/api/characters';

const mockAddItemMutate = vi.fn();
vi.mock('@/lib/api/characters', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/characters')>();
  return {
    ...actual,
    useManageInventory: () => ({
      addItem: {
        mutate: mockAddItemMutate,
        isPending: false,
      },
      updateItem: { mutate: vi.fn(), isPending: false },
      removeItem: { mutate: vi.fn(), isPending: false },
      useConsumable: { mutate: vi.fn(), isPending: false },
    }),
  };
});

vi.mock('@/lib/api/encyclopedia', () => ({
  fetchItems: vi.fn().mockResolvedValue({
    items: [
      {
        id: 'it-potion-healing',
        slug: 'pocao-de-cura',
        name: 'Poção de Cura',
        nameEn: 'Potion of Healing',
        itemCategory: 'POTION',
        itemType: 'Poção',
        rarity: 'Comum',
        cost: '50 po',
        weight: '0.2 kg',
        description: 'Recupera 2d4 + 2 pontos de vida.',
        ruleset: 'SRD_2024',
      },
      {
        id: 'it-longsword',
        slug: 'espada-longa',
        name: 'Espada Longa',
        nameEn: 'Longsword',
        itemCategory: 'WEAPON',
        itemType: 'Arma Marcial',
        rarity: 'Comum',
        cost: '15 po',
        weight: '1.5 kg',
        description: 'Dano de 1d8 cortante versátil (1d10).',
        ruleset: 'SRD_2024',
      },
    ],
  }),
}));

const mockCharacter: CharacterResponse = {
  id: 'char-hero-1',
  name: 'Valerius',
  level: 3,
  hitPointsCurrent: 25,
  hitPointsMax: 25,
  hitPointsTemp: 0,
  armorClass: 16,
  initiativeBonus: 2,
  speed: 9,
  proficiencyBonus: 2,
  ruleset: 'SRD_2024',
  currency: {
    cp: 50,
    sp: 20,
    ep: 0,
    gp: 100, // 100 gold = 10000 copper
    pp: 0,
    totalCopper: 10250,
    totalGold: 102.5,
  },
  abilityScores: {
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 12,
    charisma: 8,
  },
  lineage: {} as any,
  background: {} as any,
  archetype: {} as any,
};

describe('ItemCatalogModal Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('renders modal with character balance and loaded catalog items', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ItemCatalogModal character={mockCharacter} open={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Catálogo de Itens & Loja')).toBeInTheDocument();
    expect(screen.getByText(/100 po/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText('Poção de Cura').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Espada Longa')).toBeInTheDocument();
    });
  });

  it('supports direct add mode without currency deduction', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ItemCatalogModal character={mockCharacter} open={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Espada Longa')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Espada Longa'));

    const addBtn = screen.getByRole('button', { name: /Adicionar ao Inventário/i });
    fireEvent.click(addBtn);

    expect(mockAddItemMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'it-longsword',
        quantity: 1,
        purchaseWithCurrency: false,
      }),
      expect.any(Object)
    );
  });

  it('supports store purchase mode with currency deduction check', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ItemCatalogModal character={mockCharacter} open={true} onClose={vi.fn()} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Poção de Cura').length).toBeGreaterThanOrEqual(1);
    });

    const buyModeBtn = screen.getByRole('button', { name: /Comprar na Loja/i });
    fireEvent.click(buyModeBtn);

    const buyConfirmBtn = screen.getByRole('button', { name: /Comprar por 50.00 PO/i });
    expect(buyConfirmBtn).toBeEnabled();

    fireEvent.click(buyConfirmBtn);

    expect(mockAddItemMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: 'it-potion-healing',
        quantity: 1,
        purchaseWithCurrency: true,
      }),
      expect.any(Object)
    );
  });
});
