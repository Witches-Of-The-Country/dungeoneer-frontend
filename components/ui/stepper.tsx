import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  title: string
  description?: string
}

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Step[]
  currentStep: number // 1-indexed
}

export function Stepper({ steps, currentStep, className, ...props }: StepperProps) {
  return (
    <div className={cn("flex flex-row items-start justify-between w-full", className)} {...props}>
      {steps.map((step, index) => {
        const stepNumber = index + 1
        const isCompleted = currentStep > stepNumber
        const isActive = currentStep === stepNumber
        
        return (
          <div key={step.title} className="flex flex-col items-center flex-1 relative group">
            {/* Connecting Line */}
            {index !== steps.length - 1 && (
              <div 
                className={cn(
                  "absolute top-4 left-[50%] w-full h-[2px] -z-10 transition-colors duration-300",
                  isCompleted ? "bg-amber-600/80" : "bg-muted-foreground/30"
                )} 
              />
            )}
            
            {/* Step Circle */}
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-bold transition-all duration-300 z-10 bg-background",
                isActive ? "border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-110" : 
                isCompleted ? "border-amber-600/80 bg-amber-600/10 text-amber-500" : 
                "border-muted-foreground/30 text-muted-foreground bg-muted/20"
              )}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            
            {/* Step Label */}
            <div className="mt-2 text-center w-full px-1">
              <div className={cn(
                "text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors duration-300 hidden sm:block",
                isActive ? "text-amber-500" : isCompleted ? "text-amber-600/80" : "text-muted-foreground/70"
              )}>
                {step.title}
              </div>
              
              {/* Mobile label fallback for current step only */}
              {isActive && (
                <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 sm:hidden mt-1">
                  {step.title}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
