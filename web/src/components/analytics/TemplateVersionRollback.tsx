import React, { useState, useMemo } from 'react';
import styles from './TemplateVersionRollback.module.css';
import { ExportTemplates } from './ExportTemplates';

interface VersionTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface TemplateVersion {
  version: string;
  timestamp: string;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  author: string;
  tags?: VersionTag[];
}

interface TemplateVersionRollbackProps {
  template: ExportTemplates;
  currentVersion: TemplateVersion;
  targetVersion: TemplateVersion;
  onClose: () => void;
  onRollback: (version: string) => void;
}

export const TemplateVersionRollback: React.FC<TemplateVersionRollbackProps> = ({
  template,
  currentVersion,
  targetVersion,
  onClose,
  onRollback,
}) => {
  const [confirmStep, setConfirmStep] = useState<'preview' | 'confirm'>('preview');
  const [rollbackReason, setRollbackReason] = useState('');

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatChange = (change: { field: string; oldValue: any; newValue: any }) => {
    const formatValue = (value: any) => {
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
      return value || 'None';
    };

    return `${change.field}: ${formatValue(change.oldValue)} → ${formatValue(change.newValue)}`;
  };

  const changes = useMemo(() => {
    const currentFields = new Set(currentVersion.changes.map(c => c.field));
    const targetFields = new Set(targetVersion.changes.map(c => c.field));
    const allFields = new Set([...currentFields, ...targetFields]);

    return Array.from(allFields).map(field => {
      const currentChange = currentVersion.changes.find(c => c.field === field);
      const targetChange = targetVersion.changes.find(c => c.field === field);

      return {
        field,
        current: currentChange?.newValue,
        target: targetChange?.newValue,
        willChange: JSON.stringify(currentChange?.newValue) !== JSON.stringify(targetChange?.newValue),
      };
    });
  }, [currentVersion, targetVersion]);

  const handleRollback = () => {
    if (confirmStep === 'preview') {
      setConfirmStep('confirm');
      return;
    }

    onRollback(targetVersion.version);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Rollback Template Version</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.versions}>
            <div className={styles.versionInfo}>
              <h4>Current Version</h4>
              <div className={styles.version}>
                <span className={styles.versionNumber}>
                  Version {currentVersion.version}
                </span>
                <span className={styles.timestamp}>
                  {formatTimestamp(currentVersion.timestamp)}
                </span>
                <span className={styles.author}>by {currentVersion.author}</span>
              </div>
            </div>

            <div className={styles.versionInfo}>
              <h4>Target Version</h4>
              <div className={styles.version}>
                <span className={styles.versionNumber}>
                  Version {targetVersion.version}
                </span>
                <span className={styles.timestamp}>
                  {formatTimestamp(targetVersion.timestamp)}
                </span>
                <span className={styles.author}>by {targetVersion.author}</span>
              </div>
            </div>
          </div>

          <div className={styles.changes}>
            <h4>Changes to be Applied</h4>
            <div className={styles.changesList}>
              {changes
                .filter(change => change.willChange)
                .map((change, index) => (
                  <div key={index} className={styles.change}>
                    <div className={styles.field}>{change.field}</div>
                    <div className={styles.values}>
                      <div className={styles.value}>
                        <span className={styles.label}>Current:</span>
                        {JSON.stringify(change.current)}
                      </div>
                      <div className={styles.value}>
                        <span className={styles.label}>Will Change To:</span>
                        {JSON.stringify(change.target)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {confirmStep === 'confirm' && (
            <div className={styles.confirmation}>
              <h4>Confirm Rollback</h4>
              <p>
                You are about to roll back to version {targetVersion.version}. This action
                cannot be undone. Please provide a reason for this rollback.
              </p>
              <textarea
                value={rollbackReason}
                onChange={e => setRollbackReason(e.target.value)}
                placeholder="Enter reason for rollback..."
                className={styles.reasonInput}
              />
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.rollbackButton}
              onClick={handleRollback}
              disabled={confirmStep === 'confirm' && !rollbackReason.trim()}
            >
              {confirmStep === 'preview' ? 'Continue to Confirm' : 'Confirm Rollback'}
            </button>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 