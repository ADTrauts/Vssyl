import React, { useState } from 'react';
import styles from './TemplateHistoryDialog.module.css';
import { ExportTemplates } from './ExportTemplates';
import { TemplateVersionCompare } from './TemplateVersionCompare';
import { TemplateVersionTag } from './TemplateVersionTag';
import { TemplateVersionFilter } from './TemplateVersionFilter';
import { TemplateVersionGroup } from './TemplateVersionGroup';
import { TemplateVersionExport } from './TemplateVersionExport';
import { TemplateVersionStats } from './TemplateVersionStats';
import { TemplateVersionGroupCompare } from './TemplateVersionGroupCompare';
import { TemplateVersionImport } from './TemplateVersionImport';
import { TemplateVersionRollback } from './TemplateVersionRollback';

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

interface TemplateHistoryDialogProps {
  template: ExportTemplates;
  versions: TemplateVersion[];
  onClose: () => void;
  onRestore: (version: string) => void;
  onAddTag: (version: string, tag: Omit<VersionTag, 'id'>) => void;
  onRemoveTag: (version: string, tagId: string) => void;
}

export const TemplateHistoryDialog: React.FC<TemplateHistoryDialogProps> = ({
  template,
  versions,
  onClose,
  onRestore,
  onAddTag,
  onRemoveTag,
}) => {
  const [comparingVersions, setComparingVersions] = useState(false);
  const [filteredVersions, setFilteredVersions] = useState(versions);
  const [selectedVersion, setSelectedVersion] = useState<TemplateVersion | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'group'>('group');
  const [showExport, setShowExport] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showRollback, setShowRollback] = useState(false);
  const [rollbackVersion, setRollbackVersion] = useState<TemplateVersion | null>(null);

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

  const handleVersionSelect = (version: TemplateVersion) => {
    setSelectedVersion(version);
  };

  const handleImport = (importedVersions: TemplateVersion[]) => {
    // Filter out duplicate versions if they exist
    const newVersions = importedVersions.filter(
      imported => !versions.some(existing => existing.version === imported.version)
    );
    setFilteredVersions(prev => [...newVersions, ...prev]);
  };

  const handleRollbackClick = (version: TemplateVersion) => {
    setRollbackVersion(version);
    setShowRollback(true);
  };

  const handleRollback = (version: string) => {
    onRestore(version);
    setShowRollback(false);
    setRollbackVersion(null);
  };

  const currentVersion = versions[0];

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Version History: {template.name}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.templateInfo}>
            <p>{template.description}</p>
            <div className={styles.meta}>
              <span>Current Version: {template.version}</span>
              <span>Last Updated: {formatTimestamp(template.updatedAt)}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.compareButton}
              onClick={() => setComparingVersions(true)}
            >
              Compare Versions
            </button>
            <button
              className={styles.exportButton}
              onClick={() => setShowExport(true)}
            >
              Export History
            </button>
            <button
              className={styles.importButton}
              onClick={() => setShowImport(true)}
            >
              Import Versions
            </button>
            <button
              className={styles.statsButton}
              onClick={() => setShowStats(true)}
            >
              View Statistics
            </button>
            <button
              className={`${styles.viewToggleButton} ${
                viewMode === 'list' ? styles.active : ''
              }`}
              onClick={() => setViewMode(prev => prev === 'list' ? 'group' : 'list')}
            >
              {viewMode === 'list' ? 'Group View' : 'List View'}
            </button>
          </div>

          <TemplateVersionFilter
            versions={versions}
            onFilterChange={setFilteredVersions}
          />

          {viewMode === 'group' ? (
            <TemplateVersionGroup
              versions={filteredVersions}
              onVersionSelect={handleVersionSelect}
            />
          ) : (
            <div className={styles.versionsList}>
              {filteredVersions.map((version) => (
                <div key={version.version} className={styles.versionItem}>
                  <div className={styles.versionHeader}>
                    <div className={styles.versionInfo}>
                      <h4>Version {version.version}</h4>
                      <span className={styles.timestamp}>
                        {formatTimestamp(version.timestamp)}
                      </span>
                      <span className={styles.author}>by {version.author}</span>
                    </div>
                    {version.version !== template.version && (
                      <button
                        className={styles.restoreButton}
                        onClick={() => handleRollbackClick(version)}
                      >
                        Rollback
                      </button>
                    )}
                  </div>

                  {version.tags && version.tags.length > 0 && (
                    <TemplateVersionTag
                      version={version.version}
                      tags={version.tags}
                      onAddTag={onAddTag}
                      onRemoveTag={onRemoveTag}
                    />
                  )}

                  <div className={styles.changes}>
                    {version.changes.map((change, index) => (
                      <div key={index} className={styles.change}>
                        {formatChange(change)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {comparingVersions && (
        <TemplateVersionGroupCompare
          template={template}
          versions={filteredVersions}
          onClose={() => setComparingVersions(false)}
        />
      )}

      {showExport && (
        <TemplateVersionExport
          template={template}
          versions={filteredVersions}
          onClose={() => setShowExport(false)}
        />
      )}

      {showImport && (
        <TemplateVersionImport
          template={template}
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {showStats && (
        <div className={styles.statsOverlay}>
          <div className={styles.statsDialog}>
            <div className={styles.statsHeader}>
              <h3>Version Statistics</h3>
              <button className={styles.closeButton} onClick={() => setShowStats(false)}>
                ×
              </button>
            </div>
            <div className={styles.statsContent}>
              <TemplateVersionStats versions={filteredVersions} />
            </div>
          </div>
        </div>
      )}

      {showRollback && rollbackVersion && (
        <TemplateVersionRollback
          template={template}
          currentVersion={currentVersion}
          targetVersion={rollbackVersion}
          onClose={() => {
            setShowRollback(false);
            setRollbackVersion(null);
          }}
          onRollback={handleRollback}
        />
      )}
    </div>
  );
}; 