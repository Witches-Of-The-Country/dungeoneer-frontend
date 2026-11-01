'use client';

import React, { useState } from 'react';
import { CharacterResponse, CharacterFeat, useManageInventory } from '@/lib/api/characters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Zap, Info } from 'lucide-react';
import { toast } from 'sonner';
import { FeatDetailModal } from '@/components/encyclopedia/feat-detail-modal';

interface FeatsTabProps {
  character: CharacterResponse;
}

export function FeatsTab({ character }: FeatsTabProps) {
  const feats = character.feats || [];
  const { useFeat } = useManageInventory(character.id);
  const [selectedFeat, setSelectedFeat] = useState<CharacterFeat | null>(null);

  const handleUseFeat = (e: React.MouseEvent, feat: CharacterFeat) => {
    e.stopPropagation();
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

  const getSourceLabel = (feat: CharacterFeat) => {
    const s = (feat.source || '').toUpperCase();
    if (s.includes('CLASS') || feat.featType === 'CLASS') return 'Classe';
    if (s.includes('SUBCLASS') || feat.featType === 'SUBCLASS') return 'Subclasse';
    if (s.includes('LINEAGE') || feat.featType === 'LINEAGE') return 'Linhagem';
    if (s.includes('ORIGIN') || feat.featType === 'ORIGIN') return 'Origem';
    if (s === 'HOMEBREW') return 'Homebrew';
    if (s === 'SRD') return 'SRD';
    return feat.source || 'Classe';
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
                onClick={() => setSelectedFeat(feat)}
                className="bg-surface/60 border-primary/20 hover:border-amber-500/50 hover:bg-slate-900/90 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-400 shrink-0" />
                      {feat.name}
                    </CardTitle>
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-mono border-primary/30 text-amber-300">
                        {getSourceLabel(feat)}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        Nível {feat.unlockedAtLevel}
                      </Badge>
                      {feat.featType && (
                        <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                          {feat.featType}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hasCharges && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-primary">
                          {feat.currentCharges} / {feat.maxCharges}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-primary/30 px-2"
                          disabled={useFeat.isPending || (feat.currentCharges ?? 0) <= 0}
                          onClick={(e) => handleUseFeat(e, feat)}
                        >
                          <Zap className="w-3 h-3 mr-1 text-amber-400" />
                          Usar
                        </Button>
                      </div>
                    )}
                    <Info className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {feat.description || 'Clique para ver os detalhes completos deste talento.'}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedFeat && (
        <FeatDetailModal
          feat={selectedFeat}
          open={!!selectedFeat}
          onClose={() => setSelectedFeat(null)}
        />
      )}
    </div>
  );
}
