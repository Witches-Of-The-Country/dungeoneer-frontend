'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useCreateHomebrewSpell,
  useCreateHomebrewFeat,
  useCreateHomebrewItem,
  useCreateHomebrewClass,
  useCreateHomebrewSubclass,
  useCreateHomebrewLineage,
  HomebrewProgressionFeatPayload,
} from '@/lib/api/homebrew';
import { useReferenceClasses } from '@/lib/api/characters';
import { fetchFeats, Feat } from '@/lib/api/encyclopedia';

export type HomebrewCategory =
  | 'spells'
  | 'feats'
  | 'items'
  | 'classes'
  | 'subclasses'
  | 'lineages';

interface CreateHomebrewDialogProps {
  open: boolean;
  category: HomebrewCategory;
  onClose: () => void;
}

const WEAPON_PROPERTIES = [
  'FINESSE',
  'VERSATILE',
  'HEAVY',
  'LIGHT',
  'TWO_HANDED',
  'REACH',
  'THROWN',
  'AMMUNITION',
  'LOADING',
];

const DAMAGE_TYPES = [
  'SLASHING',
  'PIERCING',
  'BLUDGEONING',
  'FIRE',
  'COLD',
  'LIGHTNING',
  'ACID',
  'POISON',
  'NECROTIC',
  'RADIANT',
  'FORCE',
  'PSYCHIC',
  'THUNDER',
];

interface DraftProgressionFeat {
  unlockLevel: number;
  mode: 'INLINE' | 'EXISTING';
  featId: string;
  name: string;
  description: string;
  acBonus: number;
  hpPerLevelBonus: number;
}

export interface DamageRollDraft {
  diceCount: number;
  diceType: number;
  damageType: string;
  bonusModifier?: number;
  conditional: boolean;
  conditionNote: string;
}

export interface PrerequisiteDraft {
  type: 'ABILITY_SCORE' | 'CLASS' | 'LINEAGE' | 'FEAT' | 'LEVEL' | string;
  targetKey: string;
  minValue?: number;
  displayLabel: string;
}

export function CreateHomebrewDialog({
  open,
  category,
  onClose,
}: CreateHomebrewDialogProps) {
  const [activeCategory, setActiveCategory] = useState<HomebrewCategory>(category);

  useEffect(() => {
    setActiveCategory(category);
  }, [category, open]);

  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');

  // Spells
  const [level, setLevel] = useState(1);
  const [school, setSchool] = useState('Evocação');
  const [compV, setCompV] = useState(true);
  const [compS, setCompS] = useState(true);
  const [compM, setCompM] = useState(false);
  const [compMDescription, setCompMDescription] = useState('');
  const [castingTimeValue, setCastingTimeValue] = useState(1);
  const [castingTimeUnit, setCastingTimeUnit] = useState('ação');
  const [castingTimeReactionTrigger, setCastingTimeReactionTrigger] = useState('');
  const [rangeType, setRangeType] = useState<'DISTANCE' | 'TOUCH' | 'SELF' | 'SIGHT'>('DISTANCE');
  const [rangeValue, setRangeValue] = useState(18);
  const [rangeUnit, setRangeUnit] = useState('metros');
  const [durationIsInstant, setDurationIsInstant] = useState(true);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState('minuto(s)');
  const [durationConcentration, setDurationConcentration] = useState(false);
  const [spellDamageRolls, setSpellDamageRolls] = useState<DamageRollDraft[]>([]);

  // Feats
  const [prerequisites, setPrerequisites] = useState('');
  const [featType, setFeatType] = useState<'GENERAL' | 'ORIGIN' | 'CLASS' | 'SUBCLASS' | 'LINEAGE'>('GENERAL');
  const [featAbilityMode, setFeatAbilityMode] = useState<'NONE' | 'FIXED' | 'CHOICE'>('NONE');
  const [featBonusAbility, setFeatBonusAbility] = useState<string>('STRENGTH');
  const [featBonusAmount, setFeatBonusAmount] = useState<number>(1);
  const [featChooseCount, setFeatChooseCount] = useState<number>(1);
  const [featAllowedAbilities, setFeatAllowedAbilities] = useState<string[]>(['STRENGTH', 'DEXTERITY', 'CONSTITUTION']);
  const [featIsConditional, setFeatIsConditional] = useState<boolean>(false);
  const [featConditionDesc, setFeatConditionDesc] = useState<string>('');
  const [featPrerequisiteRules, setFeatPrerequisiteRules] = useState<PrerequisiteDraft[]>([]);
  const [featAcBonus, setFeatAcBonus] = useState<number>(0);
  const [featInitBonus, setFeatInitBonus] = useState<number>(0);
  const [featSpeedBonus, setFeatSpeedBonus] = useState<number>(0);
  const [featHpPerLevelBonus, setFeatHpPerLevelBonus] = useState<number>(0);
  const [featGrantsAction, setFeatGrantsAction] = useState<boolean>(false);
  const [featActionType, setFeatActionType] = useState<string>('ACTION');
  const [featMaxUses, setFeatMaxUses] = useState<number>(1);
  const [featRechargeOn, setFeatRechargeOn] = useState<string>('LONG_REST');

  // Items
  const [itemCategory, setItemCategory] = useState('WEAPON');
  const [itemType, setItemType] = useState('Arma Simples');
  const [rarity, setRarity] = useState('COMMON');
  const [attunement, setAttunement] = useState(false);
  const [cost, setCost] = useState('');
  const [itemCostCp, setItemCostCp] = useState<number>(0);
  const [itemCostSp, setItemCostSp] = useState<number>(0);
  const [itemCostEp, setItemCostEp] = useState<number>(0);
  const [itemCostGp, setItemCostGp] = useState<number>(0);
  const [itemCostPp, setItemCostPp] = useState<number>(0);
  const [weight, setWeight] = useState('');

  // Weapon mechanical fields (incremental damage rolls)
  const [weaponDamageRolls, setWeaponDamageRolls] = useState<DamageRollDraft[]>([
    { diceCount: 1, diceType: 8, damageType: 'SLASHING', bonusModifier: 0, conditional: false, conditionNote: '' },
  ]);
  const [weaponMagicBonus, setWeaponMagicBonus] = useState(0);
  const [weaponVersatileDice, setWeaponVersatileDice] = useState('');
  const [weaponProps, setWeaponProps] = useState<string[]>([]);

  // Armor mechanical fields
  const [armorCategory, setArmorCategory] = useState('LIGHT');
  const [armorBaseAc, setArmorBaseAc] = useState(12);
  const [armorMagicBonus, setArmorMagicBonus] = useState(0);
  const [armorStrReq, setArmorStrReq] = useState(0);
  const [armorStealthDisadv, setArmorStealthDisadv] = useState(false);

  // Consumable mechanical fields
  const [consumableEffectType, setConsumableEffectType] = useState('HEAL');
  const [consumableDiceFormula, setConsumableDiceFormula] = useState('2d4+2');

  // Classes & Subclasses
  const [hitDice, setHitDice] = useState('D8');
  const [primaryAbility, setPrimaryAbility] = useState('STRENGTH');
  const [classSavingThrows, setClassSavingThrows] = useState<string[]>(['STRENGTH', 'CONSTITUTION']);
  const [spellcastingType, setSpellcastingType] = useState('NONE');
  const [classSpellPrepType, setClassSpellPrepType] = useState<'NONE' | 'PREPARED' | 'KNOWN'>('NONE');
  const [subclassLevel, setSubclassLevel] = useState(3);
  const [parentArchetypeId, setParentArchetypeId] = useState('');
  const [progressionFeats, setProgressionFeats] = useState<DraftProgressionFeat[]>([]);
  const [lineageFeats, setLineageFeats] = useState<DraftProgressionFeat[]>([]);
  const [catalogFeats, setCatalogFeats] = useState<Feat[]>([]);

  // Lineages
  const [speed, setSpeed] = useState(30);
  const [size, setSize] = useState('MEDIUM');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: classes2024 = [] } = useReferenceClasses('SRD_2024');
  const { data: classes2014 = [] } = useReferenceClasses('SRD_2014');
  const { data: classesHb = [] } = useReferenceClasses('HOMEBREW');

  const availableParentClasses = useMemo(() => {
    const seen = new Set<string>();
    return [...classes2024, ...classes2014, ...classesHb].filter((c) => {
      if (!c?.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }, [classes2024, classes2014, classesHb]);

  useEffect(() => {
    if (!parentArchetypeId && availableParentClasses.length > 0) {
      setParentArchetypeId(availableParentClasses[0].id);
    }
  }, [availableParentClasses, parentArchetypeId]);

  useEffect(() => {
    if (!open || (activeCategory !== 'classes' && activeCategory !== 'subclasses')) return;
    let active = true;
    Promise.all([
      fetchFeats({ ruleset: 'SRD_2024', limit: 100 }).catch(() => ({ items: [] })),
      fetchFeats({ ruleset: 'HOMEBREW', limit: 100 }).catch(() => ({ items: [] })),
    ]).then(([srdPage, hbPage]) => {
      if (!active) return;
      const seen = new Set<string>();
      const list = [...(hbPage?.items || []), ...(srdPage?.items || [])].filter((f) => {
        if (!f?.id || seen.has(f.id)) return false;
        seen.add(f.id);
        return true;
      });
      setCatalogFeats(list);
    });
    return () => {
      active = false;
    };
  }, [open, activeCategory]);

  const spellMutation = useCreateHomebrewSpell();
  const featMutation = useCreateHomebrewFeat();
  const itemMutation = useCreateHomebrewItem();
  const classMutation = useCreateHomebrewClass();
  const subclassMutation = useCreateHomebrewSubclass();
  const lineageMutation = useCreateHomebrewLineage();

  const isPending =
    spellMutation.isPending ||
    featMutation.isPending ||
    itemMutation.isPending ||
    classMutation.isPending ||
    subclassMutation.isPending ||
    lineageMutation.isPending;

  if (!open) return null;

  const categoryTitles: Record<HomebrewCategory, string> = {
    spells: 'Criar Nova Magia Homebrew',
    feats: 'Criar Novo Talento Homebrew',
    items: 'Criar Novo Item Homebrew',
    classes: 'Criar Nova Classe Homebrew',
    subclasses: 'Criar Nova Subclasse Homebrew',
    lineages: 'Criar Nova Linhagem Homebrew',
  };

  const categoryTabs: { id: HomebrewCategory; label: string }[] = [
    { id: 'spells', label: 'Magia' },
    { id: 'feats', label: 'Talento' },
    { id: 'items', label: 'Item' },
    { id: 'classes', label: 'Classe' },
    { id: 'subclasses', label: 'Subclasse' },
    { id: 'lineages', label: 'Linhagem' },
  ];

  const toggleWeaponProperty = (prop: string) => {
    setWeaponProps((prev) =>
      prev.includes(prop) ? prev.filter((p) => p !== prop) : [...prev, prop]
    );
  };

  const addDraftProgressionFeat = () => {
    setProgressionFeats((prev) => [
      ...prev,
      {
        unlockLevel: activeCategory === 'subclasses' ? 3 : 1,
        mode: 'INLINE',
        featId: catalogFeats[0]?.id || '',
        name: '',
        description: '',
        acBonus: 0,
        hpPerLevelBonus: 0,
      },
    ]);
  };

  const updateDraftProgressionFeat = (
    idx: number,
    patch: Partial<DraftProgressionFeat>
  ) => {
    setProgressionFeats((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const removeDraftProgressionFeat = (idx: number) => {
    setProgressionFeats((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildProgressionFeatsPayload = (list: DraftProgressionFeat[] = progressionFeats): HomebrewProgressionFeatPayload[] => {
    return list
      .map((pf): HomebrewProgressionFeatPayload | null => {
        const lvl = Math.min(20, Math.max(1, Number(pf.unlockLevel) || 1));
        if (pf.mode === 'EXISTING' && pf.featId) {
          return {
            unlockLevel: lvl,
            featId: pf.featId,
          };
        }
        if (pf.name.trim()) {
          const hasEffects = pf.acBonus !== 0 || pf.hpPerLevelBonus !== 0;
          return {
            unlockLevel: lvl,
            name: pf.name.trim(),
            description: pf.description.trim() || pf.name.trim(),
            mechanicalEffects: hasEffects
              ? {
                  acBonus: pf.acBonus || undefined,
                  hpPerLevelBonus: pf.hpPerLevelBonus || undefined,
                }
              : undefined,
          };
        }
        return null;
      })
      .filter((x): x is HomebrewProgressionFeatPayload => x !== null);
  };

  const addWeaponDamageRoll = () => {
    setWeaponDamageRolls((prev) => [
      ...prev,
      { diceCount: 1, diceType: 6, damageType: 'FIRE', bonusModifier: 0, conditional: true, conditionNote: '' },
    ]);
  };

  const updateWeaponDamageRoll = (idx: number, patch: Partial<DamageRollDraft>) => {
    setWeaponDamageRolls((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  };

  const removeWeaponDamageRoll = (idx: number) => {
    setWeaponDamageRolls((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSpellDamageRoll = () => {
    setSpellDamageRolls((prev) => [
      ...prev,
      { diceCount: 1, diceType: 8, damageType: 'FORCE', bonusModifier: 0, conditional: false, conditionNote: '' },
    ]);
  };

  const updateSpellDamageRoll = (idx: number, patch: Partial<DamageRollDraft>) => {
    setSpellDamageRolls((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, ...patch } : r))
    );
  };

  const removeSpellDamageRoll = (idx: number) => {
    setSpellDamageRolls((prev) => prev.filter((_, i) => i !== idx));
  };

  const addFeatPrerequisite = () => {
    setFeatPrerequisiteRules((prev) => [
      ...prev,
      { type: 'ABILITY_SCORE', targetKey: 'STRENGTH', minValue: 13, displayLabel: 'Força 13+' },
    ]);
  };

  const updateFeatPrerequisite = (idx: number, patch: Partial<PrerequisiteDraft>) => {
    setFeatPrerequisiteRules((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    );
  };

  const removeFeatPrerequisite = (idx: number) => {
    setFeatPrerequisiteRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const addLineageFeat = () => {
    setLineageFeats((prev) => [
      ...prev,
      {
        unlockLevel: 1,
        mode: 'INLINE',
        featId: catalogFeats[0]?.id || '',
        name: '',
        description: '',
        acBonus: 0,
        hpPerLevelBonus: 0,
      },
    ]);
  };

  const updateLineageFeat = (idx: number, patch: Partial<DraftProgressionFeat>) => {
    setLineageFeats((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const removeLineageFeat = (idx: number) => {
    setLineageFeats((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleClassSavingThrow = (ability: string) => {
    setClassSavingThrows((prev) =>
      prev.includes(ability) ? prev.filter((a) => a !== ability) : [...prev, ability]
    );
  };

  const toggleFeatAllowedAbility = (ability: string) => {
    setFeatAllowedAbilities((prev) =>
      prev.includes(ability) ? prev.filter((a) => a !== ability) : [...prev, ability]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('O nome é obrigatório.');
      return;
    }
    if (!description.trim() && activeCategory !== 'classes') {
      setErrorMsg('A descrição é obrigatória.');
      return;
    }

    try {
      if (activeCategory === 'spells') {
        const compParts: string[] = [];
        if (compV) compParts.push('V');
        if (compS) compParts.push('S');
        if (compM) compParts.push(compMDescription.trim() ? `M (${compMDescription.trim()})` : 'M');
        const calculatedComponents = compParts.join(', ') || 'Nenhum';

        const calculatedCastingTime =
          castingTimeUnit === 'reação' && castingTimeReactionTrigger.trim()
            ? `1 Reação, ${castingTimeReactionTrigger.trim()}`
            : `${castingTimeValue} ${castingTimeUnit}`.toLowerCase();

        let calculatedRange = 'Pessoal';
        if (rangeType === 'DISTANCE') {
          calculatedRange = `${rangeValue} ${rangeUnit}`;
        } else if (rangeType === 'TOUCH') {
          calculatedRange = 'Toque';
        } else if (rangeType === 'SIGHT') {
          calculatedRange = 'Linha de Visão';
        }

        let calculatedDuration = 'Instantânea';
        if (!durationIsInstant) {
          const timeStr = `${durationValue} ${durationUnit}`;
          calculatedDuration = durationConcentration ? `Concentração, até ${timeStr}` : timeStr;
        }

        const spellMechanics = spellDamageRolls.length > 0 ? {
          damageRolls: spellDamageRolls.map((r) => ({
            diceCount: Math.max(1, r.diceCount),
            diceType: r.diceType,
            damageType: r.damageType,
            bonusModifier: r.bonusModifier || 0,
            conditional: r.conditional,
            conditionNote: r.conditionNote.trim() || undefined,
          })),
        } : undefined;

        await spellMutation.mutateAsync({
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          level,
          school,
          castingTime: calculatedCastingTime,
          rangeArea: calculatedRange,
          components: calculatedComponents,
          duration: calculatedDuration,
          description: description.trim(),
          mechanicalProperties: spellMechanics,
        });
        toast.success('Magia Homebrew criada com sucesso!');
      } else if (activeCategory === 'feats') {
        const abilityBonuses: Record<string, number> = {};
        let abilityBonusChoice: any = undefined;

        if (featAbilityMode === 'FIXED' && featBonusAbility && featBonusAmount > 0) {
          abilityBonuses[featBonusAbility] = featBonusAmount;
        } else if (featAbilityMode === 'CHOICE' && featAllowedAbilities.length > 0) {
          abilityBonusChoice = {
            chooseCount: Math.max(1, featChooseCount),
            allowedAbilities: featAllowedAbilities,
            bonusAmount: Math.max(1, featBonusAmount),
          };
        }

        const hasMechanicalEffects =
          Object.keys(abilityBonuses).length > 0 ||
          abilityBonusChoice !== undefined ||
          featAcBonus !== 0 ||
          featInitBonus !== 0 ||
          featSpeedBonus !== 0 ||
          featHpPerLevelBonus !== 0 ||
          featGrantsAction ||
          featIsConditional ||
          featPrerequisiteRules.length > 0;

        let finalPrerequisites = prerequisites.trim();
        if (!finalPrerequisites && featPrerequisiteRules.length > 0) {
          finalPrerequisites = featPrerequisiteRules.map((r) => r.displayLabel).join(', ');
        }

        await featMutation.mutateAsync({
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          prerequisites: finalPrerequisites || undefined,
          description: description.trim(),
          featType,
          mechanicalEffects: hasMechanicalEffects
            ? {
                abilityBonuses:
                  Object.keys(abilityBonuses).length > 0 ? abilityBonuses : undefined,
                abilityBonusChoice,
                acBonus: featAcBonus || undefined,
                initiativeBonus: featInitBonus || undefined,
                speedBonus: featSpeedBonus || undefined,
                hpPerLevelBonus: featHpPerLevelBonus || undefined,
                grantsAction: featGrantsAction || undefined,
                actionType: featGrantsAction ? featActionType : undefined,
                actionName: featGrantsAction ? name.trim() : undefined,
                actionDescription: featGrantsAction ? description.trim() : undefined,
                maxUses: featGrantsAction ? featMaxUses : undefined,
                rechargeOn: featGrantsAction ? featRechargeOn : undefined,
                conditional: featIsConditional || undefined,
                conditionDescription: featIsConditional ? featConditionDesc.trim() || undefined : undefined,
                prerequisiteRules: featPrerequisiteRules.length > 0 ? featPrerequisiteRules : undefined,
              }
            : undefined,
        });
        toast.success('Talento Homebrew criado com sucesso!');
      } else if (activeCategory === 'items') {
        let mechanicalProperties: any = undefined;
        if (itemCategory === 'WEAPON') {
          mechanicalProperties = {
            damageRolls: weaponDamageRolls.map((r) => ({
              diceCount: Math.max(1, r.diceCount),
              diceType: r.diceType,
              damageType: r.damageType,
              bonusModifier: r.bonusModifier || 0,
              conditional: r.conditional,
              conditionNote: r.conditionNote.trim() || undefined,
            })),
            weaponProperties: weaponProps,
            versatileDice: weaponVersatileDice.trim() || undefined,
            magicBonus: weaponMagicBonus || undefined,
          };
        } else if (itemCategory === 'ARMOR') {
          mechanicalProperties = {
            armorCategory,
            baseAc: armorBaseAc,
            magicBonus: armorMagicBonus || undefined,
            strengthRequirement: armorStrReq > 0 ? armorStrReq : undefined,
            stealthDisadvantage: armorStealthDisadv,
          };
        } else if (itemCategory === 'CONSUMABLE') {
          mechanicalProperties = {
            effectType: consumableEffectType,
            diceFormula: consumableDiceFormula.trim() || undefined,
          };
        }

        const coinParts: string[] = [];
        if (itemCostPp > 0) coinParts.push(`${itemCostPp} pl`);
        if (itemCostGp > 0) coinParts.push(`${itemCostGp} po`);
        if (itemCostEp > 0) coinParts.push(`${itemCostEp} pe`);
        if (itemCostSp > 0) coinParts.push(`${itemCostSp} pp`);
        if (itemCostCp > 0) coinParts.push(`${itemCostCp} pc`);
        const coinCost = coinParts.join(', ');
        const finalCost = coinCost || cost.trim() || undefined;

        await itemMutation.mutateAsync({
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          itemCategory,
          itemType,
          rarity,
          attunement,
          cost: finalCost,
          weight: weight.trim() || undefined,
          description: description.trim(),
          mechanicalProperties,
        });
        toast.success('Item Homebrew criado com sucesso!');
      } else if (activeCategory === 'classes') {
        await classMutation.mutateAsync({
          name: name.trim(),
          hitDice,
          primaryAbility,
          savingThrowProficiencies: classSavingThrows.length > 0
            ? classSavingThrows
            : ['STRENGTH', 'CONSTITUTION'],
          spellcastingType,
          spellPreparationType: classSpellPrepType,
          subclassLevel: Math.min(20, Math.max(1, subclassLevel)),
          progressionFeats: buildProgressionFeatsPayload(progressionFeats),
        });
        toast.success('Classe Homebrew criada com sucesso!');
      } else if (activeCategory === 'subclasses') {
        if (!parentArchetypeId) {
          setErrorMsg('Selecione a classe principal desta subclasse.');
          return;
        }
        await subclassMutation.mutateAsync({
          archetypeId: parentArchetypeId,
          name: name.trim(),
          nameEn: nameEn.trim() || undefined,
          description: description.trim(),
          progressionFeats: buildProgressionFeatsPayload(progressionFeats),
        });
        toast.success('Subclasse Homebrew criada com sucesso!');
      } else if (activeCategory === 'lineages') {
        await lineageMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          speed,
          size,
          inlineFeats: buildProgressionFeatsPayload(lineageFeats),
        });
        toast.success('Linhagem Homebrew criada com sucesso!');
      }

      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao criar conteúdo Homebrew.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      <Card className="relative z-10 w-full max-w-2xl bg-slate-950 border border-amber-900/40 shadow-2xl text-amber-50 my-auto">
        <CardHeader className="space-y-3 border-b border-amber-950/40 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <CardTitle className="text-xl font-serif tracking-wide text-amber-200">
                {categoryTitles[activeCategory]}
              </CardTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-slate-400 hover:text-amber-100 transition-colors p-1"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 6 Category Switcher Tabs */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`homebrew-tab-${tab.id}`}
                onClick={() => setActiveCategory(tab.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                  activeCategory === tab.id
                    ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-amber-800/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Conteúdos criados recebem o selo{' '}
            <span className="text-amber-400 font-semibold">HOMEBREW</span> e integram-se
            automaticamente às fichas de personagem.
          </p>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4 max-h-[65vh] overflow-y-auto pr-2">
            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded flex items-center gap-2 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nome (pt-BR) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Raio Purpúreo"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Nome em Inglês
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="Ex: Shadow Blade"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Categoria: Magias */}
            {activeCategory === 'spells' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Círculo (0-9) *
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500"
                    >
                      <option value={0}>Truque (0)</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}º Círculo
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Escola *
                    </label>
                    <select
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500"
                    >
                      {[
                        'Abjuração',
                        'Adivinhação',
                        'Conjuração',
                        'Encantamento',
                        'Evocação',
                        'Ilusão',
                        'Necromancia',
                        'Transmutação',
                      ].map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Tempo de Conjuração
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={1}
                        value={castingTimeValue}
                        onChange={(e) => setCastingTimeValue(Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-sm text-amber-50"
                      />
                      <select
                        value={castingTimeUnit}
                        onChange={(e) => setCastingTimeUnit(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-2 text-sm text-amber-50"
                      >
                        <option value="ação">Ação Padrão</option>
                        <option value="ação bônus">Ação Bônus</option>
                        <option value="reação">Reação</option>
                        <option value="minuto(s)">Minuto(s)</option>
                        <option value="hora(s)">Hora(s)</option>
                      </select>
                    </div>
                    {castingTimeUnit === 'reação' && (
                      <input
                        type="text"
                        placeholder="Gatilho da reação (ex: ao sofrer dano)"
                        value={castingTimeReactionTrigger}
                        onChange={(e) => setCastingTimeReactionTrigger(e.target.value)}
                        className="w-full mt-1.5 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-amber-50"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Alcance / Área
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={rangeType}
                        onChange={(e) => setRangeType(e.target.value as any)}
                        className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-amber-50"
                      >
                        <option value="DISTANCE">Distância</option>
                        <option value="TOUCH">Toque</option>
                        <option value="SELF">Pessoal</option>
                        <option value="SIGHT">Visão</option>
                      </select>
                      {rangeType === 'DISTANCE' && (
                        <>
                          <input
                            type="number"
                            min={0}
                            value={rangeValue}
                            onChange={(e) => setRangeValue(Number(e.target.value) || 0)}
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-amber-50"
                          />
                          <select
                            value={rangeUnit}
                            onChange={(e) => setRangeUnit(e.target.value)}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-amber-50"
                          >
                            <option value="metros">Metros</option>
                            <option value="pés">Pés</option>
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Componentes
                  </label>
                  <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-2.5 rounded">
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compV}
                        onChange={(e) => setCompV(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      V (Verbal)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compS}
                        onChange={(e) => setCompS(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      S (Somático)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compM}
                        onChange={(e) => setCompM(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      M (Material)
                    </label>
                  </div>
                  {compM && (
                    <input
                      type="text"
                      placeholder="Descrição do material (ex: pó de diamante no valor de 50 po)"
                      value={compMDescription}
                      onChange={(e) => setCompMDescription(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-amber-50"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Duração
                  </label>
                  <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800 p-2.5 rounded">
                    <label className="flex items-center gap-1.5 text-xs text-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={durationIsInstant}
                        onChange={(e) => setDurationIsInstant(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      Instantânea
                    </label>
                    {!durationIsInstant && (
                      <>
                        <input
                          type="number"
                          min={1}
                          value={durationValue}
                          onChange={(e) => setDurationValue(Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                        />
                        <select
                          value={durationUnit}
                          onChange={(e) => setDurationUnit(e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                        >
                          <option value="rodada(s)">Rodada(s)</option>
                          <option value="minuto(s)">Minuto(s)</option>
                          <option value="hora(s)">Hora(s)</option>
                          <option value="dia(s)">Dia(s)</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-xs text-amber-300 cursor-pointer ml-2">
                          <input
                            type="checkbox"
                            checked={durationConcentration}
                            onChange={(e) => setDurationConcentration(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-950 text-amber-500"
                          />
                          Concentração
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Efeitos Mecânicos / Dados de Dano da Magia */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                      Dados de Dano / Efeitos Mecânicos da Magia (Opcional)
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addSpellDamageRoll}
                      className="h-6 text-[11px] border-amber-700/50 text-amber-200 bg-slate-950 hover:bg-slate-800"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Dano
                    </Button>
                  </div>
                  {spellDamageRolls.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Nenhum dado de dano incremental adicionado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {spellDamageRolls.map((roll, rIdx) => (
                        <div key={rIdx} className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-400">Qtd Dados</label>
                              <input
                                type="number"
                                min={1}
                                value={roll.diceCount}
                                onChange={(e) => updateSpellDamageRoll(rIdx, { diceCount: Math.max(1, Number(e.target.value) || 1) })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400">Dado</label>
                              <select
                                value={roll.diceType}
                                onChange={(e) => updateSpellDamageRoll(rIdx, { diceType: Number(e.target.value) })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                              >
                                {[4, 6, 8, 10, 12].map((d) => (
                                  <option key={d} value={d}>d{d}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400">Tipo de Dano</label>
                              <select
                                value={roll.damageType}
                                onChange={(e) => updateSpellDamageRoll(rIdx, { damageType: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                              >
                                {DAMAGE_TYPES.map((dt) => (
                                  <option key={dt} value={dt}>{dt}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end justify-between">
                              <label className="flex items-center gap-1.5 text-xs text-amber-200 cursor-pointer mb-1">
                                <input
                                  type="checkbox"
                                  checked={roll.conditional}
                                  onChange={(e) => updateSpellDamageRoll(rIdx, { conditional: e.target.checked })}
                                  className="rounded border-slate-700 bg-slate-900 text-amber-500"
                                />
                                Condicional
                              </label>
                              <button
                                type="button"
                                onClick={() => removeSpellDamageRoll(rIdx)}
                                className="text-red-400 hover:text-red-300 p-1 mb-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {roll.conditional && (
                            <input
                              type="text"
                              placeholder="Condição (ex: se o alvo estiver molhado ou falhar por 5+)"
                              value={roll.conditionNote}
                              onChange={(e) => updateSpellDamageRoll(rIdx, { conditionNote: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Categoria: Talentos (com Efeitos Mecânicos e Pré-requisitos Avançados) */}
            {activeCategory === 'feats' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Categoria do Talento *
                    </label>
                    <select
                      data-testid="feat-type-select"
                      value={featType}
                      onChange={(e) => setFeatType(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    >
                      <option value="GENERAL">Geral (Nível 4+)</option>
                      <option value="ORIGIN">Origem (Antecedente 2024)</option>
                      <option value="CLASS">Característica de Classe</option>
                      <option value="SUBCLASS">Característica de Subclasse</option>
                      <option value="LINEAGE">Traço de Linhagem</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Texto de Pré-requisito (Resumo)
                    </label>
                    <input
                      type="text"
                      value={prerequisites}
                      onChange={(e) => setPrerequisites(e.target.value)}
                      placeholder="Ex: Força 13+ ou Nível 4 (preenchido auto se adicionar regras)"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    />
                  </div>
                </div>

                {/* Construtor Dinâmico de Pré-requisitos Hard Dependencies */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                        Regras de Pré-requisito (Dependências Rígidas)
                      </span>
                      <p className="text-[10px] text-slate-400">
                        Adicione dependências de atributos, classe, linhagem ou talentos anteriores.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addFeatPrerequisite}
                      className="h-6 text-[11px] border-amber-700/50 text-amber-200 bg-slate-950 hover:bg-slate-800"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Regra
                    </Button>
                  </div>

                  {featPrerequisiteRules.length > 0 && (
                    <div className="space-y-2">
                      {featPrerequisiteRules.map((rule, pIdx) => (
                        <div key={pIdx} className="p-2 rounded bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                          <select
                            value={rule.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              updateFeatPrerequisite(pIdx, {
                                type: newType,
                                targetKey: newType === 'CLASS' ? (availableParentClasses[0]?.id || '') : (newType === 'FEAT' ? (catalogFeats[0]?.id || '') : 'STRENGTH'),
                                minValue: newType === 'ABILITY_SCORE' ? 13 : (newType === 'LEVEL' ? 4 : undefined),
                                displayLabel: newType === 'ABILITY_SCORE' ? 'Força 13+' : newType,
                              });
                            }}
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-200 text-xs"
                          >
                            <option value="ABILITY_SCORE">Atributo Mínimo</option>
                            <option value="CLASS">Classe Exigida</option>
                            <option value="LINEAGE">Linhagem Exigida</option>
                            <option value="FEAT">Talento Pré-requisito</option>
                            <option value="LEVEL">Nível Mínimo</option>
                          </select>

                          {rule.type === 'ABILITY_SCORE' && (
                            <>
                              <select
                                value={rule.targetKey}
                                onChange={(e) => {
                                  const key = e.target.value;
                                  updateFeatPrerequisite(pIdx, {
                                    targetKey: key,
                                    displayLabel: `${key} ${rule.minValue || 13}+`,
                                  });
                                }}
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-50 text-xs"
                              >
                                <option value="STRENGTH">Força</option>
                                <option value="DEXTERITY">Destreza</option>
                                <option value="CONSTITUTION">Constituição</option>
                                <option value="INTELLIGENCE">Inteligência</option>
                                <option value="WISDOM">Sabedoria</option>
                                <option value="CHARISMA">Carisma</option>
                              </select>
                              <input
                                type="number"
                                min={1}
                                max={30}
                                value={rule.minValue || 13}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 1;
                                  updateFeatPrerequisite(pIdx, {
                                    minValue: val,
                                    displayLabel: `${rule.targetKey} ${val}+`,
                                  });
                                }}
                                className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-50 text-xs"
                              />
                            </>
                          )}

                          {rule.type === 'CLASS' && (
                            <select
                              value={rule.targetKey}
                              onChange={(e) => {
                                const cls = availableParentClasses.find((c) => c.id === e.target.value);
                                updateFeatPrerequisite(pIdx, {
                                  targetKey: e.target.value,
                                  displayLabel: `Classe: ${cls?.name || 'Classe'}`,
                                });
                              }}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-50 text-xs max-w-[200px]"
                            >
                              {availableParentClasses.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                  {cls.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {rule.type === 'LINEAGE' && (
                            <input
                              type="text"
                              placeholder="Nome da Linhagem (ex: Elfo)"
                              value={rule.targetKey}
                              onChange={(e) =>
                                updateFeatPrerequisite(pIdx, {
                                  targetKey: e.target.value,
                                  displayLabel: `Linhagem: ${e.target.value}`,
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-50 text-xs"
                            />
                          )}

                          {rule.type === 'FEAT' && (
                            <select
                              value={rule.targetKey}
                              onChange={(e) => {
                                const f = catalogFeats.find((feat) => feat.id === e.target.value);
                                updateFeatPrerequisite(pIdx, {
                                  targetKey: e.target.value,
                                  displayLabel: `Talento: ${f?.name || 'Talento'}`,
                                });
                              }}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-50 text-xs max-w-[200px]"
                            >
                              {catalogFeats.map((feat) => (
                                <option key={feat.id} value={feat.id}>
                                  {feat.name}
                                </option>
                              ))}
                            </select>
                          )}

                          {rule.type === 'LEVEL' && (
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={rule.minValue || 4}
                              onChange={(e) => {
                                const lvl = Number(e.target.value) || 1;
                                updateFeatPrerequisite(pIdx, {
                                  minValue: lvl,
                                  displayLabel: `Nível ${lvl}+`,
                                });
                              }}
                              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-50 text-xs"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => removeFeatPrerequisite(pIdx)}
                            className="text-red-400 hover:text-red-300 ml-auto p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mechanical Effects Sub-form */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-900/30 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                    Propriedades Mecânicas (Opcional)
                  </span>

                  {/* Configuração de Bônus de Atributo: Nenhum, Fixo ou Escolha */}
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-2">
                    <label className="block text-[11px] font-semibold text-amber-200">
                      Modo de Bônus de Atributo
                    </label>
                    <div className="flex gap-4 text-xs text-slate-300">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="featAbilityMode"
                          checked={featAbilityMode === 'NONE'}
                          onChange={() => setFeatAbilityMode('NONE')}
                          className="text-amber-500 bg-slate-900 border-slate-700"
                        />
                        Nenhum
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="featAbilityMode"
                          checked={featAbilityMode === 'FIXED'}
                          onChange={() => setFeatAbilityMode('FIXED')}
                          className="text-amber-500 bg-slate-900 border-slate-700"
                        />
                        Atributo Fixo
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="featAbilityMode"
                          checked={featAbilityMode === 'CHOICE'}
                          onChange={() => setFeatAbilityMode('CHOICE')}
                          className="text-amber-500 bg-slate-900 border-slate-700"
                        />
                        Escolha 1 entre Opções
                      </label>
                    </div>

                    {featAbilityMode === 'FIXED' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] text-slate-400">Atributo</label>
                          <select
                            value={featBonusAbility}
                            onChange={(e) => setFeatBonusAbility(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                          >
                            <option value="STRENGTH">Força</option>
                            <option value="DEXTERITY">Destreza</option>
                            <option value="CONSTITUTION">Constituição</option>
                            <option value="INTELLIGENCE">Inteligência</option>
                            <option value="WISDOM">Sabedoria</option>
                            <option value="CHARISMA">Carisma</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400">Valor do Bônus</label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={featBonusAmount}
                            onChange={(e) => setFeatBonusAmount(Number(e.target.value) || 1)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                          />
                        </div>
                      </div>
                    )}

                    {featAbilityMode === 'CHOICE' && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-slate-400">Escolha</label>
                          <input
                            type="number"
                            min={1}
                            max={3}
                            value={featChooseCount}
                            onChange={(e) => setFeatChooseCount(Math.max(1, Number(e.target.value) || 1))}
                            className="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-amber-50"
                          />
                          <span className="text-[10px] text-slate-400">entre os atributos marcados:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { key: 'STRENGTH', label: 'FOR' },
                            { key: 'DEXTERITY', label: 'DES' },
                            { key: 'CONSTITUTION', label: 'CON' },
                            { key: 'INTELLIGENCE', label: 'INT' },
                            { key: 'WISDOM', label: 'SAB' },
                            { key: 'CHARISMA', label: 'CAR' },
                          ].map((ab) => {
                            const active = featAllowedAbilities.includes(ab.key);
                            return (
                              <button
                                key={ab.key}
                                type="button"
                                onClick={() => toggleFeatAllowedAbility(ab.key)}
                                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${
                                  active
                                    ? 'border-amber-500 bg-amber-500/25 text-amber-200'
                                    : 'border-slate-800 bg-slate-900 text-slate-400'
                                }`}
                              >
                                {ab.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Bônus na CA
                      </label>
                      <input
                        type="number"
                        value={featAcBonus}
                        onChange={(e) => setFeatAcBonus(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        PV por Nível (Ex: Durão +2)
                      </label>
                      <input
                        type="number"
                        value={featHpPerLevelBonus}
                        onChange={(e) => setFeatHpPerLevelBonus(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Bônus de Iniciativa
                      </label>
                      <input
                        type="number"
                        value={featInitBonus}
                        onChange={(e) => setFeatInitBonus(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Bônus Deslocamento (pés)
                      </label>
                      <input
                        type="number"
                        value={featSpeedBonus}
                        onChange={(e) => setFeatSpeedBonus(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                      />
                    </div>
                  </div>

                  {/* Flag de Condicional no Talento */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <label className="flex items-center gap-2 text-xs text-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featIsConditional}
                        onChange={(e) => setFeatIsConditional(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      Bônus ou Efeito Mecânico é Condicional
                    </label>
                    {featIsConditional && (
                      <input
                        type="text"
                        placeholder="Descreva a condição (ex: Apenas em fúria ou com menos de 50% dos PV)"
                        value={featConditionDesc}
                        onChange={(e) => setFeatConditionDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                      />
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-2.5">
                    <label className="flex items-center gap-2 text-xs text-amber-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={featGrantsAction}
                        onChange={(e) => setFeatGrantsAction(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      Concede Ação Ativa ou Cargas de Uso na Ficha
                    </label>

                    {featGrantsAction && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Tipo de Ação
                          </label>
                          <select
                            value={featActionType}
                            onChange={(e) => setFeatActionType(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                          >
                            <option value="ACTION">Ação Padrão</option>
                            <option value="BONUS_ACTION">Ação Bônus</option>
                            <option value="REACTION">Reação</option>
                            <option value="FREE">Livre</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Usos Máximos
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={featMaxUses}
                            onChange={(e) => setFeatMaxUses(Math.max(1, Number(e.target.value) || 1))}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Recarga
                          </label>
                          <select
                            value={featRechargeOn}
                            onChange={(e) => setFeatRechargeOn(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                          >
                            <option value="SHORT_REST">Descanso Curto</option>
                            <option value="LONG_REST">Descanso Longo</option>
                            <option value="NONE">Sem Recarga</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Categoria: Itens (com Propriedades Mecânicas dinâmicas) */}
            {activeCategory === 'items' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Categoria do Item *
                    </label>
                    <select
                      data-testid="homebrew-item-category-select"
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    >
                      <option value="WEAPON">Arma</option>
                      <option value="ARMOR">Armadura / Escudo / Veste</option>
                      <option value="CONSUMABLE">Consumível (Poção / Pergaminho)</option>
                      <option value="EQUIPMENT">Equipamento / Utilitário</option>
                      <option value="MAGIC">Item Mágico Geral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Subtipo do Item *
                    </label>
                    <input
                      type="text"
                      value={itemType}
                      onChange={(e) => setItemType(e.target.value)}
                      placeholder="Ex: Espada Longa, Armadura Leve"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    />
                  </div>
                </div>

                {/* Dynamic Weapon Mechanics com Suporte a Múltiplos Dados e Condicional */}
                {itemCategory === 'WEAPON' && (
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-900/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                        Dados de Dano da Arma
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addWeaponDamageRoll}
                        className="h-6 text-[11px] border-amber-700/50 text-amber-200 bg-slate-950 hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Adicionar Dado de Dano
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {weaponDamageRolls.map((roll, wIdx) => (
                        <div key={wIdx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-400">Qtd Dados</label>
                              <input
                                type="number"
                                min={1}
                                value={roll.diceCount}
                                onChange={(e) => updateWeaponDamageRoll(wIdx, { diceCount: Math.max(1, Number(e.target.value) || 1) })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400">Dado de Dano</label>
                              <select
                                value={roll.diceType}
                                onChange={(e) => updateWeaponDamageRoll(wIdx, { diceType: Number(e.target.value) })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                              >
                                {[4, 6, 8, 10, 12].map((d) => (
                                  <option key={d} value={d}>d{d}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400">Tipo de Dano</label>
                              <select
                                value={roll.damageType}
                                onChange={(e) => updateWeaponDamageRoll(wIdx, { damageType: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                              >
                                {DAMAGE_TYPES.map((dt) => (
                                  <option key={dt} value={dt}>{dt}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end justify-between">
                              <label className="flex items-center gap-1.5 text-xs text-amber-200 cursor-pointer mb-1">
                                <input
                                  type="checkbox"
                                  checked={roll.conditional}
                                  onChange={(e) => updateWeaponDamageRoll(wIdx, { conditional: e.target.checked })}
                                  className="rounded border-slate-700 bg-slate-900 text-amber-500"
                                />
                                Condicional
                              </label>
                              {wIdx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => removeWeaponDamageRoll(wIdx)}
                                  className="text-red-400 hover:text-red-300 p-1 mb-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {roll.conditional && (
                            <input
                              type="text"
                              placeholder="Condição do dano extra (ex: Quando a arma estiver acesa, ou alvo for morto-vivo)"
                              value={roll.conditionNote}
                              onChange={(e) => updateWeaponDamageRoll(wIdx, { conditionNote: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-amber-50"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Bônus Mágico (+0 a +3)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={weaponMagicBonus}
                          onChange={(e) => setWeaponMagicBonus(Number(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Dano Versátil (Opcional — Ex: 1d10)
                        </label>
                        <input
                          type="text"
                          value={weaponVersatileDice}
                          onChange={(e) => setWeaponVersatileDice(e.target.value)}
                          placeholder="Ex: 1d10"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="block text-[11px] text-slate-400 mb-1.5">
                        Propriedades da Arma (Acuidade usa DES, etc.)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {WEAPON_PROPERTIES.map((prop) => {
                          const active = weaponProps.includes(prop);
                          return (
                            <button
                              key={prop}
                              type="button"
                              onClick={() => toggleWeaponProperty(prop)}
                              className={`px-2 py-1 rounded text-[11px] font-mono border transition-all ${
                                active
                                  ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                                  : 'border-slate-800 bg-slate-950 text-slate-400'
                              }`}
                            >
                              {prop}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Armor Mechanics */}
                {itemCategory === 'ARMOR' && (
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-900/30 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                      Propriedades Mecânicas da Armadura / Escudo
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Categoria de Armadura
                        </label>
                        <select
                          data-testid="armor-category-select"
                          value={armorCategory}
                          onChange={(e) => setArmorCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                        >
                          <option value="LIGHT">Leve (+DES total)</option>
                          <option value="MEDIUM">Média (+DES máx. 2)</option>
                          <option value="HEAVY">Pesada (Sem DES)</option>
                          <option value="ROBE">Veste / Manto (+DES total)</option>
                          <option value="SHIELD">Escudo (+Bônus CA)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          CA Base (ou +2 p/ Escudo)
                        </label>
                        <input
                          type="number"
                          value={armorBaseAc}
                          onChange={(e) => setArmorBaseAc(Number(e.target.value) || 10)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Bônus Mágico (+0 a +3)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          value={armorMagicBonus}
                          onChange={(e) => setArmorMagicBonus(Number(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Req. Força
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={armorStrReq}
                          onChange={(e) => setArmorStrReq(Number(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={armorStealthDisadv}
                        onChange={(e) => setArmorStealthDisadv(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-500"
                      />
                      Impõe Desvantagem em Furtividade
                    </label>
                  </div>
                )}

                {/* Dynamic Consumable Mechanics */}
                {itemCategory === 'CONSUMABLE' && (
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-900/30 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                      Efeito do Consumível
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Tipo de Efeito
                        </label>
                        <select
                          value={consumableEffectType}
                          onChange={(e) => setConsumableEffectType(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                        >
                          <option value="HEAL">Cura de PV (HEAL)</option>
                          <option value="BUFF">Efeito / Buff</option>
                          <option value="DAMAGE">Dano</option>
                          <option value="UTILITY">Utilitário</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Fórmula de Dados (Ex: 2d4+2)
                        </label>
                        <input
                          type="text"
                          value={consumableDiceFormula}
                          onChange={(e) => setConsumableDiceFormula(e.target.value)}
                          placeholder="Ex: 2d4+2"
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-amber-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Raridade
                    </label>
                    <select
                      value={rarity}
                      onChange={(e) => setRarity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    >
                      <option value="NONE">Comum (Não mágica)</option>
                      <option value="COMMON">Comum</option>
                      <option value="UNCOMMON">Incomum</option>
                      <option value="RARE">Raro</option>
                      <option value="VERY_RARE">Muito Raro</option>
                      <option value="LEGENDARY">Lendário</option>
                      <option value="ARTIFACT">Artefato</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Peso
                    </label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Ex: 1,5 kg"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Custo (Moedas)
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="text-center space-y-1">
                      <span className="block text-xs text-amber-600 font-bold">PC (Cobre)</span>
                      <input
                        type="number"
                        min={0}
                        value={itemCostCp === 0 ? '' : itemCostCp}
                        placeholder="0"
                        onChange={(e) => setItemCostCp(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-center text-amber-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="block text-xs text-slate-400 font-bold">PP (Prata)</span>
                      <input
                        type="number"
                        min={0}
                        value={itemCostSp === 0 ? '' : itemCostSp}
                        placeholder="0"
                        onChange={(e) => setItemCostSp(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-center text-amber-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="block text-xs text-cyan-400 font-bold">PE (Electro)</span>
                      <input
                        type="number"
                        min={0}
                        value={itemCostEp === 0 ? '' : itemCostEp}
                        placeholder="0"
                        onChange={(e) => setItemCostEp(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-center text-amber-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="block text-xs text-amber-300 font-bold">PO (Ouro)</span>
                      <input
                        type="number"
                        min={0}
                        value={itemCostGp === 0 ? '' : itemCostGp}
                        placeholder="0"
                        onChange={(e) => setItemCostGp(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-amber-500/40 rounded px-2 py-1.5 text-sm text-center text-amber-200 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <span className="block text-xs text-violet-300 font-bold">PL (Platina)</span>
                      <input
                        type="number"
                        min={0}
                        value={itemCostPp === 0 ? '' : itemCostPp}
                        placeholder="0"
                        onChange={(e) => setItemCostPp(e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="w-full bg-slate-900 border border-violet-500/40 rounded px-2 py-1.5 text-sm text-center text-violet-200 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="attunement-cb"
                    checked={attunement}
                    onChange={(e) => setAttunement(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-600"
                  />
                  <label htmlFor="attunement-cb" className="text-sm text-slate-300 cursor-pointer">
                    Requer Sintonização
                  </label>
                </div>
              </div>
            )}

            {/* Categoria: Classes */}
            {activeCategory === 'classes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Dado de Vida *
                    </label>
                    <select
                      value={hitDice}
                      onChange={(e) => setHitDice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    >
                      <option value="D6">d6</option>
                      <option value="D8">d8</option>
                      <option value="D10">d10</option>
                      <option value="D12">d12</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Atributo Primário *
                    </label>
                    <select
                      value={primaryAbility}
                      onChange={(e) => setPrimaryAbility(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    >
                      <option value="STRENGTH">Força</option>
                      <option value="DEXTERITY">Destreza</option>
                      <option value="CONSTITUTION">Constituição</option>
                      <option value="INTELLIGENCE">Inteligência</option>
                      <option value="WISDOM">Sabedoria</option>
                      <option value="CHARISMA">Carisma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Nível da Subclasse *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={subclassLevel}
                      onChange={(e) => setSubclassLevel(Math.min(20, Math.max(1, Number(e.target.value) || 3)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      Salvaguardas de Resistência com Proficiência *
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { key: 'STRENGTH', label: 'Força' },
                        { key: 'DEXTERITY', label: 'Destreza' },
                        { key: 'CONSTITUTION', label: 'Constituição' },
                        { key: 'INTELLIGENCE', label: 'Inteligência' },
                        { key: 'WISDOM', label: 'Sabedoria' },
                        { key: 'CHARISMA', label: 'Carisma' },
                      ].map((ab) => {
                        const active = classSavingThrows.includes(ab.key);
                        return (
                          <button
                            key={ab.key}
                            type="button"
                            onClick={() => toggleClassSavingThrow(ab.key)}
                            className={`px-3 py-1 rounded text-xs font-semibold border transition-all ${
                              active
                                ? 'border-amber-500 bg-amber-500/25 text-amber-200'
                                : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {ab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Progressão de Conjuração
                      </label>
                      <select
                        value={spellcastingType}
                        onChange={(e) => setSpellcastingType(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                      >
                        <option value="NONE">Sem Conjuração (NONE)</option>
                        <option value="FULL">Conjurador Completo (FULL)</option>
                        <option value="HALF">Meio-Conjurador (HALF)</option>
                        <option value="PACT">Magia de Pacto (PACT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Tipo de Preparação de Magias
                      </label>
                      <select
                        value={classSpellPrepType}
                        onChange={(e) => setClassSpellPrepType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                      >
                        <option value="NONE">Nenhum / Não Prepara</option>
                        <option value="PREPARED">Magias Preparadas (Clérigo/Mago/Druida)</option>
                        <option value="KNOWN">Magias Conhecidas (Bardo/Feiticeiro/Bruxo)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Categoria: Subclasses */}
            {activeCategory === 'subclasses' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Classe Principal Associada *
                </label>
                <select
                  data-testid="subclass-parent-class-select"
                  value={parentArchetypeId}
                  onChange={(e) => setParentArchetypeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                >
                  {availableParentClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.ruleset === 'HOMEBREW' ? 'Homebrew' : cls.ruleset})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Hybrid Progression Builder (Levels 1-20) for Classes & Subclasses */}
            {(activeCategory === 'classes' || activeCategory === 'subclasses') && (
              <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                      Características de Progressão (Níveis 1 a 20)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Crie habilidades novas inline ou vincule talentos existentes do catálogo.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid="add-progression-feat-button"
                    onClick={addDraftProgressionFeat}
                    className="h-7 text-xs border-amber-700/50 text-amber-200 bg-slate-950 hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar Característica
                  </Button>
                </div>

                {progressionFeats.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Nenhuma característica de nível adicionada ainda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {progressionFeats.map((pf, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-amber-200 font-semibold">
                              Nível:
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={pf.unlockLevel}
                              onChange={(e) =>
                                updateDraftProgressionFeat(idx, {
                                  unlockLevel: Math.min(20, Math.max(1, Number(e.target.value) || 1)),
                                })
                              }
                              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50 font-mono"
                            />
                            <select
                              value={pf.mode}
                              onChange={(e) =>
                                updateDraftProgressionFeat(idx, {
                                  mode: e.target.value as 'INLINE' | 'EXISTING',
                                })
                              }
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-200"
                            >
                              <option value="INLINE">Criar Nova Inline</option>
                              <option value="EXISTING">Vincular do Catálogo</option>
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDraftProgressionFeat(idx)}
                            className="text-red-400 hover:text-red-300 p-1"
                            aria-label="Remover característica"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {pf.mode === 'EXISTING' ? (
                          <select
                            value={pf.featId}
                            onChange={(e) =>
                              updateDraftProgressionFeat(idx, { featId: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                          >
                            {catalogFeats.map((cf) => (
                              <option key={cf.id} value={cf.id}>
                                {cf.name} ({cf.ruleset})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Nome da Característica (Ex: Ataque Extra)"
                              value={pf.name}
                              onChange={(e) =>
                                updateDraftProgressionFeat(idx, { name: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                            />
                            <textarea
                              rows={2}
                              placeholder="Descrição e efeito no nível..."
                              value={pf.description}
                              onChange={(e) =>
                                updateDraftProgressionFeat(idx, { description: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-slate-400">
                                  Bônus CA Passivo (Opcional)
                                </label>
                                <input
                                  type="number"
                                  value={pf.acBonus}
                                  onChange={(e) =>
                                    updateDraftProgressionFeat(idx, {
                                      acBonus: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400">
                                  PV Extra por Nível (Opcional)
                                </label>
                                <input
                                  type="number"
                                  value={pf.hpPerLevelBonus}
                                  onChange={(e) =>
                                    updateDraftProgressionFeat(idx, {
                                      hpPerLevelBonus: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Categoria: Linhagens */}
            {activeCategory === 'lineages' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Deslocamento (metros/pés)
                    </label>
                    <input
                      type="number"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Tamanho
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50"
                    >
                      <option value="SMALL">Pequeno</option>
                      <option value="MEDIUM">Médio</option>
                      <option value="LARGE">Grande</option>
                    </select>
                  </div>
                </div>

                {/* Inline Traits / Feats Builder for Lineages */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-amber-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block">
                        Traços e Talentos de Linhagem Inline
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Adicione traços raciais únicos ou vincule do catálogo existente.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addLineageFeat}
                      className="h-7 text-xs border-amber-700/50 text-amber-200 bg-slate-950 hover:bg-slate-800"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adicionar Traço
                    </Button>
                  </div>

                  {lineageFeats.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">
                      Nenhum traço inline adicionado ainda.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {lineageFeats.map((lf, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={lf.mode}
                                onChange={(e) =>
                                  updateLineageFeat(idx, {
                                    mode: e.target.value as 'INLINE' | 'EXISTING',
                                  })
                                }
                                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-200"
                              >
                                <option value="INLINE">Criar Traço Inline</option>
                                <option value="EXISTING">Vincular do Catálogo</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLineageFeat(idx)}
                              className="text-red-400 hover:text-red-300 p-1"
                              aria-label="Remover traço"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {lf.mode === 'EXISTING' ? (
                            <select
                              value={lf.featId}
                              onChange={(e) =>
                                updateLineageFeat(idx, { featId: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                            >
                              {catalogFeats.map((cf) => (
                                <option key={cf.id} value={cf.id}>
                                  {cf.name} ({cf.ruleset})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="Nome do Traço (Ex: Visão no Escuro Superior)"
                                value={lf.name}
                                onChange={(e) =>
                                  updateLineageFeat(idx, { name: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                              />
                              <textarea
                                rows={2}
                                placeholder="Descrição e mecânicas do traço..."
                                value={lf.description}
                                onChange={(e) =>
                                  updateLineageFeat(idx, { description: e.target.value })
                                }
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-amber-50"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-slate-400">
                                    Bônus CA Passivo (Opcional)
                                  </label>
                                  <input
                                    type="number"
                                    value={lf.acBonus}
                                    onChange={(e) =>
                                      updateLineageFeat(idx, {
                                        acBonus: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-400">
                                    PV Extra por Nível (Opcional)
                                  </label>
                                  <input
                                    type="number"
                                    value={lf.hpPerLevelBonus}
                                    onChange={(e) =>
                                      updateLineageFeat(idx, {
                                        hpPerLevelBonus: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-amber-50"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Descrição detalhada {activeCategory !== 'classes' && '*'}
              </label>
              <textarea
                rows={3}
                required={activeCategory !== 'classes'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Insira detalhes e mecânicas..."
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-amber-50 focus:outline-none focus:border-amber-500"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-end gap-3 border-t border-amber-950/40 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-serif font-bold shadow-sm tracking-wide flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Salvar Homebrew
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
