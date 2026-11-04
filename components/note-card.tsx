"use client";

import React, { useState } from "react";
import { CharacterNote, useUpdateCharacterNote } from "@/lib/api/characters";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Pencil } from "lucide-react";
import { toast } from "sonner";

interface NoteCardProps {
  note: CharacterNote;
  characterId?: string;
}

export function NoteCard({ note, characterId }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  const effectiveCharacterId = characterId || note.characterId;
  const updateNoteMutation = useUpdateCharacterNote(effectiveCharacterId);

  const formattedDate = new Date(note.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleStartEdit = () => {
    setTitle(note.title);
    setBody(note.body);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTitle(note.title);
    setBody(note.body);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();

    if (!trimmedTitle) {
      toast.error("O título da nota é obrigatório.");
      return;
    }
    if (!trimmedBody) {
      toast.error("O conteúdo da nota é obrigatório.");
      return;
    }

    try {
      await updateNoteMutation.mutateAsync({
        noteId: note.id,
        payload: {
          title: trimmedTitle,
          body: trimmedBody,
        },
      });
      toast.success("Nota atualizada com sucesso!");
      setIsEditing(false);
    } catch {
      // Handled by apiFetch or toast
    }
  };

  return (
    <Card className="bg-slate-950/80 border border-amber-900/40 text-amber-50 shadow-md">
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between space-y-0">
        {isEditing ? (
          <div className="w-full mr-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da nota"
              className="bg-slate-900 border-amber-900/50 text-amber-100 font-serif font-bold text-sm h-8"
              aria-label="Título da nota editável"
            />
          </div>
        ) : (
          <CardTitle className="text-base font-serif font-bold text-amber-200">
            {note.title}
          </CardTitle>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center text-xs text-slate-400 gap-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-500/80" />
            <span>{formattedDate}</span>
          </div>
          {!isEditing && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStartEdit}
              aria-label="Editar nota"
              className="h-7 w-7 p-0 text-slate-400 hover:text-amber-300 hover:bg-slate-800"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-1 text-sm text-slate-300 leading-relaxed">
        {isEditing ? (
          <div className="space-y-3 mt-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="Conteúdo da nota"
              className="w-full rounded-md bg-slate-900 border border-amber-900/50 p-2.5 text-sm text-amber-50 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              aria-label="Conteúdo da nota editável"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateNoteMutation.isPending}
                className="border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 h-8"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={updateNoteMutation.isPending}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold h-8"
              >
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{note.body}</div>
        )}
      </CardContent>
    </Card>
  );
}
