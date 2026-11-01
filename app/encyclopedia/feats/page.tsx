'use client';

import { useState } from 'react';
import { Award, Loader2, Plus } from 'lucide-react';
import { useInfiniteFeats, type Feat } from '@/lib/api/encyclopedia';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreateHomebrewDialog } from '@/components/homebrew/create-homebrew-dialog';
import { SearchBar } from '@/components/encyclopedia/search-bar';
import { ReferenceCard } from '@/components/encyclopedia/reference-card';
import { ReferenceCardSkeleton } from '@/components/encyclopedia/reference-card-skeleton';
import { EmptySearchResults } from '@/components/encyclopedia/empty-search-results';
import { FeatDetailModal } from '@/components/encyclopedia/feat-detail-modal';
import { Button } from '@/components/ui/button';

const RULESETS = [
  { value: 'ALL', label: 'Todos os Conjuntos' },
  { value: 'SRD_2014', label: 'SRD 2014 (5.1)' },
  { value: 'SRD_2024', label: 'SRD 2024 (5.2)' },
  { value: 'HOMEBREW', label: 'Homebrew' },
];

const FEAT_TYPE_OPTIONS = [
  { value: 'ORIGIN', label: 'Origem' },
  { value: 'GENERAL', label: 'Geral' },
  { value: 'CLASS', label: 'Classe' },
  { value: 'SUBCLASS', label: 'Subclasse' },
  { value: 'LINEAGE', label: 'Linhagem' },
];

const FEAT_TYPE_LABELS: Record<string, string> = {
  ORIGIN: 'Origem',
  GENERAL: 'Geral',
  CLASS: 'Classe',
  SUBCLASS: 'Subclasse',
  LINEAGE: 'Linhagem',
};

export default function FeatsPage() {
  const { isDM } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);
  const [editingFeat, setEditingFeat] = useState<Feat | null>(null);
  const [search, setSearch] = useState('');
  const [ruleset, setRuleset] = useState('ALL');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const toggleFeatType = (typeVal: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeVal) ? prev.filter((t) => t !== typeVal) : [...prev, typeVal]
    );
  };

  const filters = {
    q: search || undefined,
    ruleset: ruleset !== 'ALL' ? ruleset : undefined,
    featTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
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
  } = useInfiniteFeats(filters);

  const allFeats: Feat[] = data?.pages.flatMap((p) => p.items) ?? [];

  const handleResetFilters = () => {
    setSearch('');
    setRuleset('ALL');
    setSelectedTypes([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-accent" />
            Talentos de Personagem
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consulte talentos gerais, de origem, classe, subclasse e linhagem do SRD 2014, 2024 e Homebrew.
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
        open={createOpen || !!editingFeat}
        category="feats"
        editEntity={editingFeat}
        onClose={() => {
          setCreateOpen(false);
          setEditingFeat(null);
        }}
      />
      <FeatDetailModal
        feat={selectedFeat}
        open={!!selectedFeat}
        onClose={() => setSelectedFeat(null)}
        onEdit={(f) => setEditingFeat(f)}
      />

      <div className="space-y-3 bg-card/60 p-4 rounded-xl border border-border/60">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar talento por nome (PT/EN) ou requisitos..."
          />

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

        {/* Multi-Select Feat Type Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            Tipo de Talento:
          </span>
          {FEAT_TYPE_OPTIONS.map((opt) => {
            const active = selectedTypes.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`filter-feat-type-${opt.value.toLowerCase()}`}
                onClick={() => toggleFeatType(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'border-amber-500 bg-amber-500/25 text-amber-200'
                    : 'border-border/60 bg-card text-muted-foreground hover:border-accent/60'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {selectedTypes.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTypes([])}
              className="text-xs text-amber-400 hover:underline ml-2"
            >
              Limpar tipos
            </button>
          )}
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
          <p className="text-destructive font-medium">Erro ao carregar talentos da enciclopédia.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Tentar novamente
          </Button>
        </div>
      ) : allFeats.length === 0 ? (
        <EmptySearchResults
          message="Nenhum talento encontrado com os termos ou filtros aplicados."
          onReset={handleResetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allFeats.map((feat) => {
              const typeLabel = feat.featType ? (FEAT_TYPE_LABELS[feat.featType] || feat.featType) : undefined;
              return (
                <ReferenceCard
                  key={`${feat.ruleset}-${feat.slug}`}
                  title={feat.name}
                  subtitle={feat.nameEn}
                  badge={typeLabel ? `Talento (${typeLabel})` : 'Talento'}
                  ruleset={feat.ruleset}
                  onClick={() => setSelectedFeat(feat)}
                  description={feat.description}
                  metaFields={[
                    { label: 'Tipo', value: typeLabel || 'Geral' },
                    { label: 'Pré-requisitos', value: feat.prerequisites || 'Nenhum' },
                    { label: 'Origem', value: feat.source },
                  ]}
                />
              );
            })}
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
                    Carregando mais talentos...
                  </>
                ) : (
                  'Carregar mais talentos'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
