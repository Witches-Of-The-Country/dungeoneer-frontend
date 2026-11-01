'use client';

import React, { useState } from 'react';
import { CharacterResponse, CharacterAction } from '@/lib/api/characters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Swords, Dices, ShieldAlert } from 'lucide-react';
import { DiceRollerModal } from './dice-roller-modal';

interface ActionsTabProps {
  character: CharacterResponse;
}

export function ActionsTab({ character }: ActionsTabProps) {
  const actions = character.actions || [];
  const [activeRoll, setActiveRoll] = useState<{
    title: string;
    attackBonus?: number | null;
    damageFormula?: string;
  } | null>(null);

  const getFormula = (action: CharacterAction) => {
    if (!action.damageRolls || action.damageRolls.length === 0) return undefined;
    const first = action.damageRolls[0];
    const bonus = first.bonusModifier ? `+${first.bonusModifier}` : '';
    return `${first.diceCount}d${first.diceType}${bonus}`;
  };

  return (
    <div className="space-y-4">
      {actions.length === 0 ? (
        <Card className="border-dashed border-primary/30 bg-surface/30">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Nenhuma ação ofensiva ou de combate disponível.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {actions.map((act) => {
            const formula = getFormula(act);
            return (
              <Card
                key={act.id}
                className="bg-surface/60 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Swords className="w-4 h-4 text-primary" />
                      {act.name}
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30">
                        {act.actionType}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {act.sourceType}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 text-foreground font-semibold"
                    onClick={() =>
                      setActiveRoll({
                        title: act.name,
                        attackBonus: act.attackBonus,
                        damageFormula: formula,
                      })
                    }
                  >
                    <Dices className="w-3.5 h-3.5" />
                    Rolar
                  </Button>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-1.5 text-xs text-muted-foreground">
                  {act.attackBonus !== null && act.attackBonus !== undefined && (
                    <div className="flex justify-between">
                      <span>Bônus de Ataque:</span>
                      <span className="font-mono font-bold text-foreground">
                        {act.attackBonus >= 0 ? `+${act.attackBonus}` : act.attackBonus}
                      </span>
                    </div>
                  )}

                  {formula && (
                    <div className="flex justify-between">
                      <span>Dano:</span>
                      <span className="font-mono font-bold text-red-400">
                        {formula} {act.damageRolls?.[0]?.damageType}
                      </span>
                    </div>
                  )}

                  {act.versatileDice && (
                    <div className="flex justify-between text-[11px] text-muted-foreground/80">
                      <span>Versátil:</span>
                      <span className="font-mono">{act.versatileDice}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeRoll && (
        <DiceRollerModal
          isOpen={true}
          onClose={() => setActiveRoll(null)}
          title={activeRoll.title}
          attackBonus={activeRoll.attackBonus}
          damageFormula={activeRoll.damageFormula}
        />
      )}
    </div>
  );
}