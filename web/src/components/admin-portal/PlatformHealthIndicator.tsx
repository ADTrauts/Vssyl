'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Spinner } from 'shared/components';
import {
  OPERATOR_STATUS_LABEL,
  operatorStatusDotClass,
  operatorStatusTextClass,
  type OperatorServiceStatus,
} from '../../lib/adminPlatformOperations';
import { usePlatformOperationsStatus } from '../../hooks/usePlatformOperationsStatus';

export function PlatformHealthIndicator() {
  const { data, loading, error, refresh } = usePlatformOperationsStatus();

  const status: OperatorServiceStatus = error ? 'offline' : (data?.overallStatus ?? 'unknown');
  const label = error ? 'Status unavailable' : OPERATOR_STATUS_LABEL[status];

  return (
    <button
      type="button"
      onClick={() => void refresh()}
      className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-v-surface-muted transition-colors"
      title={
        error
          ? error
          : data
            ? `Last checked ${new Date(data.timestamp).toLocaleTimeString()} — click to refresh`
            : 'Loading platform status'
      }
      aria-live="polite"
    >
      {loading ? (
        <Spinner size={14} />
      ) : (
        <span
          className={`w-2 h-2 rounded-full ${operatorStatusDotClass(status)}`}
          aria-hidden
        />
      )}
      <span className={`text-sm ${operatorStatusTextClass(status)}`}>{label}</span>
      {!loading && (
        <RefreshCw className="w-3 h-3 text-v-text-muted opacity-60" aria-hidden />
      )}
    </button>
  );
}
