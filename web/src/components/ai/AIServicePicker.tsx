'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles, Zap, Brain, ChevronDown } from 'lucide-react';
import { DropdownMenu, ContextMenuItem } from 'shared/components';

export type AIProvider = 'auto' | 'openai' | 'anthropic';

interface AIServicePickerProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
  compact?: boolean;
  showLabel?: boolean;
  className?: string;
}

const PROVIDER_OPTIONS: Array<{
  value: AIProvider;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number | string }>;
}> = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Let AI choose based on query complexity',
    icon: Sparkles,
  },
  {
    value: 'openai',
    label: 'OpenAI',
    description: 'Best for general queries and conversations',
    icon: Zap,
  },
  {
    value: 'anthropic',
    label: 'Anthropic',
    description: 'Best for complex analysis and reasoning',
    icon: Brain,
  },
];

export default function AIServicePicker({
  value,
  onChange,
  compact = false,
  showLabel = true,
  className = '',
}: AIServicePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = useMemo(
    (): ContextMenuItem[] =>
      PROVIDER_OPTIONS.map((option) => {
        const OptionIcon = option.icon;
        return {
          icon: <OptionIcon className="h-4 w-4" />,
          label: option.label,
          onClick: () => onChange(option.value),
        };
      }),
    [onChange]
  );

  const selectedProvider = PROVIDER_OPTIONS.find((p) => p.value === value) || PROVIDER_OPTIONS[0];
  const Icon = selectedProvider.icon;

  const trigger = compact ? (
    <button
      type="button"
      className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 rounded-md transition-colors"
      title={selectedProvider.description}
    >
      <Icon className="h-3.5 w-3.5" />
      {showLabel && <span className="font-medium">{selectedProvider.label}</span>}
      <ChevronDown className="h-3 w-3" />
    </button>
  ) : (
    <button
      type="button"
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span>{selectedProvider.label}</span>
      <ChevronDown className="h-4 w-4" />
    </button>
  );

  return (
    <div className={className}>
      <DropdownMenu
        open={isOpen}
        onOpenChange={setIsOpen}
        items={menuItems}
        menuLabel="Select AI provider"
        align="start"
      >
        {trigger}
      </DropdownMenu>
    </div>
  );
}
