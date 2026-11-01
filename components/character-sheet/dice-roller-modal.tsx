'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Dices, Sparkles } from 'lucide-react';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  attackBonus?: number | null;
  damageFormula?: string;
}

export function DiceRollerModal({
  isOpen,
  onClose,
  title,
  attackBonus,
  damageFormula,
}: DiceRollerModalProps) {
  const [d20Result, setD20Result] = useState<number | null>(null);
  const [damageResult, setDamageResult] = useState<number | null>(null);

  const rollD20 = () => {
    const raw = Math.floor(Math.random() * 20) + 1;
    setD20Result(raw);
  };

  const rollDamage = () => {
    if (!damageFormula) return;
    // Simple parser for 1d8, 2d6+3, etc.
    const parts = damageFormula.toLowerCase().split('d');
    if (parts.length === 2) {
      const count = parseInt(parts[0], 10) || 1;
      const rest = parts[1].split('+');
      const dieType = parseInt(rest[0], 10) || 6;
      const bonus = rest.length > 1 ? parseInt(rest[1], 10) : 0;

      let sum = 0;
      for (let i = 0; i < count; i++) {
        sum += Math.floor(Math.random() * dieType) + 1;
      }
      setDamageResult(sum + bonus);
    }
  };

  const totalAttack = d20Result !== null ? d20Result + (attackBonus || 0) : null;
  const isCritical = d20Result === 20;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-surface border-primary/30 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-primary" />
            <DialogTitle className="text-lg font-bold text-primary">{title}</DialogTitle>
          </div>
          <DialogDescription>Simulador de rolagem de ataque e dano.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Attack Roll */}
          <div className="p-4 rounded-xl border border-primary/20 bg-background/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground">Teste de Ataque (d20 {attackBonus ? `+ ${attackBonus}` : ''}):</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-extrabold font-mono ${isCritical ? 'text-amber-400 animate-pulse' : 'text-primary'}`}>
                  {totalAttack !== null ? totalAttack : '-'}
                </span>
                {d20Result !== null && (
                  <span className="text-xs text-muted-foreground font-mono">
                    (dado: {d20Result} {isCritical ? 'CRÍTICO!' : ''})
                  </span>
                )}
              </div>
            </div>
            <Button
              size="sm"
              onClick={rollD20}
              className="bg-primary/20 hover:bg-primary/30 border border-primary/40 text-foreground font-semibold"
            >
              Rolar Ataque
            </Button>
          </div>

          {/* Damage Roll */}
          {damageFormula && (
            <div className="p-4 rounded-xl border border-primary/20 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Dano ({damageFormula}):</span>
                <div>
                  <span className="text-3xl font-extrabold font-mono text-red-400">
                    {damageResult !== null ? damageResult : '-'}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                onClick={rollDamage}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-semibold"
              >
                Rolar Dano
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}