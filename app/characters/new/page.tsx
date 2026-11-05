"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  ChevronLeft,
  ChevronRight,
  User,
  Shield,
  BookOpen,
  Map,
  Dices,
  Eye,
  Sparkles,
  CheckCircle2,
  Lock,
  Plus,
  Minus,
  RotateCcw,
  AlertCircle,
  Wand2,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { processAvatarImage } from "@/lib/image-upload";

import { Stepper } from "@/components/ui/stepper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useReferenceLineages,
  useReferenceClasses,
  useReferenceBackgrounds,
  useRollAbilityScores,
  useCreateCharacter,
  Ruleset,
  AbilityScoreMethod,
  HpCalculationMethod,
  AbilityKey,
  ABILITY_KEYS,
  ABILITY_LABELS,
  DND_SKILLS,
  DND_XP_THRESHOLDS,
  normalizeAbilityKey,
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  calculatePointBuyTotal,
} from "@/lib/api/characters";
import {
  fetchSubclasses,
  fetchFeats,
  Subclass,
  Feat,
} from "@/lib/api/encyclopedia";
import {
  CLASS_SKILL_OPTIONS,
  translateReferenceName,
} from "@/lib/srd-translations";

const WIZARD_STEPS = [
  { title: "Nome & Regras" },
  { title: "Linhagem" },
  { title: "Classe" },
  { title: "Antecedente" },
  { title: "Atributos" },
  { title: "Revisão" },
];

const STANDARD_ARRAY_VALUES = [15, 14, 13, 12, 10, 8];
const ROLL_STORAGE_KEY = "dungeoneer_wizard_ability_roll";

function formatAbilityName(raw: string | undefined | null): string {
  if (!raw) return "";
  const key = normalizeAbilityKey(raw);
  if (key && ABILITY_LABELS[key]) {
    return ABILITY_LABELS[key].full;
  }
  return translateReferenceName(raw) || raw;
}

export const wizardStep1Schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do personagem é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  ruleset: z.enum(["SRD_2014", "SRD_2024"]),
});

type WizardStep1Values = z.infer<typeof wizardStep1Schema>;

interface PoolItem {
  id: string;
  value: number;
}

function DraggableScoreChip({
  item,
  isSelected,
  onClick,
}: {
  item: PoolItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: { value: item.value, source: "pool", itemId: item.id },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={onClick}
      data-testid={`score-chip-${item.id}`}
      {...listeners}
      {...attributes}
      className={`px-4 py-2.5 rounded-lg font-mono text-lg font-bold border select-none ${
        isDragging
          ? "opacity-50 scale-105 z-50 cursor-grabbing"
          : "transition-all duration-150 cursor-grab"
      } ${
        isSelected
          ? "bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-lg"
          : "bg-slate-900 text-amber-200 border-amber-700/50 hover:border-amber-500"
      }`}
    >
      {item.value}
    </button>
  );
}

function DroppableAbilitySlot({
  ability,
  assignedItem,
  asiBonus,
  hasSelectedChip,
  onSlotClick,
  onClearSlot,
}: {
  ability: AbilityKey;
  assignedItem: PoolItem | null;
  asiBonus: number;
  hasSelectedChip: boolean;
  onSlotClick: () => void;
  onClearSlot: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `slot-${ability}`,
    data: { ability },
  });

  const label = ABILITY_LABELS[ability];
  const baseScore = assignedItem?.value ?? null;
  const finalScore = baseScore !== null ? baseScore + asiBonus : null;
  const modifier = finalScore !== null ? calculateModifier(finalScore) : null;

  return (
    <div
      ref={setNodeRef}
      onClick={onSlotClick}
      data-testid={`ability-slot-${ability}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSlotClick();
        }
      }}
      aria-label={`Slot de atributo ${label.short}`}
      className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-between min-h-[168px] cursor-pointer ${
        isOver
          ? "border-amber-400 bg-amber-500/20 scale-[1.02]"
          : assignedItem
          ? "border-amber-600/60 bg-slate-900/90"
          : hasSelectedChip
          ? "border-amber-500/50 border-dashed bg-amber-950/20 hover:bg-amber-950/30"
          : "border-amber-900/40 bg-slate-950/70 hover:border-amber-700/50"
      }`}
    >
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
          {label.short}
        </span>
        <span className="text-[11px] text-slate-400">{label.full}</span>
      </div>

      <div className="my-2 flex flex-col items-center">
        {assignedItem ? (
          <div className="flex flex-col items-center">
            <span
              data-testid={`slot-value-${ability}`}
              className="text-2xl font-mono font-bold text-amber-100"
            >
              {finalScore}
            </span>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              Mod: {modifier !== null ? formatModifier(modifier) : "--"}
            </span>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg border border-dashed border-slate-700 flex items-center justify-center text-slate-500 font-mono text-sm">
            --
          </div>
        )}
      </div>

      <div className="w-full flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5">
        <span>
          Base: {baseScore ?? "-"}
          {asiBonus > 0 ? ` (+${asiBonus})` : ""}
        </span>
        {assignedItem && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClearSlot();
            }}
            className="text-red-400 hover:text-red-300 underline text-[10px]"
          >
            Limpar
          </button>
        )}
      </div>
    </div>
  );
}

function isLevelOneSubclassClass(cls: { name?: string; ruleset?: string; subclassLevel?: number } | null): boolean {
  if (!cls) return false;
  if (typeof cls.subclassLevel === "number") {
    return cls.subclassLevel === 1;
  }
  if (cls.ruleset === "SRD_2014") {
    const n = (cls.name || "").toLowerCase();
    return (
      n.includes("cleric") ||
      n.includes("clérigo") ||
      n.includes("sorcerer") ||
      n.includes("feiticeiro") ||
      n.includes("warlock") ||
      n.includes("bruxo")
    );
  }
  return false;
}

export default function CharacterCreationWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [characterAvatarUrl, setCharacterAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await processAvatarImage(file);
      setCharacterAvatarUrl(dataUrl);
      toast.success("Retrato do personagem carregado!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar imagem.";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // Step 1 form (React Hook Form + Zod)
  const step1Form = useForm<WizardStep1Values>({
    resolver: zodResolver(wizardStep1Schema),
    defaultValues: {
      name: "",
      ruleset: "SRD_2024",
    },
    mode: "onChange",
  });

  const watchedName = step1Form.watch("name");
  const watchedRuleset = step1Form.watch("ruleset") as Ruleset;

  // Step 3 Level, HP, Subclass & Skills State
  const [characterLevel, setCharacterLevel] = useState<number>(1);
  const [hpMethod, setHpMethod] = useState<HpCalculationMethod>("AVERAGE");
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>([]);
  const [availableSubclasses, setAvailableSubclasses] = useState<Subclass[]>([]);
  const [selectedSubclassId, setSelectedSubclassId] = useState<string>("");

  // Step 4 Origin Feat State (SRD_2024)
  const [originFeats, setOriginFeats] = useState<Feat[]>([]);
  const [selectedOriginFeatId, setSelectedOriginFeatId] = useState<string>("");

  // Queries for Reference Data (SRD + HOMEBREW)
  const { data: srdLineages = [], isLoading: loadingLineages } =
    useReferenceLineages(watchedRuleset);
  const { data: homebrewLineages = [] } = useReferenceLineages("HOMEBREW");
  const lineages = useMemo(() => {
    const seen = new Set<string>();
    return [...srdLineages, ...homebrewLineages].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [srdLineages, homebrewLineages]);

  const { data: srdClasses = [], isLoading: loadingClasses } =
    useReferenceClasses(watchedRuleset);
  const { data: homebrewClasses = [] } = useReferenceClasses("HOMEBREW");
  const classes = useMemo(() => {
    const seen = new Set<string>();
    return [...srdClasses, ...homebrewClasses].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [srdClasses, homebrewClasses]);

  const { data: backgrounds = [], isLoading: loadingBackgrounds } =
    useReferenceBackgrounds(watchedRuleset);

  // Selected IDs
  const [selectedLineageId, setSelectedLineageId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string>("");

  // Auto-select first available item when reference data loads or ruleset changes
  useEffect(() => {
    if (
      lineages.length > 0 &&
      !lineages.some((l) => l.id === selectedLineageId)
    ) {
      setSelectedLineageId(lineages[0].id);
    }
  }, [lineages, selectedLineageId]);

  useEffect(() => {
    if (
      classes.length > 0 &&
      !classes.some((c) => c.id === selectedClassId)
    ) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  useEffect(() => {
    if (
      backgrounds.length > 0 &&
      !backgrounds.some((b) => b.id === selectedBackgroundId)
    ) {
      setSelectedBackgroundId(backgrounds[0].id);
    }
  }, [backgrounds, selectedBackgroundId]);

  const selectedLineage = useMemo(
    () => lineages.find((l) => l.id === selectedLineageId) ?? null,
    [lineages, selectedLineageId]
  );
  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId]
  );
  const selectedBackground = useMemo(
    () => backgrounds.find((b) => b.id === selectedBackgroundId) ?? null,
    [backgrounds, selectedBackgroundId]
  );

  const requiresLevelOneSubclass = useMemo(
    () => isLevelOneSubclassClass(selectedClass),
    [selectedClass]
  );

  // Load subclasses when selectedClass requires a Level 1 subclass
  useEffect(() => {
    if (!selectedClassId || !requiresLevelOneSubclass) {
      setAvailableSubclasses([]);
      setSelectedSubclassId("");
      return;
    }
    let active = true;
    Promise.all([
      fetchSubclasses(selectedClassId, watchedRuleset).catch(() => []),
      fetchSubclasses(selectedClassId, "HOMEBREW").catch(() => []),
    ]).then(([srdSubs, hbSubs]) => {
      if (!active) return;
      const seen = new Set<string>();
      const merged = [...(srdSubs || []), ...(hbSubs || [])].filter((s) => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
      setAvailableSubclasses(merged);
      setSelectedSubclassId((prev) =>
        merged.some((s) => s.id === prev) ? prev : merged[0]?.id || ""
      );
    });
    return () => {
      active = false;
    };
  }, [selectedClassId, requiresLevelOneSubclass, watchedRuleset]);

  // Load Origin Feats when ruleset is SRD_2024
  useEffect(() => {
    if (watchedRuleset !== "SRD_2024") {
      setOriginFeats([]);
      setSelectedOriginFeatId("");
      return;
    }
    let active = true;
    Promise.all([
      fetchFeats({ ruleset: "SRD_2024", featTypes: ["ORIGIN"], limit: 100 }).catch(() => ({ items: [] })),
      fetchFeats({ ruleset: "HOMEBREW", featTypes: ["ORIGIN"], limit: 100 }).catch(() => ({ items: [] })),
    ]).then(([srdPage, hbPage]) => {
      if (!active) return;
      const seen = new Set<string>();
      const merged = [...(srdPage?.items || []), ...(hbPage?.items || [])].filter(
        (f) => {
          if (seen.has(f.id)) return false;
          seen.add(f.id);
          return f.featType === "ORIGIN";
        }
      );
      setOriginFeats(merged);
    });
    return () => {
      active = false;
    };
  }, [watchedRuleset]);

  // Pre-select matching background origin feat when background changes in SRD_2024
  useEffect(() => {
    if (watchedRuleset !== "SRD_2024" || originFeats.length === 0) return;
    if (selectedBackground?.originFeatName) {
      const targetName = selectedBackground.originFeatName.trim().toLowerCase();
      const matched = originFeats.find(
        (f) =>
          f.name.trim().toLowerCase() === targetName ||
          (f.nameEn && f.nameEn.trim().toLowerCase() === targetName)
      );
      if (matched) {
        setSelectedOriginFeatId(matched.id);
        return;
      }
    }
    if (!selectedOriginFeatId && originFeats.length > 0) {
      setSelectedOriginFeatId(originFeats[0].id);
    }
  }, [watchedRuleset, selectedBackground, originFeats, selectedOriginFeatId]);

  const handleLevelChange = (lvl: number) => {
    const validLevel = Math.min(20, Math.max(1, lvl));
    setCharacterLevel(validLevel);
  };

  // Class Skills Selection
  const classSkillConfig = useMemo(() => {
    if (!selectedClass) return null;
    return CLASS_SKILL_OPTIONS[selectedClass.name] ?? null;
  }, [selectedClass]);

  const maxClassSkills = classSkillConfig?.count ?? 2;
  const availableSkills = useMemo(() => {
    if (classSkillConfig?.skills && classSkillConfig.skills.length > 0) {
      return classSkillConfig.skills;
    }
    return DND_SKILLS.map((s) => s.enName);
  }, [classSkillConfig]);

  useEffect(() => {
    setSelectedClassSkills((prev) => {
      const valid = prev.filter((s) => availableSkills.includes(s));
      return valid.slice(0, maxClassSkills);
    });
  }, [availableSkills, maxClassSkills]);

  const toggleClassSkill = (skill: string) => {
    setSelectedClassSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= maxClassSkills) {
        toast.error(
          `Você só pode escolher até ${maxClassSkills} perícias para esta classe.`
        );
        return prev;
      }
      return [...prev, skill];
    });
  };

  // Step 4 Background Skills & Collision Detection
  const backgroundSkills = useMemo(() => {
    return selectedBackground?.skillProficiencies ?? [];
  }, [selectedBackground]);

  const collidingSkills = useMemo(() => {
    return backgroundSkills.filter((bs) =>
      selectedClassSkills.some((cs) => {
        const csNorm = cs.trim().toLowerCase();
        const bsNorm = bs.trim().toLowerCase();
        return (
          csNorm === bsNorm ||
          translateReferenceName(cs).toLowerCase() ===
            translateReferenceName(bs).toLowerCase()
        );
      })
    );
  }, [backgroundSkills, selectedClassSkills]);

  // Step 4 — 2024 Background ASI Distribution (+2/+1 or +1/+1/+1)
  const [asiMode2024, setAsiMode2024] = useState<"2_1" | "1_1_1">("2_1");
  const [asiPlus2Ability, setAsiPlus2Ability] = useState<AbilityKey | "">("");
  const [asiPlus1Ability, setAsiPlus1Ability] = useState<AbilityKey | "">("");

  const allowedBackgroundAbilities = useMemo<AbilityKey[]>(() => {
    if (!selectedBackground?.allowedAbilityBonuses?.length) {
      return ["strength", "dexterity", "constitution"];
    }
    const mapped = selectedBackground.allowedAbilityBonuses
      .map(normalizeAbilityKey)
      .filter((k): k is AbilityKey => k !== null);
    return mapped.length > 0
      ? mapped
      : ["strength", "dexterity", "constitution"];
  }, [selectedBackground]);

  useEffect(() => {
    if (allowedBackgroundAbilities.length >= 2) {
      setAsiPlus2Ability(allowedBackgroundAbilities[0]);
      setAsiPlus1Ability(allowedBackgroundAbilities[1]);
    }
  }, [allowedBackgroundAbilities]);

  // Compute ASI bonuses map across both rulesets
  const computedAsiBonuses = useMemo<Record<AbilityKey, number>>(() => {
    const bonuses: Record<AbilityKey, number> = {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    };

    if (watchedRuleset === "SRD_2014" && selectedLineage?.abilityBonuses) {
      for (const [rawKey, bonus] of Object.entries(
        selectedLineage.abilityBonuses
      )) {
        const key = normalizeAbilityKey(rawKey);
        if (key) {
          bonuses[key] = (bonuses[key] ?? 0) + Number(bonus);
        }
      }
    } else if (watchedRuleset === "SRD_2024") {
      if (asiMode2024 === "1_1_1") {
        for (const key of allowedBackgroundAbilities.slice(0, 3)) {
          bonuses[key] = 1;
        }
      } else {
        if (asiPlus2Ability) bonuses[asiPlus2Ability] = 2;
        if (asiPlus1Ability && asiPlus1Ability !== asiPlus2Ability) {
          bonuses[asiPlus1Ability] = 1;
        }
      }
    }

    return bonuses;
  }, [
    watchedRuleset,
    selectedLineage,
    asiMode2024,
    allowedBackgroundAbilities,
    asiPlus2Ability,
    asiPlus1Ability,
  ]);

  // Step 5 — Ability Score Generation State
  const [abilityMethod, setAbilityMethod] =
    useState<AbilityScoreMethod>("STANDARD_ARRAY");

  // Standard Array Pool & Slots
  const [standardPool, setStandardPool] = useState<PoolItem[]>(() =>
    STANDARD_ARRAY_VALUES.map((v, idx) => ({ id: `std-${idx}`, value: v }))
  );
  const [standardSlots, setStandardSlots] = useState<
    Record<AbilityKey, PoolItem | null>
  >({
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null,
  });

  // Rolled (4d6kh3) Pool, Slots & Single-chance Lock
  const rollAbilityMutation = useRollAbilityScores();
  const [abilityRollId, setAbilityRollId] = useState<string | null>(null);
  const [hasRolledAbilities, setHasRolledAbilities] = useState(false);
  const [rolledPool, setRolledPool] = useState<PoolItem[]>([]);
  const [rolledSlots, setRolledSlots] = useState<
    Record<AbilityKey, PoolItem | null>
  >({
    strength: null,
    dexterity: null,
    constitution: null,
    intelligence: null,
    wisdom: null,
    charisma: null,
  });

  // Load persisted roll from sessionStorage so refreshing preserves the single-chance roll lock
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem(ROLL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          rollId: string;
          rolledScores: number[];
        };
        if (parsed.rollId && Array.isArray(parsed.rolledScores)) {
          setAbilityRollId(parsed.rollId);
          setHasRolledAbilities(true);
          setRolledPool(
            parsed.rolledScores.map((v, i) => ({
              id: `roll-${i}`,
              value: v,
            }))
          );
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleRollAbilityScores = async () => {
    if (hasRolledAbilities) return;
    try {
      const res = await rollAbilityMutation.mutateAsync();
      setAbilityRollId(res.rollId);
      setHasRolledAbilities(true);
      const items = res.rolledScores.map((v, i) => ({
        id: `roll-${i}`,
        value: v,
      }));
      setRolledPool(items);
      setRolledSlots({
        strength: null,
        dexterity: null,
        constitution: null,
        intelligence: null,
        wisdom: null,
        charisma: null,
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          ROLL_STORAGE_KEY,
          JSON.stringify({
            rollId: res.rollId,
            rolledScores: res.rolledScores,
          })
        );
      }
      toast.success("Atributos 4d6kh3 rolados! Distribua os valores nos slots.");
    } catch {
      // error toast handled by apiFetch
    }
  };

  // Point Buy State
  const [pointBuyScores, setPointBuyScores] = useState<
    Record<AbilityKey, number>
  >({
    strength: 8,
    dexterity: 8,
    constitution: 8,
    intelligence: 8,
    wisdom: 8,
    charisma: 8,
  });

  const pointBuyUsed = useMemo(
    () => calculatePointBuyTotal(pointBuyScores),
    [pointBuyScores]
  );
  const pointBuyRemaining = 27 - pointBuyUsed;

  const adjustPointBuy = (ability: AbilityKey, delta: number) => {
    const current = pointBuyScores[ability];
    const next = current + delta;
    if (next < 8 || next > 15) return;
    const candidate = { ...pointBuyScores, [ability]: next };
    if (calculatePointBuyTotal(candidate) > 27) return;
    setPointBuyScores(candidate);
  };

  // Drag-and-Drop & Tap-to-Assign logic for STANDARD_ARRAY and ROLLED
  const [selectedChipId, setSelectedChipId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const activePool =
    abilityMethod === "ROLLED" ? rolledPool : standardPool;
  const activeSlots =
    abilityMethod === "ROLLED" ? rolledSlots : standardSlots;

  const updatePoolAndSlots = (
    newPool: PoolItem[],
    newSlots: Record<AbilityKey, PoolItem | null>
  ) => {
    if (abilityMethod === "ROLLED") {
      setRolledPool(newPool);
      setRolledSlots(newSlots);
    } else {
      setStandardPool(newPool);
      setStandardSlots(newSlots);
    }
  };

  const assignChipToSlot = (itemId: string, targetAbility: AbilityKey) => {
    const chipInPool = activePool.find((i) => i.id === itemId);
    if (!chipInPool) return;

    const existingInSlot = activeSlots[targetAbility];
    const nextPool = activePool.filter((i) => i.id !== itemId);
    if (existingInSlot) {
      nextPool.push(existingInSlot);
    }
    const nextSlots = {
      ...activeSlots,
      [targetAbility]: chipInPool,
    };
    updatePoolAndSlots(nextPool, nextSlots);
    setSelectedChipId(null);
  };

  const clearSlot = (ability: AbilityKey) => {
    const existing = activeSlots[ability];
    if (!existing) return;
    const nextPool = [...activePool, existing];
    const nextSlots = { ...activeSlots, [ability]: null };
    updatePoolAndSlots(nextPool, nextSlots);
  };

  const resetAllSlots = () => {
    const returned = Object.values(activeSlots).filter(
      (v): v is PoolItem => v !== null
    );
    const nextPool = [...activePool, ...returned];
    const emptySlots: Record<AbilityKey, PoolItem | null> = {
      strength: null,
      dexterity: null,
      constitution: null,
      intelligence: null,
      wisdom: null,
      charisma: null,
    };
    updatePoolAndSlots(nextPool, emptySlots);
    setSelectedChipId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    if (overId.startsWith("slot-")) {
      const ability = overId.replace("slot-", "") as AbilityKey;
      assignChipToSlot(String(active.id), ability);
    }
  };

  const handleSlotClick = (ability: AbilityKey) => {
    if (selectedChipId) {
      assignChipToSlot(selectedChipId, ability);
    } else if (activePool.length > 0 && !activeSlots[ability]) {
      assignChipToSlot(activePool[0].id, ability);
    }
  };

  // Check if all 6 ability scores are valid to advance from Step 5
  const isStep5Valid = useMemo(() => {
    if (abilityMethod === "POINT_BUY") {
      return pointBuyUsed <= 27;
    }
    if (abilityMethod === "ROLLED") {
      if (!hasRolledAbilities) return false;
      return ABILITY_KEYS.every((k) => rolledSlots[k] !== null);
    }
    return ABILITY_KEYS.every((k) => standardSlots[k] !== null);
  }, [
    abilityMethod,
    pointBuyUsed,
    hasRolledAbilities,
    rolledSlots,
    standardSlots,
  ]);

  // Base ability scores map for submission & preview
  const baseAbilityScores = useMemo<Record<AbilityKey, number>>(() => {
    if (abilityMethod === "POINT_BUY") {
      return pointBuyScores;
    }
    const sourceSlots =
      abilityMethod === "ROLLED" ? rolledSlots : standardSlots;
    return {
      strength: sourceSlots.strength?.value ?? 10,
      dexterity: sourceSlots.dexterity?.value ?? 10,
      constitution: sourceSlots.constitution?.value ?? 10,
      intelligence: sourceSlots.intelligence?.value ?? 10,
      wisdom: sourceSlots.wisdom?.value ?? 10,
      charisma: sourceSlots.charisma?.value ?? 10,
    };
  }, [abilityMethod, pointBuyScores, rolledSlots, standardSlots]);

  const finalAbilityScores = useMemo<Record<AbilityKey, number>>(() => {
    return {
      strength: baseAbilityScores.strength + computedAsiBonuses.strength,
      dexterity: baseAbilityScores.dexterity + computedAsiBonuses.dexterity,
      constitution:
        baseAbilityScores.constitution + computedAsiBonuses.constitution,
      intelligence:
        baseAbilityScores.intelligence + computedAsiBonuses.intelligence,
      wisdom: baseAbilityScores.wisdom + computedAsiBonuses.wisdom,
      charisma: baseAbilityScores.charisma + computedAsiBonuses.charisma,
    };
  }, [baseAbilityScores, computedAsiBonuses]);

  const selectedOriginFeat = useMemo(
    () => originFeats.find((f) => f.id === selectedOriginFeatId) ?? null,
    [originFeats, selectedOriginFeatId]
  );

  // Derived combat stats preview for Step 6 (Level 1 base stats + target XP floor)
  const derivedStats = useMemo(() => {
    const conMod = calculateModifier(finalAbilityScores.constitution);
    const dexMod = calculateModifier(finalAbilityScores.dexterity);
    const hitDieFaces = Number(
      (selectedClass?.hitDice ?? "d8").replace(/\D/g, "") || 8
    );

    const featHpPerLevel =
      Number(selectedOriginFeat?.mechanicalEffects?.hpPerLevelBonus) || 0;
    const maxHp = Math.max(1, hitDieFaces + conMod + featHpPerLevel);
    const targetXp =
      DND_XP_THRESHOLDS[Math.min(19, Math.max(0, characterLevel - 1))] ?? 0;

    return {
      maxHp,
      ac: 10 + dexMod,
      initiative: dexMod,
      speed: selectedLineage?.speed ?? 30,
      proficiencyBonus: calculateProficiencyBonus(1),
      targetProficiencyBonus: calculateProficiencyBonus(characterLevel),
      targetXp,
    };
  }, [
    finalAbilityScores,
    selectedClass,
    selectedLineage,
    characterLevel,
    selectedOriginFeat,
  ]);

  // Navigation Handlers
  const handleNext = async () => {
    if (currentStep === 1) {
      const valid = await step1Form.trigger();
      if (!valid) return;
    }
    if (currentStep === 3) {
      if (!selectedClassId) {
        toast.error("Selecione uma classe antes de avançar.");
        return;
      }
      if (
        requiresLevelOneSubclass &&
        availableSubclasses.length > 0 &&
        !selectedSubclassId
      ) {
        toast.error(
          "Esta classe exige a escolha de uma Subclasse já no Nível 1."
        );
        return;
      }
    }
    if (currentStep === 5 && !isStep5Valid) {
      toast.error("Distribua todos os 6 atributos antes de avançar.");
      return;
    }
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Create Character Mutation
  const createCharacterMutation = useCreateCharacter();

  const handleCreateCharacter = async () => {
    const abilityScoreBonusesPayload: Record<string, number> = {};
    for (const key of ABILITY_KEYS) {
      const bonus = computedAsiBonuses[key];
      if (bonus > 0) {
        abilityScoreBonusesPayload[key.toUpperCase()] = bonus;
      }
    }

    const consolidatedSkills = Array.from(
      new Set([
        ...selectedClassSkills,
        ...(selectedBackground?.skillProficiencies ?? []),
      ])
    );

    try {
      const created = await createCharacterMutation.mutateAsync({
        name: watchedName.trim(),
        level: characterLevel,
        ruleset: watchedRuleset,
        lineageId: selectedLineageId,
        backgroundId: selectedBackgroundId,
        archetypeId: selectedClassId,
        subclassId:
          requiresLevelOneSubclass && selectedSubclassId
            ? selectedSubclassId
            : null,
        originFeatId:
          watchedRuleset === "SRD_2024" && selectedOriginFeatId
            ? selectedOriginFeatId
            : null,
        abilityScoreMethod: abilityMethod,
        abilityScores: baseAbilityScores,
        abilityScoreBonuses:
          watchedRuleset === "SRD_2024"
            ? abilityScoreBonusesPayload
            : undefined,
        abilityRollId: abilityMethod === "ROLLED" ? abilityRollId : undefined,
        hpCalculationMethod: hpMethod,
        avatarUrl: characterAvatarUrl || undefined,
        skillProficiencies:
          consolidatedSkills.length > 0 ? consolidatedSkills : undefined,
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(ROLL_STORAGE_KEY);
      }
      toast.success(
        characterLevel > 1
          ? `Personagem "${created.name}" criado! Conclua a progressão até o Nível ${characterLevel} na ficha.`
          : `Personagem "${created.name}" criado com sucesso!`
      );
      router.push(`/characters/${created.id}`);
    } catch {
      // handled by apiFetch
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-amber-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="space-y-2 pt-2 text-center">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-amber-400 tracking-wide">
            Forja de Personagem
          </h1>
          <p className="text-slate-400 text-sm">
            Siga os 6 passos para dar vida ao seu aventureiro nas regras D&amp;D
            5e.
          </p>
        </div>

        {/* Stepper */}
        <div className="bg-slate-900/70 backdrop-blur-sm border border-amber-900/40 p-4 md:p-6 rounded-xl shadow-lg">
          <Stepper steps={WIZARD_STEPS} currentStep={currentStep} />
        </div>

        {/* Step Content */}
        <div className="relative w-full min-h-[460px]">
          {/* STEP 1: NOME & REGRAS */}
          {currentStep === 1 && (
            <Card className="bg-slate-900/80 border border-amber-900/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-200">
                  <User className="w-6 h-6 text-amber-500" />
                  Passo 1 — Nome &amp; Regras
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Defina o nome do seu herói e a edição de regras.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Character Name & Avatar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-amber-900/50 flex items-center justify-center text-amber-400 overflow-hidden shadow-inner">
                      {characterAvatarUrl ? (
                        <img
                          src={characterAvatarUrl}
                          alt="Retrato do Personagem"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Shield className="w-9 h-9 opacity-60" />
                      )}
                    </div>
                    <label
                      htmlFor="character-avatar-input"
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-md transition-transform active:scale-95"
                      title="Carregar Retrato"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <input
                        id="character-avatar-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        disabled={uploadingAvatar}
                        onChange={handleAvatarFileChange}
                      />
                    </label>
                  </div>

                  <div className="space-y-2 flex-1 w-full">
                    <Label htmlFor="character-name" className="text-amber-100">
                      Nome do Personagem
                    </Label>
                    <Input
                      id="character-name"
                      placeholder="Ex: Thorin Escudo de Carvalho"
                      value={watchedName}
                      onChange={(e) =>
                        step1Form.setValue("name", e.target.value, {
                          shouldValidate: true,
                        })
                      }
                      className="bg-slate-950 border-amber-900/50 text-amber-50"
                    />
                    {step1Form.formState.errors.name && (
                      <p className="text-xs text-red-400">
                        {step1Form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Ruleset Selector */}
                <div className="space-y-2">
                  <Label className="text-amber-100">Conjunto de Regras</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(
                      [
                        {
                          value: "SRD_2014",
                          title: "D&D 5e (2014)",
                          desc: "Regras clássicas da 5ª Edição com bônus de atributo fixos na Linhagem.",
                        },
                        {
                          value: "SRD_2024",
                          title: "D&D 5e Revisado (2024)",
                          desc: "Novas regras com bônus de atributo (+2/+1 ou +1/+1/+1) e Talento de Origem no Antecedente.",
                        },
                      ] as const
                    ).map((opt) => {
                      const active = watchedRuleset === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            step1Form.setValue("ruleset", opt.value, {
                              shouldValidate: true,
                            })
                          }
                          className={`p-4 rounded-xl border text-left transition-all ${
                            active
                              ? "border-amber-500 bg-amber-500/15 shadow-md"
                              : "border-amber-900/40 bg-slate-950/60 hover:border-amber-700/50"
                          }`}
                        >
                          <div className="font-serif font-bold text-amber-200">
                            {opt.title}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {opt.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: LINHAGEM */}
          {currentStep === 2 && (
            <Card className="bg-slate-900/80 border border-amber-900/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-200">
                  <Map className="w-6 h-6 text-amber-500" />
                  Passo 2 — Linhagem
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Escolha a linhagem (espécie/raça) do seu personagem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLineages ? (
                  <p className="text-slate-400 text-sm">
                    Carregando linhagens...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {lineages.map((lin) => (
                        <button
                          key={lin.id}
                          type="button"
                          onClick={() => setSelectedLineageId(lin.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                            selectedLineageId === lin.id
                              ? "border-amber-500 bg-amber-500/15 text-amber-100"
                              : "border-amber-900/30 bg-slate-950/60 text-slate-300 hover:border-amber-700/50"
                          }`}
                        >
                          <div className="font-serif font-bold">{lin.name}</div>
                          <div className="text-xs text-slate-400">
                            Deslocamento: {lin.speed} pés • Porte: {lin.size}
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedLineage && (
                      <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950/80 border border-amber-900/40 space-y-4">
                        <div className="flex items-center justify-between border-b border-amber-900/30 pb-3">
                          <h3 className="text-xl font-serif font-bold text-amber-300">
                            {selectedLineage.name}
                          </h3>
                          <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {selectedLineage.speed} pés • {selectedLineage.size}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300">
                          {selectedLineage.description}
                        </p>

                        {watchedRuleset === "SRD_2014" &&
                          selectedLineage.abilityBonuses &&
                          Object.keys(selectedLineage.abilityBonuses).length >
                            0 && (
                            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-700/40">
                              <span className="text-xs font-semibold uppercase text-amber-300 block mb-1">
                                Bônus de Atributo Fixos (SRD 2014)
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(
                                  selectedLineage.abilityBonuses
                                ).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 text-xs font-mono font-bold"
                                  >
                                    {k} +{v}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold uppercase text-slate-400">
                            Traços Raciais
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(selectedLineage.traitsSummary ?? []).map((t) => (
                              <span
                                key={t}
                                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 3: CLASSE */}
          {currentStep === 3 && (
            <Card className="bg-slate-900/80 border border-amber-900/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-200">
                  <Shield className="w-6 h-6 text-amber-500" />
                  Passo 3 — Classe &amp; Progressão
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Defina a classe inicial, o nível alvo, o método de ganho de Pontos de Vida para a carreira e as perícias de classe.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingClasses ? (
                  <p className="text-slate-400 text-sm">
                    Carregando classes...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      <Label className="text-amber-200 text-xs uppercase font-bold tracking-wider block mb-1">
                        Classe Inicial
                      </Label>
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => setSelectedClassId(cls.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                            selectedClassId === cls.id
                              ? "border-amber-500 bg-amber-500/15 text-amber-100"
                              : "border-amber-900/30 bg-slate-950/60 text-slate-300 hover:border-amber-700/50"
                          }`}
                        >
                          <div className="font-serif font-bold flex items-center justify-between">
                            <span>{cls.name}</span>
                            {cls.ruleset === "HOMEBREW" && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Homebrew
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">
                            Dado de Vida: {cls.hitDice.toUpperCase()} •{" "}
                            {formatAbilityName(cls.primaryAbility)}
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedClass && (
                      <div className="lg:col-span-2 space-y-5">
                        {/* Class Info Box */}
                        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/40 space-y-3">
                          <div className="flex items-center justify-between border-b border-amber-900/30 pb-3">
                            <div>
                              <h3 className="text-xl font-serif font-bold text-amber-300">
                                {selectedClass.name}
                              </h3>
                              <p className="text-xs text-slate-400">
                                Atributo Principal: {formatAbilityName(selectedClass.primaryAbility)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded bg-red-500/15 text-red-300 border border-red-500/30 text-xs font-mono font-bold">
                                Dado de Vida: {selectedClass.hitDice.toUpperCase()}
                              </span>
                              {selectedClass.spellcastingType !== "NONE" && (
                                <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold">
                                  Conjurador ({selectedClass.spellcastingType})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold uppercase text-slate-400 block">
                              Proficiências em Salvaguardas
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {(selectedClass.savingThrowProficiencies ?? []).map((st) => (
                                <span
                                  key={st}
                                  className="px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-semibold"
                                >
                                  {formatAbilityName(st)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Subclass Selection when class unlocks Subclass at Level 1 */}
                        {requiresLevelOneSubclass && (
                          <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-500/40 space-y-3">
                            <Label
                              htmlFor="level-1-subclass"
                              className="text-amber-300 font-serif font-bold text-sm flex items-center gap-2"
                            >
                              <Wand2 className="w-4 h-4 text-amber-400" />
                              Subclasse de Nível 1 ({selectedClass.name})
                            </Label>
                            <p className="text-xs text-slate-300">
                              Esta classe escolhe sua especialização já no 1º nível.
                            </p>
                            {availableSubclasses.length > 0 ? (
                              <select
                                id="level-1-subclass"
                                data-testid="level-1-subclass-select"
                                value={selectedSubclassId}
                                onChange={(e) => setSelectedSubclassId(e.target.value)}
                                className="w-full h-10 px-3 py-2 rounded-lg border border-amber-600/50 bg-slate-950 text-amber-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                              >
                                {availableSubclasses.map((sc) => (
                                  <option key={sc.id} value={sc.id}>
                                    {sc.name}
                                    {sc.nameEn && sc.nameEn !== sc.name
                                      ? ` (${sc.nameEn})`
                                      : ""}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-amber-200/80 italic">
                                Nenhuma subclasse cadastrada para esta classe.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Target Level Selector */}
                        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/30 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="character-level" className="text-amber-100 font-serif font-bold text-sm">
                              Nível Alvo do Personagem (1–20)
                            </Label>
                            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                              Nível {characterLevel}
                            </span>
                          </div>
                          <Input
                            id="character-level"
                            type="number"
                            min={1}
                            max={20}
                            value={characterLevel}
                            onChange={(e) => handleLevelChange(Number(e.target.value) || 1)}
                            className="bg-slate-900 border-amber-900/50 text-amber-50 font-mono text-base"
                          />
                          {characterLevel > 1 && (
                            <div
                              data-testid="higher-level-creation-notice"
                              className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2"
                            >
                              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-300 block">
                                  Progressão Guiada Nível a Nível ({derivedStats.targetXp.toLocaleString("pt-BR")} XP)
                                </span>
                                O personagem será inicializado no Nível 1 de{" "}
                                <strong>{selectedClass.name}</strong> com o XP necessário para o{" "}
                                <strong>Nível {characterLevel}</strong>. Ao abrir a ficha, o assistente de{" "}
                                <strong>Subir de Nível</strong> abrirá automaticamente para você configurar os níveis{" "}
                                2 até {characterLevel} (incluindo Multiclasse, Subclasses, ASIs e Talentos).
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Career HP Calculation Method (ALWAYS shown so it locks for the character's career) */}
                        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/30 space-y-3">
                          <div>
                            <Label className="text-amber-100 font-serif font-bold text-sm block">
                              Método de Ganho de Pontos de Vida (Carreira: Níveis 2–20)
                            </Label>
                            <p className="text-xs text-slate-400 mt-0.5">
                              No Nível 1 você sempre recebe o Dado de Vida máximo ({selectedClass.hitDice.toUpperCase()}) + Mod. de Constituição. A escolha abaixo ficará travada para todas as subidas de nível futuras.
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                { id: "AVERAGE", label: "Média Fixa", desc: "Valor fixo por nível" },
                                { id: "ROLLED", label: "Rolado", desc: "Rolar dado a cada nível" },
                                { id: "MAX", label: "Máximo", desc: "Dado cheio a cada nível" },
                              ] as const
                            ).map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                data-testid={`hp-method-${m.id}`}
                                onClick={() => setHpMethod(m.id)}
                                className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all text-left ${
                                  hpMethod === m.id
                                    ? "border-amber-500 bg-amber-500/20 text-amber-200"
                                    : "border-amber-900/40 bg-slate-950 text-slate-400 hover:border-amber-700/40"
                                }`}
                              >
                                <div className="font-bold">{m.label}</div>
                                <div className="text-[10px] opacity-80">{m.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Class Skills Selection */}
                        <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-amber-100 font-serif font-bold text-sm">
                              Perícias de Treinamento da Classe
                            </Label>
                            <span
                              data-testid="class-skills-counter"
                              className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            >
                              {selectedClassSkills.length} / {maxClassSkills} selecionada(s)
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Escolha até {maxClassSkills} perícias concedidas pela classe {selectedClass.name}.
                          </p>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {availableSkills.map((sk) => {
                              const isSelected = selectedClassSkills.includes(sk);
                              const ptName = translateReferenceName(sk);
                              return (
                                <button
                                  key={sk}
                                  type="button"
                                  onClick={() => toggleClassSkill(sk)}
                                  aria-pressed={isSelected}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    isSelected
                                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-200 shadow"
                                      : "border-slate-800 bg-slate-900 text-slate-400 hover:border-amber-700/50 hover:text-slate-200"
                                  }`}
                                >
                                  {ptName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 4: ANTECEDENTE */}
          {currentStep === 4 && (
            <Card className="bg-slate-900/80 border border-amber-900/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-200">
                  <BookOpen className="w-6 h-6 text-amber-500" />
                  Passo 4 — Antecedente
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sua história pregressa concede perícias e, em 2024, bônus de
                  atributo e 1 Talento de Origem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBackgrounds ? (
                  <p className="text-slate-400 text-sm">
                    Carregando antecedentes...
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {backgrounds.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => setSelectedBackgroundId(bg.id)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                            selectedBackgroundId === bg.id
                              ? "border-amber-500 bg-amber-500/15 text-amber-100"
                              : "border-amber-900/30 bg-slate-950/60 text-slate-300 hover:border-amber-700/50"
                          }`}
                        >
                          <div className="font-serif font-bold">{bg.name}</div>
                          <div className="text-xs text-slate-400">
                            Perícias: {(bg.skillProficiencies ?? []).join(", ")}
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedBackground && (
                      <div className="lg:col-span-2 p-5 rounded-xl bg-slate-950/80 border border-amber-900/40 space-y-5">
                        <div className="border-b border-amber-900/30 pb-3">
                          <h3 className="text-xl font-serif font-bold text-amber-300">
                            {selectedBackground.name}
                          </h3>
                          <p className="text-sm text-slate-300 mt-1">
                            {selectedBackground.description}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold uppercase text-slate-400 block">
                            Proficiências em Perícias
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {(selectedBackground.skillProficiencies ?? []).map(
                              (sk) => {
                                const isCollision = collidingSkills.some(
                                  (cs) => cs.trim().toLowerCase() === sk.trim().toLowerCase()
                                );
                                return (
                                  <span
                                    key={sk}
                                    className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                                      isCollision
                                        ? "bg-amber-500/20 text-amber-200 border-amber-500/50"
                                        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                    }`}
                                  >
                                    {translateReferenceName(sk)}
                                    {isCollision && " (Já escolhida na Classe)"}
                                  </span>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {collidingSkills.length > 0 && (
                          <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-600/50 flex items-start gap-2.5 text-xs text-amber-200">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold text-amber-300 block mb-0.5">
                                Colisão de Perícias Detectada
                              </span>
                              A(s) perícia(s){" "}
                              <span className="font-semibold text-amber-100">
                                {collidingSkills.map((s) => translateReferenceName(s)).join(", ")}
                              </span>{" "}
                              já foi/foram selecionada(s) nas escolhas da sua classe. Pelas regras de D&amp;D 5e,
                              você pode personalizar a perícia duplicada ou trocá-la voltando ao Passo 3.
                            </div>
                          </div>
                        )}

                        {watchedRuleset === "SRD_2024" && (
                          <div className="space-y-4 pt-2 border-t border-amber-900/30">
                            {/* Origin Feat Selector (SRD 2024 + Homebrew ORIGIN) */}
                            <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-700/40 space-y-2.5">
                              <Label
                                htmlFor="origin-feat-select"
                                className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm"
                              >
                                <Sparkles className="w-4 h-4" />
                                Talento de Origem (SRD 2024)
                              </Label>
                              {originFeats.length > 0 ? (
                                <>
                                  <select
                                    id="origin-feat-select"
                                    data-testid="origin-feat-select"
                                    value={selectedOriginFeatId}
                                    onChange={(e) => setSelectedOriginFeatId(e.target.value)}
                                    className="w-full h-10 px-3 py-2 rounded-lg border border-amber-600/50 bg-slate-950 text-amber-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400"
                                  >
                                    {originFeats.map((feat) => (
                                      <option key={feat.id} value={feat.id}>
                                        {feat.name}
                                        {feat.ruleset === "HOMEBREW" ? " [Homebrew]" : ""}
                                      </option>
                                    ))}
                                  </select>
                                  {selectedOriginFeat && (
                                    <p className="text-xs text-slate-300 leading-relaxed">
                                      {selectedOriginFeat.description}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <div>
                                  <div className="text-xs font-semibold text-amber-200">
                                    {selectedBackground.originFeatName || "Talento de Origem do Antecedente"}
                                  </div>
                                  {selectedBackground.originFeatDescription && (
                                    <p className="text-xs text-slate-300 mt-1">
                                      {selectedBackground.originFeatDescription}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* 2024 ASI Selector */}
                            <div className="space-y-3">
                              <Label className="text-amber-200 text-xs uppercase tracking-wider">
                                Bônus de Atributo do Antecedente (SRD 2024)
                              </Label>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setAsiMode2024("2_1")}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                    asiMode2024 === "2_1"
                                      ? "border-amber-500 bg-amber-500/20 text-amber-200"
                                      : "border-slate-800 bg-slate-900 text-slate-400"
                                  }`}
                                >
                                  Distribuir +2 / +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAsiMode2024("1_1_1")}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                    asiMode2024 === "1_1_1"
                                      ? "border-amber-500 bg-amber-500/20 text-amber-200"
                                      : "border-slate-800 bg-slate-900 text-slate-400"
                                  }`}
                                >
                                  Distribuir +1 / +1 / +1
                                </button>
                              </div>

                              {asiMode2024 === "2_1" ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                  <div>
                                    <span className="text-xs text-slate-400 block mb-1">
                                      Atributo +2
                                    </span>
                                    <div className="flex gap-2">
                                      {allowedBackgroundAbilities.map((ab) => (
                                        <button
                                          key={ab}
                                          type="button"
                                          onClick={() => {
                                            setAsiPlus2Ability(ab);
                                            if (asiPlus1Ability === ab) {
                                              const other =
                                                allowedBackgroundAbilities.find(
                                                  (x) => x !== ab
                                                );
                                              if (other)
                                                setAsiPlus1Ability(other);
                                            }
                                          }}
                                          className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                                            asiPlus2Ability === ab
                                              ? "border-amber-400 bg-amber-500 text-slate-950"
                                              : "border-slate-700 bg-slate-900 text-slate-300"
                                          }`}
                                        >
                                          {ABILITY_LABELS[ab].short} +2
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs text-slate-400 block mb-1">
                                      Atributo +1
                                    </span>
                                    <div className="flex gap-2">
                                      {allowedBackgroundAbilities
                                        .filter((ab) => ab !== asiPlus2Ability)
                                        .map((ab) => (
                                          <button
                                            key={ab}
                                            type="button"
                                            onClick={() =>
                                              setAsiPlus1Ability(ab)
                                            }
                                            className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                                              asiPlus1Ability === ab
                                                ? "border-amber-400 bg-amber-500 text-slate-950"
                                                : "border-slate-700 bg-slate-900 text-slate-300"
                                            }`}
                                          >
                                            {ABILITY_LABELS[ab].short} +1
                                          </button>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-amber-300 font-mono">
                                  Aplicando +1 em{" "}
                                  {allowedBackgroundAbilities
                                    .slice(0, 3)
                                    .map((a) => ABILITY_LABELS[a].short)
                                    .join(", ")}
                                  .
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 5: ATRIBUTOS */}
          {currentStep === 5 && (
            <Card className="bg-slate-900/80 border border-amber-900/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-200">
                  <Dices className="w-6 h-6 text-amber-500" />
                  Passo 5 — Atributos
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Escolha o método de geração e distribua os valores entre os 6
                  atributos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Method Selector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(
                    [
                      {
                        id: "ROLLED",
                        label: "Rolagem (4d6kh3)",
                        desc: "Rolagem única validada pelo servidor",
                      },
                      {
                        id: "STANDARD_ARRAY",
                        label: "Valores Padrão",
                        desc: "Distribua 15, 14, 13, 12, 10, 8",
                      },
                      {
                        id: "POINT_BUY",
                        label: "Compra de Pontos",
                        desc: "Orçamento de 27 pontos (8 a 15)",
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setAbilityMethod(tab.id);
                        setSelectedChipId(null);
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        abilityMethod === tab.id
                          ? "border-amber-500 bg-amber-500/15 text-amber-100 shadow-md"
                          : "border-amber-900/40 bg-slate-950/60 text-slate-300 hover:border-amber-700/50"
                      }`}
                    >
                      <div className="font-serif font-bold text-sm">
                        {tab.label}
                      </div>
                      <div className="text-xs text-slate-400">{tab.desc}</div>
                    </button>
                  ))}
                </div>

                {/* MODE A & B: ROLLED or STANDARD_ARRAY (with @dnd-kit/core) */}
                {(abilityMethod === "ROLLED" ||
                  abilityMethod === "STANDARD_ARRAY") && (
                  <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                    <div className="space-y-5">
                      {abilityMethod === "ROLLED" && (
                        <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
                              {hasRolledAbilities ? (
                                <Lock className="w-4 h-4 text-amber-400" />
                              ) : (
                                <Dices className="w-4 h-4 text-amber-400" />
                              )}
                              Rolagem Oficial da Guilda (4d6 descartando o menor)
                            </h4>
                            <p className="text-xs text-slate-400">
                              Você possui apenas uma chance de rolagem para esta
                              criação. Arraste ou clique nos números para
                              alocá-los.
                            </p>
                          </div>
                          <Button
                            type="button"
                            disabled={
                              hasRolledAbilities ||
                              rollAbilityMutation.isPending
                            }
                            onClick={handleRollAbilityScores}
                            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shrink-0"
                          >
                            <Dices className="w-4 h-4 mr-2" />
                            {hasRolledAbilities
                              ? "Atributos Rolados"
                              : "Rolar Atributos"}
                          </Button>
                        </div>
                      )}

                      {/* Pool of Unassigned Value Chips */}
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-amber-900/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Valores Disponíveis (Arraste ou clique em um valor e
                            depois no atributo)
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={resetAllSlots}
                            className="h-7 text-xs text-amber-300 hover:text-amber-200"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Reiniciar Slots
                          </Button>
                        </div>

                        <div
                          data-testid="ability-score-pool"
                          className="flex flex-wrap gap-3 min-h-[48px] items-center"
                        >
                          {activePool.length > 0 ? (
                            activePool.map((item) => (
                              <DraggableScoreChip
                                key={item.id}
                                item={item}
                                isSelected={selectedChipId === item.id}
                                onClick={() =>
                                  setSelectedChipId((prev) =>
                                    prev === item.id ? null : item.id
                                  )
                                }
                              />
                            ))
                          ) : (
                            <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              {abilityMethod === "ROLLED" && !hasRolledAbilities
                                ? 'Clique em "Rolar Atributos" para gerar seus 6 valores.'
                                : "Todos os 6 valores foram alocados nos atributos!"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 6 Droppable Ability Slots */}
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {ABILITY_KEYS.map((ability) => (
                          <DroppableAbilitySlot
                            key={ability}
                            ability={ability}
                            assignedItem={activeSlots[ability]}
                            asiBonus={computedAsiBonuses[ability]}
                            hasSelectedChip={Boolean(selectedChipId)}
                            onSlotClick={() => handleSlotClick(ability)}
                            onClearSlot={() => clearSlot(ability)}
                          />
                        ))}
                      </div>
                    </div>
                  </DndContext>
                )}

                {/* MODE C: POINT BUY */}
                {abilityMethod === "POINT_BUY" && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-slate-950/90 border border-amber-900/40 flex items-center justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-amber-200 text-sm">
                          Orçamento de Compra de Pontos
                        </h4>
                        <p className="text-xs text-slate-400">
                          Cada atributo inicia em 8 e pode ser elevado até 15
                          antes dos bônus de origem.
                        </p>
                      </div>
                      <div
                        data-testid="point-buy-counter"
                        className="px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/40 font-mono text-lg font-bold text-amber-300"
                      >
                        {pointBuyRemaining} / 27 pts
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                      {ABILITY_KEYS.map((ability) => {
                        const base = pointBuyScores[ability];
                        const bonus = computedAsiBonuses[ability];
                        const finalVal = base + bonus;
                        const mod = calculateModifier(finalVal);
                        const label = ABILITY_LABELS[ability];

                        return (
                          <div
                            key={ability}
                            className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/40 flex flex-col items-center justify-between gap-3"
                          >
                            <div className="text-center">
                              <span className="text-xs font-bold uppercase text-amber-400 block">
                                {label.short}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {label.full}
                              </span>
                            </div>

                            <div className="text-center">
                              <div className="text-2xl font-mono font-bold text-amber-100">
                                {finalVal}
                              </div>
                              <div className="text-xs font-mono text-amber-400">
                                Mod: {formatModifier(mod)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                aria-label={`Diminuir ${label.short}`}
                                disabled={base <= 8}
                                onClick={() => adjustPointBuy(ability, -1)}
                                className="h-7 w-7 border-amber-900/50 bg-slate-900"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="font-mono text-xs text-slate-300 w-6 text-center">
                                {base}
                              </span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                aria-label={`Aumentar ${label.short}`}
                                disabled={base >= 15 || pointBuyRemaining <= 0}
                                onClick={() => adjustPointBuy(ability, 1)}
                                className="h-7 w-7 border-amber-900/50 bg-slate-900"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 6: REVISÃO & CRIAÇÃO */}
          {currentStep === 6 && (
            <Card className="bg-slate-900/80 border border-amber-900/40 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-200">
                  <Eye className="w-6 h-6 text-amber-500" />
                  Passo 6 — Revisão &amp; Criação
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Confira o resumo completo da sua ficha antes de consagrar seu
                  personagem.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Identity Summary */}
                <div className="p-5 rounded-xl bg-slate-950/80 border border-amber-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-amber-300">
                      {watchedName || "Aventureiro Sem Nome"}
                    </h3>
                    <p className="text-sm text-slate-300 mt-1">
                      {characterLevel > 1
                        ? `Nível 1 (Alvo: Nível ${characterLevel} • ${derivedStats.targetXp.toLocaleString("pt-BR")} XP)`
                        : "Nível 1"}{" "}
                      • {selectedClass?.name ?? "Classe"} •{" "}
                      {selectedLineage?.name ?? "Linhagem"} •{" "}
                      {selectedBackground?.name ?? "Antecedente"}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {watchedRuleset === "SRD_2024" ? "D&D 5e 2024" : "D&D 5e 2014"}
                  </span>
                </div>

                {/* Derived Combat Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-900/30 text-center">
                    <span className="text-xs text-slate-400 block">
                      PV Inicial (Nv. 1)
                    </span>
                    <span className="text-2xl font-mono font-bold text-red-400">
                      {derivedStats.maxHp}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-900/30 text-center">
                    <span className="text-xs text-slate-400 block">
                      Classe de Armadura (CA)
                    </span>
                    <span className="text-2xl font-mono font-bold text-amber-300">
                      {derivedStats.ac}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-900/30 text-center">
                    <span className="text-xs text-slate-400 block">
                      Iniciativa
                    </span>
                    <span className="text-2xl font-mono font-bold text-amber-300">
                      {formatModifier(derivedStats.initiative)}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-900/30 text-center">
                    <span className="text-xs text-slate-400 block">
                      Bônus de Proficiência
                    </span>
                    <span className="text-2xl font-mono font-bold text-emerald-400">
                      +{derivedStats.proficiencyBonus}
                    </span>
                  </div>
                </div>

                {/* Final Ability Scores Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  {ABILITY_KEYS.map((key) => {
                    const score = finalAbilityScores[key];
                    const mod = calculateModifier(score);
                    return (
                      <div
                        key={key}
                        className="p-3 rounded-lg bg-slate-950/90 border border-amber-900/40 text-center"
                      >
                        <span className="text-xs font-bold text-amber-400 block">
                          {ABILITY_LABELS[key].short}
                        </span>
                        <span className="text-xl font-mono font-bold text-amber-50">
                          {score}
                        </span>
                        <span className="text-xs font-mono text-slate-400 block">
                          ({formatModifier(mod)})
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Consolidated Skills Summary */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/40 space-y-2">
                  <span className="text-xs font-semibold uppercase text-slate-400 block">
                    Perícias de Treinamento Consolidadas
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Set([
                        ...selectedClassSkills,
                        ...(selectedBackground?.skillProficiencies ?? []),
                      ])
                    ).map((sk) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                      >
                        {translateReferenceName(sk)}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-amber-900/40 pb-12">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="w-32 border-amber-900/40 bg-slate-900 hover:bg-slate-800 text-amber-100"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {currentStep < WIZARD_STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={currentStep === 5 && !isStep5Valid}
              className="w-36 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleCreateCharacter}
              disabled={createCharacterMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-6 shadow-lg shadow-amber-600/20"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {createCharacterMutation.isPending
                ? "Criando..."
                : "Criar Personagem"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
