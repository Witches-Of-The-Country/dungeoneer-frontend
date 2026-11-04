'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  CharacterResponse,
  useTakeRest,
  RestPayload,
  HitDiceSpendItem,
} from '@/lib/api/characters';
import { toast } from 'sonner';
import {
  Moon,
  Sunrise,
  Heart,
  Dices,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';

interface RestModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterResponse;
  initialMode?: 'SHORT' | 'LONG';
}

export function RestModal({
  isOpen,
  onClose,
  character,
  initialMode = 'SHORT',
}: RestModalProps) {
  const [mode, setMode] = useState<'SHORT' | 'LONG'>(initialMode);
  const [diceSpends, setDiceSpends] = useState<Record<string, number>>({});
  const takeRestMutation = useTakeRest(character.id);

  // Sync mode if initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setDiceSpends({});
    }
  }, [isOpen, initialMode]);

  const isDeadOrUnconscious = character.hitPointsCurrent <= 0;

  // Calculate Constitution modifier
  const conMod =
    character.abilityScores?.constitutionModifier ??
    Math.floor(((character.abilityScores?.constitution ?? 10) - 10) / 2);

  // Classes list or fallback
  const characterClasses =
    character.classes && character.classes.length > 0
      ? character.classes
      : [
          {
            classProgressionId: character.id,
            className: character.archetype?.name ?? 'Aventureiro',
            subclassName: null,
            classLevel: character.level,
            hitDie: character.archetype?.hitDice ?? 'D8',
            hitDiceSpent: 0,
            availableHitDice: character.level,
          },
        ];

  const handleSpendChange = (id: string, delta: number, max: number) => {
    setDiceSpends((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const totalDiceSelected = Object.values(diceSpends).reduce(
    (acc, count) => acc + count,
    0
  );

  const handleConfirmShortRest = async () => {
    if (isDeadOrUnconscious) return;
    const spends: HitDiceSpendItem[] = [];

    characterClasses.forEach((cls, idx) => {
      const cpId = cls.classProgressionId || cls.className || `prog-${idx}`;
      const count = diceSpends[cpId] || 0;
      if (count > 0 && cls.classProgressionId) {
        spends.push({
          classProgressionId: cls.classProgressionId,
          count,
        });
      }
    });

    const payload: RestPayload = {
      restType: 'SHORT',
      hitDiceSpends: spends,
    };

    try {
      await takeRestMutation.mutateAsync(payload);
      toast.success('Descanso Curto concluído com sucesso!');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar descanso.';
      toast.error(msg);
    }
  };

  const handleConfirmLongRest = async () => {
    if (isDeadOrUnconscious) return;
    const payload: RestPayload = {
      restType: 'LONG',
    };

    try {
      await takeRestMutation.mutateAsync(payload);
      toast.success('Descanso Longo concluído! Forças revigoradas.');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao realizar descanso.';
      toast.error(msg);
    }
  };

  const hdRecoverAmount = Math.max(1, Math.floor(character.level / 2));
  const currentExhaustion = character.exhaustion ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-slate-950 border border-amber-900/40 text-slate-100 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-serif text-amber-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Descanso e Recuperação
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Gerencie descansos curtos e longos de acordo com as regras de D&D 5e.
          </DialogDescription>
        </DialogHeader>

        {/* Dead / Unconscious Warning Guard */}
        {isDeadOrUnconscious && (
          <div
            role="alert"
            data-testid="rest-dead-warning"
            className="p-3 rounded-lg bg-red-950/80 border border-red-700/60 flex items-start gap-2.5 text-red-200 text-sm"
          >
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-300">
                Personagem Inconsciente ou Morto (0 PV)
              </p>
              <p className="text-xs text-red-200/90 mt-0.5">
                Personagens com 0 pontos de vida não podem tirar descanso curto ou longo até que recebam cura ou estabilização.
              </p>
            </div>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex rounded-lg bg-slate-900/90 p-1 border border-amber-900/30 gap-1">
          <button
            type="button"
            data-testid="tab-short-rest"
            onClick={() => setMode('SHORT')}
            className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-serif font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'SHORT'
                ? 'bg-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800/60'
            }`}
          >
            <Moon className="w-4 h-4" />
            Descanso Curto (1 hora)
          </button>
          <button
            type="button"
            data-testid="tab-long-rest"
            onClick={() => setMode('LONG')}
            className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-serif font-semibold flex items-center justify-center gap-2 transition-all ${
              mode === 'LONG'
                ? 'bg-amber-600 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:text-amber-200 hover:bg-slate-800/60'
            }`}
          >
            <Sunrise className="w-4 h-4" />
            Descanso Longo (8 horas)
          </button>
        </div>

        {/* TAB 1: SHORT REST */}
        {mode === 'SHORT' && (
          <div className="space-y-4 py-2" data-testid="short-rest-content">
            <p className="text-xs text-slate-300">
              Gaste Dados de Vida para curar pontos de vida perdidos. O servidor rola cada dado e soma seu modificador de Constituição. Cargas de talentos de descanso curto também são recuperadas.
            </p>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Pontos de Vida Atuais:</span>
              <span className="font-mono font-bold text-amber-200">
                {character.hitPointsCurrent} / {character.hitPointsMax} PV
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs text-amber-200">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-400" />
                Modificador de Constituição:
              </span>
              <span className="font-mono font-bold">
                {conMod >= 0 ? `+${conMod}` : conMod} PV por dado
              </span>
            </div>

            {/* Hit Dice List by Class */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Dices className="w-4 h-4 text-amber-400" />
                Selecione os Dados de Vida para Gastar:
              </label>

              {characterClasses.map((cls, idx) => {
                const cpId = cls.classProgressionId || cls.className || `prog-${idx}`;
                const available =
                  cls.availableHitDice ??
                  Math.max(0, cls.classLevel - (cls.hitDiceSpent ?? 0));
                const selected = diceSpends[cpId] || 0;
                const dieName = (cls.hitDie || 'd8').toLowerCase();

                return (
                  <div
                    key={cpId}
                    data-testid={`hit-dice-class-row-${idx}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/80 border border-slate-800"
                  >
                    <div>
                      <span className="font-serif font-bold text-amber-200 text-sm block">
                        {cls.className} {cls.subclassName ? `(${cls.subclassName})` : ''}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Dado: {dieName} • Disponíveis: {available} de {cls.classLevel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label={`Diminuir dados de ${cls.className}`}
                        disabled={selected <= 0 || isDeadOrUnconscious || takeRestMutation.isPending}
                        onClick={() => handleSpendChange(cpId, -1, available)}
                        className="h-8 w-8 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                      <span
                        data-testid={`dice-count-${idx}`}
                        className="w-8 text-center font-mono font-bold text-amber-300 text-sm"
                      >
                        {selected}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        aria-label={`Aumentar dados de ${cls.className}`}
                        disabled={
                          selected >= available ||
                          isDeadOrUnconscious ||
                          takeRestMutation.isPending
                        }
                        onClick={() => handleSpendChange(cpId, 1, available)}
                        className="h-8 w-8 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-800 text-xs flex justify-between items-center text-slate-300">
              <span>Total de Dados Selecionados:</span>
              <span
                data-testid="total-dice-selected"
                className="font-mono font-bold text-amber-300"
              >
                {totalDiceSelected}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: LONG REST */}
        {mode === 'LONG' && (
          <div className="space-y-4 py-2" data-testid="long-rest-content">
            <p className="text-xs text-slate-300">
              Um descanso longo de 8 horas restaura completamente as forças do aventureiro.
            </p>

            <div className="space-y-2 rounded-lg bg-slate-900/60 border border-slate-800 p-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>Pontos de Vida:</strong> Restaura ao valor máximo ({character.hitPointsMax} PV).
                </span>
              </div>
              <div className="flex items-center gap-2 text-amber-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Pontos de Vida Temporários:</strong> Preservados ({character.hitPointsTemp} PV mantidos).
                </span>
              </div>
              <div className="flex items-center gap-2 text-blue-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-400" />
                <span>
                  <strong>Dados de Vida:</strong> Recupera metade do total de níveis ({hdRecoverAmount} {hdRecoverAmount === 1 ? 'dado' : 'dados'}).
                </span>
              </div>
              <div className="flex items-center gap-2 text-purple-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                <span>
                  <strong>Recursos:</strong> Restaura todos os espaços de magia e recarrega talentos com descanso longo.
                </span>
              </div>
              {currentExhaustion > 0 ? (
                <div className="flex items-center gap-2 text-red-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-red-400" />
                  <span>
                    <strong>Exaustão:</strong> Reduz 1 nível ({currentExhaustion} → {Math.max(0, currentExhaustion - 1)}).
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>
                    <strong>Exaustão:</strong> Nenhum nível de exaustão ativo.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={takeRestMutation.isPending}
            className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900"
          >
            Cancelar
          </Button>

          {mode === 'SHORT' ? (
            <Button
              type="button"
              data-testid="confirm-short-rest-btn"
              disabled={
                isDeadOrUnconscious ||
                totalDiceSelected === 0 ||
                takeRestMutation.isPending
              }
              onClick={handleConfirmShortRest}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-serif font-bold shadow-md"
            >
              {takeRestMutation.isPending ? 'Descansando...' : 'Confirmar Descanso Curto'}
            </Button>
          ) : (
            <Button
              type="button"
              data-testid="confirm-long-rest-btn"
              disabled={isDeadOrUnconscious || takeRestMutation.isPending}
              onClick={handleConfirmLongRest}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-serif font-bold shadow-md"
            >
              {takeRestMutation.isPending ? 'Descansando...' : 'Confirmar Descanso Longo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
