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
import { Users, Footprints, Maximize2, Sparkles, Edit3 } from 'lucide-react';
import { LineageSummary } from '@/lib/api/encyclopedia';

export interface LineageDetailModalProps {
  lineage: LineageSummary | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (lineage: LineageSummary) => void;
}

export function LineageDetailModal({ lineage, open, onClose, onEdit }: LineageDetailModalProps) {
  if (!lineage) return null;

  const isHomebrew = lineage.ruleset === 'HOMEBREW' || (lineage as any).source === 'HOMEBREW';

  const bonuses = lineage.abilityBonuses || {};
  const bonusEntries = Object.entries(bonuses);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-xl bg-slate-950 border-amber-900/60 text-slate-100 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-amber-950/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-serif text-amber-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400 shrink-0" />
                {lineage.name}
              </DialogTitle>
              {(lineage as any).nameEn && (lineage as any).nameEn !== lineage.name && (
                <DialogDescription className="text-xs text-slate-400 italic mt-0.5">
                  {(lineage as any).nameEn}
                </DialogDescription>
              )}
            </div>
            {isHomebrew && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(lineage);
                }}
                className="border-amber-600/40 text-amber-300 hover:bg-amber-950/40 text-xs shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
              {lineage.ruleset === 'SRD_2024' ? '5e 2024' : lineage.ruleset === 'SRD_2014' ? '5e 2014' : 'Homebrew'}
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
              Tamanho: {lineage.size || 'Médio'}
            </Badge>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
              Deslocamento: {lineage.speed || 30} pés (9m)
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <Footprints className="w-3.5 h-3.5 text-amber-400" /> Deslocamento Base
              </span>
              <p className="font-bold text-amber-300">{lineage.speed ? `${lineage.speed} pés (9m)` : '9 metros'}</p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" /> Categoria de Tamanho
              </span>
              <p className="font-medium text-slate-200">{lineage.size || 'Médio (Medium)'}</p>
            </div>
          </div>

          {/* Ability Bonuses */}
          {bonusEntries.length > 0 && (
            <div className="p-3 bg-slate-900/90 rounded border border-amber-900/30 space-y-1.5 text-xs">
              <span className="font-semibold text-amber-400 uppercase tracking-wider block">
                Bônus de Atributos Raciais
              </span>
              <div className="flex flex-wrap gap-2">
                {bonusEntries.map(([attr, bonus]) => (
                  <Badge key={attr} className="bg-amber-950/60 border-amber-600/40 text-amber-200 font-mono text-xs">
                    {attr}: +{bonus}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Descrição & Lore
            </span>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded border border-slate-800/80">
              {lineage.description || 'Nenhuma descrição detalhada disponível.'}
            </div>
          </div>

          {/* Traits Summary */}
          {lineage.traitsSummary && lineage.traitsSummary.length > 0 && (
            <div className="p-3 bg-slate-900/90 rounded border border-amber-900/30 space-y-2 text-xs">
              <span className="font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Traços e Características Raciais
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                {lineage.traitsSummary.map((trait, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {trait}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
