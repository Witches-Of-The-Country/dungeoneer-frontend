'use client';

import React from 'react';
import { getXpProgress } from '@/lib/api/characters';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, Plus } from 'lucide-react';

interface XpProgressBarProps {
  currentXp: number;
  currentLevel: number;
  onOpenAddXp: () => void;
  onOpenLevelUp: () => void;
}

export function XpProgressBar({
  currentXp,
  currentLevel,
  onOpenAddXp,
  onOpenLevelUp,
}: XpProgressBarProps) {
  const { current, max, percentage, canLevelUp } = getXpProgress(currentXp, currentLevel);

  return (
    <div className="bg-surface/80 border border-primary/20 rounded-xl p-4 shadow-lg backdrop-blur flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="font-semibold text-sm tracking-wide text-foreground uppercase">
            Experiência (XP)
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-mono">
            Nível {currentLevel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1 border-primary/30 hover:bg-primary/20"
            onClick={onOpenAddXp}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar XP
          </Button>

          {canLevelUp && (
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold shadow-md shadow-amber-500/20 animate-bounce"
              onClick={onOpenLevelUp}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Subir de Nível!
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>{current.toLocaleString('pt-BR')} XP</span>
          <span>{currentLevel < 20 ? `${max.toLocaleString('pt-BR')} XP` : 'Nível Máximo'}</span>
        </div>
        <Progress value={percentage} className="h-2.5 bg-stone-900 border border-primary/20" />
      </div>
    </div>
  );
}