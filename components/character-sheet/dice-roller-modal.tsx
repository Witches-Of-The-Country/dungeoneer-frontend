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
import { Dices, Heart, Sparkles } from 'lucide-react';

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  attackBonus?: number | null;
  damageFormula?: string;
  isHealing?: boolean;
  onApplyHealing?: (amount: number) => void;
}

export function DiceRollerModal({
  isOpen,
  onClose,
  title,
  attackBonus,
  damageFormula,
  isHealing,
  onApplyHealing,
}: DiceRollerModalProps) {
  const isAdvantage =
    (damageFormula && damageFormula.toLowerCase().includes('2d20kh1')) ||
    title.toLowerCase().includes('descuidado') ||
    title.toLowerCase().includes('reckless');

  const [d20Rolls, setD20Rolls] = useState<number[] | null>(null);
  const [effectResult, setEffectResult] = useState<number | null>(null);

  const rollAttack = () => {
    if (isAdvantage) {
      const d1 = Math.floor(Math.random() * 20) + 1;
      const d2 = Math.floor(Math.random() * 20) + 1;
      setD20Rolls([d1, d2]);
    } else {
      const d = Math.floor(Math.random() * 20) + 1;
      setD20Rolls([d]);
    }
  };

  const rollEffect = () => {
    if (!damageFormula) return;
    // Regex for NdX(kh1)?(+/-B)
    const match = damageFormula.toLowerCase().match(/(\d+)d(\d+)(?:kh\d|kl\d)?(?:([+-])(\d+))?/);
    if (!match) return;

    const count = parseInt(match[1], 10) || 1;
    const dieType = parseInt(match[2], 10) || 6;
    const sign = match[3] === '-' ? -1 : 1;
    const bonus = match[4] ? parseInt(match[4], 10) * sign : 0;

    let sum = 0;
    for (let i = 0; i < count; i++) {
      sum += Math.floor(Math.random() * dieType) + 1;
    }
    setEffectResult(sum + bonus);
  };

  const chosenD20 =
    d20Rolls !== null
      ? isAdvantage && d20Rolls.length === 2
        ? Math.max(d20Rolls[0], d20Rolls[1])
        : d20Rolls[0]
      : null;

  const totalAttack = chosenD20 !== null ? chosenD20 + (attackBonus || 0) : null;
  const isCritical = chosenD20 === 20;

  const hasAttackSection = attackBonus !== null && attackBonus !== undefined;
  const hasEffectSection = !!damageFormula && (!isAdvantage || damageFormula !== '2d20kh1');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] bg-surface border-primary/30 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isHealing ? (
              <Heart className="w-5 h-5 text-emerald-400" />
            ) : (
              <Dices className="w-5 h-5 text-primary" />
            )}
            <DialogTitle className={`text-lg font-bold ${isHealing ? 'text-emerald-400' : 'text-primary'}`}>
              {title}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isHealing
              ? 'Rolagem de recuperação de pontos de vida (cura).'
              : isAdvantage
              ? 'Ataque com Vantagem (rola 2d20 e mantém o maior dado).'
              : 'Simulador de rolagem de ataque e dano.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Attack Roll (or Advantage Attack Roll) */}
          {hasAttackSection && (
            <div className="p-4 rounded-xl border border-primary/20 bg-background/50 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">
                  {isAdvantage ? 'Ataque com Vantagem (2d20kh1' : 'Teste de Ataque (d20'}
                  {attackBonus ? ` + ${attackBonus}` : ''}):
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-extrabold font-mono ${
                      isCritical ? 'text-amber-400 animate-pulse' : 'text-primary'
                    }`}
                  >
                    {totalAttack !== null ? totalAttack : '-'}
                  </span>
                  {d20Rolls !== null && (
                    <span className="text-xs text-muted-foreground font-mono">
                      {isAdvantage && d20Rolls.length === 2
                        ? `(dados: ${d20Rolls[0]}, ${d20Rolls[1]} → maior: ${chosenD20})`
                        : `(dado: ${chosenD20})`}
                      {isCritical ? ' CRÍTICO!' : ''}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                onClick={rollAttack}
                className="bg-primary/20 hover:bg-primary/30 border border-primary/40 text-foreground font-semibold"
              >
                {isAdvantage ? 'Rolar c/ Vantagem' : 'Rolar Ataque'}
              </Button>
            </div>
          )}

          {/* Healing or Damage Roll */}
          {hasEffectSection && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isHealing
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-red-500/20 bg-background/50'
              }`}
            >
              <div>
                <span className="text-xs text-muted-foreground">
                  {isHealing ? 'Recuperação de Vida' : 'Dano'} ({damageFormula}):
                </span>
                <div>
                  <span
                    className={`text-3xl font-extrabold font-mono ${
                      isHealing ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {effectResult !== null ? (isHealing ? `+${effectResult} PV` : effectResult) : '-'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  onClick={rollEffect}
                  className={
                    isHealing
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold'
                      : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 font-semibold'
                  }
                >
                  {isHealing ? 'Rolar Cura' : 'Rolar Dano'}
                </Button>
                {isHealing && effectResult !== null && onApplyHealing && (
                  <Button
                    size="sm"
                    onClick={() => onApplyHealing(effectResult)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold shadow-md animate-pulse text-xs"
                  >
                    Aplicar aos PV (+{effectResult} PV)
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
