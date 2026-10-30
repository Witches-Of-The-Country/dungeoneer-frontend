"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ScrollText,
  Edit3,
  Trash2,
  Shield,
  Heart,
  RefreshCw,
  Swords,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useCharacters,
  useDeleteCharacter,
  CharacterSummary,
} from "@/lib/api/characters";
import { DeleteCharacterModal } from "@/components/delete-character-modal";

export default function CharactersPage() {
  const { user } = useAuth();
  const {
    data: characters,
    isLoading,
    isError,
    error,
    refetch,
  } = useCharacters();
  const deleteMutation = useDeleteCharacter();

  const [characterToDelete, setCharacterToDelete] =
    useState<CharacterSummary | null>(null);

  const handleConfirmDelete = async () => {
    if (!characterToDelete) return;
    try {
      await deleteMutation.mutateAsync(characterToDelete.id);
      toast.success(
        `Personagem "${characterToDelete.name}" excluído com sucesso.`
      );
      setCharacterToDelete(null);
    } catch {
      // Error toast already triggered by apiFetch
    }
  };

  const sortedCharacters = React.useMemo(() => {
    if (!characters) return [];
    return [...characters].sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [characters]);

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-amber-900/40">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-400 tracking-wide">
            {user ? `Heróis de ${user.nickname}` : "Meus Personagens"}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Gerencie suas fichas de aventureiros nas regras D&amp;D 5e 2014 e
            2024.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Link href="/characters/new">
            <Button className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-600/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Personagem
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          data-testid="characters-loading"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[1, 2, 3].map((idx) => (
            <Card
              key={idx}
              className="bg-slate-900/60 border border-amber-900/30 animate-pulse h-64"
            >
              <CardHeader className="space-y-3">
                <div className="h-6 w-2/3 bg-slate-800 rounded" />
                <div className="h-4 w-1/2 bg-slate-800 rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-3 w-full bg-slate-800 rounded" />
                <div className="h-8 w-full bg-slate-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <Card className="bg-slate-900/80 border border-red-900/50 text-center py-10">
          <CardHeader>
            <CardTitle className="text-xl font-serif text-red-300">
              Falha ao carregar personagens
            </CardTitle>
            <CardDescription className="text-slate-400">
              {error instanceof Error
                ? error.message
                : "Não foi possível consultar suas fichas no momento."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-amber-700/50 text-amber-300 hover:bg-amber-950/40"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && sortedCharacters.length === 0 && (
        <Card className="bg-slate-900/70 border border-amber-900/40 shadow-2xl text-center py-14 px-6">
          <CardHeader className="items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Swords className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-serif text-amber-100">
              Nenhum aventureiro forjado ainda
            </CardTitle>
            <CardDescription className="text-slate-400 max-w-md mx-auto">
              A taverna está silenciosa. Crie seu primeiro personagem nas regras
              D&amp;D 5e (2014) ou 2024 Revisado para iniciar sua campanha.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pt-4">
            <Link href="/characters/new">
              <Button className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Criar Personagem
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}

      {/* Character Card Grid */}
      {!isLoading && !isError && sortedCharacters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCharacters.map((char) => {
            const hpPercent =
              char.hitPointsMax > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      Math.round(
                        (char.hitPointsCurrent / char.hitPointsMax) * 100
                      )
                    )
                  )
                : 100;

            const rulesetLabel =
              char.ruleset === "SRD_2024" ? "5e 2024" : "5e 2014";

            return (
              <Card
                key={char.id}
                className="bg-slate-900/80 border border-amber-900/40 hover:border-amber-500/60 transition-all duration-300 shadow-xl flex flex-col justify-between group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl font-serif text-amber-100 group-hover:text-amber-400 transition-colors">
                        {char.name}
                      </CardTitle>
                      <CardDescription className="text-slate-300 font-medium mt-1">
                        Nível {char.level} • {char.className} •{" "}
                        {char.lineageName}
                      </CardDescription>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
                      {rulesetLabel}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pb-4">
                  {/* HP Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-red-300 font-medium">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        Pontos de Vida
                      </span>
                      <span className="font-mono font-semibold text-amber-50">
                        {char.hitPointsCurrent} / {char.hitPointsMax} PV
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-emerald-600 transition-all duration-500"
                        style={{ width: `${hpPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Stats Row */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    {char.armorClass !== undefined && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Shield className="w-3.5 h-3.5 text-amber-400" />
                        CA {char.armorClass}
                      </span>
                    )}
                    {char.backgroundName && (
                      <span>Antecedente: {char.backgroundName}</span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-amber-900/30 flex items-center justify-between gap-2">
                  <Link href={`/characters/${char.id}`} className="flex-1">
                    <Button
                      size="sm"
                      className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold"
                    >
                      <ScrollText className="w-3.5 h-3.5 mr-1.5" />
                      Abrir Ficha
                    </Button>
                  </Link>
                  <Link href={`/characters/${char.id}/edit`}>
                    <Button
                      size="sm"
                      variant="outline"
                      aria-label={`Editar ${char.name}`}
                      className="border-amber-900/40 bg-slate-950 hover:bg-slate-800 text-amber-200"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Excluir ${char.name}`}
                    onClick={() => setCharacterToDelete(char)}
                    className="border-red-900/40 bg-slate-950 hover:bg-red-950/50 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Excluir
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <DeleteCharacterModal
        open={Boolean(characterToDelete)}
        characterName={characterToDelete?.name ?? ""}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setCharacterToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
