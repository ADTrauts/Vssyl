'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Package } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getInstalledModules } from '../../api/modules';
import {
  getAvailableWidgets,
  getWidgetsByCategory,
  getIconShapeClass,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type WidgetRegistryEntry,
  type WidgetCategory,
} from './widgetRegistry';

type DashboardType = 'personal' | 'business' | 'educational' | 'household';

interface WidgetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (widgetType: string) => void;
  existingWidgetTypes: string[];
  dashboardType?: DashboardType;
  businessId?: string | null;
}

export default function WidgetPicker({
  isOpen,
  onClose,
  onSelect,
  existingWidgetTypes,
  dashboardType = 'personal',
  businessId = null,
}: WidgetPickerProps) {
  const { data: session } = useSession();
  const [installedModuleIds, setInstalledModuleIds] = useState<string[]>([]);
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<WidgetCategory | 'all'>('all');
  const [keepOpen, setKeepOpen] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !session?.accessToken) return;

    const opts =
      dashboardType === 'business' && businessId
        ? { scope: 'business' as const, businessId }
        : { scope: 'personal' as const };

    getInstalledModules(opts)
      .then((modules) => {
        setInstalledModuleIds(modules.map((m) => m.id || m.name));
        setModulesLoaded(true);
      })
      .catch(() => {
        setModulesLoaded(true);
      });
  }, [isOpen, session?.accessToken, dashboardType, businessId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setActiveCategory('all');
      setRecentlyAdded([]);
    }
  }, [isOpen]);

  const handleAddWidget = (widgetType: string) => {
    onSelect(widgetType);
    setRecentlyAdded((prev) => [...prev, widgetType]);
    if (!keepOpen) {
      onClose();
    }
  };

  const availableWidgets = useMemo(
    () => getAvailableWidgets(installedModuleIds, dashboardType),
    [installedModuleIds, dashboardType]
  );

  const filteredWidgets = useMemo(() => {
    let widgets = availableWidgets;
    
    // Filter out widgets that are already on the dashboard (unless they allow multiples)
    // For now, filter out single-instance widgets like quickstats
    const singleInstanceWidgets = ['quickstats']; // Widgets that should only appear once
    widgets = widgets.filter((w) => {
      if (singleInstanceWidgets.includes(w.id)) {
        return !existingWidgetTypes.includes(w.id);
      }
      return true; // Allow multiple instances of other widgets
    });
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      widgets = widgets.filter(
        (w) =>
          w.name.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== 'all') {
      widgets = widgets.filter((w) => w.category === activeCategory);
    }
    return widgets;
  }, [availableWidgets, searchQuery, activeCategory, existingWidgetTypes]);

  const groupedWidgets = useMemo(
    () => getWidgetsByCategory(filteredWidgets),
    [filteredWidgets]
  );

  const widgetTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of existingWidgetTypes) {
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [existingWidgetTypes]);

  const nonEmptyCategories = CATEGORY_ORDER.filter(
    (cat) => groupedWidgets[cat]?.length > 0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Widget</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {recentlyAdded.length > 0
                ? `${recentlyAdded.length} widget${recentlyAdded.length > 1 ? 's' : ''} added`
                : 'Choose widgets to add to your dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={keepOpen}
                onChange={(e) => setKeepOpen(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">Add multiple</span>
            </label>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 dark:bg-slate-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search + Category Tabs */}
        <div className="px-6 pt-4 pb-2 space-y-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <CategoryTab
              label="All"
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
            />
            {CATEGORY_ORDER.map((cat) => (
              <CategoryTab
                key={cat}
                label={CATEGORY_LABELS[cat]}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!modulesLoaded ? (
            <div className="flex items-center justify-center py-12 text-gray-600 dark:text-gray-400 text-sm">
              Loading available widgets...
            </div>
          ) : filteredWidgets.length === 0 ? (
            <EmptyState
              hasSearch={!!searchQuery.trim()}
              hasCategory={activeCategory !== 'all'}
            />
          ) : activeCategory === 'all' ? (
            nonEmptyCategories.map((cat) => (
              <div key={cat} className="mb-5 last:mb-0">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupedWidgets[cat].map((entry) => (
                    <WidgetCard
                      key={entry.id}
                      entry={entry}
                      count={widgetTypeCounts[entry.id] || 0}
                      justAdded={recentlyAdded.includes(entry.id)}
                      onAdd={() => handleAddWidget(entry.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredWidgets.map((entry) => (
                <WidgetCard
                  key={entry.id}
                  entry={entry}
                  count={widgetTypeCounts[entry.id] || 0}
                  justAdded={recentlyAdded.includes(entry.id)}
                  onAdd={() => handleAddWidget(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
}

function WidgetCard({
  entry,
  count,
  justAdded,
  onAdd,
}: {
  entry: WidgetRegistryEntry;
  count: number;
  justAdded?: boolean;
  onAdd: () => void;
}) {
  const Icon = entry.icon;
  const [iconColor, iconBg] = entry.color.split(' ');
  const shapeClass = getIconShapeClass(entry.category);

  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${
        justAdded 
          ? 'border-green-300 bg-green-50/50' 
          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
      }`}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center flex-shrink-0 ${shapeClass} ${iconBg}`}
      >
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {entry.name}
          </span>
          {justAdded && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
              Added!
            </span>
          )}
          {!justAdded && count > 0 && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:text-gray-300">
              {count} on dashboard
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{entry.description}</p>
      </div>
      <button
        onClick={onAdd}
        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
          justAdded
            ? 'text-green-600 bg-green-100'
            : 'text-gray-600 group-hover:text-blue-600 group-hover:bg-blue-100'
        }`}
        title={`Add another ${entry.name}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function EmptyState({
  hasSearch,
  hasCategory,
}: {
  hasSearch: boolean;
  hasCategory: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Package className="w-10 h-10 text-gray-600 mb-3" />
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
        {hasSearch ? 'No widgets found' : 'No widgets available'}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {hasSearch
          ? 'Try a different search term'
          : hasCategory
            ? 'No widgets in this category'
            : 'Install modules to unlock more widgets'}
      </p>
    </div>
  );
}
