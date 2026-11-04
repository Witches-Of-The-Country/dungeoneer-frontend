'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  ArchetypeSummary,
  Subclass,
  Feat,
  fetchSubclasses,
  fetchProgressionFeats,
  fetchSubclassProgressionFeats,
} from '@/lib/api/encyclopedia';
import { calculateProficiencyBonus } from '@/lib/api/characters';
import { translateReferenceName } from '@/lib/srd-translations';
import {
  Shield,
  Wand2,
  Award,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClassDetailModalProps {
  archetype: ArchetypeSummary | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (archetype: ArchetypeSummary) => void;
}

const LEVELS_1_TO_20 = Array.from({ length: 20 }, (_, i) => i + 1);

function isStandardAsiLevel(className: string, level: number): boolean {
  if ([4, 8, 12, 16, 19].includes(level)) return true;
  const n = className.toLowerCase();
  if ((n.includes('fighter') || n.includes('guerreiro')) && [6, 14].includes(level)) {
    return true;
  }
  if ((n.includes('rogue') || n.includes('ladino')) && level === 10) {
    return true;
  }
  return false;
}

export function ClassDetailModal({ archetype, open, onClose, onEdit }: ClassDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [featuresByLevel, setFeaturesByLevel] = useState<Record<number, Feat[]>>({});
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);
  const [expandedFeatIds, setExpandedFeatIds] = useState<Record<string, boolean>>({});
  const [expandedSubclassIds, setExpandedSubclassIds] = useState<Record<string, boolean>>({});
  const [subclassFeaturesById, setSubclassFeaturesById] = useState<
    Record<string, Array<{ level: number; feat: Feat }>>
  >({});

  useEffect(() => {
    if (!open || !archetype) return;
    let active = true;
    setLoading(true);
    setFeaturesByLevel({});
    setSubclasses([]);
    setExpandedFeatIds({});
    setExpandedSubclassIds({});
    setSubclassFeaturesById({});

    const prevFetchLevels: Record<number, Feat[]> = {};

    Promise.all([
      fetchSubclasses(archetype.id, archetype.ruleset).catch(() => []),
      fetchSubclasses(archetype.id, 'HOMEBREW').catch(() => []),
      ...LEVELS_1_TO_20.map(async (lvl) => {
        const feats = await fetchProgressionFeats(archetype.id, lvl).catch(() => []);
        return { lvl, feats: feats || [] };
      }),
    ])
      .then((results) => {
        if (!active) return;
        const srdSubs = (results[0] as Subclass[]) || [];
        const hbSubs = (results[1] as Subclass[]) || [];
        const seenSubs = new Set<string>();
        const mergedSubs = [...srdSubs, ...hbSubs].filter((s) => {
          if (!s?.id || seenSubs.has(s.id)) return false;
          seenSubs.add(s.id);
          return true;
        });
        setSubclasses(mergedSubs);

        const levelEntries = results.slice(2) as Array<{ lvl: number; feats: Feat[] }>;
        for (const entry of levelEntries) {
          // Only keep features newly unlocked at this exact level compared to previous level
          const prevIds = new Set(
            (prevFetchLevels[entry.lvl - 1] || []).map((f) => f.id)
          );
          prevFetchLevels[entry.lvl] = entry.feats;
          const newlyUnlocked = entry.feats.filter((f) => !prevIds.has(f.id));
          prevFetchLevels[entry.lvl] = entry.feats;
          setFeaturesByLevel((prev) => ({ ...prev, [entry.lvl]: newlyUnlocked }));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, archetype]);

  const toggleFeatExpand = (key: string) => {
    setExpandedFeatIds((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubclassExpand = async (sc: Subclass) => {
    const nextState = !expandedSubclassIds[sc.id];
    setExpandedSubclassIds((prev) => ({ ...prev, [sc.id]: nextState }));

    if (nextState && !subclassFeaturesById[sc.id]) {
      try {
        const allLvlResults = await Promise.all(
          LEVELS_1_TO_20.map(async (lvl) => {
            const feats = await fetchSubclassProgressionFeats(sc.id, lvl).catch(() => []);
            return { lvl, feats: feats || [] };
          })
        );
        const collected: Array<{ level: number; feat: Feat }> = [];
        const seenFeatIds = new Set<string>();
        for (const r of allLvlResults) {
          for (const f of r.feats) {
            if (!seenFeatIds.has(f.id)) {
              seenFeatIds.add(f.id);
              collected.push({ level: r.lvl, feat: f });
            }
          }
        }
        setSubclassFeaturesById((prev) => ({ ...prev, [sc.id]: collected }));
      } catch {
        setSubclassFeaturesById((prev) => ({ ...prev, [sc.id]: [] }));
      }
    }
  };

  if (!archetype) return null;

  const subclassUnlockLvl = archetype.subclassLevel ?? 3;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[88vh] overflow-y-auto bg-slate-950 border border-amber-900/40 text-amber-50">
        <DialogHeader className="space-y-2 border-b border-amber-900/30 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-amber-400" />
              <DialogTitle className="text-2xl font-serif font-bold text-amber-300">
                {translateReferenceName(archetype.name)}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {archetype.ruleset === 'HOMEBREW' && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(archetype);
                  }}
                  className="border-amber-600/40 text-amber-300 hover:bg-amber-950/40 text-xs shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1" />
                  Editar
                </Button>
              )}
              <Badge
                variant="outline"
                className="font-mono text-xs border-amber-500/40 text-amber-300"
              >
                Dado de Vida: {archetype.hitDice?.toUpperCase()}
              </Badge>
              <Badge
                variant="outline"
                className="font-mono text-xs border-emerald-500/40 text-emerald-300"
              >
                {archetype.ruleset === 'SRD_2024'
                  ? 'SRD 2024'
                  : archetype.ruleset === 'HOMEBREW'
                  ? 'Homebrew'
                  : 'SRD 2014'}
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            Atributo Primário: {translateReferenceName(archetype.primaryAbility)} • Subclasse desbloqueada no Nível {subclassUnlockLvl} • Origem: {archetype.source}
          </DialogDescription>

          {/* Proficiencies Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">
                Salvaguardas
              </span>
              <span className="text-slate-300">
                {(archetype.savingThrowProficiencies ?? []).length > 0
                  ? (archetype.savingThrowProficiencies ?? [])
                      .map(translateReferenceName)
                      .join(', ')
                  : 'Padrão da Classe'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">
                Proficiências de Armadura
              </span>
              <span className="text-slate-300">
                {(archetype.armorProficiencies ?? []).length > 0
                  ? (archetype.armorProficiencies ?? [])
                      .map(translateReferenceName)
                      .join(', ')
                  : 'Nenhuma / Conforme SRD'}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-amber-300 block mb-1">
                Proficiências de Armas
              </span>
              <span className="text-slate-300">
                {(archetype.weaponProficiencies ?? []).length > 0
                  ? (archetype.weaponProficiencies ?? [])
                      .map(translateReferenceName)
                      .join(', ')
                  : 'Armas Simples'}
              </span>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-amber-200">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-sm font-serif">
              Consultando tabela de progressão de {translateReferenceName(archetype.name)}...
            </span>
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Level 1-20 Progression Table */}
            <div className="space-y-2.5">
              <h3 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Tabela de Progressão da Classe (Níveis 1 a 20)
              </h3>
              <div className="rounded-xl border border-amber-900/30 overflow-hidden bg-slate-900/50">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-amber-900/40 bg-slate-900 text-amber-300 font-serif">
                      <th className="py-2.5 px-3 w-16">Nível</th>
                      <th className="py-2.5 px-3 w-28">Bônus Prof.</th>
                      <th className="py-2.5 px-3">Características Desbloqueadas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {LEVELS_1_TO_20.map((lvl) => {
                      const prof = calculateProficiencyBonus(lvl);
                      const featsAtLvl = featuresByLevel[lvl] || [];
                      const isAsi = isStandardAsiLevel(archetype.name, lvl);
                      const isSubclassLvl = lvl === subclassUnlockLvl;

                      return (
                        <tr
                          key={lvl}
                          data-testid={`class-progression-row-${lvl}`}
                          className="hover:bg-slate-900/80 transition-colors align-top"
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-200">
                            {lvl}º
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">
                            +{prof}
                          </td>
                          <td className="py-2.5 px-3 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isSubclassLvl && (
                                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/40 font-semibold">
                                  Especialização de Subclasse
                                </span>
                              )}
                              {isAsi && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 font-semibold">
                                  Aumento no Valor de Atributo / Talento
                                </span>
                              )}
                              {featsAtLvl.map((f) => {
                                const expandKey = `${lvl}-${f.id}`;
                                const isExpanded = Boolean(expandedFeatIds[expandKey]);
                                return (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => toggleFeatExpand(expandKey)}
                                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-100 border border-amber-700/40 inline-flex items-center gap-1 transition-colors"
                                  >
                                    <span>{f.name}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="w-3 h-3 text-amber-400" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 text-slate-400" />
                                    )}
                                  </button>
                                );
                              })}
                              {!isSubclassLvl && !isAsi && featsAtLvl.length === 0 && (
                                <span className="text-slate-500">—</span>
                              )}
                            </div>

                            {/* Expanded feature descriptions */}
                            {featsAtLvl.map((f) => {
                              const expandKey = `${lvl}-${f.id}`;
                              if (!expandedFeatIds[expandKey]) return null;
                              return (
                                <div
                                  key={`desc-${f.id}`}
                                  className="p-2.5 rounded-lg bg-slate-950 border border-amber-900/40 text-slate-300 space-y-1 mt-1"
                                >
                                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {f.name}
                                  </div>
                                  <p className="text-xs leading-relaxed whitespace-pre-line">
                                    {f.description}
                                  </p>
                                </div>
                              );
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subclasses Accordion */}
            <div className="space-y-3">
              <h3 className="text-base font-serif font-bold text-amber-200 flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-amber-400" />
                Subclasses &amp; Arquétipos ({subclasses.length})
              </h3>
              {subclasses.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Nenhuma subclasse cadastrada para esta classe.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {subclasses.map((sc) => {
                    const isExpanded = Boolean(expandedSubclassIds[sc.id]);
                    const scFeats = subclassFeaturesById[sc.id] || [];

                    return (
                      <div
                        key={sc.id}
                        className="rounded-xl border border-amber-900/40 bg-slate-900/70 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSubclassExpand(sc)}
                          className="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900 transition-colors"
                        >
                          <div>
                            <div className="font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
                              <span>{sc.name}</span>
                              {sc.ruleset === 'HOMEBREW' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  Homebrew
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {sc.description}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 text-xs">
                            <p className="text-slate-300 leading-relaxed pt-2">
                              {sc.description}
                            </p>
                            {scFeats.length > 0 && (
                              <div className="space-y-2 pt-1">
                                <span className="font-bold uppercase tracking-wider text-amber-300 block text-[11px]">
                                  Características da Subclasse
                                </span>
                                {scFeats.map(({ level: fLvl, feat }) => (
                                  <div
                                    key={feat.id}
                                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-amber-200">
                                        {feat.name}
                                      </span>
                                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300">
                                        Nível {fLvl}
                                      </span>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed">
                                      {feat.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
