'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Sparkles, Coins, Weight, Swords, Edit3 } from 'lucide-react';
import { Item } from '@/lib/api/encyclopedia';

export interface ItemDetailModalProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (item: Item) => void;
}

export function ItemDetailModal({ item, open, onClose, onEdit }: ItemDetailModalProps) {
  if (!item) return null;

  const isHomebrew = item.ruleset === 'HOMEBREW' || item.source === 'HOMEBREW';

  const formatRarity = (rarity: string) => {
    const map: Record<string, string> = {
      NONE: 'Comum (Não mágica)',
      COMMON: 'Comum',
      UNCOMMON: 'Incomum',
      RARE: 'Raro',
      VERY_RARE: 'Muito Raro',
      LEGENDARY: 'Lendário',
      ARTIFACT: 'Artefato',
      VARIES: 'Varia',
    };
    return map[rarity.toUpperCase()] || rarity;
  };

  const getRarityBadgeColor = (rarity: string) => {
    switch (rarity.toUpperCase()) {
      case 'UNCOMMON':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';
      case 'RARE':
        return 'text-blue-400 border-blue-500/40 bg-blue-950/20';
      case 'VERY_RARE':
        return 'text-purple-400 border-purple-500/40 bg-purple-950/20';
      case 'LEGENDARY':
        return 'text-amber-400 border-amber-500/40 bg-amber-950/20 font-bold';
      case 'ARTIFACT':
        return 'text-red-400 border-red-500/40 bg-red-950/20 font-bold';
      default:
        return 'text-slate-300 border-slate-700 bg-slate-900';
    }
  };

  const mech: any = (item as any).mechanicalProperties || {};

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-xl bg-slate-950 border-amber-900/60 text-slate-100 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-amber-950/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-serif text-amber-100 flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-400 shrink-0" />
                {item.name}
              </DialogTitle>
              {item.nameEn && item.nameEn !== item.name && (
                <DialogDescription className="text-xs text-slate-400 italic mt-0.5">
                  {item.nameEn}
                </DialogDescription>
              )}
            </div>
            {isHomebrew && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="border-amber-600/40 text-amber-300 hover:bg-amber-950/40 text-xs shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <Badge variant="outline" className={`text-xs ${getRarityBadgeColor(item.rarity)}`}>
              {formatRarity(item.rarity)}
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
              {item.itemType || item.itemCategory}
            </Badge>
            {item.attunement && (
              <Badge className="bg-amber-950/60 border-amber-600/40 text-amber-300 text-xs">
                Requer Sintonia
              </Badge>
            )}
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
              {item.ruleset === 'SRD_2024' ? '5e 2024' : item.ruleset === 'SRD_2014' ? '5e 2014' : 'Homebrew'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Custo / Preço
              </span>
              <p className="font-bold text-amber-300 font-mono">{item.cost || 'Preço sob consulta'}</p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <Weight className="w-3.5 h-3.5 text-slate-400" /> Peso
              </span>
              <p className="font-medium text-slate-200">{item.weight || '-'}</p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Descrição do Item
            </span>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded border border-slate-800/80">
              {item.description || 'Nenhuma descrição detalhada disponível.'}
            </div>
          </div>

          {/* Mechanical Properties */}
          {mech && (mech.damageRolls || mech.baseAc || mech.properties || mech.magicBonus) && (
            <div className="p-3 bg-slate-900/90 rounded border border-amber-900/30 space-y-2 text-xs">
              <span className="font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Propriedades Mecânicas
              </span>

              {mech.damageRolls && mech.damageRolls.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Dano:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {mech.damageRolls.map((d: any) => `${d.diceFormula || `${d.diceCount}d${d.diceType}`} (${d.damageType})`).join(' + ')}
                  </span>
                  {mech.versatileDice && (
                    <span className="text-slate-400">
                      (Versátil: <strong className="text-amber-200">{mech.versatileDice}</strong>)
                    </span>
                  )}
                </div>
              )}

              {mech.baseAc && (
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Classe de Armadura (CA): <strong className="text-amber-300 font-mono">{mech.baseAc}</strong></span>
                  {mech.armorCategory && <span className="text-slate-400">({mech.armorCategory})</span>}
                </div>
              )}

              {mech.magicBonus > 0 && (
                <div className="text-slate-300">
                  Bônus Mágico: <strong className="text-amber-400 font-mono">+{mech.magicBonus}</strong> em ataque e dano / CA
                </div>
              )}

              {mech.properties && mech.properties.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {mech.properties.map((prop: string) => (
                    <Badge key={prop} variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                      {prop}
                    </Badge>
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
