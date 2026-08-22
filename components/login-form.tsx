"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
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

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl border-border/50 bg-card/80 backdrop-blur-sm relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none group-hover:opacity-75 transition-opacity duration-500" />
      <CardHeader className="space-y-2 pb-6 relative z-10 text-center">
        <CardTitle className="text-3xl font-serif text-primary tracking-wide">
          Dungeoneer
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Aventure-se na escuridão. Faça login para continuar sua jornada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative z-10">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Email Místico
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              name="email_dungeoneer"
              type="email"
              autoComplete="off"
              placeholder="seu@email.aventureiro"
              className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-medium flex items-center justify-between">
            <span>Palavra-Passe</span>
            <span className="text-xs text-primary hover:underline cursor-pointer">Esqueceu?</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password_dungeoneer"
              autoComplete="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pl-10 pr-10 bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4 relative z-10">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          Desvendar os Mistérios
        </Button>
        <p className="text-sm text-center text-muted-foreground w-full">
          Um novo aventureiro?{" "}
          <a href="/register" className="text-primary hover:underline font-medium">
            Junte-se à Guilda
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
