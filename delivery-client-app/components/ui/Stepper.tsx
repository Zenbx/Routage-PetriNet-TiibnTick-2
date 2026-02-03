"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: number;
  label: string;
  icon: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-8">
      <div className="flex items-center justify-between relative">
        {/* Ligne de progression - AMÉLIORÉE */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-border -z-10 rounded-full">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Steps */}
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div
              key={step.id}
              className="flex flex-col items-center gap-2 relative z-10"
            >
              {/* Cercle de l'étape */}
              <div
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 shadow-lg",
                  isCompleted &&
                    "bg-primary border-primary text-white",
                  isActive &&
                    "bg-primary border-primary text-white scale-110 shadow-primary/50",
                  !isCompleted &&
                    !isActive &&
                    "bg-background-card border-border text-text-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  (isActive || isCompleted) && "text-primary",
                  !isActive && !isCompleted && "text-text-muted"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
