"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Code,
  Menu,
  LogOut,
  User as UserIcon,
  Sparkles,
  ScrollText,
  Crown,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/lib/hooks/use-auth";

export function Navbar() {
  const { user, isAuthenticated, isLoading, isDM, logout, toggleDM } = useAuth();
  const [togglingDm, setTogglingDm] = useState(false);
  const router = useRouter();
  const logoHref = !isLoading && isAuthenticated ? "/characters" : "/";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleToggleDm = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (togglingDm) return;
    setTogglingDm(true);
    try {
      const res = await toggleDM();
      const nowDm = res.user?.roles?.includes("DUNGEON_MASTER");
      toast.success(
        nowDm
          ? "Modo Mestre de Jogo (DM) ativado!"
          : "Modo Mestre de Jogo (DM) desativado."
      );
    } catch {
      toast.error("Não foi possível alternar o modo Mestre.");
    } finally {
      setTogglingDm(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto py-2 md:py-2.5 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href={logoHref} className="flex items-center">
            <Image
              src="/logo.png"
              alt="Dungeoneer"
              width={370}
              height={120}
              className="h-14 sm:h-16 md:h-20 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <ModeToggle />
          <Link
            href="https://github.com/Kevinrehem/Dungeoneer"
            target="_blank"
          >
            <Button variant="ghost" size="icon">
              <Code className="w-5 h-5" />
            </Button>
          </Link>

          {!isLoading && isAuthenticated && user ? (
            <>
              <Link href="/characters">
                <Button variant="ghost" className="flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-primary" />
                  Meus Personagens
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-primary/30"
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.nickname || "Avatar"}
                        className="w-5 h-5 rounded-full object-cover border border-primary/50"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-primary" />
                    )}
                    <span>{user.nickname || user.email}</span>
                    {isDM && (
                      <span className="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Crown className="w-3 h-3" />
                        Mestre
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          {user.nickname}
                        </p>
                        {isDM && (
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                            Mestre
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="w-full cursor-pointer flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-primary" /> Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleToggleDm}
                    disabled={togglingDm}
                    data-testid="navbar-toggle-dm"
                    className="w-full cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Crown className={`w-4 h-4 ${isDM ? "text-amber-400" : "text-muted-foreground"}`} />
                      Modo Mestre (DM)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isDM
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {togglingDm ? "..." : isDM ? "ATIVO" : "OFF"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/characters"
                      className="w-full cursor-pointer flex items-center gap-2"
                    >
                      <ScrollText className="w-4 h-4" /> Meus Personagens
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/characters/new"
                      className="w-full cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-primary" /> Criar
                      Personagem
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button>Cadastrar</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuItem asChild>
                <Link
                  href="https://github.com/Kevinrehem/Dungeoneer"
                  target="_blank"
                  className="w-full cursor-pointer flex items-center gap-2"
                >
                  <Code className="w-4 h-4" /> Repositório
                </Link>
              </DropdownMenuItem>

              {!isLoading && isAuthenticated && user ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center justify-between">
                    <span>{user.nickname || user.email}</span>
                    {isDM && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        Mestre
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="w-full cursor-pointer flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-primary" /> Meu Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleToggleDm}
                    disabled={togglingDm}
                    className="w-full cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Crown className={`w-4 h-4 ${isDM ? "text-amber-400" : "text-muted-foreground"}`} />
                      Modo Mestre (DM)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isDM
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {togglingDm ? "..." : isDM ? "ATIVO" : "OFF"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/characters"
                      className="w-full cursor-pointer flex items-center gap-2"
                    >
                      <ScrollText className="w-4 h-4" /> Meus Personagens
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/characters/new"
                      className="w-full cursor-pointer flex items-center gap-2 text-primary font-medium"
                    >
                      <Sparkles className="w-4 h-4" /> Criar Personagem
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="w-full cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full cursor-pointer">
                      Entrar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/register"
                      className="w-full cursor-pointer text-primary font-medium"
                    >
                      Cadastrar
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
