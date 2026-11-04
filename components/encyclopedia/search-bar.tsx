'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Pesquisar por nome ou texto...',
  debounceMs = 300,
}: SearchBarProps) {
  const [innerValue, setInnerValue] = useState(value);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (innerValue !== value) {
        onChange(innerValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [innerValue, value, onChange, debounceMs]);

  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        value={innerValue}
        onChange={(e) => setInnerValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9 bg-card border-border/60 focus-visible:ring-accent"
        aria-label="Campo de busca da enciclopédia"
      />
      {innerValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setInnerValue('');
            onChange('');
          }}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          aria-label="Limpar busca"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
