import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchBar } from '@/components/encyclopedia/search-bar';
import { ReferenceCard } from '@/components/encyclopedia/reference-card';
import { EmptySearchResults } from '@/components/encyclopedia/empty-search-results';
import { ClassDetailModal } from '@/components/encyclopedia/class-detail-modal';
import { SpellDetailModal } from '@/components/encyclopedia/spell-detail-modal';
import { ItemDetailModal } from '@/components/encyclopedia/item-detail-modal';
import { LineageDetailModal } from '@/components/encyclopedia/lineage-detail-modal';
import FeatsPage from '@/app/encyclopedia/feats/page';
import SpellsPage from '@/app/encyclopedia/spells/page';
import ItemsPage from '@/app/encyclopedia/items/page';

vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({ isDM: false, user: null }),
}));

vi.mock('@/lib/api/encyclopedia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api/encyclopedia')>();
  return {
    ...actual,
    fetchSubclasses: vi.fn().mockResolvedValue([
      {
        id: 'sub-champion',
        archetypeId: 'cls-fighter',
        name: 'Campeão',
        nameEn: 'Champion',
        description: 'Foco em golpes críticos devastadores.',
        ruleset: 'SRD_2024',
        source: 'SRD',
      },
    ]),
    fetchProgressionFeats: vi.fn().mockImplementation(async (_archId: string, level: number) => {
      if (level >= 1) {
        return [
          {
            id: 'feat-second-wind',
            name: 'Retomar o Fôlego',
            nameEn: 'Second Wind',
            description: 'Recupera 1d10 + nível PV como ação bônus.',
            ruleset: 'SRD_2024',
            source: 'SRD',
          },
        ];
      }
      return [];
    }),
    fetchSubclassProgressionFeats: vi.fn().mockResolvedValue([]),
  };
});

describe('Encyclopedia UI Components', () => {
  it('renders SearchBar and triggers debounced onChange', async () => {
    vi.useFakeTimers();
    const handleChange = vi.fn();
    render(<SearchBar value="" onChange={handleChange} debounceMs={300} />);

    const input = screen.getByLabelText('Campo de busca da enciclopédia');
    fireEvent.change(input, { target: { value: 'Bola de Fogo' } });

    expect(handleChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(handleChange).toHaveBeenCalledWith('Bola de Fogo');
    vi.useRealTimers();
  });

  it('renders ReferenceCard with title, ruleset, badge, meta fields, and clickable onClick handler', () => {
    const handleClick = vi.fn();
    render(
      <ReferenceCard
        title="Bola de Fogo"
        subtitle="Fireball"
        badge="3º Círculo"
        ruleset="SRD_2024"
        description="Uma explosão brilhante de fogo surge do dedo do conjurador."
        onClick={handleClick}
        metaFields={[
          { label: 'Tempo', value: '1 ação' },
          { label: 'Alcance', value: '45 metros' },
        ]}
      />
    );

    expect(screen.getByText('Bola de Fogo')).toBeInTheDocument();
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('3º Círculo')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText(/Tempo:/)).toBeInTheDocument();
    expect(screen.getByText('1 ação')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders EmptySearchResults with reset button action', () => {
    const handleReset = vi.fn();
    render(
      <EmptySearchResults
        message="Nenhuma magia encontrada."
        onReset={handleReset}
      />
    );

    expect(screen.getByText('Nada encontrado')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma magia encontrada.')).toBeInTheDocument();

    const button = screen.getByRole('button', { name: 'Limpar filtros' });
    fireEvent.click(button);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('renders ClassDetailModal with Level 1–20 Progression Table and Subclasses', async () => {
    render(
      <ClassDetailModal
        open={true}
        onClose={vi.fn()}
        archetype={{
          id: 'cls-fighter',
          name: 'Guerreiro',
          hitDice: 'd10',
          primaryAbility: 'STRENGTH',
          savingThrowProficiencies: ['STRENGTH', 'CONSTITUTION'],
          subclassLevel: 3,
          ruleset: 'SRD_2024',
          source: 'SRD',
        }}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Tabela de Progressão da Classe \(Níveis 1 a 20\)/i)
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId('class-progression-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('class-progression-row-20')).toBeInTheDocument();
    expect(screen.getByText('Retomar o Fôlego')).toBeInTheDocument();
    expect(screen.getByText('Campeão')).toBeInTheDocument();
  });

  it('renders FeatsPage with multi-select feat type chips and allows toggling', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <FeatsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Talentos de Personagem')).toBeInTheDocument();
    const originChip = screen.getByTestId('filter-feat-type-origin');
    const generalChip = screen.getByTestId('filter-feat-type-general');
    expect(originChip).toBeInTheDocument();
    expect(generalChip).toBeInTheDocument();

    fireEvent.click(originChip);
    expect(screen.getByText('Limpar tipos')).toBeInTheDocument();

    fireEvent.click(generalChip);
    fireEvent.click(screen.getByText('Limpar tipos'));
    expect(screen.queryByText('Limpar tipos')).toBeNull();
  });

  it('renders SpellsPage with multi-select circle and school chips and allows toggling', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SpellsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Grimório de Magias')).toBeInTheDocument();
    const cantripChip = screen.getByTestId('filter-spell-level-0');
    const level1Chip = screen.getByTestId('filter-spell-level-1');
    const evocationChip = screen.getByTestId('filter-spell-school-evocação');

    expect(cantripChip).toBeInTheDocument();
    expect(level1Chip).toBeInTheDocument();
    expect(evocationChip).toBeInTheDocument();

    fireEvent.click(cantripChip);
    expect(screen.getByText('Limpar círculos')).toBeInTheDocument();

    fireEvent.click(evocationChip);
    expect(screen.getByText('Limpar escolas')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Limpar círculos'));
    expect(screen.queryByText('Limpar círculos')).toBeNull();
  });

  it('renders ItemsPage with multi-select category and rarity chips and allows toggling', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ItemsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText('Itens & Equipamentos')).toBeInTheDocument();
    const weaponChip = screen.getByTestId('filter-item-category-weapon');
    const rareChip = screen.getByTestId('filter-item-rarity-rare');

    expect(weaponChip).toBeInTheDocument();
    expect(rareChip).toBeInTheDocument();

    fireEvent.click(weaponChip);
    expect(screen.getByText('Limpar categorias')).toBeInTheDocument();

    fireEvent.click(rareChip);
    expect(screen.getByText('Limpar raridades')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Limpar categorias'));
    expect(screen.queryByText('Limpar categorias')).toBeNull();
  });

  it('renders SpellDetailModal with full mechanics and Edit action for Homebrew', () => {
    const handleEdit = vi.fn();
    render(
      <SpellDetailModal
        open={true}
        onClose={vi.fn()}
        onEdit={handleEdit}
        spell={{
          id: 'sp-1',
          name: 'Raio de Fogo Místico',
          nameEn: 'Mystic Fire Bolt',
          level: 1,
          school: 'Evocação',
          castingTime: '1 ação',
          rangeArea: '36 metros',
          components: 'V, S',
          duration: 'Instantânea',
          description: 'Dispara uma rajada ardente contra o alvo.',
          ruleset: 'HOMEBREW',
          source: 'HOMEBREW',
          mechanicalProperties: {
            damageRolls: [
              { diceCount: 2, diceType: 6, damageType: 'FIRE', bonusModifier: 0, conditional: false },
            ],
          },
        } as any}
      />
    );

    expect(screen.getByText('Raio de Fogo Místico')).toBeInTheDocument();
    expect(screen.getByText('Mystic Fire Bolt')).toBeInTheDocument();
    expect(screen.getByText('1º Círculo de Evocação')).toBeInTheDocument();
    expect(screen.getByText('36 metros')).toBeInTheDocument();
    expect(screen.getByText(/2d6/)).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /Editar/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('renders ItemDetailModal with full mechanics and Edit action for Homebrew', () => {
    const handleEdit = vi.fn();
    render(
      <ItemDetailModal
        open={true}
        onClose={vi.fn()}
        onEdit={handleEdit}
        item={{
          id: 'it-1',
          slug: 'espada-flamejante',
          name: 'Espada Flamejante',
          nameEn: 'Flaming Sword',
          itemCategory: 'WEAPON',
          itemType: 'Arma Marcial',
          rarity: 'Raro',
          attunement: true,
          cost: '500 po',
          weight: '1.5 kg',
          description: 'Uma lâmina forjada nas profundezas de lava.',
          ruleset: 'HOMEBREW',
          source: 'HOMEBREW',
          mechanicalProperties: {
            damageRolls: [
              { diceCount: 1, diceType: 8, damageType: 'SLASHING', bonusModifier: 1, conditional: false },
              { diceCount: 1, diceType: 6, damageType: 'FIRE', bonusModifier: 0, conditional: true, conditionNote: 'Quando empunhada' },
            ],
            versatileDice: '1d10',
          },
        } as any}
      />
    );

    expect(screen.getByText('Espada Flamejante')).toBeInTheDocument();
    expect(screen.getByText('Flaming Sword')).toBeInTheDocument();
    expect(screen.getByText('500 po')).toBeInTheDocument();
    expect(screen.getByText(/1d8/)).toBeInTheDocument();
    expect(screen.getByText(/1d10/)).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /Editar/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('renders LineageDetailModal with speed, size, and Edit action for Homebrew', () => {
    const handleEdit = vi.fn();
    render(
      <LineageDetailModal
        open={true}
        onClose={vi.fn()}
        onEdit={handleEdit}
        lineage={{
          id: 'lin-1',
          name: 'Gnomo Noturno',
          ruleset: 'HOMEBREW',
          source: 'HOMEBREW',
          speed: 9,
          size: 'Pequeno',
          description: 'Uma variante subterrânea adaptada à escuridão.',
        } as any}
      />
    );

    expect(screen.getByText('Gnomo Noturno')).toBeInTheDocument();
    expect(screen.getAllByText(/9 pés/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Pequeno/).length).toBeGreaterThanOrEqual(1);

    const editBtn = screen.getByRole('button', { name: /Editar/i });
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
});
