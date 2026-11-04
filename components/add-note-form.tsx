"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Feather } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddCharacterNote } from "@/lib/api/characters";

export const addNoteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "O título da nota é obrigatório.")
    .max(255, "O título deve ter no máximo 255 caracteres."),
  body: z
    .string()
    .trim()
    .min(1, "O corpo da nota é obrigatório.")
    .max(10000, "O corpo da nota deve ter no máximo 10.000 caracteres."),
});

export type AddNoteFormValues = z.infer<typeof addNoteSchema>;

interface AddNoteFormProps {
  characterId: string;
}

export function AddNoteForm({ characterId }: AddNoteFormProps) {
  const addNoteMutation = useAddCharacterNote(characterId);

  const form = useForm<AddNoteFormValues>({
    resolver: zodResolver(addNoteSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const onSubmit = async (values: AddNoteFormValues) => {
    try {
      await addNoteMutation.mutateAsync({
        title: values.title.trim(),
        body: values.body.trim(),
      });
      toast.success("Nota adicionada com sucesso!");
      form.reset();
    } catch {
      // Handled by apiFetch or toast
    }
  };

  return (
    <Card className="bg-slate-900/90 border border-amber-900/40 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-serif text-amber-200 flex items-center gap-2">
          <Feather className="w-4 h-4 text-amber-400" />
          Nova Anotação
        </CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="note-title" className="text-amber-100 text-xs">
              Título da Nota
            </Label>
            <Input
              id="note-title"
              placeholder="Ex: Pista na taverna, Recompensa prometida..."
              {...form.register("title")}
              className="bg-slate-950 border-amber-900/50 text-amber-50 placeholder:text-slate-500"
            />
            {form.formState.errors.title && (
              <p className="text-xs text-red-400">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note-body" className="text-amber-100 text-xs">
              Conteúdo
            </Label>
            <textarea
              id="note-body"
              rows={4}
              placeholder="Descreva detalhes, diálogos, itens obtidos..."
              {...form.register("body")}
              className="w-full rounded-md bg-slate-950 border border-amber-900/50 p-3 text-sm text-amber-50 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
            {form.formState.errors.body && (
              <p className="text-xs text-red-400">
                {form.formState.errors.body.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={addNoteMutation.isPending}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              {addNoteMutation.isPending ? "Adicionando..." : "Adicionar Nota"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
