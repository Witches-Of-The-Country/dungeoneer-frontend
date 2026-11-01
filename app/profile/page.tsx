"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Shield, Crown, Sparkles, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/hooks/use-auth";
import { selfPromoteToDm } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading, isDM } = useAuth();
  const router = useRouter();
  const [promoting, setPromoting] = useState(false);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="w-5 h-5 animate-spin text-primary" />
          <span>Carregando dados do perfil...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para acessar seu perfil.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/login")} className="w-full">
              Fazer Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handlePromoteToDm = async () => {
    setPromoting(true);
    try {
      await selfPromoteToDm();
      toast.success("Parabéns! Você agora é um Mestre de Jogo (DM).");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao promover para Mestre.";
      toast.error(msg);
    } finally {
      setPromoting(false);
    }
  };

  const formattedBirthdate = user.birthdate
    ? user.birthdate.includes("-")
      ? user.birthdate.split("-").reverse().join("/")
      : user.birthdate
    : "Não informada";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Perfil de Aventureiro
        </h1>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-lg">
        <CardHeader className="flex flex-row items-center gap-4 pb-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold text-foreground">
                {user.nickname}
              </CardTitle>
              {isDM && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  Mestre de Jogo
                </span>
              )}
            </div>
            <CardDescription className="text-sm">
              Membro da Guilda Dungeoneer
            </CardDescription>
          </div>
        </CardHeader>

        <Separator className="bg-border/40" />

        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background/50 border border-border/40">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Email</p>
                <p className="text-sm font-semibold text-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-background/50 border border-border/40">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground font-medium">Data de Nascimento</p>
                <p className="text-sm font-semibold text-foreground">{formattedBirthdate}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Papéis Ativos
            </h3>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground border border-border/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Jogador (PLAYER)
              </span>

              {isDM ? (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  <Crown className="w-3.5 h-3.5 text-amber-400" /> Mestre de Jogo (DUNGEON_MASTER)
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/40 text-muted-foreground border border-dashed border-border/60">
                  Mestre de Jogo (Inativo)
                </span>
              )}
            </div>
          </div>

          {!isDM && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-200">
                    Deseja mestrar aventuras e criar conteúdo Homebrew?
                  </h4>
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    Como Mestre de Jogo (DM), você terá acesso à criação de magias, talentos, itens e
                    linhagens personalizadas, além da enciclopédia completa de monstros e futuros módulos
                    de gerenciamento de campanha.
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePromoteToDm}
                disabled={promoting}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-medium gap-2 shadow-md transition-all"
              >
                <Crown className="w-4 h-4" />
                {promoting ? "Promovendo..." : "Tornar-se Mestre de Jogo (DM)"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
