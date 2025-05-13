import React, { useState } from 'react';
import styles from './TemplateVersionExport.module.css';

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

interface TemplateVersionExportProps {
  template: {
    id: string;
    name: string;
    description: string;
    version: string;
    updatedAt: string;
  };
  versions: TemplateVersion[];
  onClose: () => void;
}

type ExportFormat = 'json' | 'csv' | 'markdown';

export const TemplateVersionExport: React.FC<TemplateVersionExportProps> = ({
  template,
  versions,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeChanges, setIncludeChanges] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportToJson = () => {
    const exportData = {
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        currentVersion: template.version,
        lastUpdated: template.updatedAt,
      },
      versions: versions.map(version => ({
        version: version.version,
        timestamp: version.timestamp,
        author: version.author,
        ...(includeChanges && { changes: version.changes }),
        ...(includeTags && { tags: version.tags }),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-versions.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    const headers = ['Version', 'Timestamp', 'Author'];
    if (includeChanges) headers.push('Changes');
    if (includeTags) headers.push('Tags');

    const rows = versions.map(version => {
      const row = [
        version.version,
        formatTimestamp(version.timestamp),
        version.author,
      ];

      if (includeChanges) {
        row.push(
          version.changes
            .map(change => `${change.field}: ${change.oldValue} → ${change.newValue}`)
            .join('; ')
        );
      }

      if (includeTags) {
        row.push(version.tags?.map(tag => tag.name).join(', ') || '');
      }

      return row;
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-versions.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToMarkdown = () => {
    const content = [
      `# ${template.name} - Version History`,
      '',
      `**Description:** ${template.description}`,
      `**Current Version:** ${template.version}`,
      `**Last Updated:** ${formatTimestamp(template.updatedAt)}`,
      '',
      '## Versions',
      '',
      ...versions.map(version => [
        `### Version ${version.version}`,
        '',
        `- **Timestamp:** ${formatTimestamp(version.timestamp)}`,
        `- **Author:** ${version.author}`,
        '',
        ...(includeChanges && version.changes.length > 0
          ? [
              '#### Changes',
              '',
              ...version.changes.map(
                change =>
                  `- ${change.field}: ${change.oldValue} → ${change.newValue}`
              ),
              '',
            ]
          : []),
        ...(includeTags && version.tags && version.tags.length > 0
          ? [
              '#### Tags',
              '',
              ...version.tags.map(tag => `- ${tag.name}`),
              '',
            ]
          : []),
      ]).flat(),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}-versions.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    switch (format) {
      case 'json':
        exportToJson();
        break;
      case 'csv':
        exportToCsv();
        break;
      case 'markdown':
        exportToMarkdown();
        break;
    }
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Export Version History</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h4>Export Format</h4>
            <div className={styles.formatOptions}>
              <label className={styles.formatOption}>
                <input
                  type="radio"
                  value="json"
                  checked={format === 'json'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                />
                JSON
              </label>
              <label className={styles.formatOption}>
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                />
                CSV
              </label>
              <label className={styles.formatOption}>
                <input
                  type="radio"
                  value="markdown"
                  checked={format === 'markdown'}
                  onChange={(e) => setFormat(e.target.value as ExportFormat)}
                />
                Markdown
              </label>
            </div>
          </div>

          <div className={styles.section}>
            <h4>Include in Export</h4>
            <div className={styles.includeOptions}>
              <label className={styles.includeOption}>
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                />
                Template Metadata
              </label>
              <label className={styles.includeOption}>
                <input
                  type="checkbox"
                  checked={includeChanges}
                  onChange={(e) => setIncludeChanges(e.target.checked)}
                />
                Version Changes
              </label>
              <label className={styles.includeOption}>
                <input
                  type="checkbox"
                  checked={includeTags}
                  onChange={(e) => setIncludeTags(e.target.checked)}
                />
                Version Tags
              </label>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.exportButton} onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}; 