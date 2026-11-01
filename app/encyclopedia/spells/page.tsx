'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Plus } from 'lucide-react';
import { useInfiniteSpells, type Spell } from '@/lib/api/encyclopedia';
import { useAuth } from '@/lib/hooks/use-auth';
import { CreateHomebrewDialog } from '@/components/homebrew/create-homebrew-dialog';
import { SearchBar } from '@/components/encyclopedia/search-bar';
import { ReferenceCard } from '@/components/encyclopedia/reference-card';
import { ReferenceCardSkeleton } from '@/components/encyclopedia/reference-card-skeleton';
import { EmptySearchResults } from '@/components/encyclopedia/empty-search-results';
import { SpellDetailModal } from '@/components/encyclopedia/spell-detail-modal';
import { Button } from '@/components/ui/button';

const SPELL_LEVELS = [
  { value: 'ALL', label: 'Todos os Círculos' },
  { value: '0', label: 'Truque (0)' },
  { value: '1', label: '1º Círculo' },
  { value: '2', label: '2º Círculo' },
  { value: '3', label: '3º Círculo' },
  { value: '4', label: '4º Círculo' },
  { value: '5', label: '5º Círculo' },
  { value: '6', label: '6º Círculo' },
  { value: '7', label: '7º Círculo' },
  { value: '8', label: '8º Círculo' },
  { value: '9', label: '9º Círculo' },
];

const SPELL_SCHOOLS = [
  { value: 'ALL', label: 'Todas as Escolas' },
  { value: 'Abjuração', label: 'Abjuração' },
  { value: 'Adivinhação', label: 'Adivinhação' },
  { value: 'Conjuração', label: 'Conjuração' },
  { value: 'Encantamento', label: 'Encantamento' },
  { value: 'Evocação', label: 'Evocação' },
  { value: 'Ilusão', label: 'Ilusão' },
  { value: 'Necromancia', label: 'Necromancia' },
  { value: 'Transmutação', label: 'Transmutação' },
];

const RULESETS = [
  { value: 'ALL', label: 'Todos os Conjuntos' },
  { value: 'SRD_2014', label: 'SRD 2014 (5.1)' },
  { value: 'SRD_2024', label: 'SRD 2024 (5.2)' },
  { value: 'HOMEBREW', label: 'Homebrew' },
];

export default function SpellsPage() {
  const { isDM } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [editingSpell, setEditingSpell] = useState<Spell | null>(null);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('ALL');
  const [school, setSchool] = useState('ALL');
  const [ruleset, setRuleset] = useState('ALL');

  const filters = {
    q: search || undefined,
    level: level !== 'ALL' ? parseInt(level, 10) : undefined,
    school: school !== 'ALL' ? school : undefined,
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
  } = useInfiniteSpells(filters);

  const allSpells: Spell[] = data?.pages.flatMap((p) => p.items) ?? [];

  const handleResetFilters = () => {
    setSearch('');
    setLevel('ALL');
    setSchool('ALL');
    setRuleset('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Grimório de Magias
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Consulte truques e magias do 1º ao 9º círculo dos compêndios SRD 2014, 2024 e Homebrew.
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
        open={createOpen || !!editingSpell}
        category="spells"
        editEntity={editingSpell}
        onClose={() => {
          setCreateOpen(false);
          setEditingSpell(null);
        }}
      />
      <SpellDetailModal
        spell={selectedSpell}
        open={!!selectedSpell}
        onClose={() => setSelectedSpell(null)}
        onEdit={(sp) => setEditingSpell(sp)}
      />

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-card/60 p-4 rounded-xl border border-border/60">
        <div className="flex flex-col md:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar magia por nome (PT/EN) ou descrição..."
          />

          <div className="flex flex-wrap sm:flex-nowrap gap-2">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="bg-card border border-border/80 text-foreground text-xs rounded-lg px-3 py-2 focus:ring-accent focus:border-accent"
              aria-label="Filtrar por círculo"
            >
              {SPELL_LEVELS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className="bg-card border border-border/80 text-foreground text-xs rounded-lg px-3 py-2 focus:ring-accent focus:border-accent"
              aria-label="Filtrar por escola"
            >
              {SPELL_SCHOOLS.map((opt) => (
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

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReferenceCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12 border border-destructive/40 rounded-xl bg-destructive/10 p-6">
          <p className="text-destructive font-medium">Erro ao carregar magias da enciclopédia.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
            Tentar novamente
          </Button>
        </div>
      ) : allSpells.length === 0 ? (
        <EmptySearchResults
          message="Nenhuma magia encontrada com os termos ou filtros aplicados."
          onReset={handleResetFilters}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allSpells.map((spell) => (
              <ReferenceCard
                key={`${spell.ruleset}-${spell.slug}`}
                title={spell.name}
                subtitle={spell.nameEn}
                badge={spell.level === 0 ? 'Truque' : `${spell.level}º Círculo`}
                ruleset={spell.ruleset}
                onClick={() => setSelectedSpell(spell)}
                description={spell.description}
                extraBadges={[spell.school]}
                metaFields={[
                  { label: 'Tempo', value: spell.castingTime },
                  { label: 'Alcance', value: spell.rangeArea },
                  { label: 'Componentes', value: spell.components },
                  { label: 'Duração', value: spell.duration },
                ]}
              />
            ))}
          </div>

          {/* Lazy Load Button */}
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
                    Carregando mais magias...
                  </>
                ) : (
                  'Carregar mais magias'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
