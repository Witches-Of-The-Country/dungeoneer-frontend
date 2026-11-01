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
const mockItemMutateAsync = vi.fn();
const mockFeatMutateAsync = vi.fn();
const mockClassMutateAsync = vi.fn();
const mockSubclassMutateAsync = vi.fn();

vi.mock('@/lib/api/homebrew', () => ({
  useCreateHomebrewSpell: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useCreateHomebrewFeat: () => ({
    mutateAsync: mockFeatMutateAsync,
    isPending: false,
  }),
  useCreateHomebrewItem: () => ({
    mutateAsync: mockItemMutateAsync,
    isPending: false,
  }),
  useCreateHomebrewClass: () => ({
    mutateAsync: mockClassMutateAsync,
    isPending: false,
  }),
  useCreateHomebrewSubclass: () => ({
    mutateAsync: mockSubclassMutateAsync,
    isPending: false,
  }),
  useCreateHomebrewLineage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateHomebrewSpell: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateHomebrewFeat: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateHomebrewItem: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateHomebrewClass: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateHomebrewSubclass: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateHomebrewLineage: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/lib/api/characters', () => ({
  useReferenceClasses: () => ({
    data: [
      { id: 'cls-1', name: 'Guerreiro', hitDice: 'd10', primaryAbility: 'STRENGTH', ruleset: 'SRD_2024' },
    ],
  }),
}));

vi.mock('@/lib/api/encyclopedia', () => ({
  fetchFeats: vi.fn().mockResolvedValue({ items: [] }),
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

  it('switches to Items tab and submits dynamic Weapon and Armor mechanicalProperties', async () => {
    mockUseAuth.mockReturnValue({
      isDM: true,
      user: { id: 'dm-user-1', roles: ['DUNGEON_MASTER'] },
      token: 'jwt-token-dm',
    });
    mockItemMutateAsync.mockResolvedValueOnce({ id: 'new-item-id' });

    renderWithQueryClient(<SpellsPage />);
    fireEvent.click(screen.getByTestId('create-homebrew-button'));

    fireEvent.click(screen.getByTestId('homebrew-tab-items'));
    expect(screen.getByText('Criar Novo Item Homebrew')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('homebrew-item-category-select'), {
      target: { value: 'ARMOR' },
    });
    fireEvent.change(screen.getByTestId('armor-category-select'), {
      target: { value: 'ROBE' },
    });

    fireEvent.change(screen.getByPlaceholderText('Ex: Raio Purpúreo'), {
      target: { value: 'Manto do Arquimago' },
    });
    fireEvent.change(screen.getByPlaceholderText('Insira detalhes e mecânicas...'), {
      target: { value: 'Veste arcana com CA 15 + DES.' },
    });

    fireEvent.click(screen.getByText('Salvar Homebrew'));

    await waitFor(() => {
      expect(mockItemMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Manto do Arquimago',
          itemCategory: 'ARMOR',
          mechanicalProperties: expect.objectContaining({
            armorCategory: 'ROBE',
          }),
        })
      );
    });
  });

  it('submits a Weapon with incremental conditional damage rolls', async () => {
    mockUseAuth.mockReturnValue({
      isDM: true,
      user: { id: 'dm-user-1', roles: ['DUNGEON_MASTER'] },
      token: 'jwt-token-dm',
    });
    mockItemMutateAsync.mockResolvedValueOnce({ id: 'flame-tongue-id' });

    renderWithQueryClient(<SpellsPage />);
    fireEvent.click(screen.getByTestId('create-homebrew-button'));
    fireEvent.click(screen.getByTestId('homebrew-tab-items'));

    fireEvent.change(screen.getByPlaceholderText('Ex: Raio Purpúreo'), {
      target: { value: 'Flame Tongue' },
    });
    fireEvent.change(screen.getByPlaceholderText('Insira detalhes e mecânicas...'), {
      target: { value: 'Espada com chamas conditioned.' },
    });

    const addDamageBtn = screen.getByText('Adicionar Dado de Dano');
    fireEvent.click(addDamageBtn);

    fireEvent.click(screen.getByText('Salvar Homebrew'));

    await waitFor(() => {
      expect(mockItemMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Flame Tongue',
          itemCategory: 'WEAPON',
          mechanicalProperties: expect.objectContaining({
            damageRolls: expect.arrayContaining([
              expect.objectContaining({
                conditional: true,
              }),
            ]),
          }),
        })
      );
    });
  });

  it('submits a Feat with ability bonus choice and hard prerequisites', async () => {
    mockUseAuth.mockReturnValue({
      isDM: true,
      user: { id: 'dm-user-1', roles: ['DUNGEON_MASTER'] },
      token: 'jwt-token-dm',
    });
    mockFeatMutateAsync.mockResolvedValueOnce({ id: 'custom-feat-id' });

    renderWithQueryClient(<SpellsPage />);
    fireEvent.click(screen.getByTestId('create-homebrew-button'));
    fireEvent.click(screen.getByTestId('homebrew-tab-feats'));

    fireEvent.change(screen.getByPlaceholderText('Ex: Raio Purpúreo'), {
      target: { value: 'Mestre Guerreiro' },
    });
    fireEvent.change(screen.getByPlaceholderText('Insira detalhes e mecânicas...'), {
      target: { value: 'Talento para combatentes veteranos.' },
    });

    fireEvent.click(screen.getByText('Escolha 1 entre Opções'));

    const addPrereqBtn = screen.getByText('Adicionar Regra');
    fireEvent.click(addPrereqBtn);

    fireEvent.click(screen.getByText('Salvar Homebrew'));

    await waitFor(() => {
      expect(mockFeatMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mestre Guerreiro',
          mechanicalEffects: expect.objectContaining({
            abilityBonusChoice: expect.objectContaining({
              chooseCount: 1,
            }),
            prerequisiteRules: expect.arrayContaining([
              expect.objectContaining({
                type: 'ABILITY_SCORE',
              }),
            ]),
          }),
        })
      );
    });
  });

  it('submits a Class with saving throw chips and spellPreparationType', async () => {
    mockUseAuth.mockReturnValue({
      isDM: true,
      user: { id: 'dm-user-1', roles: ['DUNGEON_MASTER'] },
      token: 'jwt-token-dm',
    });
    mockClassMutateAsync.mockResolvedValueOnce({ id: 'custom-class-id' });

    renderWithQueryClient(<SpellsPage />);
    fireEvent.click(screen.getByTestId('create-homebrew-button'));
    fireEvent.click(screen.getByTestId('homebrew-tab-classes'));

    fireEvent.change(screen.getByPlaceholderText('Ex: Raio Purpúreo'), {
      target: { value: 'Artífice' },
    });

    fireEvent.click(screen.getByText('Salvar Homebrew'));

    await waitFor(() => {
      expect(mockClassMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Artífice',
          savingThrowProficiencies: expect.arrayContaining(['STRENGTH', 'CONSTITUTION']),
          spellPreparationType: 'NONE',
        })
      );
    });
  });
});
