'use client';

import React, { useMemo, useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { DropdownMenu, ContextMenuItem } from 'shared/components';
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

  const providerModels =
    provider === 'openai' || provider === 'anthropic'
      ? models.filter((m) => m.provider === provider)
      : [];

  const menuItems = useMemo(
    (): ContextMenuItem[] =>
      providerModels.map((model) => ({
        label: model.label,
        onClick: () => onChange(model.id),
      })),
    [providerModels, onChange]
  );

  const selectedModel = value ? providerModels.find((m) => m.id === value) : null;
  const selectedLabel = selectedModel?.label ?? (provider === 'auto' ? 'Auto' : 'Default');
  const showVisionWarning =
    hasImages && value && selectedModel && !selectedModel.supportsVision;

  if (provider === 'auto') {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        {showLabel && (
          <span className="font-medium text-gray-700 dark:text-gray-300 block mb-1">Model</span>
        )}
        <span>Auto (model chosen by system)</span>
      </div>
    );
  }

  if (providerModels.length === 0) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        {showLabel && (
          <span className="font-medium text-gray-700 dark:text-gray-300 block mb-1">Model</span>
        )}
        <span>Default</span>
      </div>
    );
  }

  const trigger = compact ? (
    <button
      type="button"
      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 rounded-md transition-colors"
      title={selectedModel?.description}
    >
      {showLabel && <span className="font-medium">{selectedLabel}</span>}
      <ChevronDown className="h-3 w-3" />
    </button>
  ) : (
    <button
      type="button"
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors w-full text-left"
    >
      <span className="flex-1">{selectedLabel}</span>
      <ChevronDown className="h-4 w-4" />
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
        menuLabel="Select AI model"
        align="start"
      >
        {trigger}
      </DropdownMenu>
    </div>
  );
}
