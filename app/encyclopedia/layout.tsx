'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Sparkles, Award, Shield, Users, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/encyclopedia/classes', label: 'Classes & Arquétipos', icon: Shield },
  { href: '/encyclopedia/spells', label: 'Magias', icon: Sparkles },
  { href: '/encyclopedia/feats', label: 'Talentos', icon: Award },
  { href: '/encyclopedia/items', label: 'Itens & Equipamentos', icon: BookOpen },
  { href: '/encyclopedia/lineages', label: 'Linhagens & Raças', icon: Users },
];

export default function EncyclopediaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Link href="/characters">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </Button>
            <div className="h-5 w-px bg-border/60" />
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-accent" />
              <h1 className="text-lg font-serif font-bold tracking-tight">Enciclopédia D&amp;D</h1>
            </div>
          </div>

          <div className="text-xs text-muted-foreground hidden md:block">
            SRD 5.1 &amp; SRD 5.2 sob licença <span className="font-medium text-foreground">CC-BY 4.0</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="border-t border-border/40 bg-card/30 overflow-x-auto no-scrollbar">
          <div className="container max-w-7xl mx-auto px-4 flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                    isActive
                      ? 'border-accent text-accent font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Mandatory Attribution Footer */}
      <footer className="border-t border-border/60 bg-card/20 py-6 text-xs text-muted-foreground">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-center md:text-left">
            This work includes material taken from the <strong>System Reference Document 5.1</strong> (&quot;SRD 5.1&quot;)
            and <strong>System Reference Document 5.2</strong> (&quot;SRD 5.2&quot;) by Wizards of the Coast LLC and
            available at{' '}
            <a
              href="https://dnd.wizards.com/resources/systems-reference-document"
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-2"
            >
              dnd.wizards.com
            </a>
            . The SRD 5.1 and SRD 5.2 are licensed under the Creative Commons Attribution 4.0 International License (CC-BY 4.0).
          </p>
          <p className="text-muted-foreground/60 shrink-0">
            Dungeoneer Companion &copy; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
