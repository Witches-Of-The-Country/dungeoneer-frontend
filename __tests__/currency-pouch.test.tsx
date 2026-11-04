import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CurrencyPouchCard } from '@/components/character-sheet/currency-pouch-card';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUpdateCurrencyMutate = vi.fn();

vi.mock('@/lib/api/characters', async () => {
  const actual = await vi.importActual('@/lib/api/characters');
  return {
    ...actual,
    useManageInventory: () => ({
      updateCurrency: {
        mutate: mockUpdateCurrencyMutate,
        isPending: false,
      },
    }),
  };
});

describe('CurrencyPouchCard Component', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const mockCharacter: any = {
    id: 'char-123',
    name: 'Gimli',
    currency: {
      cp: 50,
      sp: 20,
      ep: 5,
      gp: 15,
      pp: 2,
      totalCopper: 4000,
      totalGold: 40.0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 5 coin denominations and equivalent gold total', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CurrencyPouchCard character={mockCharacter} />
      </QueryClientProvider>
    );

    expect(screen.getByText('Bolsa de Moedas (Currency Pouch)')).toBeDefined();
    expect(screen.getByText('PC')).toBeDefined();
    expect(screen.getByText('PP')).toBeDefined();
    expect(screen.getByText('PE')).toBeDefined();
    expect(screen.getByText('PO')).toBeDefined();
    expect(screen.getByText('PL')).toBeDefined();

    expect(screen.getByText('50')).toBeDefined(); // cp
    expect(screen.getByText('20')).toBeDefined(); // sp
    expect(screen.getByText('5')).toBeDefined(); // ep
    expect(screen.getByText('15')).toBeDefined(); // gp
    expect(screen.getByText('2')).toBeDefined(); // pp
    expect(screen.getByText('40 PO')).toBeDefined();
  });

  it('triggers consolidation mutation when clicking Consolidar', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CurrencyPouchCard character={mockCharacter} />
      </QueryClientProvider>
    );

    const consolidateBtn = screen.getByText('Consolidar');
    fireEvent.click(consolidateBtn);

    expect(mockUpdateCurrencyMutate).toHaveBeenCalledWith(
      { consolidate: true },
      expect.any(Object)
    );
  });
});
