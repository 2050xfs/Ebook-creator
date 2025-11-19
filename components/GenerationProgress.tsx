import React from 'react';
import { GenerationStep } from '../types';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface Props {
  steps: GenerationStep[];
  currentStepId: number;
}

export const GenerationProgress: React.FC<Props> = ({ steps, currentStepId }) => {
  return (
    <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur p-8 rounded-2xl border border-slate-800 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Constructing Asset...</h2>
      <div className="space-y-4 relative">
        {/* Connecting Line */}
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-800 -z-10" />
        
        {steps.map((step) => {
          const isActive = step.id === currentStepId;
          const isCompleted = step.id < currentStepId;
          
          return (
            <div key={step.id} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'scale-105' : 'opacity-60'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-slate-950 shrink-0 transition-colors
                ${isActive ? 'border-indigo-500 text-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 
                  isCompleted ? 'border-green-500 text-green-500 bg-green-500/10' : 'border-slate-700 text-slate-700'}
              `}>
                {isCompleted ? <CheckCircle2 size={20} /> : isActive ? <Loader2 size={20} className="animate-spin" /> : <Circle size={20} />}
              </div>
              <div>
                <p className={`font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{step.label}</p>
                {isActive && <p className="text-xs text-indigo-400 animate-pulse">AI Processing...</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};