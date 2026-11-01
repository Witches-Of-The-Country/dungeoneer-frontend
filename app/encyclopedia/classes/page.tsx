'use client';

import { useState } from 'react';
import { Shield, Loader2, Plus } from 'lucide-react';
import { useInfiniteClasses, type ArchetypeSummary } from '@/lib/api/encyclopedia';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreateHomebrewDialog } from '@/components/homebrew/create-homebrew-dialog';
import { SearchBar } from '@/components/encyclopedia/search-bar';
import { ReferenceCard } from '@/components/encyclopedia/reference-card';
import { ReferenceCardSkeleton } from '@/components/encyclopedia/reference-card-skeleton';
import { EmptySearchResults } from '@/components/encyclopedia/empty-search-results';
import { Button } from '@/components/ui/button';

const RULESETS = [
  { value: 'ALL', label: 'Todos os Conjuntos' },
  { value: 'SRD_2014', label: 'SRD 2014 (5.1)' },
  { value: 'SRD_2024', label: 'SRD 2024 (5.2)' },
  { value: 'HOMEBREW', label: 'Homebrew' },
];

export default function ClassesPage() {
  const { isDM } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [ruleset, setRuleset] = useState('ALL');

  const filters = {
    q: search || undefined,
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
  } = useInfiniteClasses(filters);

  const allClasses: ArchetypeSummary[] = data?.pages.flatMap((p) => p.items) ?? [];

  const handleResetFilters = () => {
    setSearch('');
    setRuleset('ALL');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-accent" />
            Classes &amp; Arquétipos
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Explore as classes fundamentais e arquétipos pelo SRD 2014, 2024 e Homebrew.
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
        category="classes"
        onClose={() => setCreateOpen(false)}
      />

      <div className="space-y-3 bg-card/60 p-4 rounded-xl border border-border/60">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar classe por nome..."
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
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReferenceCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 border border-destructive/40 rounded-xl bg-destructive/10 p-6">
          <p className="text-destructive font-medium">Erro ao carregar classes da enciclopédia.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Tentar novamente
          </Button>
        </div>
      ) : allClasses.length === 0 ? (
        <EmptySearchResults
          message="Nenhuma classe encontrada com os termos ou filtros aplicados."
          onReset={handleResetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allClasses.map((cls) => (
              <ReferenceCard
                key={`${cls.ruleset}-${cls.id}`}
                title={cls.name}
                badge="Classe"
                ruleset={cls.ruleset}
                metaFields={[
                  { label: 'Dado de Vida', value: cls.hitDice },
                  { label: 'Atributo Primário', value: cls.primaryAbility },
                  { label: 'Origem', value: cls.source },
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
                    Carregando mais classes...
                  </>
                ) : (
                  'Carregar mais classes'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
