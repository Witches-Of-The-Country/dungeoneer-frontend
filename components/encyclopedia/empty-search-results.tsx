'use client';

import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptySearchResultsProps {
  message?: string;
  onReset?: () => void;
}

export function EmptySearchResults({
  message = 'Nenhum resultado encontrado para os filtros selecionados.',
  onReset,
}: EmptySearchResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border/60 rounded-xl bg-card/40 my-6">
      <div className="p-3 rounded-full bg-accent/10 border border-accent/20 mb-3 text-accent">
        <SearchX className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Nada encontrado</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-4">{message}</p>
      {onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
