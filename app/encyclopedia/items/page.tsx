'use client';

import { useState } from 'react';
import { BookOpen, Loader2, Plus } from 'lucide-react';
import { useInfiniteItems, type Item } from '@/lib/api/encyclopedia';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreateHomebrewDialog } from '@/components/homebrew/create-homebrew-dialog';
import { SearchBar } from '@/components/encyclopedia/search-bar';
import { ReferenceCard } from '@/components/encyclopedia/reference-card';
import { ReferenceCardSkeleton } from '@/components/encyclopedia/reference-card-skeleton';
import { EmptySearchResults } from '@/components/encyclopedia/empty-search-results';
import { Button } from '@/components/ui/button';

const ITEM_CATEGORIES = [
  { value: 'ALL', label: 'Todas as Categorias' },
  { value: 'WEAPON', label: 'Armas' },
  { value: 'ARMOR', label: 'Armaduras & Escudos' },
  { value: 'POTION', label: 'Poções' },
  { value: 'RING', label: 'Anéis' },
  { value: 'ROD', label: 'Bastões' },
  { value: 'SCROLL', label: 'Pergaminhos' },
  { value: 'STAFF', label: 'Cajados' },
  { value: 'WAND', label: 'Varinhas' },
  { value: 'WONDROUS', label: 'Itens Maravilhosos' },
  { value: 'ADVENTURING_GEAR', label: 'Equipamento de Aventura' },
];

const ITEM_RARITIES = [
  { value: 'ALL', label: 'Todas as Raridades' },
  { value: 'Comum', label: 'Comum' },
  { value: 'Incomum', label: 'Incomum' },
  { value: 'Raro', label: 'Raro' },
  { value: 'Muito Raro', label: 'Muito Raro' },
  { value: 'Lendário', label: 'Lendário' },
  { value: 'Artefato', label: 'Artefato' },
];

const RULESETS = [
  { value: 'ALL', label: 'Todos os Conjuntos' },
  { value: 'SRD_2014', label: 'SRD 2014 (5.1)' },
  { value: 'SRD_2024', label: 'SRD 2024 (5.2)' },
  { value: 'HOMEBREW', label: 'Homebrew' },
];

export default function ItemsPage() {
  const { isDM } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [rarity, setRarity] = useState('ALL');
  const [ruleset, setRuleset] = useState('ALL');

  const filters = {
    q: search || undefined,
    category: category !== 'ALL' ? category : undefined,
    rarity: rarity !== 'ALL' ? rarity : undefined,
    ruleset: ruleset !== 'ALL' ? ruleset : undefined,
    limit: 20,
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteItems(filters);

  const allItems: Item[] = data?.pages.flatMap((p) => p.items) ?? [];

  const handleResetFilters = () => {
    setSearch('');
    setCategory('ALL');
    setRarity('ALL');
    setRuleset('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-accent" />
            Itens &amp; Equipamentos
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Armas, armaduras, poções e itens mágicos dos compêndios SRD 2014, 2024 e Homebrew.
          </p>
        </div>

        {isDM && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold shadow-sm font-serif tracking-wide flex items-center gap-2 self-start sm:self-auto"
            data-testid="create-homebrew-button"
          >
            <Plus className="w-4 h-4" />
            Criar novo
          </Button>
        )}
      </div>

      <CreateHomebrewDialog
        open={createOpen}
        category="items"
        onClose={() => setCreateOpen(false)}
      />

      <div className="space-y-3 bg-card/60 p-4 rounded-xl border border-border/60">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar item por nome (PT/EN), tipo ou propriedades..."
          />

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-card border border-border/80 text-foreground text-xs rounded-lg px-3 py-2 focus:ring-accent focus:border-accent"
              aria-label="Filtrar por categoria"
            >
              {ITEM_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value)}
              className="bg-card border border-border/80 text-foreground text-xs rounded-lg px-3 py-2 focus:ring-accent focus:border-accent"
              aria-label="Filtrar por raridade"
            >
              {ITEM_RARITIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={ruleset}
              onChange={(e) => setRuleset(e.target.value)}
              className="bg-card border border-border/80 text-foreground text-xs rounded-lg px-3 py-2 focus:ring-accent focus:border-accent"
              aria-label="Filtrar por conjunto de regras"
            >
              {RULESETS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReferenceCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 border border-destructive/40 rounded-xl bg-destructive/10 p-6">
          <p className="text-destructive font-medium">Erro ao carregar itens da enciclopédia.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Tentar novamente
          </Button>
        </div>
      ) : allItems.length === 0 ? (
        <EmptySearchResults
          message="Nenhum item encontrado com os termos ou filtros aplicados."
          onReset={handleResetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allItems.map((item) => (
              <ReferenceCard
                key={`${item.ruleset}-${item.slug}`}
                title={item.name}
                subtitle={item.nameEn}
                badge={item.rarity || 'Comum'}
                ruleset={item.ruleset}
                description={item.description}
                extraBadges={[item.itemCategory, item.itemType].filter(Boolean)}
                metaFields={[
                  { label: 'Sintonia', value: item.attunement ? 'Necessária' : 'Não' },
                  { label: 'Custo', value: item.cost },
                  { label: 'Peso', value: item.weight },
                  { label: 'Origem', value: item.source },
                ]}
              />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4 pb-8">
              <Button
                variant="outline"
                size="default"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2 px-6"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando mais itens...
                  </>
                ) : (
                  'Carregar mais itens'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
