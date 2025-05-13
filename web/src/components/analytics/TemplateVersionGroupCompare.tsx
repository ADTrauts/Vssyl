import React, { useState, useMemo } from 'react';
import styles from './TemplateVersionGroupCompare.module.css';
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

interface TemplateVersionGroupCompareProps {
  template: ExportTemplates;
  versions: TemplateVersion[];
  onClose: () => void;
}

interface VersionGroup {
  label: string;
  versions: TemplateVersion[];
}

export const TemplateVersionGroupCompare: React.FC<TemplateVersionGroupCompareProps> = ({
  template,
  versions,
  onClose,
}) => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  const groups = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const groups: VersionGroup[] = [
      {
        label: 'Today',
        versions: versions.filter(v => new Date(v.timestamp) >= today),
      },
      {
        label: 'This Week',
        versions: versions.filter(
          v => new Date(v.timestamp) >= weekAgo && new Date(v.timestamp) < today
        ),
      },
      {
        label: 'This Month',
        versions: versions.filter(
          v => new Date(v.timestamp) >= monthAgo && new Date(v.timestamp) < weekAgo
        ),
      },
      {
        label: 'Older',
        versions: versions.filter(v => new Date(v.timestamp) < monthAgo),
      },
    ];

    return groups.filter(group => group.versions.length > 0);
  }, [versions]);

  const handleGroupSelect = (label: string) => {
    setSelectedGroups(prev =>
      prev.includes(label)
        ? prev.filter(g => g !== label)
        : [...prev, label]
    );
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersions(prev =>
      prev.includes(version)
        ? prev.filter(v => v !== version)
        : [...prev, version]
    );
  };

  const selectedVersionsData = useMemo(() => {
    return versions.filter(v => selectedVersions.includes(v.version));
  }, [versions, selectedVersions]);

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

  const getCommonChanges = () => {
    if (selectedVersionsData.length < 2) return [];

    const changes = selectedVersionsData.map(v => v.changes);
    const commonFields = changes.reduce((fields, versionChanges) => {
      const versionFields = new Set(versionChanges.map(c => c.field));
      return fields.filter(field => versionFields.has(field));
    }, changes[0].map(c => c.field));

    return commonFields.map(field => {
      const changes = selectedVersionsData.map(v => 
        v.changes.find(c => c.field === field)
      );
      return {
        field,
        changes: changes.map(c => ({
          version: selectedVersionsData[changes.indexOf(c)].version,
          value: c?.newValue,
        })),
      };
    });
  };

  const getUniqueChanges = () => {
    if (selectedVersionsData.length < 2) return [];

    const allChanges = selectedVersionsData.flatMap(v => 
      v.changes.map(c => ({
        ...c,
        version: v.version,
      }))
    );

    const uniqueChanges = allChanges.filter(change => {
      const otherVersions = selectedVersionsData.filter(v => v.version !== change.version);
      return !otherVersions.some(v => 
        v.changes.some(c => c.field === change.field && c.newValue === change.newValue)
      );
    });

    return uniqueChanges;
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Compare Template Versions</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.selection}>
            <div className={styles.groups}>
              {groups.map(group => (
                <div
                  key={group.label}
                  className={`${styles.group} ${
                    selectedGroups.includes(group.label) ? styles.selected : ''
                  }`}
                  onClick={() => handleGroupSelect(group.label)}
                >
                  <h4>{group.label}</h4>
                  <span className={styles.versionCount}>
                    {group.versions.length} versions
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.versions}>
              {groups
                .filter(group => selectedGroups.includes(group.label))
                .map(group => (
                  <div key={group.label} className={styles.versionGroup}>
                    <h4>{group.label}</h4>
                    {group.versions.map(version => (
                      <div
                        key={version.version}
                        className={`${styles.version} ${
                          selectedVersions.includes(version.version)
                            ? styles.selected
                            : ''
                        }`}
                        onClick={() => handleVersionSelect(version.version)}
                      >
                        <div className={styles.versionInfo}>
                          <span className={styles.versionNumber}>
                            Version {version.version}
                          </span>
                          <span className={styles.timestamp}>
                            {formatTimestamp(version.timestamp)}
                          </span>
                        </div>
                        <span className={styles.author}>by {version.author}</span>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>

          {selectedVersionsData.length >= 2 && (
            <div className={styles.comparison}>
              <div className={styles.section}>
                <h4>Common Changes</h4>
                <div className={styles.changes}>
                  {getCommonChanges().map((change, index) => (
                    <div key={index} className={styles.change}>
                      <div className={styles.field}>{change.field}</div>
                      <div className={styles.values}>
                        {change.changes.map((c, i) => (
                          <div key={i} className={styles.value}>
                            <span className={styles.version}>
                              v{c.version}:
                            </span>
                            {JSON.stringify(c.value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.section}>
                <h4>Unique Changes</h4>
                <div className={styles.changes}>
                  {getUniqueChanges().map((change, index) => (
                    <div key={index} className={styles.change}>
                      <div className={styles.versionInfo}>
                        <span className={styles.versionNumber}>
                          Version {change.version}
                        </span>
                        <span className={styles.field}>{change.field}</span>
                      </div>
                      <div className={styles.value}>
                        {formatChange(change)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 