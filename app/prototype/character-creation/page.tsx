"use client"

import * as React from "react"
import { useState } from "react"
import { Stepper } from "@/components/ui/stepper"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, User, Shield, BookOpen, Map, Dices, Eye } from "lucide-react"

const steps = [
  { title: "Nome & Regras" },
  { title: "Linhagem" },
  { title: "Classe" },
  { title: "Antecedente" },
  { title: "Atributos" },
  { title: "Revisão" },
]

export default function CharacterCreationPrototype() {
  const [currentStep, setCurrentStep] = useState(1)

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-foreground p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="space-y-4 pt-4">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-amber-50 text-center tracking-tight">
            Crie seu Personagem
          </h1>
          <p className="text-muted-foreground text-center">
            Forje seu destino neste mundo de fantasia sombria.
          </p>
        </div>

        {/* Stepper */}
        <div className="bg-card/40 backdrop-blur-sm border border-border p-4 md:p-6 rounded-xl shadow-lg">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Content Area */}
        <div className="relative w-full overflow-hidden min-h-[500px]">
          {/* We use key={currentStep} to force re-render and trigger animate-in on each step change */}
          <div key={currentStep} className="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both ease-out">
            {currentStep === 1 && <StepNameRuleset />}
            {currentStep === 2 && <StepLineage />}
            {currentStep === 3 && <StepClass />}
            {currentStep === 4 && <StepBackground />}
            {currentStep === 5 && <StepAbilityScores />}
            {currentStep === 6 && <StepReview />}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border/50 pb-12">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            disabled={currentStep === 1}
            className="w-32 bg-background/50 hover:bg-background/80 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button 
            onClick={handleNext} 
            disabled={currentStep === steps.length}
            className="w-32 bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            {currentStep === steps.length ? "Concluir" : "Próximo"}
            {currentStep !== steps.length && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>

      </div>
    </div>
  )
}

function StepNameRuleset() {
  return (
    <Card className="border-muted bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-100">
          <User className="w-6 h-6 text-amber-500" />
          Nome & Regras
        </CardTitle>
        <CardDescription>
          Identifique seu personagem e escolha o conjunto de regras do D&D para esta campanha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="h-24 bg-muted/20 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic flex items-center gap-2">
              [ Espaço Reservado: Nome ]
            </span>
          </div>
          <div className="h-32 bg-muted/20 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic flex items-center gap-2">
              [ Espaço Reservado: Seleção de Regras (2014 / 2024) ]
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StepLineage() {
  return (
    <Card className="border-muted bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-100">
          <Map className="w-6 h-6 text-amber-500" />
          Linhagem
        </CardTitle>
        <CardDescription>
          Sua raça ou linhagem determina seus traços físicos e origem cultural.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-72 lg:h-96 col-span-1 bg-muted/20 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic text-center">
              [ Espaço Reservado: Lista de Linhagens ]
            </span>
          </div>
          <div className="h-72 lg:h-96 col-span-1 lg:col-span-2 bg-muted/10 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic text-center">
              [ Espaço Reservado: Detalhes e Traços da Linhagem ]
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StepClass() {
  return (
    <Card className="border-muted bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-100">
          <Shield className="w-6 h-6 text-amber-500" />
          Classe
        </CardTitle>
        <CardDescription>
          Sua classe determina seu papel, habilidades e aptidão em combate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-72 lg:h-96 col-span-1 bg-muted/20 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic text-center">
              [ Espaço Reservado: Lista de Classes ]
            </span>
          </div>
          <div className="h-72 lg:h-96 col-span-1 lg:col-span-2 bg-muted/10 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic text-center">
              [ Espaço Reservado: Detalhes da Classe, Dados de Vida e Magias ]
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StepBackground() {
  return (
    <Card className="border-muted bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-100">
          <BookOpen className="w-6 h-6 text-amber-500" />
          Antecedente
        </CardTitle>
        <CardDescription>
          O que você fazia antes de se tornar um aventureiro?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 lg:h-80 col-span-1 bg-muted/20 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic text-center">
              [ Espaço Reservado: Lista de Antecedentes ]
            </span>
          </div>
          <div className="h-64 lg:h-80 col-span-1 lg:col-span-2 bg-muted/10 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
            <span className="text-muted-foreground/50 italic text-center">
              [ Espaço Reservado: Proficiências e Talentos de Origem ]
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StepAbilityScores() {
  return (
    <Card className="border-muted bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-100">
          <Dices className="w-6 h-6 text-amber-500" />
          Atributos
        </CardTitle>
        <CardDescription>
          Determine seus atributos principais usando Conjunto Padrão, Compra de Pontos ou Rolagem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-20 mb-6 bg-muted/20 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
          <span className="text-muted-foreground/50 italic">
            [ Espaço Reservado: Abas de Métodos de Geração ]
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {["FOR", "DES", "CON", "INT", "SAB", "CAR"].map((stat) => (
             <div key={stat} className="h-40 bg-muted/10 hover:bg-muted/20 transition-colors border border-muted-foreground/20 rounded-md flex flex-col items-center justify-center p-4 gap-4">
               <span className="text-sm font-semibold text-muted-foreground">{stat}</span>
               <div className="w-16 h-16 bg-background/50 rounded flex items-center justify-center border border-muted text-xl font-mono text-muted-foreground">--</div>
             </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StepReview() {
  return (
    <Card className="border-muted bg-card/80 backdrop-blur shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-serif text-amber-100">
          <Eye className="w-6 h-6 text-amber-500" />
          Revisar & Criar
        </CardTitle>
        <CardDescription>
          Verifique os detalhes do seu personagem antes de finalizar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-[500px] bg-muted/10 border border-muted-foreground/20 rounded-md flex items-center justify-center p-4">
          <span className="text-muted-foreground/50 italic text-center">
            [ Espaço Reservado: Ficha Completa de Revisão ]
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
