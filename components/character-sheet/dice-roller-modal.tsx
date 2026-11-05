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
import { Dices, Heart } from 'lucide-react';
import { DamageRollItem } from '@/lib/api/characters';

export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  SLASHING: 'Cortante',
  PIERCING: 'Perfurante',
  BLUDGEONING: 'Concussão',
  FIRE: 'Fogo',
  COLD: 'Frio',
  LIGHTNING: 'Elétrico',
  THUNDER: 'Trovão',
  POISON: 'Veneno',
  ACID: 'Ácido',
  PSYCHIC: 'Psíquico',
  NECROTIC: 'Necrótico',
  RADIANT: 'Radiante',
  FORCE: 'Energia',
  HEALING: 'Cura',
};

interface DiceRollerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  attackBonus?: number | null;
  damageFormula?: string;
  damageRolls?: DamageRollItem[];
  versatileDice?: string | null;
  isHealing?: boolean;
  onApplyHealing?: (amount: number) => void;
  onConsumeCharge?: () => void;
}

interface DamagePartBreakdown {
  label: string;
  formula: string;
  damageType: string;
  rolls: number[];
  bonus: number;
  total: number;
  isConditional?: boolean;
}

export function DiceRollerModal({
  isOpen,
  onClose,
  title,
  attackBonus,
  damageFormula,
  damageRolls,
  versatileDice,
  isHealing,
  onApplyHealing,
  onConsumeCharge,
}: DiceRollerModalProps) {
  const isAdvantage =
    (damageFormula && damageFormula.toLowerCase().includes('2d20kh1')) ||
    title.toLowerCase().includes('descuidado') ||
    title.toLowerCase().includes('reckless');

  const [d20Rolls, setD20Rolls] = useState<number[] | null>(null);
  const [effectResult, setEffectResult] = useState<number | null>(null);
  const [breakdownParts, setBreakdownParts] = useState<DamagePartBreakdown[] | null>(null);
  const [chargeConsumed, setChargeConsumed] = useState<boolean>(false);

  const consumeChargeOnce = () => {
    if (!isHealing && onConsumeCharge && !chargeConsumed) {
      setChargeConsumed(true);
      onConsumeCharge();
    }
  };

  // Options
  const [useVersatile, setUseVersatile] = useState<boolean>(false);
  const [enabledConditionals, setEnabledConditionals] = useState<Record<number, boolean>>({});

  const toggleConditional = (idx: number) => {
    setEnabledConditionals((prev) => ({
      ...prev,
      [idx]: prev[idx] !== undefined ? !prev[idx] : false,
    }));
  };

  const isConditionalActive = (idx: number) => {
    return enabledConditionals[idx] !== undefined ? enabledConditionals[idx] : true;
  };

  const rollAttack = () => {
    consumeChargeOnce();
    if (isAdvantage) {
      const d1 = Math.floor(Math.random() * 20) + 1;
      const d2 = Math.floor(Math.random() * 20) + 1;
      setD20Rolls([d1, d2]);
    } else {
      const d = Math.floor(Math.random() * 20) + 1;
      setD20Rolls([d]);
    }
  };

  const parseAndRollFormula = (formulaStr: string) => {
    const match = formulaStr.toLowerCase().match(/(\d+)d(\d+)(?:kh\d|kl\d)?(?:([+-])(\d+))?/);
    if (!match) return null;

    const count = parseInt(match[1], 10) || 1;
    const dieType = parseInt(match[2], 10) || 6;
    const sign = match[3] === '-' ? -1 : 1;
    const bonus = match[4] ? parseInt(match[4], 10) * sign : 0;

    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * dieType) + 1;
      rolls.push(r);
      sum += r;
    }
    return { rolls, bonus, total: sum + bonus };
  };

  const rollEffect = () => {
    consumeChargeOnce();
    if (damageRolls && damageRolls.length > 0) {
      const parts: DamagePartBreakdown[] = [];
      let grandTotal = 0;

      damageRolls.forEach((dr, idx) => {
        if (dr.conditional && !isConditionalActive(idx)) {
          return;
        }

        let formulaToRoll = dr.diceFormula || '';
        let label = DAMAGE_TYPE_LABELS[dr.damageType] || dr.damageType;

        if (idx === 0 && useVersatile && versatileDice) {
          formulaToRoll = versatileDice;
          label = `${label} (Versátil)`;
        } else if (dr.conditional) {
          label = `${label} (Condicional)`;
        }

        const rolled = parseAndRollFormula(formulaToRoll);
        if (rolled) {
          parts.push({
            label,
            formula: formulaToRoll,
            damageType: dr.damageType,
            rolls: rolled.rolls,
            bonus: rolled.bonus,
            total: rolled.total,
            isConditional: dr.conditional,
          });
          grandTotal += rolled.total;
        }
      });

      setBreakdownParts(parts);
      setEffectResult(grandTotal);
      return;
    }

    if (!damageFormula) return;
    const single = parseAndRollFormula(damageFormula);
    if (single) {
      setBreakdownParts(null);
      setEffectResult(single.total);
    }
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
  const hasDamageRolls = damageRolls && damageRolls.length > 0;
  const hasEffectSection = (hasDamageRolls || !!damageFormula) && (!isAdvantage || damageFormula !== '2d20kh1');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-surface border-primary/30 text-foreground">
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
              : 'Simulador de rolagem de ataque e dano com suporte a múltiplos dados e propriedades.'}
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

          {/* Healing or Damage Section */}
          {hasEffectSection && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isHealing
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-red-500/20 bg-background/50'
              }`}
            >
              {/* Optional toggles: versatile and conditionals */}
              {!isHealing && (versatileDice || (damageRolls && damageRolls.some((r) => r.conditional))) && (
                <div className="p-2.5 rounded-lg bg-background/70 border border-red-500/20 space-y-1.5 text-xs">
                  {versatileDice && (
                    <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white">
                      <input
                        type="checkbox"
                        checked={useVersatile}
                        onChange={(e) => setUseVersatile(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0 accent-amber-500 cursor-pointer"
                      />
                      <span>Usar 2 Mãos (Versátil: <strong className="font-mono text-amber-300">{versatileDice}</strong>)</span>
                    </label>
                  )}
                  {damageRolls &&
                    damageRolls.map((dr, idx) =>
                      dr.conditional ? (
                        <label
                          key={idx}
                          className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isConditionalActive(idx)}
                            onChange={() => toggleConditional(idx)}
                            className="rounded border-slate-700 text-amber-500 focus:ring-0 accent-amber-500 cursor-pointer"
                          />
                          <span>
                            Incluir adicional:{' '}
                            <strong className="font-mono text-amber-300">
                              +{dr.diceFormula} {DAMAGE_TYPE_LABELS[dr.damageType] || dr.damageType}
                            </strong>{' '}
                            (Condicional)
                          </span>
                        </label>
                      ) : null
                    )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">
                    {isHealing
                      ? 'Recuperação de Vida'
                      : 'Dano Total'}
                    {damageRolls && damageRolls.length > 0 ? (
                      ` (${damageRolls.map((r) => r.diceFormula).join(' + ')})`
                    ) : damageFormula ? (
                      ` (${damageFormula})`
                    ) : null}:
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

              {/* Detailed Breakdown for multi-dice rolls */}
              {breakdownParts && breakdownParts.length > 0 && (
                <div className="pt-2 border-t border-red-500/20 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400">Detalhamento dos Dados:</span>
                  {breakdownParts.map((part, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs bg-black/30 px-2.5 py-1.5 rounded border border-red-500/10 font-mono"
                    >
                      <span className="text-slate-300">
                        {part.label} ({part.formula}):
                      </span>
                      <span className="text-red-300 font-bold">
                        [{part.rolls.join(', ')}]
                        {part.bonus !== 0 ? ` ${part.bonus > 0 ? `+ ${part.bonus}` : `- ${Math.abs(part.bonus)}`}` : ''}
                        {' = '}
                        <strong className="text-white text-sm">{part.total}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
