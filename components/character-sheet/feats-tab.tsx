'use client';

import React from 'react';
import { CharacterResponse, CharacterFeat, useManageInventory } from '@/lib/api/characters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface FeatsTabProps {
  character: CharacterResponse;
}

export function FeatsTab({ character }: FeatsTabProps) {
  const feats = character.feats || [];
  const { useFeat } = useManageInventory(character.id);

  const handleUseFeat = (feat: CharacterFeat) => {
    if (feat.maxCharges && (feat.currentCharges ?? 0) <= 0) {
      toast.error('Sem cargas restantes para este talento.');
      return;
    }

    useFeat.mutate(feat.id, {
      onSuccess: () => {
        toast.success(`Carga utilizada para ${feat.name}.`);
      },
      onError: (err: any) => {
        toast.error(err.message || 'Erro ao utilizar talento.');
      },
    });
  };

  return (
    <div className="space-y-4">
      {feats.length === 0 ? (
        <Card className="border-dashed border-primary/30 bg-surface/30">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            Nenhum talento ou habilidade de classe registrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {feats.map((feat) => {
            const hasCharges = feat.maxCharges !== null && feat.maxCharges !== undefined && feat.maxCharges > 0;
            return (
              <Card
                key={feat.id}
                className="bg-surface/60 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400" />
                      {feat.name}
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30">
                        {feat.source || 'Classe'}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Nível {feat.unlockedAtLevel}
                      </Badge>
                    </div>
                  </div>

                  {hasCharges && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary">
                        {feat.currentCharges} / {feat.maxCharges}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-primary/30 px-2"
                        disabled={useFeat.isPending || (feat.currentCharges ?? 0) <= 0}
                        onClick={() => handleUseFeat(feat)}
                      >
                        <Zap className="w-3 h-3 mr-1 text-amber-400" />
                        Usar
                      </Button>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {feat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}