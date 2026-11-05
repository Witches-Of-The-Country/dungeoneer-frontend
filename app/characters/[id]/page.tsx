"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Shield,
  Heart,
  Zap,
  Footprints,
  Award,
  Dices,
  Edit3,
  Trash2,
  ArrowLeft,
  Plus,
  Minus,
  Save,
  Sparkles,
  Swords,
  BookOpen,
  Backpack,
  Star,
  AlertCircle,
  Camera,
  Moon,
  Sunrise,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { processAvatarImage } from "@/lib/image-upload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useCharacterNotes,
  useRerollAbilityScores,
  ABILITY_KEYS,
  ABILITY_LABELS,
  DND_SKILLS,
  getXpProgress,
  calculateModifier,
  formatModifier,
  normalizeAbilityKey,
} from "@/lib/api/characters";
import { DeleteCharacterModal } from "@/components/delete-character-modal";
import { NoteCard } from "@/components/note-card";
import { AddNoteForm } from "@/components/add-note-form";
import { XpProgressBar } from "@/components/character-sheet/xp-progress-bar";
import { AddXpModal } from "@/components/character-sheet/add-xp-modal";
import { LevelUpWizardModal } from "@/components/character-sheet/level-up-wizard-modal";
import { InventoryTab } from "@/components/character-sheet/inventory-tab";
import { FeatsTab } from "@/components/character-sheet/feats-tab";
import { ActionsTab } from "@/components/character-sheet/actions-tab";
import { RestModal } from "@/components/character-sheet/rest-modal";

type SheetTab =
  | "Resumo"
  | "Atributos"
  | "Perícias"
  | "Ações"
  | "Magias"
  | "Inventário"
  | "Talentos"
  | "Notas";

const SHEET_TABS: SheetTab[] = [
  "Resumo",
  "Atributos",
  "Perícias",
  "Ações",
  "Magias",
  "Inventário",
  "Talentos",
  "Notas",
];

export default function CharacterSheetPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = typeof params?.id === "string" ? params.id : "";

  const {
    data: character,
    isLoading,
    isError,
    error,
  } = useCharacter(characterId);
  const updateMutation = useUpdateCharacter();
  const deleteMutation = useDeleteCharacter();

  const [activeTab, setActiveTab] = useState<SheetTab>("Resumo");
  const rerollMutation = useRerollAbilityScores();
  const [isRerollingAbilities, setIsRerollingAbilities] = useState(false);

  const handleRerollAbilities = async () => {
    if (!character) return;
    setIsRerollingAbilities(true);
    try {
      await rerollMutation.mutateAsync({ id: character.id });
      toast.success("Atributos re-rolados com sucesso!");
    } catch {
      // handled by apiFetch / toast
    } finally {
      setIsRerollingAbilities(false);
    }
  };
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddXpModal, setShowAddXpModal] = useState(false);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [showRestModal, setShowRestModal] = useState(false);
  const [restModalMode, setRestModalMode] = useState<"SHORT" | "LONG">("SHORT");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [damageAmount, setDamageAmount] = useState("");
  const [healAmount, setHealAmount] = useState("");
  const autoOpenedForCharacterRef = useRef<string | null>(null);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !character) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await processAvatarImage(file);
      await updateMutation.mutateAsync({
        id: character.id,
        payload: { avatarUrl: dataUrl },
      });
      toast.success("Retrato do personagem atualizado!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao processar imagem.";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const { data: notes = [], isLoading: loadingNotes } =
    useCharacterNotes(characterId);

  useEffect(() => {
    if (!character) return;
    if (autoOpenedForCharacterRef.current === character.id) return;
    const xpState = getXpProgress(character.experiencePoints || 0, character.level);
    if ((xpState.canLevelUp || character.hasPendingLevelChoices) && character.level < 20) {
      autoOpenedForCharacterRef.current = character.id;
      setShowLevelUpModal(true);
    }
  }, [character]);

  if (isLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-12 px-4">
        <div className="h-64 rounded-xl bg-slate-900/60 border border-amber-900/30 animate-pulse flex items-center justify-center text-amber-200 font-serif">
          Abrindo pergaminho do personagem...
        </div>
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Card className="bg-slate-900/80 border border-red-900/50 text-center py-10">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-red-300">
              Ficha não encontrada
            </CardTitle>
            <CardDescription className="text-slate-400">
              {error instanceof Error
                ? error.message
                : "Não foi possível carregar os dados deste personagem."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/characters">
              <Button variant="outline" className="border-amber-700/50 text-amber-200">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Meus Personagens
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAdjustHp = async (delta: number) => {
    let nextCurrent = character.hitPointsCurrent;
    let nextTemp = character.hitPointsTemp ?? 0;

    if (delta < 0) {
      const damage = Math.abs(delta);
      const absorbedByTemp = Math.min(nextTemp, damage);
      nextTemp = nextTemp - absorbedByTemp;
      const remainingDamage = damage - absorbedByTemp;
      nextCurrent = Math.max(0, nextCurrent - remainingDamage);
    } else if (delta > 0) {
      nextCurrent = Math.min(character.hitPointsMax, nextCurrent + delta);
    }

    if (nextCurrent === character.hitPointsCurrent && nextTemp === (character.hitPointsTemp ?? 0)) return;

    try {
      await updateMutation.mutateAsync({
        id: character.id,
        payload: {
          name: character.name,
          hitPointsCurrent: nextCurrent,
          hitPointsTemp: nextTemp,
          notes: character.notes ?? "",
        },
      });
      toast.success(
        delta < 0
          ? `Dano aplicado! Vida atual: ${nextCurrent}/${character.hitPointsMax} PV (PV Temp: ${nextTemp})`
          : `Cura aplicada! Vida atual: ${nextCurrent}/${character.hitPointsMax} PV`
      );
    } catch {
      // handled by apiFetch
    }
  };

  const handleApplyDamage = () => {
    const amount = parseInt(damageAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      handleAdjustHp(-amount);
      setDamageAmount("");
    }
  };

  const handleApplyHeal = () => {
    const amount = parseInt(healAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      handleAdjustHp(amount);
      setHealAmount("");
    }
  };


  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(character.id);
      toast.success(`Personagem "${character.name}" excluído.`);
      setShowDeleteModal(false);
      router.push("/characters");
    } catch {
      // handled by apiFetch
    }
  };

  const rulesetLabel =
    character.ruleset === "SRD_2024" ? "5e 2024" : "5e 2014";

  const proficientSavingThrows = new Set(
    (character.archetype?.savingThrowProficiencies ?? [])
      .map(normalizeAbilityKey)
      .filter(Boolean)
  );

  const proficientSkillsLower = new Set(
    (character.background?.skillProficiencies ?? []).map((s) =>
      s.trim().toLowerCase()
    )
  );

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Top Back Link */}
      <div>
        <Link
          href="/characters"
          className="inline-flex items-center text-xs text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Voltar para Meus Personagens
        </Link>
      </div>

      {/* Sheet Header */}
      <XpProgressBar
        currentXp={character.experiencePoints || 0}
        currentLevel={character.level}
        hasPendingLevelChoices={character.hasPendingLevelChoices}
        onOpenAddXp={() => setShowAddXpModal(true)}
        onOpenLevelUp={() => setShowLevelUpModal(true)}
      />

      <Card className="bg-slate-900/90 border border-amber-900/40 shadow-2xl">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-800/40 flex items-center justify-center text-amber-400 overflow-hidden shadow-inner">
                {character.avatarUrl ? (
                  <img
                    src={character.avatarUrl}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Shield className="w-8 h-8 opacity-60" />
                )}
              </div>
              <label
                htmlFor="sheet-avatar-upload"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 cursor-pointer shadow-md transition-transform active:scale-95"
                title="Alterar Retrato"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="sheet-avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={handleAvatarFileChange}
                />
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-3xl font-serif font-bold text-amber-300">
                  {character.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {rulesetLabel}
                </span>
                {character.hasPendingLevelChoices && (
                  <button
                    type="button"
                    data-testid="pending-level-choices-badge"
                    onClick={() => setShowLevelUpModal(true)}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-600/25 hover:bg-amber-500/35 text-amber-200 border border-amber-500/50 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Escolhas de Nível Pendentes — Clique para evoluir
                  </button>
                )}
                {(character.exhaustion != null && character.exhaustion > 0) && (
                  <span
                    data-testid="sheet-exhaustion-badge"
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-950/80 text-red-300 border border-red-700/60 flex items-center gap-1 shadow-sm"
                    title={`Nível de Exaustão: ${character.exhaustion}`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    Exaustão: {character.exhaustion}
                  </span>
                )}
              </div>
              {(() => {
                const classDisplay =
                  character.classes && character.classes.length > 0
                    ? character.classes
                        .map(
                          (c) =>
                            `${c.className}${c.subclassName ? ` (${c.subclassName})` : ""}${character.classes!.length > 1 ? ` ${c.classLevel}` : ""}`
                        )
                        .join(" / ")
                    : (character.archetype?.name ?? "Classe");
                return (
                  <p className="text-sm text-slate-300">
                    Nível {character.level} • {classDisplay} •{" "}
                    {character.lineage?.name ?? "Linhagem"} •{" "}
                    {character.background?.name ?? "Antecedente"}
                  </p>
                );
              })()}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            <Button
              variant="outline"
              size="sm"
              data-testid="short-rest-btn"
              onClick={() => {
                setRestModalMode("SHORT");
                setShowRestModal(true);
              }}
              className="border-amber-900/50 bg-slate-950 hover:bg-slate-800 text-amber-200"
            >
              <Moon className="w-4 h-4 mr-1.5 text-amber-400" />
              Descanso Curto
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="long-rest-btn"
              onClick={() => {
                setRestModalMode("LONG");
                setShowRestModal(true);
              }}
              className="border-amber-900/50 bg-slate-950 hover:bg-slate-800 text-amber-200"
            >
              <Sunrise className="w-4 h-4 mr-1.5 text-amber-400" />
              Descanso Longo
            </Button>
            <Link href={`/characters/${character.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-900/50 bg-slate-950 hover:bg-slate-800 text-amber-200"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Editar
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              className="border-red-900/50 bg-slate-950 hover:bg-red-950/50 text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 8-Tab Navigation Bar */}
      <div
        role="tablist"
        aria-label="Seções da Ficha de Personagem"
        className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-900/80 border border-amber-900/40"
      >
        {SHEET_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-serif font-semibold transition-all ${
                isActive
                  ? "bg-amber-600 text-slate-950 shadow-md"
                  : "text-slate-300 hover:text-amber-200 hover:bg-slate-800/60"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* TAB 1: RESUMO */}
      {activeTab === "Resumo" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hit Points & Quick Adjust */}
          <Card className="bg-slate-900/80 border border-amber-900/40 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif text-amber-200 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                Pontos de Vida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span
                    data-testid="sheet-hp-current"
                    className="text-4xl font-mono font-bold text-amber-50"
                  >
                    {character.hitPointsCurrent}
                  </span>
                  <span className="text-lg font-mono text-slate-400">
                    {" "}
                    / {character.hitPointsMax} PV
                  </span>
                </div>
                <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                  PV Temp: {character.hitPointsTemp}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Reduzir PV"
                  disabled={
                    updateMutation.isPending ||
                    (character.hitPointsCurrent <= 0 &&
                      (character.hitPointsTemp ?? 0) <= 0)
                  }
                  onClick={() => handleAdjustHp(-1)}
                  className="flex-1 border-red-900/50 bg-slate-950 hover:bg-red-950/40 text-red-300"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  -1 PV
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-label="Aumentar PV"
                  disabled={
                    updateMutation.isPending ||
                    character.hitPointsCurrent >= character.hitPointsMax
                  }
                  onClick={() => handleAdjustHp(1)}
                  className="flex-1 border-emerald-900/50 bg-slate-950 hover:bg-emerald-950/40 text-emerald-300"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  +1 PV
                </Button>
              </div>

              {/* Linha 2: Controles Numéricos com Auto-Reset */}
              <div className="flex items-center gap-2 pt-1">
                {/* Lado esquerdo: Dano */}
                <div className="flex items-center gap-1.5 flex-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label="Aplicar Dano"
                    disabled={
                      updateMutation.isPending ||
                    (character.hitPointsCurrent <= 0 &&
                      (character.hitPointsTemp ?? 0) <= 0)
                    }
                    onClick={handleApplyDamage}
                    className="h-8 px-2.5 border-red-900/50 bg-slate-950 hover:bg-red-950/40 text-red-400"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Dano"
                    value={damageAmount}
                    onChange={(e) => setDamageAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyDamage();
                      }
                    }}
                    aria-label="Valor de dano"
                    className="h-8 text-xs bg-slate-950 border-red-900/40 text-red-200 placeholder:text-slate-500 font-mono"
                  />
                </div>

                {/* Lado direito: Cura */}
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Cura"
                    value={healAmount}
                    onChange={(e) => setHealAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyHeal();
                      }
                    }}
                    aria-label="Valor de cura"
                    className="h-8 text-xs bg-slate-950 border-emerald-900/40 text-emerald-200 placeholder:text-slate-500 font-mono"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-label="Aplicar Cura"
                    disabled={
                      updateMutation.isPending ||
                      character.hitPointsCurrent >= character.hitPointsMax
                    }
                    onClick={handleApplyHeal}
                    className="h-8 px-2.5 border-emerald-900/50 bg-slate-950 hover:bg-emerald-950/40 text-emerald-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Combat Stats */}
          <Card className="bg-slate-900/80 border border-amber-900/40 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif text-amber-200 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                Estatísticas de Combate
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/30 text-center">
                <span className="text-[11px] text-slate-400 block">
                  Classe de Armadura
                </span>
                <span
                  data-testid="sheet-ac"
                  className="text-2xl font-mono font-bold text-amber-300"
                >
                  {character.armorClass}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/30 text-center">
                <span className="text-[11px] text-slate-400 block">
                  Iniciativa
                </span>
                <span
                  data-testid="sheet-initiative"
                  className="text-2xl font-mono font-bold text-amber-300"
                >
                  {formatModifier(character.initiativeBonus)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/30 text-center">
                <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                  <Footprints className="w-3 h-3" /> Deslocamento
                </span>
                <span className="text-xl font-mono font-bold text-amber-100">
                  {character.speed} pés
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-900/30 text-center">
                <span className="text-[11px] text-slate-400 block flex items-center justify-center gap-1">
                  <Award className="w-3 h-3" /> Proficiência
                </span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  +{character.proficiencyBonus}
                </span>
              </div>
              <div className="col-span-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs px-4">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Dices className="w-4 h-4 text-amber-400" />
                  Dados de Vida
                </span>
                <span
                  data-testid="sheet-hit-dice-display"
                  className="font-mono font-bold text-amber-200"
                >
                  {(() => {
                    const totalAvailable =
                      character.classes && character.classes.length > 0
                        ? character.classes.reduce(
                            (acc, c) =>
                              acc +
                              (c.availableHitDice ??
                                Math.max(0, c.classLevel - (c.hitDiceSpent ?? 0))),
                            0
                          )
                        : character.level;
                    const hdBreakdown =
                      character.classes && character.classes.length > 0
                        ? character.classes
                            .map(
                              (c) =>
                                `${c.classLevel}${c.hitDie ? c.hitDie.toLowerCase() : "d8"}`
                            )
                            .join(" + ")
                        : `${character.level}${(character.archetype?.hitDice ?? "d8").toLowerCase()}`;
                    return `${totalAvailable}/${character.level} (${hdBreakdown})`;
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Saving Throws */}
          <Card className="bg-slate-900/80 border border-amber-900/40 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif text-amber-200 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Salvaguardas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ABILITY_KEYS.map((key) => {
                const label = ABILITY_LABELS[key];
                const isProf = proficientSavingThrows.has(key);
                const score = character.abilityScores?.[key] ?? 10;
                const baseMod = calculateModifier(score);
                const serverSave =
                  character.savingThrows?.[key.toUpperCase()] ??
                  character.savingThrows?.[key];
                const totalSave =
                  serverSave !== undefined
                    ? serverSave
                    : baseMod + (isProf ? character.proficiencyBonus : 0);

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isProf
                            ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                            : "bg-slate-700"
                        }`}
                      />
                      <span className="font-semibold text-amber-100">
                        {label.full} ({label.short})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-300">
                      {formatModifier(totalSave)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: ATRIBUTOS */}
      {activeTab === "Atributos" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ABILITY_KEYS.map((key) => {
              const label = ABILITY_LABELS[key];
              const score = character.abilityScores?.[key] ?? 10;
              const mod = calculateModifier(score);
              const isProf = proficientSavingThrows.has(key);

              return (
                <Card
                  key={key}
                  data-testid={`sheet-ability-card-${key}`}
                  className="bg-slate-900/85 border border-amber-900/40 text-center shadow-xl"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-serif text-amber-400 uppercase tracking-wider">
                      {label.short}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400">
                      {label.full}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-3xl font-mono font-bold text-amber-50">
                      {formatModifier(mod)}
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full bg-slate-950 border border-amber-900/50 text-sm font-mono font-semibold text-amber-200">
                      Valor: {score}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                      {isProf ? (
                        <span className="text-amber-300 font-medium">
                          ● Proficiente em Salvaguarda
                        </span>
                      ) : (
                        <span>○ Sem proficiência</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-slate-900/85 border border-amber-900/40 p-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif font-bold text-amber-200 text-sm flex items-center gap-2">
                  <Dices className="w-4 h-4 text-amber-400" />
                  Re-rolagem de Atributos (4d6kh3)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {!character.campaignId
                    ? "Ficha básica (fora de campanha): re-rolagem livre autorizada."
                    : character.allowAbilityReroll
                    ? "Re-rolagem autorizada pelo Mestre da Campanha."
                    : "Personagem vinculado a uma campanha: requer autorização do Mestre."}
                </p>
              </div>

              {!character.campaignId || character.allowAbilityReroll ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRerollAbilities}
                  disabled={isRerollingAbilities || rerollMutation.isPending}
                  className="border-amber-600/50 text-amber-200 hover:bg-amber-950/40 text-xs shrink-0"
                  data-testid="sheet-reroll-abilities-button"
                >
                  <Dices className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  {isRerollingAbilities || rerollMutation.isPending
                    ? "Re-rolando..."
                    : "Re-rolar Atributos"}
                </Button>
              ) : (
                <div
                  data-testid="sheet-reroll-locked-badge"
                  className="flex items-center gap-1.5 text-xs text-amber-500/80 bg-amber-950/40 px-3 py-1.5 rounded border border-amber-900/40"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Re-rolagem Bloqueada</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: PERÍCIAS */}
      {activeTab === "Perícias" && (
        <Card className="bg-slate-900/85 border border-amber-900/40 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-amber-200">
              Perícias (18 Perícias D&amp;D)
            </CardTitle>
            <CardDescription className="text-slate-400">
              Modificadores calculados a partir dos atributos e proficiências do
              antecedente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DND_SKILLS.map((skill) => {
                const isProf =
                  proficientSkillsLower.has(skill.enName.toLowerCase()) ||
                  proficientSkillsLower.has(skill.ptName.toLowerCase());
                const abilityScore =
                  character.abilityScores?.[skill.ability] ?? 10;
                const abilityMod = calculateModifier(abilityScore);
                const serverSkillMod =
                  character.skills?.[skill.enName] ??
                  character.skills?.[skill.ptName];
                const totalMod =
                  serverSkillMod !== undefined
                    ? serverSkillMod
                    : abilityMod + (isProf ? character.proficiencyBonus : 0);

                return (
                  <div
                    key={skill.id}
                    data-testid={`skill-row-${skill.id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-amber-900/30"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        data-testid={`skill-prof-${skill.id}`}
                        className={`w-2.5 h-2.5 rounded-full ${
                          isProf
                            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                            : "bg-slate-700"
                        }`}
                      />
                      <div>
                        <span className="text-sm font-medium text-amber-100">
                          {skill.ptName}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5 font-mono">
                          ({ABILITY_LABELS[skill.ability].short})
                        </span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {formatModifier(totalMod)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: NOTAS */}
      {activeTab === "Notas" && (
        <div className="space-y-6">
          <Card className="bg-slate-900/85 border border-amber-900/40 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-serif text-amber-200">
                Notas &amp; História do Personagem
              </CardTitle>
              <CardDescription className="text-slate-400">
                Registre antecedentes, traços de personalidade, crônicas e anotações
                de sessão de forma incremental.
              </CardDescription>
            </CardHeader>
          </Card>

          <AddNoteForm characterId={character.id} />

          <div className="space-y-4">
            <h3 className="text-lg font-serif font-bold text-amber-300">
              Anotações Registradas
            </h3>
            {loadingNotes ? (
              <div className="p-8 text-center text-sm text-amber-200/70 font-serif">
                Consultando pergaminhos...
              </div>
            ) : notes.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/60 border border-amber-900/30 text-center text-sm text-slate-400">
                Nenhuma anotação registrada ainda para este aventureiro.
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} characterId={character.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AÇÕES */}
      {activeTab === "Ações" && <ActionsTab character={character} />}

      {/* TAB 6: INVENTÁRIO */}
      {activeTab === "Inventário" && <InventoryTab character={character} />}

      {/* TAB 7: TALENTOS */}
      {activeTab === "Talentos" && (
        <div className="space-y-4">
          {character.background?.originFeatName && (
            <Card className="bg-slate-900/85 border border-amber-700/50 shadow-xl">
              <CardHeader>
                <CardTitle className="text-lg font-serif text-amber-300 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Talento de Origem: {character.background.originFeatName}
                </CardTitle>
                {character.background.originFeatDescription && (
                  <CardDescription className="text-slate-300">
                    {character.background.originFeatDescription}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          )}
          <FeatsTab character={character} />
        </div>
      )}

      {/* PLACEHOLDER TAB: MAGIAS */}
      {activeTab === "Magias" && (
        <div className="space-y-6">
          <Card className="bg-slate-900/80 border border-amber-900/40 shadow-xl text-center py-12 px-6">
            <CardHeader className="items-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <BookOpen className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Em breve
              </span>
              <CardTitle className="text-2xl font-serif text-amber-100">
                Grimório de Magias em Desenvolvimento
              </CardTitle>
              <CardDescription className="text-slate-400 max-w-md mx-auto">
                O módulo completo de preparação e slots de magias será desbloqueado nas próximas atualizações.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )}

      <AddXpModal
        isOpen={showAddXpModal}
        onClose={() => setShowAddXpModal(false)}
        characterId={character.id}
      />

      <LevelUpWizardModal
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        character={character}
      />

      <RestModal
        isOpen={showRestModal}
        onClose={() => setShowRestModal(false)}
        character={character}
        initialMode={restModalMode}
      />

      <DeleteCharacterModal
        open={showDeleteModal}
        characterName={character.name}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
