'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import type { ChatModelDefinition } from '../../api/aiModels';

export type AIProvider = 'auto' | 'openai' | 'anthropic';

interface AIModelPickerProps {
  provider: AIProvider;
  value: string | null;
  onChange: (modelId: string | null) => void;
  models: ChatModelDefinition[];
  compact?: boolean;
  showLabel?: boolean;
  hasImages?: boolean;
  className?: string;
}

export default function AIModelPicker({
  provider,
  value,
  onChange,
  models,
  compact = false,
  showLabel = true,
  hasImages = false,
  className = '',
}: AIModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const providerModels = provider === 'openai' || provider === 'anthropic'
    ? models.filter((m) => m.provider === provider)
    : [];
  const selectedModel = value ? providerModels.find((m) => m.id === value) : null;
  const selectedLabel = selectedModel?.label ?? (provider === 'auto' ? 'Auto' : 'Default');
  const showVisionWarning = hasImages && value && selectedModel && !selectedModel.supportsVision;

  if (provider === 'auto') {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        {showLabel && <span className="font-medium text-gray-700 block mb-1">Model</span>}
        <span>Auto (model chosen by system)</span>
      </div>
    );
  }

  if (providerModels.length === 0) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        {showLabel && <span className="font-medium text-gray-700 block mb-1">Model</span>}
        <span>Default</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title={selectedModel?.description}
        >
          {showLabel && <span className="font-medium">{selectedLabel}</span>}
          <ChevronDown className="h-3 w-3" />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
            {providerModels.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => {
                  onChange(model.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  value === model.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium block">{model.label}</span>
                  <span className="text-xs text-gray-600 block truncate">{model.description}</span>
                  {(model.queryCost ?? 1) > 1 && (
                    <span className="text-xs text-gray-500 block">Uses {model.queryCost} queries</span>
                  )}
                </div>
                {value === model.id && (
                  <span className="h-2 w-2 rounded-full bg-purple-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {showVisionWarning && (
        <div className="flex items-center gap-2 mb-2 text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Selected model does not support images; attachments will be described as text only.</span>
        </div>
      )}
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
      >
        <span className="flex-1">{selectedLabel}</span>
        <ChevronDown className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[220px]">
          {providerModels.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onChange(model.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-start gap-2 px-4 py-3 text-left transition-colors ${
                value === model.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium block">{model.label}</span>
                <span className="text-xs text-gray-600 block">{model.description}</span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {model.costTier === 'premium' && (
                    <span className="text-xs text-gray-500">Premium</span>
                  )}
                  {(model.queryCost ?? 1) > 1 && (
                    <span className="text-xs text-gray-600">Uses {model.queryCost} queries per request</span>
                  )}
                </div>
              </div>
              {value === model.id && (
                <span className="h-2 w-2 rounded-full bg-purple-600 flex-shrink-0 mt-1.5" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
