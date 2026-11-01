"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Shield, Crown, Sparkles, ArrowLeft, CheckCircle2, Camera } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/lib/hooks/use-auth";
import { updateAvatar } from "@/lib/api/auth";
import { processAvatarImage } from "@/lib/image-upload";
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
  const { user, isAuthenticated, isLoading, isDM, toggleDM } = useAuth();
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const dataUrl = await processAvatarImage(file);
      await updateAvatar(dataUrl);
      toast.success("Foto de perfil atualizada com sucesso!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao processar imagem.";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

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

  const handleToggleDm = async () => {
    setToggling(true);
    try {
      const res = await toggleDM();
      const nowDm = res.user?.roles?.includes("DUNGEON_MASTER");
      toast.success(
        nowDm
          ? "Modo Mestre de Jogo (DM) ativado!"
          : "Modo Mestre de Jogo (DM) desativado."
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao alternar papel de Mestre.";
      toast.error(msg);
    } finally {
      setToggling(false);
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
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <label
              htmlFor="profile-avatar-upload"
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-md transition-transform active:scale-95"
              title="Alterar Foto de Perfil"
            >
              <Camera className="w-3.5 h-3.5" />
              <input
                id="profile-avatar-upload"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={handleAvatarFileChange}
              />
            </label>
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
            <p className="text-xs text-muted-foreground">
              O papel de Jogador permanece sempre ativo. Clique em Mestre de Jogo para ativar ou desativar as ferramentas de criação Homebrew e mestria.
            </p>
            <div className="flex flex-wrap gap-3">
              <span
                data-testid="role-badge-player"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground border border-border/50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Jogador (PLAYER) — Fixo
              </span>

              <button
                type="button"
                data-testid="toggle-dm-role-button"
                disabled={toggling}
                onClick={handleToggleDm}
                aria-pressed={isDM}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                  isDM
                    ? "bg-amber-500/20 text-amber-200 border-amber-500/50 hover:bg-amber-500/30 shadow-sm"
                    : "bg-muted/40 text-muted-foreground border-dashed border-border/60 hover:border-amber-500/40 hover:text-amber-200"
                }`}
              >
                <Crown className={`w-3.5 h-3.5 ${isDM ? "text-amber-400" : "text-muted-foreground"}`} />
                <span>
                  {toggling
                    ? "Alternando..."
                    : isDM
                    ? "Mestre de Jogo (Ativo — Clique para desativar)"
                    : "Mestre de Jogo (Inativo — Clique para ativar)"}
                </span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-amber-200">
                  {isDM
                    ? "Modo Mestre de Jogo Ativo"
                    : "Deseja mestrar aventuras e criar conteúdo Homebrew?"}
                </h4>
                <p className="text-xs text-amber-300/80 leading-relaxed">
                  Como Mestre de Jogo (DM), você tem acesso à criação de magias, talentos, itens,
                  classes, subclasses e linhagens personalizadas na Enciclopédia, além de futuros módulos
                  de gerenciamento de campanha.
                </p>
              </div>
            </div>
            <Button
              onClick={handleToggleDm}
              disabled={toggling}
              variant={isDM ? "outline" : "default"}
              className={
                isDM
                  ? "w-full sm:w-auto border-amber-500/40 text-amber-200 hover:bg-amber-500/20 gap-2"
                  : "w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-white font-medium gap-2 shadow-md transition-all"
              }
            >
              <Crown className="w-4 h-4" />
              {toggling
                ? "Atualizando..."
                : isDM
                ? "Desativar Modo Mestre (DM)"
                : "Ativar Modo Mestre de Jogo (DM)"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
