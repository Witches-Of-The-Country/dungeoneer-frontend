"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { login } from "@/lib/api/auth";
import { useAuth } from "@/lib/hooks/use-auth";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "A senha é obrigatória."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect");
  const { isAuthenticated, isLoading, logout } = useAuth();
  const hasCleanedStaleSessionRef = useRef(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // If redirected by middleware due to an invalid/missing cookie,
    // clear any stale in-memory/localStorage session once on initial mount
    // to prevent infinite bounce loop while avoiding logging out a newly authenticated user.
    if (redirectTarget && !hasCleanedStaleSessionRef.current) {
      hasCleanedStaleSessionRef.current = true;
      if (isAuthenticated) {
        logout();
      }
      return;
    }

    // Only auto-redirect if the user navigated to /login directly without a redirect parameter.
    // When redirectTarget is present, navigation is explicitly handled by onSubmit upon successful login.
    if (!redirectTarget && !isLoading && isAuthenticated) {
      router.replace("/characters");
    }
  }, [isAuthenticated, isLoading, redirectTarget, logout, router]);

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(values);
      toast.success("Bem-vindo de volta à Guilda!");
      const safeTarget =
        redirectTarget && redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
          ? redirectTarget
          : "/characters";
      router.push(safeTarget);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Erro desconhecido ao autenticar.");
      }
    } finally {
      setLoading(false);
    }
  }

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 relative z-10">
            {errorMessage && (
              <div className="p-3 text-sm rounded bg-destructive/15 text-destructive border border-destructive/30">
                {errorMessage}
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium">
                    Email Místico
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground font-medium flex items-center justify-between">
                    <span>Palavra-Passe</span>
                    <span className="text-xs text-primary hover:underline cursor-pointer">
                      Esqueceu?
                    </span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:border-primary transition-all placeholder:text-muted-foreground/60"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 relative z-10">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? "Desvendando..." : "Desvendar os Mistérios"}
            </Button>
            <p className="text-sm text-center text-muted-foreground w-full">
              Um novo aventureiro?{" "}
              <a href="/register" className="text-primary hover:underline font-medium">
                Junte-se à Guilda
              </a>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
