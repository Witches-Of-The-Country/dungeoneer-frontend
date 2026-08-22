import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dice6, 
  Shield, 
  Map as MapIcon, 
  ScrollText, 
  Wand2, 
  Package,
  Code,
  Swords,
  Menu
} from "lucide-react";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header/Nav */}
      <header className="container mx-auto py-4 md:py-6 px-4 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xl md:text-2xl font-serif font-bold text-primary">Dungeoneer 🐉</span>
        </div>
        
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <ModeToggle />
          <Link href="https://github.com/Kevinrehem/Dungeoneer" target="_blank">
            <Button variant="ghost" size="icon">
              <Code className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="outline">Entrar</Button>
          <Button>Começar Jornada</Button>
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
                <span className="w-full cursor-pointer">Entrar</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <span className="w-full cursor-pointer text-primary font-medium">Começar Jornada</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-24 space-y-16 md:space-y-24">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <Badge variant="secondary" className="px-4 py-1 text-sm font-medium flex items-center gap-2">
            <Swords className="w-3 h-3" /> Em Desenvolvimento: Gerenciador de Fichas
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-primary">
            Sua próxima aventura <br className="hidden sm:block" /> começa aqui.
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed">
            O Dungeoneer é a ferramenta definitiva para mestres e jogadores de D&D 5e. 
            Gerencie campanhas, NPCs e fichas de personagens com uma interface moderna construída sob Clean Architecture.
          </p>
          <div className="flex flex-col w-full sm:w-auto sm:flex-row gap-4 pt-4">
            <Button size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 py-4 md:px-8 md:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all">
              Criar minha Campanha
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base md:text-lg px-6 py-4 md:px-8 md:py-6 rounded-xl border-2">
              Ver Documentação
            </Button>
          </div>
        </section>

        <Separator className="max-w-xs mx-auto" />

        {/* Current Focus Highlight */}
        <section className="bg-card/50 border border-border rounded-3xl p-6 md:p-12 shadow-sm">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-serif font-bold">O Coração do Sistema: <br/><span className="text-primary">Fichas de Personagem</span></h2>
              <p className="text-lg text-muted-foreground">
                Estamos focados em entregar o mais robusto gerenciador de fichas do mercado. 
                Utilizando os princípios de Clean Architecture, garantimos que cada atributo, 
                perícia e magia seja calculado com precisão matemática.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="bg-primary/20 p-1 rounded-full"><ScrollText className="w-4 h-4 text-primary" /></div>
                  <span className="font-medium">Cálculos automáticos de modificadores</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-primary/20 p-1 rounded-full"><Wand2 className="w-4 h-4 text-primary" /></div>
                  <span className="font-medium">Gestão inteligente de Spell Slots</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-primary/20 p-1 rounded-full"><Shield className="w-4 h-4 text-primary" /></div>
                  <span className="font-medium">Rastreamento dinâmico de condições e HP</span>
                </li>
              </ul>
            </div>
            <div className="bg-background rounded-2xl border border-border aspect-video flex items-center justify-center shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
               <ScrollText className="w-24 h-24 text-primary/40" />
               <div className="absolute bottom-4 right-4">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">Interface em WIP</Badge>
               </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="space-y-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold">Por que o Dungeoneer?</h2>
            <p className="text-muted-foreground mt-2">Tecnologia moderna a serviço da sua criatividade.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={<Package className="w-8 h-8" />}
              title="Clean Architecture"
              description="Design desacoplado e flexível, pronto para crescer e evoluir com o jogo."
            />
            <FeatureCard 
              icon={<MapIcon className="w-8 h-8" />}
              title="Gestão Unificada"
              description="Controle NPCs, Campanhas e Jogadores em um único lugar coeso."
            />
            <FeatureCard 
              icon={<Dice6 className="w-8 h-8" />}
              title="Rolagens Reais"
              description="Lógica de dados (Value Objects) que entende vantagem e desvantagem."
            />
            <FeatureCard 
              icon={<Wand2 className="w-8 h-8" />}
              title="Extensibilidade"
              description="Adicione itens, talentos (feats) e magias customizadas facilmente."
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-16 pb-8 border-t border-border flex flex-col items-center gap-4">
          <span className="text-primary font-serif font-bold text-lg">Dungeoneer</span>
          <p className="text-sm text-muted-foreground">© 2026 - Criado para aventureiros e mestres.</p>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/20 bg-card/30">
      <CardHeader>
        <div className="text-primary mb-2">{icon}</div>
        <CardTitle className="font-serif">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-foreground/80 leading-relaxed">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
