'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Spinner } from 'shared/components';
import {
  estimateCommunicationAudience,
  type WorkforceAudienceSpec,
  type WorkforceAudienceType,
} from '@/api/workforceComms';
import { getBusinessEmployees, getDepartments, getPositions } from '@/api/orgChart';

interface AudiencePickerProps {
  businessId: string;
  communicationId?: string;
  audienceType: WorkforceAudienceType;
  audienceSpec: WorkforceAudienceSpec;
  onAudienceTypeChange: (type: WorkforceAudienceType) => void;
  onAudienceSpecChange: (spec: WorkforceAudienceSpec) => void;
}

const AUDIENCE_OPTIONS: Array<{ value: WorkforceAudienceType; label: string; description: string }> = [
  { value: 'BUSINESS', label: 'Entire Business', description: 'All active business members' },
  { value: 'DEPARTMENT', label: 'Department', description: 'Members in selected departments' },
  { value: 'POSITION', label: 'Position', description: 'Members holding selected positions' },
  { value: 'MANAGER_SUBTREE', label: 'Manager Subtree', description: 'Direct and indirect reports' },
  { value: 'BUSINESS_ROLE', label: 'Business Role', description: 'ADMIN, MANAGER, or MEMBER' },
  { value: 'CUSTOM_GROUP', label: 'Custom Group', description: 'Explicit member list' },
];

export default function AudiencePicker({
  businessId,
  communicationId,
  audienceType,
  audienceSpec,
  onAudienceTypeChange,
  onAudienceSpecChange,
}: AudiencePickerProps) {
  const { data: session } = useSession();
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [positions, setPositions] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; employeePositionId: string; name: string }>>([]);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);

  useEffect(() => {
    const token = session?.accessToken;
    if (!token) return;
    void (async () => {
      try {
        const [deptData, posData, empData] = await Promise.all([
          getDepartments(businessId, token),
          getPositions(businessId, token),
          getBusinessEmployees(businessId, token),
        ]);
        setDepartments((deptData.data ?? []).map((d) => ({ id: d.id, name: d.name })));
        setPositions((posData.data ?? []).map((p) => ({ id: p.id, name: p.name })));
        setEmployees(
          (empData.data ?? []).map((e) => ({
            id: e.userId,
            employeePositionId: e.id,
            name: e.position?.name ? `${e.position.name}` : e.userId.slice(0, 8),
          }))
        );
      } catch {
        // Org chart data optional for preview
      }
    })();
  }, [businessId, session?.accessToken]);

  useEffect(() => {
    if (!communicationId) {
      setEstimatedCount(null);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          setEstimating(true);
          setEstimateError(null);
          const result = await estimateCommunicationAudience(
            businessId,
            communicationId,
            audienceType,
            audienceSpec
          );
          setEstimatedCount(result.estimatedCount);
        } catch (err) {
          setEstimateError(err instanceof Error ? err.message : 'Estimate failed');
        } finally {
          setEstimating(false);
        }
      })();
    }, 400);
    return () => clearTimeout(timer);
  }, [businessId, communicationId, audienceType, audienceSpec]);

  const toggleId = (
    key: keyof WorkforceAudienceSpec,
    id: string
  ) => {
    const current = (audienceSpec[key] as string[] | undefined) ?? [];
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    onAudienceSpecChange({ ...audienceSpec, [key]: next });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-v-text-secondary mb-2">
          Audience type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AUDIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onAudienceTypeChange(option.value)}
              className={`text-left p-3 rounded-lg border text-sm ${
                audienceType === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-v-border hover:border-v-border'
              }`}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-v-text-muted">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {audienceType === 'DEPARTMENT' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Departments</p>
          <div className="flex flex-wrap gap-2">
            {departments.map((dept) => (
              <Button
                key={dept.id}
                type="button"
                size="sm"
                variant={(audienceSpec.departmentIds ?? []).includes(dept.id) ? 'primary' : 'secondary'}
                onClick={() => toggleId('departmentIds', dept.id)}
              >
                {dept.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {audienceType === 'POSITION' && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Positions</p>
          <div className="flex flex-wrap gap-2">
            {positions.map((pos) => (
              <Button
                key={pos.id}
                type="button"
                size="sm"
                variant={(audienceSpec.positionIds ?? []).includes(pos.id) ? 'primary' : 'secondary'}
                onClick={() => toggleId('positionIds', pos.id)}
              >
                {pos.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {audienceType === 'MANAGER_SUBTREE' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Manager</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
            value={audienceSpec.managerEmployeePositionId ?? ''}
            onChange={(e) =>
              onAudienceSpecChange({
                ...audienceSpec,
                managerEmployeePositionId: e.target.value || undefined,
              })
            }
          >
            <option value="">Select manager…</option>
            {employees.map((emp) => (
              <option key={emp.employeePositionId} value={emp.employeePositionId}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {audienceType === 'BUSINESS_ROLE' && (
        <div className="flex flex-wrap gap-2">
          {(['ADMIN', 'MANAGER', 'EMPLOYEE'] as const).map((role) => (
            <Button
              key={role}
              type="button"
              size="sm"
              variant={(audienceSpec.roles ?? []).includes(role) ? 'primary' : 'secondary'}
              onClick={() => {
                const current = audienceSpec.roles ?? [];
                const next = current.includes(role)
                  ? current.filter((r) => r !== role)
                  : [...current, role];
                onAudienceSpecChange({ ...audienceSpec, roles: next });
              }}
            >
              {role}
            </Button>
          ))}
        </div>
      )}

      {audienceType === 'CUSTOM_GROUP' && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {employees.map((emp) => (
            <label key={emp.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={(audienceSpec.userIds ?? []).includes(emp.id)}
                onChange={() => toggleId('userIds', emp.id)}
              />
              {emp.name}
            </label>
          ))}
        </div>
      )}

      {communicationId && (
        <div className="rounded-lg border border-v-border p-3 bg-v-surface-muted">
          <p className="text-sm font-medium text-v-text-secondary">Audience preview</p>
          {estimating ? (
            <div className="flex items-center gap-2 mt-2 text-sm text-v-text-muted">
              <Spinner size={16} /> Estimating reach…
            </div>
          ) : estimateError ? (
            <p className="text-sm text-red-600 mt-1">{estimateError}</p>
          ) : estimatedCount !== null ? (
            <p className="text-sm mt-1">
              Estimated reach: <strong>{estimatedCount}</strong> members
            </p>
          ) : (
            <p className="text-sm text-v-text-muted mt-1">Save draft to preview reach</p>
          )}
        </div>
      )}
    </div>
  );
}
