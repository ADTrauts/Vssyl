"use client";

import React from 'react';

type Step = {
  label: string;
};

type StepperProps = {
  steps: Step[];
  activeStep: number;
  onStepChange?: (step: number) => void;
};

export const Stepper: React.FC<StepperProps> = ({ steps, activeStep, onStepChange }) => (
  <div className="flex items-center gap-4">
    {steps.map((step, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <button
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${idx === activeStep ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'} ${onStepChange ? 'cursor-pointer' : 'cursor-default'}`}
          onClick={() => onStepChange?.(idx)}
          disabled={!onStepChange}
        >
          {idx + 1}
        </button>
        <span className={`text-sm ${idx === activeStep ? 'font-bold text-blue-600' : 'text-gray-600'}`}>{step.label}</span>
        {idx < steps.length - 1 && <span className="w-8 h-1 bg-gray-200 rounded" />}
      </div>
    ))}
  </div>
); 