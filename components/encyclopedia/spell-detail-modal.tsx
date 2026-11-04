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
import { Wand2, Clock, MapPin, Sparkles, BookOpen, Edit3 } from 'lucide-react';
import { Spell } from '@/lib/api/encyclopedia';

export interface SpellDetailModalProps {
  spell: Spell | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (spell: Spell) => void;
}

export function SpellDetailModal({ spell, open, onClose, onEdit }: SpellDetailModalProps) {
  if (!spell) return null;

  const isHomebrew = spell.ruleset === 'HOMEBREW' || spell.source === 'HOMEBREW';

  const formatLevelSchool = () => {
    if (spell.level === 0) {
      return `Truque de ${spell.school}`;
    }
    return `${spell.level}º Círculo de ${spell.school}`;
  };

  const mech: any = (spell as any).mechanicalProperties || {};

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-xl bg-slate-950 border-amber-900/60 text-slate-100 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-amber-950/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-serif text-amber-100 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-amber-400 shrink-0" />
                {spell.name}
              </DialogTitle>
              {spell.nameEn && spell.nameEn !== spell.name && (
                <DialogDescription className="text-xs text-slate-400 italic mt-0.5">
                  {spell.nameEn}
                </DialogDescription>
              )}
            </div>
            {isHomebrew && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(spell);
                }}
                className="border-amber-600/40 text-amber-300 hover:bg-amber-950/40 text-xs shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs font-serif italic text-amber-300">
              {formatLevelSchool()}
            </span>
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
              {spell.ruleset === 'SRD_2024' ? '5e 2024' : spell.ruleset === 'SRD_2014' ? '5e 2014' : 'Homebrew'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Quick Parameters Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <Clock className="w-3 h-3 text-amber-400" /> Tempo de Conjuração
              </span>
              <p className="font-medium text-slate-200">{spell.castingTime || '1 ação'}</p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <MapPin className="w-3 h-3 text-amber-400" /> Alcance / Área
              </span>
              <p className="font-medium text-slate-200">{spell.rangeArea || 'Pessoal'}</p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <Sparkles className="w-3 h-3 text-amber-400" /> Componentes
              </span>
              <p className="font-medium text-slate-200">{spell.components || 'V, S'}</p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 space-y-0.5">
              <span className="text-slate-400 flex items-center gap-1 font-semibold text-[11px] uppercase">
                <BookOpen className="w-3 h-3 text-amber-400" /> Duração
              </span>
              <p className="font-medium text-slate-200">{spell.duration || 'Instantânea'}</p>
            </div>
          </div>

          {/* Spell Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Efeito & Descrição
            </span>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded border border-slate-800/80">
              {spell.description}
            </div>
          </div>

          {/* Mechanical / Upcast Notes if present */}
          {mech && (mech.higherLevelsDescription || mech.damageRolls) && (
            <div className="p-3 bg-slate-900/90 rounded border border-amber-900/30 space-y-2 text-xs">
              <span className="font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mecânicas em Círculos Superiores
              </span>
              {mech.damageRolls && (
                <div className="flex gap-2">
                  <span className="text-slate-400">Dano Base:</span>
                  <span className="font-bold text-amber-300 font-mono">
                    {mech.damageRolls.map((d: any) => `${d.diceFormula || `${d.diceCount}d${d.diceType}`} (${d.damageType})`).join(' + ')}
                  </span>
                </div>
              )}
              {mech.higherLevelsDescription && (
                <p className="text-slate-300 leading-relaxed">
                  {mech.higherLevelsDescription}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
