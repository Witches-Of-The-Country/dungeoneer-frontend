'use client';

import React, { useState, useEffect } from 'react';
import { CharacterResponse, CharacterAction } from '@/lib/api/characters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Swords, Dices, Plus, Heart, Sparkles, Shield, X } from 'lucide-react';
import { DiceRollerModal } from './dice-roller-modal';
import { toast } from 'sonner';

interface ActionsTabProps {
  character: CharacterResponse;
}

export function ActionsTab({ character }: ActionsTabProps) {
  const baseActions = character.actions || [];
  const [customActions, setCustomActions] = useState<CharacterAction[]>([]);
  const [activeRoll, setActiveRoll] = useState<{
    title: string;
    attackBonus?: number | null;
    damageFormula?: string;
    isHealing?: boolean;
  } | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [newActionType, setNewActionType] = useState('ACTION');
  const [newAttackBonus, setNewAttackBonus] = useState<string>('');
  const [newDamageFormula, setNewDamageFormula] = useState('');
  const [newDamageType, setNewDamageType] = useState('SLASHING');
  const [newDescription, setNewDescription] = useState('');

  // Load custom actions from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(`dungeoneer_actions_${character.id}`);
      if (stored) {
        setCustomActions(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, [character.id]);

  const saveCustomActions = (updated: CharacterAction[]) => {
    setCustomActions(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`dungeoneer_actions_${character.id}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionName.trim()) {
      toast.error('Informe o nome da ação.');
      return;
    }

    const created: CharacterAction = {
      id: `custom-action-${Date.now()}`,
      name: newActionName.trim(),
      actionType: newActionType,
      category: 'CUSTOM',
      sourceType: 'CUSTOM',
      attackBonus: newAttackBonus.trim() !== '' ? parseInt(newAttackBonus, 10) : null,
      damageRolls: newDamageFormula.trim()
        ? [
            {
              diceFormula: newDamageFormula.trim(),
              damageType: newDamageType,
            },
          ]
        : undefined,
      description: newDescription.trim() || undefined,
    };

    saveCustomActions([...customActions, created]);
    toast.success('Ação personalizada criada com sucesso!');
    setIsCreateOpen(false);
    setNewActionName('');
    setNewAttackBonus('');
    setNewDamageFormula('');
    setNewDescription('');
  };

  const allActions = [...baseActions, ...customActions];

  const getFormula = (action: CharacterAction) => {
    if (!action.damageRolls || action.damageRolls.length === 0) return undefined;
    const first = action.damageRolls[0];
    if (first.diceFormula) {
      return first.diceFormula;
    }
    if (first.diceCount && first.diceType) {
      const bonus = first.bonusModifier
        ? first.bonusModifier > 0
          ? `+${first.bonusModifier}`
          : `${first.bonusModifier}`
        : '';
      return `${first.diceCount}d${first.diceType}${bonus}`;
    }
    return undefined;
  };

  const isHealingAction = (action: CharacterAction) => {
    const lowerName = action.name.toLowerCase();
    const lowerDesc = (action.description || '').toLowerCase();
    const firstType = action.damageRolls?.[0]?.damageType;
    return (
      firstType === 'HEALING' ||
      lowerName.includes('fôlego') ||
      lowerName.includes('wind') ||
      lowerName.includes('cura') ||
      lowerDesc.includes('recupera') ||
      lowerDesc.includes('cura') ||
      lowerDesc.includes('pontos de vida')
    );
  };

  return (
    <div className="space-y-4">
      {/* Actions Toolbar Header */}
      <div className="flex items-center justify-between bg-surface/50 border border-primary/20 p-3 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-foreground">Ações de Combate &amp; Habilidades:</span>
          <span className="font-mono text-primary font-bold">{allActions.length} disponíveis</span>
        </div>
        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-zinc-950 font-serif font-bold shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Criar Ação Personalizada
        </Button>
      </div>

      {allActions.length === 0 ? (
        <Card className="border-dashed border-primary/30 bg-surface/30">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Nenhuma ação ofensiva ou de combate disponível.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allActions.map((act, index) => {
            const rawFormula = getFormula(act);
            const isReckless =
              act.name.toLowerCase().includes('descuidado') || act.name.toLowerCase().includes('reckless');
            let formula = rawFormula;
            let effectiveAttackBonus = act.attackBonus;
            if (isReckless) {
              formula = formula || '2d20kh1';
              if (effectiveAttackBonus === null || effectiveAttackBonus === undefined) {
                const strScore = (character.abilityScores as any)?.strength ?? 10;
                const strMod = Math.floor((strScore - 10) / 2);
                effectiveAttackBonus = strMod + (character.proficiencyBonus || 2);
              }
            }

            const healing = isHealingAction(act);
            const isRollable =
              (effectiveAttackBonus !== null && effectiveAttackBonus !== undefined) || !!formula;
            const maxCharges = act.maxCharges ?? act.maxUses;
            const currentCharges = act.usesRemaining ?? act.currentCharges;

            return (
              <Card
                key={act.id || `action-${index}`}
                className="bg-surface/60 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {healing ? (
                        <Heart className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Swords className="w-4 h-4 text-amber-400" />
                      )}
                      {act.name}
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30">
                        {act.actionType}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {act.category || act.sourceType || 'AÇÃO'}
                      </Badge>
                      {!isRollable && (
                        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                          {maxCharges ? 'Uso com Cargas' : 'Efeito / Passiva'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Display Rolar button when rollable */}
                  {isRollable ? (
                    healing ? (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-200 font-semibold"
                        onClick={() =>
                          setActiveRoll({
                            title: act.name,
                            attackBonus: effectiveAttackBonus,
                            damageFormula: formula,
                            isHealing: true,
                          })
                        }
                      >
                        <Heart className="w-3.5 h-3.5" />
                        Rolar Cura
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 font-semibold"
                        onClick={() =>
                          setActiveRoll({
                            title: act.name,
                            attackBonus: effectiveAttackBonus,
                            damageFormula: formula,
                            isHealing: false,
                          })
                        }
                      >
                        <Dices className="w-3.5 h-3.5" />
                        {isReckless ? 'Rolar c/ Vantagem' : 'Rolar'}
                      </Button>
                    )
                  ) : maxCharges ? (
                    <Badge className="bg-amber-950/40 text-amber-300 border border-amber-600/40 font-mono text-xs">
                      {currentCharges !== undefined && currentCharges !== null ? currentCharges : maxCharges} / {maxCharges} usos
                    </Badge>
                  ) : null}
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-2 text-xs text-muted-foreground">
                  {effectiveAttackBonus !== null && effectiveAttackBonus !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {isReckless ? 'Bônus de Ataque (c/ Vantagem):' : 'Bônus de Ataque:'}
                      </span>
                      <span className="font-mono font-bold text-foreground">
                        {effectiveAttackBonus >= 0 ? `+${effectiveAttackBonus}` : effectiveAttackBonus}
                      </span>
                    </div>
                  )}

                  {formula && !healing && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        {isReckless ? 'Fórmula de Rolagem:' : 'Dano:'}
                      </span>
                      <span className="font-mono font-bold text-red-400">
                        {formula} {act.damageRolls?.[0]?.damageType || ''}
                      </span>
                    </div>
                  )}

                  {healing && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recuperação de Vida:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {formula ? `${formula} PV` : 'Recupera PV'}
                      </span>
                    </div>
                  )}

                  {act.versatileDice && (
                    <div className="flex justify-between text-[11px] text-muted-foreground/80">
                      <span>Versátil:</span>
                      <span className="font-mono text-amber-200">{act.versatileDice}</span>
                    </div>
                  )}

                  {act.description && (
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pt-1 border-t border-slate-800">
                      {act.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Custom Action Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md bg-slate-950 border border-amber-900/50 text-slate-100 p-5">
          <DialogHeader className="pb-3 border-b border-amber-950/60">
            <DialogTitle className="text-lg font-serif text-amber-200 flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-400" />
              Criar Ação Personalizada
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAction} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">
                Nome da Ação *
              </label>
              <input
                type="text"
                required
                value={newActionName}
                onChange={(e) => setNewActionName(e.target.value)}
                placeholder="Ex: Ataque Especial, Rajada Arcana..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Tipo de Ação
                </label>
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100"
                >
                  <option value="ACTION">Ação</option>
                  <option value="BONUS_ACTION">Ação Bônus</option>
                  <option value="REACTION">Reação</option>
                  <option value="FREE">Livre</option>
                  <option value="SPECIAL">Especial / Passiva</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Bônus de Ataque
                </label>
                <input
                  type="number"
                  value={newAttackBonus}
                  onChange={(e) => setNewAttackBonus(e.target.value)}
                  placeholder="Ex: 5 (+5)"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Fórmula de Dano
                </label>
                <input
                  type="text"
                  value={newDamageFormula}
                  onChange={(e) => setNewDamageFormula(e.target.value)}
                  placeholder="Ex: 1d8+3"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  Tipo de Dano
                </label>
                <select
                  value={newDamageType}
                  onChange={(e) => setNewDamageType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-100"
                >
                  <option value="SLASHING">Cortante</option>
                  <option value="PIERCING">Perfurante</option>
                  <option value="BLUDGEONING">Concussão</option>
                  <option value="FIRE">Fogo</option>
                  <option value="COLD">Frio</option>
                  <option value="LIGHTNING">Elétrico</option>
                  <option value="ACID">Ácido</option>
                  <option value="POISON">Veneno</option>
                  <option value="NECROTIC">Necrótico</option>
                  <option value="RADIANT">Radiante</option>
                  <option value="FORCE">Energia / Força</option>
                  <option value="PSYCHIC">Psíquico</option>
                  <option value="THUNDER">Trovão</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">
                Descrição ou Efeito
              </label>
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descreva detalhes mecânicos ou ativação..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
                className="border-slate-800 text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold"
              >
                Salvar Ação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {activeRoll && (
        <DiceRollerModal
          isOpen={true}
          onClose={() => setActiveRoll(null)}
          title={activeRoll.title}
          attackBonus={activeRoll.attackBonus}
          damageFormula={activeRoll.damageFormula}
          isHealing={activeRoll.isHealing}
        />
      )}
    </div>
  );
}
