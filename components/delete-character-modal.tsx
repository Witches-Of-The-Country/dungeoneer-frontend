"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DeleteCharacterModalProps {
  open: boolean;
  characterName: string;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCharacterModal({
  open,
  characterName,
  isDeleting = false,
  onCancel,
  onConfirm,
}: DeleteCharacterModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <Card className="w-full max-w-md bg-slate-950 border border-red-900/60 shadow-2xl text-amber-50">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle
                id="delete-modal-title"
                className="text-xl font-serif tracking-wide text-red-200"
              >
                Excluir Personagem
              </CardTitle>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Fechar modal"
              className="text-slate-400 hover:text-amber-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <CardDescription className="text-slate-300 text-sm">
            Tem certeza que deseja excluir permanentemente{" "}
            <strong className="text-amber-300 font-semibold">
              {characterName}
            </strong>
            ? Esta ação apagará os registros da masmorra e não poderá ser
            desfeita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/40 text-xs text-red-200/90">
            Todos os atributos, notas de campanha e progressão de nível serão
            perdidos para sempre.
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="border-amber-900/40 bg-slate-900 hover:bg-slate-800 text-slate-200"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-700 hover:bg-red-600 text-white font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
