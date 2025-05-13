import React, { useState } from 'react';
import styles from './TemplateVersionCompare.module.css';
import { ExportTemplate } from './ExportTemplates';

interface TemplateVersion {
  version: string;
  timestamp: string;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  author: string;
}

interface TemplateVersionCompareProps {
  template: ExportTemplate;
  versions: TemplateVersion[];
  onClose: () => void;
}

export const TemplateVersionCompare: React.FC<TemplateVersionCompareProps> = ({
  template,
  versions,
  onClose,
}) => {
  const [selectedVersions, setSelectedVersions] = useState<{
    from: string;
    to: string;
  }>({
    from: versions[versions.length - 1]?.version || '',
    to: template.version,
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatValue = (value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
    if (value === null || value === undefined) return 'None';
    return value.toString();
  };

  const getVersionChanges = (fromVersion: string, toVersion: string) => {
    const fromIndex = versions.findIndex(v => v.version === fromVersion);
    const toIndex = versions.findIndex(v => v.version === toVersion);
    
    if (fromIndex === -1 || toIndex === -1) return [];

    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }> = [];

    // Get all changes between the two versions
    for (let i = fromIndex; i <= toIndex; i++) {
      const version = versions[i];
      version.changes.forEach(change => {
        if (change.field !== 'Initial version' && change.field !== 'Version Restored') {
          changes.push(change);
        }
      });
    }

    // Consolidate changes for the same field
    const consolidatedChanges = changes.reduce((acc, change) => {
      const existingChange = acc.find(c => c.field === change.field);
      if (existingChange) {
        existingChange.newValue = change.newValue;
      } else {
        acc.push({
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
        });
      }
      return acc;
    }, [] as typeof changes);

    return consolidatedChanges;
  };

  const changes = getVersionChanges(selectedVersions.from, selectedVersions.to);

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Compare Versions: {template.name}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.versionSelectors}>
            <div className={styles.versionSelector}>
              <label>From Version:</label>
              <select
                value={selectedVersions.from}
                onChange={(e) =>
                  setSelectedVersions({ ...selectedVersions, from: e.target.value })
                }
              >
                {versions.map((version) => (
                  <option key={version.version} value={version.version}>
                    Version {version.version} ({formatTimestamp(version.timestamp)})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.versionSelector}>
              <label>To Version:</label>
              <select
                value={selectedVersions.to}
                onChange={(e) =>
                  setSelectedVersions({ ...selectedVersions, to: e.target.value })
                }
              >
                <option value={template.version}>
                  Current Version ({template.version})
                </option>
                {versions.map((version) => (
                  <option key={version.version} value={version.version}>
                    Version {version.version} ({formatTimestamp(version.timestamp)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.changesList}>
            {changes.length === 0 ? (
              <div className={styles.noChanges}>
                No changes between selected versions
              </div>
            ) : (
              changes.map((change, index) => (
                <div key={index} className={styles.changeItem}>
                  <div className={styles.changeField}>{change.field}</div>
                  <div className={styles.changeValues}>
                    <div className={styles.oldValue}>
                      <span className={styles.label}>Old Value:</span>
                      <span className={styles.value}>
                        {formatValue(change.oldValue)}
                      </span>
                    </div>
                    <div className={styles.newValue}>
                      <span className={styles.label}>New Value:</span>
                      <span className={styles.value}>
                        {formatValue(change.newValue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 