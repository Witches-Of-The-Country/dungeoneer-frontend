"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Sparkles,
  Award,
  Package,
  Users,
  Skull,
  UserCheck,
  ChevronRight,
  Crown,
} from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

interface EncyclopediaCategory {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  dmOnly?: boolean;
}

const CATEGORIES: EncyclopediaCategory[] = [
  {
    id: "classes",
    name: "Arquétipos",
    description: "Classes marciais, arcanas e divinas com progressão e habilidades.",
    href: "/encyclopedia/classes",
    icon: Shield,
  },
  {
    id: "spells",
    name: "Magias",
    description: "Grimório completo de truques e magias do 1º ao 9º círculo.",
    href: "/encyclopedia/spells",
    icon: Sparkles,
  },
  {
    id: "feats",
    name: "Talentos",
    description: "Proezas e especializações heroicas para aprimorar seu aventureiro.",
    href: "/encyclopedia/feats",
    icon: Award,
  },
  {
    id: "items",
    name: "Itens",
    description: "Equipamentos, armas, armaduras e relíquias mágicas lendárias.",
    href: "/encyclopedia/items",
    icon: Package,
  },
  {
    id: "lineages",
    name: "Linhagens",
    description: "Heranças ancestrais, espécies e características raciais do multiverso.",
    href: "/encyclopedia/lineages",
    icon: Users,
  },
  {
    id: "monsters",
    name: "Monstros",
    description: "Bestiário completo de criaturas, dragões e horrores para o Mestre.",
    href: "/encyclopedia/monsters",
    icon: Skull,
    dmOnly: true,
  },
  {
    id: "npcs",
    name: "NPCs",
    description: "Galeria de personagens não jogáveis, aliados e antagonistas.",
    href: "/encyclopedia/npcs",
    icon: UserCheck,
    dmOnly: true,
  },
];

export function EncyclopediaMenu() {
  const { isDM } = useAuth();

  const visibleCategories = CATEGORIES.filter((cat) => !cat.dmOnly || isDM);

  return (
    <div className="w-full space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Link
              key={category.id}
              href={category.href}
              className="group relative flex flex-col justify-between p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/50 hover:border-amber-500/40 transition-all duration-300 shadow-lg hover:shadow-amber-500/5 hover:-translate-y-0.5 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-amber-500/20 transition-all duration-500" />

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-amber-400 group-hover:text-amber-300 group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-colors duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  {category.dmOnly && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-300">
                      <Crown className="h-3 w-3" />
                      Mestre
                    </span>
                  )}
                </div>

                <h3 className="font-serif text-lg font-bold text-zinc-100 group-hover:text-amber-300 transition-colors duration-200">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed line-clamp-2">
                  {category.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-amber-400 transition-colors">
                <span>Explorar compêndio</span>
                <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
