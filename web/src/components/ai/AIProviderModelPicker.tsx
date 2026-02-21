'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Zap, Brain, ChevronDown, AlertCircle } from 'lucide-react';
import type { ChatModelDefinition } from '../../api/aiModels';

export type AIProvider = 'auto' | 'openai' | 'anthropic';

const PROVIDER_OPTIONS: Array<{
  value: AIProvider;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
}> = [
  { value: 'auto', label: 'Auto', description: 'Model chosen by system', icon: Sparkles },
  { value: 'openai', label: 'OpenAI', description: 'Best for general queries', icon: Zap },
  { value: 'anthropic', label: 'Anthropic', description: 'Best for complex analysis', icon: Brain },
];

interface AIProviderModelPickerProps {
  provider: AIProvider;
  model: string | null;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (modelId: string | null) => void;
  models: ChatModelDefinition[];
  compact?: boolean;
  showLabel?: boolean;
  hasImages?: boolean;
  className?: string;
}

export default function AIProviderModelPicker({
  provider,
  model,
  onProviderChange,
  onModelChange,
  models,
  compact = false,
  showLabel = true,
  hasImages = false,
  className = '',
}: AIProviderModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverProvider, setHoverProvider] = useState<AIProvider | null>(null);
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

  const providerForModels = hoverProvider ?? (provider !== 'auto' ? provider : null);
  const providerModels =
    providerForModels === 'openai' || providerForModels === 'anthropic'
      ? models.filter((m) => m.provider === providerForModels)
      : [];
  const selectedProviderOption = PROVIDER_OPTIONS.find((p) => p.value === provider) ?? PROVIDER_OPTIONS[0];
  const selectedModelDef =
    provider !== 'auto' && model
      ? models.find((m) => m.id === model && (m.provider === 'openai' || m.provider === 'anthropic') && m.provider === provider)
      : null;
  const displayLabel =
    provider === 'auto'
      ? 'Auto'
      : selectedModelDef
        ? `${selectedProviderOption.label} • ${selectedModelDef.label}`
        : `${selectedProviderOption.label} • Default`;
  const showVisionWarning =
    hasImages && provider !== 'auto' && model && selectedModelDef && !selectedModelDef.supportsVision;
  const Icon = selectedProviderOption.icon;

  const handleSelectProvider = (p: AIProvider) => {
    if (p === 'auto') {
      onProviderChange('auto');
      onModelChange(null);
      setIsOpen(false);
    } else {
      onProviderChange(p);
      setHoverProvider(p);
    }
  };

  const handleSelectModel = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  const triggerCompact = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      title={provider === 'auto' ? selectedProviderOption.description : selectedModelDef?.description ?? selectedProviderOption.description}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="font-medium">{displayLabel}</span>}
      <ChevronDown className="h-3 w-3" />
    </button>
  );

  const triggerFull = (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left min-w-[200px]"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 truncate">{displayLabel}</span>
      <ChevronDown className="h-4 w-4 flex-shrink-0" />
    </button>
  );

  const panel = isOpen && (
    <div
      className="absolute top-full left-0 mt-1 flex bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
      style={{ minWidth: compact ? 320 : 420 }}
    >
      {/* Left: providers */}
      <div className="w-[160px] border-r border-gray-100 flex-shrink-0 bg-gray-50/50">
        {PROVIDER_OPTIONS.map((opt) => {
          const OptIcon = opt.icon;
          const active = provider === opt.value;
          const hover = hoverProvider === opt.value;
          const showModels = (opt.value === 'openai' || opt.value === 'anthropic') && (hover || active);
          return (
            <button
              key={opt.value}
              type="button"
              onMouseEnter={() => setHoverProvider(opt.value === 'auto' ? null : opt.value)}
              onMouseLeave={() => setHoverProvider(null)}
              onClick={() => handleSelectProvider(opt.value)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                active ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <OptIcon className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{opt.label}</div>
                <div className="text-xs text-gray-500 truncate">{opt.description}</div>
              </div>
              {active && <span className="h-2 w-2 rounded-full bg-purple-600 flex-shrink-0" />}
              {showModels && (opt.value === 'openai' || opt.value === 'anthropic') && (
                <ChevronDown className="h-3 w-3 rotate-[-90deg] flex-shrink-0 text-gray-400" />
              )}
            </button>
          );
        })}
      </div>
      {/* Right: models for hovered/selected provider */}
      <div className="flex-1 min-w-[200px] max-h-[320px] overflow-y-auto">
        {providerForModels === 'openai' || providerForModels === 'anthropic' ? (
          providerModels.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No models available</div>
          ) : (
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Model
              </div>
              {providerModels.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectModel(m.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                    model === m.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block">{m.label}</span>
                    <span className="text-xs text-gray-600 block truncate">{m.description}</span>
                    {(m.queryCost ?? 1) > 1 && (
                      <span className="text-xs text-gray-500 block">Uses {m.queryCost} queries</span>
                    )}
                  </div>
                  {model === m.id && <span className="h-2 w-2 rounded-full bg-purple-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="p-4 text-sm text-gray-500">
            {providerForModels === null ? 'Select a provider' : 'Model chosen by system'}
          </div>
        )}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        {triggerCompact}
        {panel}
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
      {triggerFull}
      {panel}
    </div>
  );
}
