'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Textarea, Switch } from 'shared/components';
import { X, Save, Shield, Users, Building2, Layers, UserCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface WidgetVisibility {
  requiredPermission?: string;
  visibleToRoles?: string[];
  visibleToTiers?: string[];
  visibleToPositions?: string[];
  visibleToDepartments?: string[];
}

export interface Widget {
  id: string;
  widgetType: string;
  title: string;
  description?: string;
  position: { x: number; y: number; width: number; height: number };
  visible: boolean;
  order: number;
  settings?: Record<string, unknown>;
  visibility?: WidgetVisibility;
}

interface FrontPageWidgetEditorProps {
  widget: Widget | null;
  orgChartData?: {
    roles: string[];
    tiers: string[];
    positions: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string }>;
  };
  onSave: (widget: Widget) => void;
  onClose: () => void;
  isNew?: boolean;
}

// ============================================================================
// WIDGET TYPE CONFIGS
// ============================================================================

const WIDGET_TYPES = [
  { value: 'ai-assistant', label: '🤖 AI Assistant', description: 'Embedded AI chat interface' },
  { value: 'company-stats', label: '📊 Company Statistics', description: 'Company-wide metrics and KPIs' },
  { value: 'personal-stats', label: '👤 Personal Statistics', description: 'Individual employee metrics' },
  { value: 'announcements', label: '📢 Announcements', description: 'Company announcements and news' },
  { value: 'quick-actions', label: '⚡ Quick Actions', description: 'Common action shortcuts' },
  { value: 'recent-activity', label: '📋 Recent Activity', description: 'Latest activity feed' },
  { value: 'upcoming-events', label: '📅 Upcoming Events', description: 'Calendar events' },
  { value: 'team-highlights', label: '⭐ Team Highlights', description: 'Team achievements' },
  { value: 'metrics', label: '📈 Metrics Dashboard', description: 'Performance metrics' },
  { value: 'tasks', label: '✓ Tasks', description: 'Task list and checklist' },
];

// ============================================================================
// VISIBILITY SELECTOR COMPONENT
// ============================================================================

interface VisibilitySelectorProps {
  visibility: WidgetVisibility;
  orgChartData?: {
    roles: string[];
    tiers: string[];
    positions: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string }>;
  };
  onChange: (visibility: WidgetVisibility) => void;
}

function VisibilitySelector({ visibility, orgChartData, onChange }: VisibilitySelectorProps) {
  const [showAllUsers, setShowAllUsers] = useState(
    !visibility.visibleToRoles?.length &&
    !visibility.visibleToTiers?.length &&
    !visibility.visibleToPositions?.length &&
    !visibility.visibleToDepartments?.length
  );

  const handleToggleRole = (role: string) => {
    const current = visibility.visibleToRoles || [];
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    onChange({ ...visibility, visibleToRoles: updated });
  };

  const handleToggleTier = (tier: string) => {
    const current = visibility.visibleToTiers || [];
    const updated = current.includes(tier)
      ? current.filter((t) => t !== tier)
      : [...current, tier];
    onChange({ ...visibility, visibleToTiers: updated });
  };

  const handleTogglePosition = (positionId: string) => {
    const current = visibility.visibleToPositions || [];
    const updated = current.includes(positionId)
      ? current.filter((p) => p !== positionId)
      : [...current, positionId];
    onChange({ ...visibility, visibleToPositions: updated });
  };

  const handleToggleDepartment = (deptId: string) => {
    const current = visibility.visibleToDepartments || [];
    const updated = current.includes(deptId)
      ? current.filter((d) => d !== deptId)
      : [...current, deptId];
    onChange({ ...visibility, visibleToDepartments: updated });
  };

  const handleShowAllChange = (checked: boolean) => {
    setShowAllUsers(checked);
    if (checked) {
      onChange({
        visibleToRoles: [],
        visibleToTiers: [],
        visibleToPositions: [],
        visibleToDepartments: [],
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">Widget Visibility</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-blue-800">Show to all users</span>
          <Switch checked={showAllUsers} onChange={(checked) => handleShowAllChange(checked)} />
        </div>
      </div>

      {!showAllUsers && (
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          {/* Roles */}
          {orgChartData?.roles && orgChartData.roles.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-gray-600" />
                <label className="font-medium text-sm text-gray-700">Roles</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {orgChartData.roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleToggleRole(role)}
                    className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
                      visibility.visibleToRoles?.includes(role)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tiers */}
          {orgChartData?.tiers && orgChartData.tiers.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Layers className="w-4 h-4 text-gray-600" />
                <label className="font-medium text-sm text-gray-700">Tiers</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {orgChartData.tiers.map((tier) => (
                  <button
                    key={tier}
                    onClick={() => handleToggleTier(tier)}
                    className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
                      visibility.visibleToTiers?.includes(tier)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Positions */}
          {orgChartData?.positions && orgChartData.positions.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <UserCircle className="w-4 h-4 text-gray-600" />
                <label className="font-medium text-sm text-gray-700">Positions</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {orgChartData.positions.map((position) => (
                  <button
                    key={position.id}
                    onClick={() => handleTogglePosition(position.id)}
                    className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
                      visibility.visibleToPositions?.includes(position.id)
                        ? 'bg-purple-500 text-white border-purple-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    {position.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Departments */}
          {orgChartData?.departments && orgChartData.departments.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="w-4 h-4 text-gray-600" />
                <label className="font-medium text-sm text-gray-700">Departments</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {orgChartData.departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => handleToggleDepartment(dept.id)}
                    className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
                      visibility.visibleToDepartments?.includes(dept.id)
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {!visibility.visibleToRoles?.length &&
              !visibility.visibleToTiers?.length &&
              !visibility.visibleToPositions?.length &&
              !visibility.visibleToDepartments?.length
                ? 'Select at least one role, tier, position, or department to restrict visibility'
                : 'This widget will only be visible to users matching the selected criteria'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN WIDGET EDITOR COMPONENT
// ============================================================================

export default function FrontPageWidgetEditor({
  widget,
  orgChartData,
  onSave,
  onClose,
  isNew = false,
}: FrontPageWidgetEditorProps) {
  const [formData, setFormData] = useState<Widget>(
    widget || {
      id: '',
      widgetType: 'ai-assistant',
      title: '',
      description: '',
      position: { x: 0, y: 0, width: 6, height: 4 },
      visible: true,
      order: 0,
      settings: {},
      visibility: {},
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.widgetType) {
      newErrors.widgetType = 'Widget type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const selectedWidgetType = WIDGET_TYPES.find((t) => t.value === formData.widgetType);

  if (!widget && !isNew) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isNew ? 'Add New Widget' : 'Edit Widget'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure widget settings and visibility permissions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Widget Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Type *
            </label>
            <select
              value={formData.widgetType}
              onChange={(e) => setFormData({ ...formData, widgetType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={!isNew}
            >
              {WIDGET_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {selectedWidgetType && (
              <p className="mt-1 text-sm text-gray-600">{selectedWidgetType.description}</p>
            )}
            {errors.widgetType && (
              <p className="mt-1 text-sm text-red-600">{errors.widgetType}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Widget Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Company Dashboard"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <Textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description of what this widget displays..."
              rows={3}
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-sm text-gray-900">Visible</label>
              <p className="text-xs text-gray-600">Show this widget on the front page</p>
            </div>
            <Switch
              checked={formData.visible}
              onChange={(checked) => setFormData({ ...formData, visible: checked })}
            />
          </div>

          {/* Visibility Permissions */}
          <VisibilitySelector
            visibility={formData.visibility || {}}
            orgChartData={orgChartData}
            onChange={(visibility) => setFormData({ ...formData, visibility })}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'Add Widget' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

