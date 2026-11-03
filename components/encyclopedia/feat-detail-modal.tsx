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
import { Award, Zap, Shield, Sparkles, Edit3 } from 'lucide-react';

export interface FeatDetailModalProps {
  feat: {
    id: string;
    name: string;
    nameEn?: string;
    description: string;
    featType?: string;
    prerequisites?: string | null;
    ruleset?: string;
    source?: string;
    mechanicalEffects?: any;
    currentCharges?: number | null;
    maxCharges?: number | null;
    unlockedAtLevel?: number;
  } | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (feat: any) => void;
}

export function FeatDetailModal({ feat, open, onClose, onEdit }: FeatDetailModalProps) {
  if (!feat) return null;

  const isHomebrew = feat.ruleset === 'HOMEBREW' || feat.source === 'HOMEBREW';

  const formatSource = (source?: string, featType?: string) => {
    const s = (source || '').toUpperCase();
    if (s.includes('CLASS') || featType === 'CLASS') return 'Classe';
    if (s.includes('SUBCLASS') || featType === 'SUBCLASS') return 'Subclasse';
    if (s.includes('LINEAGE') || featType === 'LINEAGE') return 'Linhagem';
    if (s.includes('ORIGIN') || featType === 'ORIGIN') return 'Origem';
    if (s === 'HOMEBREW') return 'Homebrew';
    if (s === 'SRD') return 'SRD Oficial';
    return source || 'Geral';
  };

  const effects = feat.mechanicalEffects;
  const hasStatBonuses =
    effects &&
    (effects.strBonus ||
      effects.dexBonus ||
      effects.conBonus ||
      effects.intBonus ||
      effects.wisBonus ||
      effects.chaBonus);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-xl bg-slate-950 border-amber-900/60 text-slate-100 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-amber-950/60">
          <div className="flex items-start justify-between gap-3">
            <div>
              <DialogTitle className="text-xl font-serif text-amber-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                {feat.name}
              </DialogTitle>
              {feat.nameEn && feat.nameEn !== feat.name && (
                <DialogDescription className="text-xs text-slate-400 italic mt-0.5">
                  {feat.nameEn}
                </DialogDescription>
              )}
            </div>
            {isHomebrew && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(feat);
                }}
                className="border-amber-600/40 text-amber-300 hover:bg-amber-950/40 text-xs shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <Badge variant="outline" className="border-amber-700/40 text-amber-300 text-xs">
              {formatSource(feat.source, feat.featType)}
            </Badge>
            {feat.featType && (
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                {feat.featType}
              </Badge>
            )}
            {feat.ruleset && (
              <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
                {feat.ruleset === 'SRD_2024' ? '5e 2024' : feat.ruleset === 'SRD_2014' ? '5e 2014' : 'Homebrew'}
              </Badge>
            )}
            {feat.unlockedAtLevel !== undefined && feat.unlockedAtLevel > 0 && (
              <Badge variant="secondary" className="bg-slate-800 text-slate-300 text-xs">
                Nível {feat.unlockedAtLevel}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {feat.prerequisites && (
            <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800 text-xs">
              <span className="font-semibold text-amber-300 uppercase tracking-wider block mb-0.5">
                Pré-requisitos:
              </span>
              <span className="text-slate-300">{feat.prerequisites}</span>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Descrição & Efeitos
            </span>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-3 rounded border border-slate-800/80">
              {feat.description || 'Nenhuma descrição detalhada disponível.'}
            </div>
          </div>

          {/* Mechanical Properties & Bonuses */}
          {(effects || hasStatBonuses || feat.maxCharges) && (
            <div className="p-3 bg-slate-900/90 rounded border border-amber-900/30 space-y-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mecânicas Ativas
              </span>

              {hasStatBonuses && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {effects.strBonus > 0 && <Badge className="bg-amber-950/60 border-amber-600/40 text-amber-200">FOR +{effects.strBonus}</Badge>}
                  {effects.dexBonus > 0 && <Badge className="bg-amber-950/60 border-amber-600/40 text-amber-200">DES +{effects.dexBonus}</Badge>}
                  {effects.conBonus > 0 && <Badge className="bg-amber-950/60 border-amber-600/40 text-amber-200">CON +{effects.conBonus}</Badge>}
                  {effects.intBonus > 0 && <Badge className="bg-amber-950/60 border-amber-600/40 text-amber-200">INT +{effects.intBonus}</Badge>}
                  {effects.wisBonus > 0 && <Badge className="bg-amber-950/60 border-amber-600/40 text-amber-200">SAB +{effects.wisBonus}</Badge>}
                  {effects.chaBonus > 0 && <Badge className="bg-amber-950/60 border-amber-600/40 text-amber-200">CAR +{effects.chaBonus}</Badge>}
                </div>
              )}

              {effects?.acBonus > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Bônus de Classe de Armadura: <span className="font-bold text-amber-300">+{effects.acBonus}</span>
                </div>
              )}

              {effects?.actionName && (
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-300">{effects.actionName}</span>
                    {effects.actionType && (
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                        {effects.actionType}
                      </Badge>
                    )}
                  </div>
                  {effects.actionDescription && (
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      {effects.actionDescription}
                    </p>
                  )}
                </div>
              )}

              {feat.maxCharges && feat.maxCharges > 0 && (
                <div className="space-y-1 pt-1 border-t border-slate-800 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Cargas Disponíveis:{' '}
                    <span className="font-mono font-bold text-amber-300">
                      {feat.currentCharges ?? feat.maxCharges} / {feat.maxCharges}
                    </span>
                  </div>
                  {(effects?.shortRestRecoveryType || effects?.longRestRecoveryType || effects?.maxChargesType) && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pl-5">
                      {effects?.maxChargesType && effects.maxChargesType !== 'FIXED' && (
                        <span>Fórmula: <strong className="text-amber-200">{effects.maxChargesType}</strong></span>
                      )}
                      {effects?.shortRestRecoveryType && effects.shortRestRecoveryType !== 'NONE' && (
                        <span>Descanso Curto: <strong className="text-sky-300">{effects.shortRestRecoveryType === 'ALL' ? 'Total' : effects.shortRestRecoveryType}</strong></span>
                      )}
                      {effects?.longRestRecoveryType && (
                        <span>Descanso Longo: <strong className="text-indigo-300">{effects.longRestRecoveryType === 'ALL' ? 'Total' : effects.longRestRecoveryType}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
