'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles, Zap, Brain, ChevronDown, AlertCircle } from 'lucide-react';
import { DropdownMenu, ContextMenuItem } from 'shared/components';
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

  const openaiModels = models.filter((m) => m.provider === 'openai');
  const anthropicModels = models.filter((m) => m.provider === 'anthropic');

  const menuItems = useMemo((): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [
      {
        icon: <Sparkles className="h-4 w-4" />,
        label: 'Auto',
        onClick: () => {
          onProviderChange('auto');
          onModelChange(null);
        },
      },
      { divider: true },
      { heading: true, label: 'OpenAI' },
      {
        label: 'Default',
        onClick: () => {
          onProviderChange('openai');
          onModelChange(null);
        },
      },
      ...openaiModels.map((m) => ({
        label: m.label,
        onClick: () => {
          onProviderChange('openai');
          onModelChange(m.id);
        },
      })),
      { divider: true },
      { heading: true, label: 'Anthropic' },
      {
        label: 'Default',
        onClick: () => {
          onProviderChange('anthropic');
          onModelChange(null);
        },
      },
      ...anthropicModels.map((m) => ({
        label: m.label,
        onClick: () => {
          onProviderChange('anthropic');
          onModelChange(m.id);
        },
      })),
    ];
    return items;
  }, [openaiModels, anthropicModels, onProviderChange, onModelChange]);

  const selectedProviderOption =
    PROVIDER_OPTIONS.find((p) => p.value === provider) ?? PROVIDER_OPTIONS[0];
  const selectedModelDef =
    provider !== 'auto' && model
      ? models.find(
          (m) =>
            m.id === model &&
            (m.provider === 'openai' || m.provider === 'anthropic') &&
            m.provider === provider
        )
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

  const trigger = compact ? (
    <button
      type="button"
      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 rounded-md transition-colors"
      title={
        provider === 'auto'
          ? selectedProviderOption.description
          : selectedModelDef?.description ?? selectedProviderOption.description
      }
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="font-medium">{displayLabel}</span>}
      <ChevronDown className="h-3 w-3" />
    </button>
  ) : (
    <button
      type="button"
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors text-left min-w-[200px]"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 truncate">{displayLabel}</span>
      <ChevronDown className="h-4 w-4 flex-shrink-0" />
    </button>
  );

  return (
    <div className={className}>
      {showVisionWarning && (
        <div className="flex items-center gap-2 mb-2 text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Selected model does not support images; attachments will be described as text only.</span>
        </div>
      )}
      {showLabel && !compact && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Model</label>
      )}
      <DropdownMenu
        open={isOpen}
        onOpenChange={setIsOpen}
        items={menuItems}
        menuLabel="Select AI provider and model"
        align="start"
      >
        {trigger}
      </DropdownMenu>
    </div>
  );
}
