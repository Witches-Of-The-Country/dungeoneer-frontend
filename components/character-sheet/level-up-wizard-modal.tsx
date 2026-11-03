'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CharacterResponse,
  useLevelUp,
  useRollHitPoints,
  useReferenceClasses,
  HpCalculationMethod,
  getXpProgress,
  ABILITY_KEYS,
  ABILITY_LABELS,
  AbilityKey,
  normalizeAbilityKey,
} from '@/lib/api/characters';
import {
  fetchSubclasses,
  fetchProgressionFeats,
  fetchSubclassProgressionFeats,
  fetchFeats,
  Subclass,
  Feat,
} from '@/lib/api/encyclopedia';
import {
  Sparkles,
  Heart,
  Shield,
  Award,
  Wand2,
  ChevronRight,
  ChevronLeft,
  Check,
  Dices,
  Lock,
  Plus,
  Search,
  X,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface LevelUpWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: CharacterResponse;
}

const STAT_OPTIONS: { code: string; key: AbilityKey; label: string }[] = ABILITY_KEYS.map((k) => ({
  code: k.toUpperCase(),
  key: k,
  label: `${ABILITY_LABELS[k].full} (${ABILITY_LABELS[k].short})`,
}));

function isAsiThresholdForClass(className: string | undefined, classLevel: number): boolean {
  if ([4, 8, 12, 16, 19].includes(classLevel)) return true;
  const n = (className || '').toLowerCase();
  if ((n.includes('fighter') || n.includes('guerreiro')) && [6, 14].includes(classLevel)) {
    return true;
  }
  if ((n.includes('rogue') || n.includes('ladino')) && classLevel === 10) {
    return true;
  }
  return false;
}

export function LevelUpWizardModal({ isOpen, onClose, character }: LevelUpWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedArchetypeId, setSelectedArchetypeId] = useState<string>(
    character.classProgressions?.[0]?.archetypeId || character.archetype?.id || ''
  );
  const [subclasses, setSubclasses] = useState<Subclass[]>([]);
  const [selectedSubclassId, setSelectedSubclassId] = useState<string>('');
  const [progressionFeats, setProgressionFeats] = useState<Feat[]>([]);
  const [subclassProgressionFeats, setSubclassProgressionFeats] = useState<Feat[]>([]);

  // Available selectable Feats (GENERAL + ORIGIN)
  const [selectableFeats, setSelectableFeats] = useState<Feat[]>([]);
  const [selectedFeatId, setSelectedFeatId] = useState<string>('');

  // Feat Search & Filtering for Rich Selector
  const [featSearch, setFeatSearch] = useState('');
  const [featTypeFilter, setFeatTypeFilter] = useState<'ALL' | 'ORIGIN' | 'GENERAL' | 'HOMEBREW'>('ALL');
  const [featPage, setFeatPage] = useState(1);
  const [detailModalFeat, setDetailModalFeat] = useState<Feat | null>(null);
  const FEATS_PER_PAGE = 5;

  // HP Step (Locked to character.hpCalculationMethod)
  const lockedHpMethod: HpCalculationMethod =
    (character.hpCalculationMethod as HpCalculationMethod) || 'AVERAGE';
  const [rolledHp, setRolledHp] = useState<number>(0);
  const [hpRollId, setHpRollId] = useState<string | null>(null);

  // ASI vs Feat Step
  const [asiOrFeatChoice, setAsiOrFeatChoice] = useState<'ASI' | 'FEAT'>('ASI');
  const [primaryStat, setPrimaryStat] = useState<string>('STRENGTH');
  const [secondaryStat, setSecondaryStat] = useState<string>('CONSTITUTION');
  const [asiPlusTwo, setAsiPlusTwo] = useState<boolean>(true);
  const [halfFeatAbilityChoice, setHalfFeatAbilityChoice] = useState<string>('');

  const levelUpMutation = useLevelUp(character.id);
  const rollHpMutation = useRollHitPoints();

  const { data: srdClasses = [] } = useReferenceClasses(character.ruleset);
  const { data: homebrewClasses = [] } = useReferenceClasses('HOMEBREW');

  const allClasses = useMemo(() => {
    const seen = new Set<string>();
    const list = [
      ...(character.archetype ? [character.archetype] : []),
      ...srdClasses,
      ...homebrewClasses,
    ];
    return list.filter((c) => {
      if (!c?.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [character.archetype, srdClasses, homebrewClasses]);

  // Sync selectedArchetypeId when character or modal opens
  useEffect(() => {
    if (!isOpen) return;
    const defaultArchId =
      character.classProgressions?.[0]?.archetypeId || character.archetype?.id || '';
    if (!selectedArchetypeId && defaultArchId) {
      setSelectedArchetypeId(defaultArchId);
    }
  }, [isOpen, character, selectedArchetypeId]);

  const nextTotalLevel = character.level + 1;

  // Target class progression details
  const existingProgression = useMemo(() => {
    if (!selectedArchetypeId) return null;
    if (character.classProgressions && character.classProgressions.length > 0) {
      return (
        character.classProgressions.find((cp) => cp.archetypeId === selectedArchetypeId) || null
      );
    }
    if (character.archetype?.id === selectedArchetypeId) {
      return {
        archetypeId: character.archetype.id,
        classLevel: character.level,
        subclassId: null,
      };
    }
    return null;
  }, [character, selectedArchetypeId]);

  const currentClassLevel = existingProgression ? existingProgression.classLevel : 0;
  const newClassLevel = currentClassLevel + 1;
  const isNewMulticlass = currentClassLevel === 0;

  const targetClass = useMemo(() => {
    return (
      allClasses.find((c) => c.id === selectedArchetypeId) || character.archetype || null
    );
  }, [allClasses, selectedArchetypeId, character.archetype]);

  const targetSubclassUnlockLevel = useMemo(() => {
    if (typeof targetClass?.subclassLevel === 'number') {
      return targetClass.subclassLevel;
    }
    if (targetClass?.ruleset === 'SRD_2014') {
      const n = (targetClass.name || '').toLowerCase();
      if (
        n.includes('cleric') ||
        n.includes('clérigo') ||
        n.includes('sorcerer') ||
        n.includes('feiticeiro') ||
        n.includes('warlock') ||
        n.includes('bruxo')
      ) {
        return 1;
      }
      if (
        n.includes('druid') ||
        n.includes('druida') ||
        n.includes('wizard') ||
        n.includes('mago')
      ) {
        return 2;
      }
    }
    return 3;
  }, [targetClass]);

  const activeSubclassId = existingProgression?.subclassId || selectedSubclassId || null;
  const requiresSubclass =
    Boolean(targetClass) &&
    newClassLevel >= targetSubclassUnlockLevel &&
    !existingProgression?.subclassId;

  const isAsiLevel = useMemo(
    () => isAsiThresholdForClass(targetClass?.name, newClassLevel),
    [targetClass, newClassLevel]
  );

  // Load subclasses & progression features when selectedArchetypeId or newClassLevel changes
  useEffect(() => {
    if (!selectedArchetypeId || !isOpen) return;
    let active = true;

    Promise.all([
      fetchSubclasses(selectedArchetypeId, character.ruleset).catch(() => []),
      fetchSubclasses(selectedArchetypeId, 'HOMEBREW').catch(() => []),
      fetchProgressionFeats(selectedArchetypeId, newClassLevel).catch(() => []),
    ]).then(([srdSubs, hbSubs, progFeats]) => {
      if (!active) return;
      const seen = new Set<string>();
      const mergedSubs = [...(srdSubs || []), ...(hbSubs || [])].filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
      setSubclasses(mergedSubs);
      setProgressionFeats(progFeats || []);
    });

    return () => {
      active = false;
    };
  }, [selectedArchetypeId, newClassLevel, character.ruleset, isOpen]);

  // Load subclass progression features for the newly reached class level
  useEffect(() => {
    const subId = existingProgression?.subclassId || selectedSubclassId;
    if (!subId || !isOpen) {
      setSubclassProgressionFeats([]);
      return;
    }
    let active = true;
    fetchSubclassProgressionFeats(subId, newClassLevel)
      .then((feats) => {
        if (active) setSubclassProgressionFeats(feats || []);
      })
      .catch(() => {
        if (active) setSubclassProgressionFeats([]);
      });
    return () => {
      active = false;
    };
  }, [existingProgression?.subclassId, selectedSubclassId, newClassLevel, isOpen]);

  // Load selectable GENERAL / ORIGIN feats when at an ASI level
  useEffect(() => {
    if (!isOpen || !isAsiLevel) return;
    let active = true;
    const ownedFeatIds = new Set((character.feats || []).map((f) => f.featId));

    Promise.all([
      fetchFeats({ ruleset: character.ruleset, limit: 100 }).catch(() => ({ items: [] })),
      fetchFeats({ ruleset: 'HOMEBREW', limit: 100 }).catch(() => ({ items: [] })),
    ]).then(([srdPage, hbPage]) => {
      if (!active) return;
      const seen = new Set<string>();
      const available = [...(srdPage?.items || []), ...(hbPage?.items || [])].filter((f) => {
        if (!f?.id || seen.has(f.id) || ownedFeatIds.has(f.id)) return false;
        seen.add(f.id);
        const fType = f.featType || 'GENERAL';
        return fType === 'GENERAL' || fType === 'ORIGIN';
      });
      setSelectableFeats(available);
      setSelectedFeatId((prev) =>
        available.some((f) => f.id === prev) ? prev : available[0]?.id || ''
      );
    });

    return () => {
      active = false;
    };
  }, [isOpen, isAsiLevel, character.ruleset, character.feats]);

  // Reset roll when changing target class
  const handleSelectArchetype = (archId: string) => {
    setSelectedArchetypeId(archId);
    setSelectedSubclassId('');
    setRolledHp(0);
    setHpRollId(null);
  };

  const handleRollHp = async () => {
    if (!selectedArchetypeId) return;
    try {
      const res = await rollHpMutation.mutateAsync({
        archetypeId: selectedArchetypeId,
        level: newClassLevel,
        isSecondaryClass: true,
      });
      const rolls = res.rolledHpPerLevel || [];
      const latestRoll = rolls.length > 0 ? rolls[rolls.length - 1] : 0;
      setRolledHp(latestRoll);
      setHpRollId(res.rollId);
      toast.success(`Dado de Vida rolado: ${latestRoll}!`);
    } catch {
      // Fallback local roll if offline/mocked in unit test without hp-rolls mock
      const hitDieValue = parseInt(
        (targetClass?.hitDice || character.archetype?.hitDice || 'd8').replace(/\D/g, '') || '8',
        10
      );
      const fallback = Math.floor(Math.random() * hitDieValue) + 1;
      setRolledHp(fallback);
    }
  };

  // Existing per-level HP bonus from character's unlocked feats (e.g., Tough / Durão)
  const existingFeatHpBonusPerLevel = useMemo(() => {
    return (character.feats || []).reduce((acc, cf) => {
      const bonus = Number(cf.mechanicalEffects?.hpPerLevelBonus) || 0;
      return acc + bonus;
    }, 0);
  }, [character.feats]);

  const selectedFeatObject = useMemo(
    () => selectableFeats.find((f) => f.id === selectedFeatId) || null,
    [selectableFeats, selectedFeatId]
  );

  const halfFeatChoiceConfig = useMemo(() => {
    if (!selectedFeatObject?.mechanicalEffects) return null;
    const choice = selectedFeatObject.mechanicalEffects.abilityBonusChoice;
    if (choice && Array.isArray(choice.allowedAbilities) && choice.allowedAbilities.length > 0) {
      return {
        type: 'CHOICE' as const,
        allowedAbilities: choice.allowedAbilities as string[],
        chooseCount: choice.chooseCount || 1,
        bonusAmount: choice.bonusAmount || 1,
      };
    }
    const fixed = selectedFeatObject.mechanicalEffects.abilityBonuses;
    if (fixed && Object.keys(fixed).length > 0) {
      return {
        type: 'FIXED' as const,
        bonuses: fixed as Record<string, number>,
      };
    }
    return null;
  }, [selectedFeatObject]);

  useEffect(() => {
    if (halfFeatChoiceConfig?.type === 'CHOICE') {
      setHalfFeatAbilityChoice((prev) =>
        halfFeatChoiceConfig.allowedAbilities.some(
          (a) => a.toUpperCase() === prev.toUpperCase()
        )
          ? prev
          : ''
      );
    } else {
      setHalfFeatAbilityChoice('');
    }
  }, [selectedFeatId, halfFeatChoiceConfig]);

  const filteredFeats = useMemo(() => {
    return selectableFeats.filter((f) => {
      if (featTypeFilter === 'ORIGIN' && f.featType !== 'ORIGIN') return false;
      if (featTypeFilter === 'GENERAL' && f.featType !== 'GENERAL') return false;
      if (featTypeFilter === 'HOMEBREW' && f.ruleset !== 'HOMEBREW') return false;

      if (featSearch.trim()) {
        const q = featSearch.toLowerCase();
        const matchName = f.name?.toLowerCase().includes(q) || f.nameEn?.toLowerCase().includes(q);
        const matchPrereq = f.prerequisites?.toLowerCase().includes(q);
        const matchDesc = f.description?.toLowerCase().includes(q);
        if (!matchName && !matchPrereq && !matchDesc) return false;
      }
      return true;
    });
  }, [selectableFeats, featTypeFilter, featSearch]);

  const totalFeatPages = Math.max(1, Math.ceil(filteredFeats.length / FEATS_PER_PAGE));
  const paginatedFeats = useMemo(() => {
    const start = (featPage - 1) * FEATS_PER_PAGE;
    return filteredFeats.slice(start, start + FEATS_PER_PAGE);
  }, [filteredFeats, featPage]);

  const getCalculatedHpIncrease = () => {
    const hitDieValue = parseInt(
      (targetClass?.hitDice || character.archetype?.hitDice || 'd8').replace(/\D/g, '') || '8',
      10
    );
    const conScore = character.abilityScores?.constitution ?? 10;
    const conMod = Math.floor((conScore - 10) / 2);

    let base = Math.floor(hitDieValue / 2) + 1;
    if (lockedHpMethod === 'ROLLED') {
      base = rolledHp > 0 ? rolledHp : base;
    } else if (lockedHpMethod === 'MAX') {
      base = hitDieValue;
    }
    return Math.max(1, base + conMod + existingFeatHpBonusPerLevel);
  };

  const handleAdvanceStep = () => {
    if (step === 1) {
      if (!selectedArchetypeId) {
        toast.error('Selecione uma classe para avançar.');
        return;
      }
      if (requiresSubclass && subclasses.length > 0 && !selectedSubclassId) {
        toast.error('Selecione uma Subclasse antes de avançar.');
        return;
      }
    }
    if (step === 2) {
      if (lockedHpMethod === 'ROLLED' && rolledHp <= 0) {
        toast.error('Role o Dado de Vida antes de avançar.');
        return;
      }
    }
    if (step === 3 && isAsiLevel) {
      if (asiOrFeatChoice === 'FEAT') {
        if (!selectedFeatId) {
          toast.error('Selecione um Talento ou escolha Aumento de Atributo.');
          return;
        }
        if (halfFeatChoiceConfig?.type === 'CHOICE' && !halfFeatAbilityChoice) {
          toast.error('Selecione o atributo para o bônus do talento (+1).');
          return;
        }
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleFinish = () => {
    const archId =
      selectedArchetypeId ||
      character.classProgressions?.[0]?.archetypeId ||
      character.archetype?.id;

    if (!archId) {
      toast.error('Classe inválida para subida de nível.');
      return;
    }

    const hpGain = getCalculatedHpIncrease();
    const abilityIncreases: Record<string, number> = {};

    if (isAsiLevel && asiOrFeatChoice === 'ASI') {
      if (asiPlusTwo) {
        abilityIncreases[primaryStat] = 2;
      } else {
        abilityIncreases[primaryStat] = 1;
        abilityIncreases[secondaryStat] = (abilityIncreases[secondaryStat] || 0) + 1;
      }
    } else if (isAsiLevel && asiOrFeatChoice === 'FEAT' && halfFeatChoiceConfig) {
      if (halfFeatChoiceConfig.type === 'CHOICE' && halfFeatAbilityChoice) {
        abilityIncreases[halfFeatAbilityChoice] = halfFeatChoiceConfig.bonusAmount;
      } else if (halfFeatChoiceConfig.type === 'FIXED') {
        Object.entries(halfFeatChoiceConfig.bonuses).forEach(([stat, val]) => {
          abilityIncreases[stat] = val;
        });
      }
    }

    const chosenFeatId =
      isAsiLevel && asiOrFeatChoice === 'FEAT' && selectedFeatId ? selectedFeatId : null;

    levelUpMutation.mutate(
      {
        archetypeId: archId,
        subclassId: selectedSubclassId ? selectedSubclassId : null,
        hpCalculationMethod: lockedHpMethod,
        hpRollId: lockedHpMethod === 'ROLLED' && hpRollId ? hpRollId : null,
        hpIncrease: hpGain,
        milestone: false,
        abilityScoreIncreases:
          Object.keys(abilityIncreases).length > 0 ? abilityIncreases : undefined,
        selectedFeatId: chosenFeatId,
      },
      {
        onSuccess: (updated) => {
          setStep(1);
          setSelectedSubclassId('');
          setRolledHp(0);
          setHpRollId(null);

          const xpState = getXpProgress(
            updated?.experiencePoints ?? character.experiencePoints ?? 0,
            updated?.level ?? nextTotalLevel
          );
          const stillHasPendingLevels =
            (xpState.canLevelUp || Boolean(updated?.hasPendingLevelChoices)) &&
            (updated?.level ?? nextTotalLevel) < 20;

          if (stillHasPendingLevels) {
            toast.success(
              `Nível ${updated?.level ?? nextTotalLevel} alcançado! Continue configurando o próximo nível pendente.`
            );
          } else {
            toast.success(
              `Parabéns! ${character.name} alcançou o Nível ${updated?.level ?? nextTotalLevel}!`
            );
            onClose();
          }
        },
      }
    );
  };

  const hpMethodLabel =
    lockedHpMethod === 'MAX'
      ? 'Máximo Fixo'
      : lockedHpMethod === 'ROLLED'
      ? 'Rolagem de Dado'
      : 'Média Fixa';

  const allUnlockedFeatures = useMemo(
    () => [...progressionFeats, ...subclassProgressionFeats],
    [progressionFeats, subclassProgressionFeats]
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-surface border-primary/30 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <DialogTitle className="text-xl font-bold text-primary">
              Evolução de Personagem: Nível {nextTotalLevel}
            </DialogTitle>
          </div>
          <DialogDescription>
            Configure a classe, pontos de vida e aprimoramentos adquiridos neste nível.
          </DialogDescription>
        </DialogHeader>

        {/* Wizard Steps Tracker */}
        <div className="flex items-center justify-between border-b border-primary/10 pb-3 my-2 text-xs font-semibold">
          <span className={step === 1 ? 'text-primary' : 'text-muted-foreground'}>
            1. Classe &amp; Subclasse
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span className={step === 2 ? 'text-primary' : 'text-muted-foreground'}>
            2. Pontos de Vida (HP)
          </span>
          {isAsiLevel && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <span className={step === 3 ? 'text-primary' : 'text-muted-foreground'}>
                3. Atributos / Talentos
              </span>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          <span
            className={
              (isAsiLevel ? step === 4 : step === 3) ? 'text-primary' : 'text-muted-foreground'
            }
          >
            Resumo
          </span>
        </div>

        {/* STEP 1: Class, Multiclass & Subclass */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Escolha a Classe para Evoluir (ou Adicionar Multiclasse)
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {allClasses.map((cls) => {
                  const prog =
                    character.classProgressions?.find((cp) => cp.archetypeId === cls.id) ||
                    (character.archetype?.id === cls.id && !character.classProgressions?.length
                      ? { archetypeId: cls.id, classLevel: character.level }
                      : null);
                  const curLvl = prog ? prog.classLevel : 0;
                  const isSelected = selectedArchetypeId === cls.id;

                  return (
                    <button
                      key={cls.id}
                      type="button"
                      data-testid={`levelup-class-option-${cls.id}`}
                      onClick={() => handleSelectArchetype(cls.id)}
                      className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-foreground shadow-sm'
                          : 'border-primary/20 bg-background/50 hover:border-primary/40'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <span>{cls.name}</span>
                          {cls.ruleset === 'HOMEBREW' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              HB
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Dado de Vida: {cls.hitDice?.toUpperCase()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded font-mono font-semibold ${
                          curLvl > 0
                            ? 'bg-primary/20 text-primary-foreground'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {curLvl > 0 ? `Nv. ${curLvl} → ${curLvl + 1}` : '+ Multiclasse (Nv. 1)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {requiresSubclass && subclasses.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-amber-400 font-bold flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4" /> Escolha sua Subclasse ({targetClass?.name})
                </Label>
                <select
                  data-testid="levelup-subclass-select"
                  value={selectedSubclassId}
                  onChange={(e) => setSelectedSubclassId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md border border-amber-500/40 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione um Arquétipo / Subclasse</option>
                  {subclasses.map((sc) => (
                    <option key={sc.id} value={sc.id}>
                      {sc.name}
                      {sc.nameEn && sc.nameEn !== sc.name ? ` (${sc.nameEn})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {allUnlockedFeatures.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  Habilidades Desbloqueadas em {targetClass?.name} Nível {newClassLevel}
                </Label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {allUnlockedFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      className="p-2.5 rounded bg-background/40 border border-primary/10 text-xs"
                    >
                      <div className="font-semibold text-primary">{feat.name}</div>
                      <div className="text-muted-foreground line-clamp-2">{feat.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Hit Points (Locked to character.hpCalculationMethod) */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Método de PV da Carreira (Travado na Criação)
                </span>
                <p className="text-sm font-bold text-foreground">
                  {hpMethodLabel} — Dado de {targetClass?.name}:{' '}
                  {(targetClass?.hitDice || 'd8').toUpperCase()}
                </p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-background/80 border border-primary/30">
                {lockedHpMethod}
              </span>
            </div>

            {lockedHpMethod === 'ROLLED' ? (
              <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">
                    Resultado da Rolagem ({(targetClass?.hitDice || 'd8').toUpperCase()}):
                  </span>
                  <div className="text-2xl font-bold font-mono text-primary">
                    {rolledHp > 0
                      ? `${rolledHp} no ${(targetClass?.hitDice || 'd8').toUpperCase()}`
                      : 'Não rolado'}
                  </div>
                </div>
                <Button
                  size="sm"
                  data-testid="levelup-roll-hp-button"
                  disabled={rolledHp > 0 || rollHpMutation.isPending}
                  onClick={handleRollHp}
                  className="bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold gap-1.5"
                >
                  <Dices className="w-4 h-4" />
                  {rolledHp > 0 ? 'Dado Rolado' : 'Rolar Dado'}
                </Button>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg border border-primary/20 bg-background/50 text-xs text-muted-foreground">
                {lockedHpMethod === 'MAX'
                  ? `Recebe o valor máximo do dado de vida (${(targetClass?.hitDice || 'd8').toUpperCase()}) + Modificador de Constituição.`
                  : `Recebe a média fixa do dado de vida (${
                      Math.floor(
                        parseInt((targetClass?.hitDice || 'd8').replace(/\D/g, '') || '8', 10) / 2
                      ) + 1
                    }) + Modificador de Constituição.`}
              </div>
            )}

            <div className="p-3 rounded-lg border border-primary/20 bg-background flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-red-500 fill-red-500/20" /> Total Ganho de Vida:
              </span>
              <span className="text-lg font-bold font-mono text-green-400">
                +{getCalculatedHpIncrease()} HP
              </span>
            </div>
          </div>
        )}

        {/* STEP 3: ASI or Feat (if ASI Level) */}
        {step === 3 && isAsiLevel && (
          <div className="space-y-4 py-2">
            <Label className="text-amber-400 font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Aprimoramento de Nível {newClassLevel} ({targetClass?.name})
            </Label>

            {/* Toggle between ASI and Feat */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                data-testid="choice-asi-button"
                variant={asiOrFeatChoice === 'ASI' ? 'default' : 'outline'}
                onClick={() => setAsiOrFeatChoice('ASI')}
                className="w-full"
              >
                Aumento de Atributo (ASI)
              </Button>
              <Button
                type="button"
                data-testid="choice-feat-button"
                variant={asiOrFeatChoice === 'FEAT' ? 'default' : 'outline'}
                onClick={() => setAsiOrFeatChoice('FEAT')}
                className="w-full"
              >
                Escolher um Talento
              </Button>
            </div>

            {asiOrFeatChoice === 'ASI' ? (
              <div className="space-y-3 pt-1">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={asiPlusTwo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAsiPlusTwo(true)}
                    className="flex-1"
                  >
                    +2 em 1 Atributo
                  </Button>
                  <Button
                    type="button"
                    variant={!asiPlusTwo ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAsiPlusTwo(false)}
                    className="flex-1"
                  >
                    +1 em 2 Atributos
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Atributo Principal (+{asiPlusTwo ? '2' : '1'}) — Máx. 20</Label>
                  <select
                    value={primaryStat}
                    onChange={(e) => setPrimaryStat(e.target.value)}
                    className="w-full h-10 px-3 py-2 rounded-md border border-primary/20 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STAT_OPTIONS.map((stat) => (
                      <option key={stat.code} value={stat.code}>
                        {stat.label} (Atual: {character.abilityScores?.[stat.key] ?? 10})
                      </option>
                    ))}
                  </select>
                </div>

                {!asiPlusTwo && (
                  <div className="space-y-2">
                    <Label>Segundo Atributo (+1) — Máx. 20</Label>
                    <select
                      value={secondaryStat}
                      onChange={(e) => setSecondaryStat(e.target.value)}
                      className="w-full h-10 px-3 py-2 rounded-md border border-primary/20 bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {STAT_OPTIONS.filter((s) => s.code !== primaryStat).map((stat) => (
                        <option key={stat.code} value={stat.code}>
                          {stat.label} (Atual: {character.abilityScores?.[stat.key] ?? 10})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">
                    Selecione um Talento (Geral / Origem)
                  </Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    {filteredFeats.length} {filteredFeats.length === 1 ? 'talento encontrado' : 'talentos encontrados'}
                  </span>
                </div>

                {selectableFeats.length > 0 ? (
                  <div className="space-y-3">
                    {/* Hidden sync select for accessibility & automated tests */}
                    <select
                      data-testid="levelup-feat-select"
                      value={selectedFeatId}
                      onChange={(e) => setSelectedFeatId(e.target.value)}
                      className="sr-only"
                      tabIndex={-1}
                      aria-label="Seleção rápida de talento"
                    >
                      <option value="">Selecione um Talento...</option>
                      {selectableFeats.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>

                    {/* Search bar & Type filter chips */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={featSearch}
                          onChange={(e) => {
                            setFeatSearch(e.target.value);
                            setFeatPage(1);
                          }}
                          placeholder="Buscar talento por nome, pré-requisito..."
                          className="w-full h-9 pl-9 pr-8 rounded-lg border border-primary/20 bg-background/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber-500 transition-colors"
                        />
                        {featSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setFeatSearch('');
                              setFeatPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter Chips */}
                      <div className="flex gap-1.5 flex-wrap text-xs">
                        {[
                          { key: 'ALL', label: 'Todos' },
                          { key: 'GENERAL', label: 'Gerais' },
                          { key: 'ORIGIN', label: 'Origem' },
                          { key: 'HOMEBREW', label: 'Homebrew' },
                        ].map((chip) => (
                          <button
                            key={chip.key}
                            type="button"
                            onClick={() => {
                              setFeatTypeFilter(chip.key as any);
                              setFeatPage(1);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                              featTypeFilter === chip.key
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-background/40 text-muted-foreground border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Feat Cards List */}
                    {paginatedFeats.length > 0 ? (
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {paginatedFeats.map((f) => {
                          const isSelected = selectedFeatId === f.id;
                          return (
                            <div
                              key={f.id}
                              data-testid={`feat-card-${f.id}`}
                              onClick={() => setSelectedFeatId(f.id)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-amber-500/70 bg-amber-950/20 shadow-sm ring-1 ring-amber-500/30'
                                  : 'border-primary/20 bg-background/50 hover:border-primary/40'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`font-bold ${isSelected ? 'text-amber-300' : 'text-foreground'}`}>
                                      {f.name}
                                    </span>
                                    {f.nameEn && f.nameEn !== f.name && (
                                      <span className="text-[10px] text-muted-foreground italic">
                                        ({f.nameEn})
                                      </span>
                                    )}
                                    <Badge variant="outline" className="text-[9px] py-0 px-1 border-primary/30">
                                      {f.featType || 'GERAL'}
                                    </Badge>
                                    {f.ruleset === 'HOMEBREW' && (
                                      <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-purple-950/50 text-purple-300 border-purple-700/40">
                                        Homebrew
                                      </Badge>
                                    )}
                                  </div>
                                  {f.prerequisites && (
                                    <span className="inline-block text-[10px] text-amber-400/90 font-mono">
                                      Pré-requisito: {f.prerequisites}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDetailModalFeat(f)}
                                    className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                    Detalhes
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => setSelectedFeatId(f.id)}
                                    className={`h-7 px-2.5 text-[11px] font-semibold gap-1 ${
                                      isSelected
                                        ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950'
                                        : 'bg-primary/20 hover:bg-primary/30 border border-primary/30 text-foreground'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        Selecionado
                                      </>
                                    ) : (
                                      'Selecionar'
                                    )}
                                  </Button>
                                </div>
                              </div>
                              <p className="text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                                {f.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg border border-dashed border-slate-800 text-center text-xs text-muted-foreground">
                        Nenhum talento encontrado com os filtros atuais.
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalFeatPages > 1 && (
                      <div className="flex items-center justify-between text-xs pt-1 px-1">
                        <span className="text-muted-foreground font-mono text-[11px]">
                          Página {featPage} de {totalFeatPages}
                        </span>
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={featPage <= 1}
                            onClick={() => setFeatPage((p) => Math.max(1, p - 1))}
                            className="h-7 px-2 text-xs border-primary/20 text-foreground disabled:opacity-40"
                          >
                            <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
                            Anterior
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={featPage >= totalFeatPages}
                            onClick={() => setFeatPage((p) => Math.min(totalFeatPages, p + 1))}
                            className="h-7 px-2 text-xs border-primary/20 text-foreground disabled:opacity-40"
                          >
                            Próxima
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Active Selection Summary */}
                    {selectedFeatObject && (
                      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <span className="text-muted-foreground">Talento Selecionado: </span>
                            <span className="font-bold text-amber-300">{selectedFeatObject.name}</span>
                          </div>
                        </div>
                        {selectedFeatObject.prerequisites && (
                          <span className="text-[10px] text-amber-400 font-mono hidden sm:inline">
                            Req: {selectedFeatObject.prerequisites}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Half-Feat Ability Score Selector */}
                    {selectedFeatObject && halfFeatChoiceConfig && (
                      <div className="p-3.5 rounded-lg border border-amber-500/40 bg-zinc-900/80 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              Bônus de Atributo do Talento (+{halfFeatChoiceConfig.type === 'CHOICE' ? halfFeatChoiceConfig.bonusAmount : 1})
                            </span>
                          </div>
                          {halfFeatChoiceConfig.type === 'CHOICE' && (
                            <span className="text-[11px] text-zinc-400 font-mono">
                              Escolha {halfFeatChoiceConfig.chooseCount}
                            </span>
                          )}
                        </div>

                        {halfFeatChoiceConfig.type === 'CHOICE' ? (
                          <div className="space-y-2">
                            <p className="text-[11px] text-zinc-400">
                              Este talento concede um aumento de atributo. Selecione qual atributo deseja aumentar:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {halfFeatChoiceConfig.allowedAbilities.map((rawStat) => {
                                const normKey = normalizeAbilityKey(rawStat);
                                const label = normKey ? ABILITY_LABELS[normKey] : null;
                                const shortLabel = label?.short || rawStat;
                                const fullLabel = label?.full || rawStat;
                                const isSelected = halfFeatAbilityChoice.toUpperCase() === rawStat.toUpperCase();

                                const currentScore =
                                  normKey && character.abilityScores ? character.abilityScores[normKey] : 10;
                                const projectedScore = Math.min(20, currentScore + halfFeatChoiceConfig.bonusAmount);

                                return (
                                  <button
                                    key={rawStat}
                                    type="button"
                                    onClick={() => setHalfFeatAbilityChoice(rawStat)}
                                    className={`p-2 rounded-md border text-left transition-all flex flex-col justify-between ${
                                      isSelected
                                        ? 'border-amber-400 bg-amber-500/20 text-amber-200 shadow-sm shadow-amber-500/20'
                                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="text-xs font-bold">{shortLabel}</span>
                                      <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                          isSelected
                                            ? 'bg-amber-400 text-zinc-950 font-bold'
                                            : 'bg-zinc-800 text-zinc-400'
                                        }`}
                                      >
                                        +{halfFeatChoiceConfig.bonusAmount}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-baseline justify-between text-[11px]">
                                      <span className="text-zinc-400 truncate text-[10px]">{fullLabel}</span>
                                      <span className="font-mono text-zinc-200">
                                        {currentScore} <span className="text-amber-400">→ {projectedScore}</span>
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            {!halfFeatAbilityChoice && (
                              <p className="text-[11px] text-red-400 font-medium">
                                * É necessário selecionar um atributo para avançar.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-amber-200 bg-amber-950/30 p-2 rounded border border-amber-500/20">
                            <span className="text-zinc-400">Bônus fixos aplicados automaticamente:</span>
                            {Object.entries(halfFeatChoiceConfig.bonuses).map(([stat, val]) => (
                              <Badge
                                key={stat}
                                variant="secondary"
                                className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]"
                              >
                                +{val} {stat}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum talento elegível disponível no catálogo.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* FINAL STEP: Summary */}
        {((isAsiLevel && step === 4) || (!isAsiLevel && step === 3)) && (
          <div className="space-y-3 py-2 text-sm">
            <div className="p-3.5 rounded-lg border border-primary/20 bg-background/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Novo Nível Total:</span>
                <span className="font-bold text-foreground">{nextTotalLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Classe Evoluída:</span>
                <span className="font-bold text-foreground">
                  {targetClass?.name} (Nv. {newClassLevel}
                  {isNewMulticlass ? ' — Nova Multiclasse' : ''})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Aumento de HP ({hpMethodLabel}):</span>
                <span className="font-bold text-green-400">+{getCalculatedHpIncrease()} HP</span>
              </div>
              {isAsiLevel && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aprimoramento (ASI / Talento):</span>
                  <span className="font-bold text-amber-400">
                    {asiOrFeatChoice === 'ASI'
                      ? asiPlusTwo
                        ? `+2 em ${primaryStat}`
                        : `+1 em ${primaryStat} e +1 em ${secondaryStat}`
                      : halfFeatChoiceConfig?.type === 'CHOICE' && halfFeatAbilityChoice
                      ? `Talento: ${selectedFeatObject?.name || 'Selecionado'} (+1 em ${
                          ABILITY_LABELS[normalizeAbilityKey(halfFeatAbilityChoice) || 'strength']?.full || halfFeatAbilityChoice
                        })`
                      : halfFeatChoiceConfig?.type === 'FIXED'
                      ? `Talento: ${selectedFeatObject?.name || 'Selecionado'} (Bônus de Atributo)`
                      : `Talento: ${selectedFeatObject?.name || 'Selecionado'}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 flex justify-between sm:justify-between items-center">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 1}
            onClick={() => setStep((prev) => prev - 1)}
          >
            Voltar
          </Button>

          {(isAsiLevel && step < 4) || (!isAsiLevel && step < 3) ? (
            <Button
              type="button"
              className="bg-primary text-primary-foreground font-semibold gap-1.5"
              onClick={handleAdvanceStep}
            >
              Avançar <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              data-testid="levelup-confirm-button"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold gap-1.5"
              disabled={levelUpMutation.isPending}
              onClick={handleFinish}
            >
              <Check className="w-4 h-4" />
              {levelUpMutation.isPending ? 'Confirmando...' : 'Concluir Subida de Nível'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Detail Dialog for Feats */}
    <Dialog open={!!detailModalFeat} onOpenChange={(o) => !o && setDetailModalFeat(null)}>
      <DialogContent className="max-w-md bg-surface border border-primary/30 text-foreground">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <DialogTitle className="text-base font-bold text-primary">
              {detailModalFeat?.name}
            </DialogTitle>
          </div>
          {detailModalFeat?.nameEn && detailModalFeat.nameEn !== detailModalFeat.name && (
            <DialogDescription className="text-xs text-muted-foreground italic">
              {detailModalFeat.nameEn}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="border-primary/30">
              {detailModalFeat?.featType || 'GERAL'}
            </Badge>
            <Badge variant="secondary">
              {detailModalFeat?.ruleset || 'SRD'}
            </Badge>
          </div>

          {detailModalFeat?.prerequisites && (
            <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-300">
              <span className="font-semibold font-mono">Pré-requisito: </span>
              {detailModalFeat.prerequisites}
            </div>
          )}

          <div className="p-3 rounded-lg border border-primary/20 bg-background/50 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400">Descrição do Talento:</span>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {detailModalFeat?.description}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDetailModalFeat(null)}
              className="border-primary/20"
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (detailModalFeat) {
                  setSelectedFeatId(detailModalFeat.id);
                }
                setDetailModalFeat(null);
              }}
              className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold"
            >
              Selecionar este Talento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
