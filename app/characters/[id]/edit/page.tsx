"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  ABILITY_KEYS,
  ABILITY_LABELS,
} from "@/lib/api/characters";
import { DeleteCharacterModal } from "@/components/delete-character-modal";

export const editCharacterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do personagem é obrigatório.")
    .max(100, "O nome deve ter no máximo 100 caracteres."),
  hitPointsCurrent: z.coerce
    .number()
    .int()
    .min(0, "Os PV atuais não podem ser negativos."),
  hitPointsTemp: z.coerce
    .number()
    .int()
    .min(0, "Os PV temporários não podem ser negativos."),
});

export type EditCharacterFormValues = z.infer<typeof editCharacterSchema>;

export default function EditCharacterPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = typeof params?.id === "string" ? params.id : "";

  const { data: character, isLoading, isError } = useCharacter(characterId);
  const updateMutation = useUpdateCharacter();
  const deleteMutation = useDeleteCharacter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const form = useForm<EditCharacterFormValues>({
    resolver: zodResolver(editCharacterSchema),
    defaultValues: {
      name: "",
      hitPointsCurrent: 1,
      hitPointsTemp: 0,
    },
  });

  useEffect(() => {
    if (character) {
      form.reset({
        name: character.name,
        hitPointsCurrent: character.hitPointsCurrent,
        hitPointsTemp: character.hitPointsTemp ?? 0,
      });
    }
  }, [character, form]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="h-64 rounded-xl bg-slate-900/60 border border-amber-900/30 animate-pulse flex items-center justify-center text-amber-200 font-serif">
          Carregando dados para edição...
        </div>
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-red-300 font-serif mb-4">
          Não foi possível carregar o personagem para edição.
        </p>
        <Link href="/characters">
          <Button variant="outline">Voltar para Meus Personagens</Button>
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: EditCharacterFormValues) => {
    if (values.hitPointsCurrent > character.hitPointsMax) {
      form.setError("hitPointsCurrent", {
        message: `Os PV atuais não podem exceder o máximo (${character.hitPointsMax}).`,
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: character.id,
        payload: {
          name: values.name.trim(),
          hitPointsCurrent: values.hitPointsCurrent,
          hitPointsTemp: values.hitPointsTemp,
        },
      });
      toast.success("Alterações salvas com sucesso!");
      router.push(`/characters/${character.id}`);
    } catch {
      // handled by apiFetch
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

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <Link
          href={`/characters/${character.id}`}
          className="inline-flex items-center text-xs text-slate-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Voltar para a Ficha
        </Link>
      </div>

      {/* Immutable Character Properties Card */}
      <Card className="bg-slate-900/70 border border-amber-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-serif text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            Atributos Imutáveis de Criação
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Regras, nível, linhagem, classe, antecedente e atributos base são
            definidos na criação ou evolução de nível.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-300">
          <div className="flex flex-wrap gap-3">
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              Regras:{" "}
              <strong>
                {character.ruleset === "SRD_2024" ? "5e 2024" : "5e 2014"}
              </strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              Nível: <strong>{character.level}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              Classe: <strong>{character.archetype?.name}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              Linhagem: <strong>{character.lineage?.name}</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800">
              Antecedente: <strong>{character.background?.name}</strong>
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-1">
            {ABILITY_KEYS.map((k) => (
              <div
                key={k}
                className="p-2 rounded bg-slate-950/80 border border-slate-800 text-center"
              >
                <span className="text-[10px] text-amber-400 font-bold block">
                  {ABILITY_LABELS[k].short}
                </span>
                <span className="font-mono font-bold text-amber-100">
                  {character.abilityScores?.[k] ?? 10}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Editable Form */}
      <Card className="bg-slate-900/85 border border-amber-900/40 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-amber-200">
            Editar Personagem
          </CardTitle>
          <CardDescription className="text-slate-400">
            Atualize o nome e os Pontos de Vida atuais/temporários da ficha.
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-amber-100">
                Nome do Personagem
              </Label>
              <Input
                id="edit-name"
                {...form.register("name")}
                className="bg-slate-950 border-amber-900/50 text-amber-50"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-red-400">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-hp-current" className="text-amber-100">
                  Pontos de Vida Atuais (Máx: {character.hitPointsMax})
                </Label>
                <Input
                  id="edit-hp-current"
                  type="number"
                  min={0}
                  max={character.hitPointsMax}
                  {...form.register("hitPointsCurrent")}
                  className="bg-slate-950 border-amber-900/50 text-amber-50 font-mono"
                />
                {form.formState.errors.hitPointsCurrent && (
                  <p className="text-xs text-red-400">
                    {form.formState.errors.hitPointsCurrent.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-hp-temp" className="text-amber-100">
                  Pontos de Vida Temporários
                </Label>
                <Input
                  id="edit-hp-temp"
                  type="number"
                  min={0}
                  {...form.register("hitPointsTemp")}
                  className="bg-slate-950 border-amber-900/50 text-amber-50 font-mono"
                />
                {form.formState.errors.hitPointsTemp && (
                  <p className="text-xs text-red-400">
                    {form.formState.errors.hitPointsTemp.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-amber-900/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(true)}
              className="w-full sm:w-auto border-red-900/50 bg-slate-950 hover:bg-red-950/50 text-red-400"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Personagem
            </Button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/characters/${character.id}`)}
                className="border-amber-900/40 bg-slate-900 hover:bg-slate-800 text-slate-200"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

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
