"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Construction, Sparkles, ArrowRight, ShieldCheck, Dice6, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/use-auth";

export default function CharactersPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div>
          <h1 className="text-3xl font-serif text-primary tracking-wide">
            {user ? `Aventuras de ${user.nickname}` : "Meus Personagens"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {user ? `Conectado como ${user.email}. Gerencie suas fichas e aventure-se.` : "Gerencie suas fichas e aventure-se pelas regras de D&D 5e e 2024."}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <Link href="/prototype/character-creation">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Novo Personagem
            </Button>
          </Link>
          <Button variant="outline" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-primary/10 pointer-events-none">
          <Construction className="w-48 h-48 -mr-12 -mt-12" />
        </div>
        <CardHeader className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20 w-fit">
            <Construction className="w-3.5 h-3.5" />
            Em Construção
          </div>
          <CardTitle className="text-2xl font-serif text-foreground">
            A Forja de Heróis está sendo erguida
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            A autenticação com o <strong>auth-service</strong> foi concluída com sucesso! O módulo de persistência de fichas e dados de referência está em desenvolvimento nas próximas etapas do OpenSpec.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-background/50 border border-border/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Autenticação Ativa</p>
                <p className="text-xs text-muted-foreground">
                  Seu token JWT foi emitido e armazenado com segurança.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/40 flex items-start gap-3">
              <Dice6 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground">Protótipo Funcional Disponível</p>
                <p className="text-xs text-muted-foreground">
                  Você já pode testar o fluxo de 6 etapas de criação de ficha.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 border-t border-border/30 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Dungeoneer Companheiro v1.0.0
          </span>
          <Link href="/prototype/character-creation">
            <Button variant="outline" className="border-primary/40 hover:bg-primary/10 text-primary">
              Acessar Protótipo de Criação
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
