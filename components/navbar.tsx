"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Code, Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto py-4 md:py-6 px-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Link href="/">
          <span className="text-xl md:text-2xl font-serif font-bold text-primary">Dungeoneer 🐉</span>
        </Link>
      </div>
      
      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-4">
        <ModeToggle />
        <Link href="https://github.com/Kevinrehem/Dungeoneer" target="_blank">
          <Button variant="ghost" size="icon">
            <Code className="w-5 h-5" />
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="outline">Entrar</Button>
        </Link>
        <Link href="/register">
          <Button>Começar Jornada</Button>
        </Link>
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
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="https://github.com/Kevinrehem/Dungeoneer" target="_blank" className="w-full cursor-pointer flex items-center gap-2">
                <Code className="w-4 h-4" /> Repositório
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/login" className="w-full cursor-pointer">Entrar</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/register" className="w-full cursor-pointer text-primary font-medium">Começar Jornada</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      </div>
    </header>
  );
}
