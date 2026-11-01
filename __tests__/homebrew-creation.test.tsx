import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import SpellsPage from '@/app/encyclopedia/spells/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUseAuth = vi.fn();
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockMutateAsync = vi.fn();
vi.mock('@/lib/api/homebrew', () => ({
  useCreateHomebrewSpell: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useCreateHomebrewFeat: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateHomebrewItem: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateHomebrewClass: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useCreateHomebrewLineage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/lib/api/encyclopedia', () => ({
  useInfiniteSpells: () => ({
    data: {
      pages: [
        {
          items: [
            {
              id: 'spell-1',
              ruleset: 'HOMEBREW',
              slug: 'raio-purpureo',
              name: 'Raio Purpúreo',
              nameEn: 'Purple Ray',
              level: 3,
              school: 'Evocação',
              castingTime: '1 ação',
              rangeArea: '18 metros',
              components: 'V, S',
              duration: 'Instantânea',
              description: 'Dispara um feixe de energia púrpura.',
              source: 'HOMEBREW',
            },
          ],
          nextCursor: null,
          hasNext: false,
          pageSize: 1,
        },
      ],
    },
    isLoading: false,
    isError: false,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    refetch: vi.fn(),
  }),
}));

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Homebrew UI & Role Gating Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Criar novo" button when user is a DUNGEON_MASTER', () => {
    mockUseAuth.mockReturnValue({
      isDM: true,
      user: { id: 'dm-user-1', roles: ['DUNGEON_MASTER'] },
      token: 'jwt-token-dm',
    });

    renderWithQueryClient(<SpellsPage />);

    const createBtn = screen.getByTestId('create-homebrew-button');
    expect(createBtn).toBeDefined();
    expect(createBtn.textContent).toContain('Criar novo');
  });

  it('hides "Criar novo" button when user is a regular player (not DM)', () => {
    mockUseAuth.mockReturnValue({
      isDM: false,
      user: { id: 'player-user-1', roles: ['PLAYER'] },
      token: 'jwt-token-player',
    });

    renderWithQueryClient(<SpellsPage />);

    expect(screen.queryByTestId('create-homebrew-button')).toBeNull();
  });

  it('opens CreateHomebrewDialog when DM clicks "Criar novo" and submits successfully', async () => {
    mockUseAuth.mockReturnValue({
      isDM: true,
      user: { id: 'dm-user-1', roles: ['DUNGEON_MASTER'] },
      token: 'jwt-token-dm',
    });
    mockMutateAsync.mockResolvedValueOnce({ id: 'new-spell-id' });

    renderWithQueryClient(<SpellsPage />);

    const createBtn = screen.getByTestId('create-homebrew-button');
    fireEvent.click(createBtn);

    expect(screen.getByText('Criar Nova Magia Homebrew')).toBeDefined();

    const nameInput = screen.getByPlaceholderText('Ex: Raio Purpúreo');
    const descInput = screen.getByPlaceholderText('Insira detalhes e mecânicas...');

    fireEvent.change(nameInput, { target: { value: 'Nova Magia Arcana' } });
    fireEvent.change(descInput, { target: { value: 'Descrição detalhada da magia.' } });

    const submitBtn = screen.getByText('Salvar Homebrew');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nova Magia Arcana',
          description: 'Descrição detalhada da magia.',
        })
      );
    });
  });
});
