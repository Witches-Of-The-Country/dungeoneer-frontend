"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, User, Shield, Sword } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const registerSchema = z.object({
  email: z.string().email("Email inválido."),
  nick: z.string().min(1, "Nickname é obrigatório."),
  birthdate: z.string().min(1, "Data de nascimento é obrigatória."),
  modules: z.array(z.string()).min(1, "Selecione pelo menos um módulo."),
  password: z
    .string()
    .min(10, "A senha deve ter pelo menos 10 caracteres.")
    .regex(/[a-zA-Z]/, "A senha deve conter pelo menos uma letra.")
    .regex(/[0-9]/, "A senha deve conter pelo menos um número.")
    .regex(/[^a-zA-Z0-9]/, "A senha deve conter pelo menos um símbolo especial."),
});

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      nick: "",
      birthdate: "",
      modules: [],
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    // Implementação futura do envio
    console.log(values);
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-border/50 bg-card/80 backdrop-blur-sm relative overflow-hidden group mt-8 mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none group-hover:opacity-75 transition-opacity duration-500" />
      <CardHeader className="space-y-2 pb-6 relative z-10 text-center">
        <CardTitle className="text-3xl font-serif text-primary tracking-wide">
          Dungeoneer
        </CardTitle>
        <CardDescription className="text-muted-foreground text-sm">
          Forje seu destino. Junte-se à Guilda dos Aventureiros.
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Email Místico</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="seu@email.aventureiro"
                        className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground/60"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nick"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Alcunha (Nick)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Aragorn"
                          className="pl-10 bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground/60"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="birthdate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground font-medium">Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="modules"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-foreground font-medium">Caminho da Guilda</FormLabel>
                  <FormDescription className="text-xs">
                    Como você trilhará sua jornada? (Selecione pelo menos um)
                  </FormDescription>
                  <FormControl>
                    <ToggleGroup
                      type="multiple"
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-4 pt-2"
                    >
                      <ToggleGroupItem
                        value="player"
                        aria-label="Toggle Player"
                        className="h-auto p-4 flex flex-col gap-3 items-center border border-border/50 bg-background/50 data-[state=on]:bg-primary/20 data-[state=on]:border-primary hover:bg-muted/50 transition-all rounded-xl cursor-pointer"
                      >
                        <Sword className="h-6 w-6 text-foreground" />
                        <div className="text-center space-y-1">
                          <span className="block font-medium text-foreground">Jogador</span>
                          <span className="block text-xs text-muted-foreground whitespace-normal">Desbrave masmorras</span>
                        </div>
                      </ToggleGroupItem>

                      <ToggleGroupItem
                        value="dm"
                        aria-label="Toggle Dungeon Master"
                        className="h-auto p-4 flex flex-col gap-3 items-center border border-border/50 bg-background/50 data-[state=on]:bg-primary/20 data-[state=on]:border-primary hover:bg-muted/50 transition-all rounded-xl cursor-pointer"
                      >
                        <Shield className="h-6 w-6 text-foreground" />
                        <div className="text-center space-y-1">
                          <span className="block font-medium text-foreground">Mestre</span>
                          <span className="block text-xs text-muted-foreground whitespace-normal">Crie mundos</span>
                        </div>
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">Palavra-Passe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••"
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground/60"
                        {...field}
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
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Forjar Destino
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center relative z-10 pt-4 border-t border-border/20">
        <p className="text-sm text-center text-muted-foreground">
          Já é um membro da Guilda?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Entrar
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
