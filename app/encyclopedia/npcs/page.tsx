"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, ShieldAlert, ArrowLeft, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";

export default function NPCsPage() {
  const { isDM, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500" />
      </div>
    );
  }

  if (!isDM) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl">
        <div className="p-8 rounded-2xl border border-red-900/50 bg-red-950/20 backdrop-blur-sm text-center space-y-4 shadow-2xl">
          <div className="inline-flex p-3 rounded-full bg-red-900/30 border border-red-800/60 text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-red-200">
            Acesso Restrito ao Mestre do Jogo
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Apenas Mestres com a role correspondente têm autorização para gerenciar a galeria de NPCs e encontros de campanha.
          </p>
          <div className="pt-2">
            <Link href="/characters">
              <Button variant="outline" className="border-zinc-800 hover:bg-zinc-800 text-zinc-200">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 mb-1">
            <Crown className="h-3.5 w-3.5" />
            Exclusivo para Mestres
          </div>
          <h1 className="font-serif text-3xl font-bold text-zinc-100 tracking-wide">
            Galeria de NPCs
          </h1>
          <p className="text-sm text-zinc-400">
            Fichas rápidas de personagens não-jogáveis, aliados e antagonistas para campanhas.
          </p>
        </div>
        <Link href="/characters">
          <Button variant="ghost" className="text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/60">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-12 text-center shadow-2xl backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-zinc-800/90 border border-zinc-700/60 text-amber-400 shadow-inner">
            <UserCheck className="h-12 w-12" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-zinc-800 border border-zinc-700 text-amber-300">
              Em breve
            </span>
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              A Galeria de NPCs está sendo preparada
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A ferramenta de consulta e gestão de NPCs para campanhas estará disponível em breve.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link href="/characters">
              <Button className="bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
