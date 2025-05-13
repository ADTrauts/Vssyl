import React, { useState, useCallback } from 'react';
import styles from './TemplateVersionImport.module.css';
import { ExportTemplates } from './ExportTemplates';

interface VersionTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface Change {
  field: string;
  oldValue: string | number | boolean | null;
  newValue: string | number | boolean | null;
}

interface TemplateVersion {
  version: string;
  timestamp: string;
  changes: Change[];
  author: string;
  tags?: VersionTag[];
}

interface TemplateVersionImportProps {
  template: ExportTemplates;
  onClose: () => void;
  onImport: (versions: TemplateVersion[]) => void;
}

type ImportFormat = 'json' | 'csv' | 'markdown';

interface ImportOptions {
  format: ImportFormat;
  skipDuplicates: boolean;
  validateData: boolean;
  preserveTimestamps: boolean;
}

export const TemplateVersionImport: React.FC<TemplateVersionImportProps> = ({
  template,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    format: 'json',
    skipDuplicates: true,
    validateData: true,
    preserveTimestamps: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TemplateVersion[] | null>(null);

  const validateVersion = (version: unknown): version is TemplateVersion => {
    if (typeof version !== 'object' || version === null) return false;
    
    const v = version as Partial<TemplateVersion>;
    return (
      typeof v.version === 'string' &&
      typeof v.timestamp === 'string' &&
      Array.isArray(v.changes) &&
      v.changes.every(
        (change: unknown) => {
          if (typeof change !== 'object' || change === null) return false;
          const c = change as Partial<Change>;
          return (
            typeof c.field === 'string' &&
            'oldValue' in c &&
            'newValue' in c
          );
        }
      ) &&
      typeof v.author === 'string'
    );
  };

  const parseJson = async (content: string): Promise<TemplateVersion[]> => {
    try {
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        throw new Error('Invalid JSON format: expected an array of versions');
      }

      const versions = data.map((version, index) => {
        if (!validateVersion(version)) {
          throw new Error(`Invalid version format at index ${index}`);
        }
        return version;
      });

      return versions;
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const parseCsv = async (content: string): Promise<TemplateVersion[]> => {
    try {
      const lines = content.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const versions: TemplateVersion[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',').map(v => v.trim());
        if (values.length !== headers.length) {
          throw new Error(`Invalid CSV format at line ${i + 1}`);
        }

        const version: TemplateVersion = {
          version: values[headers.indexOf('version')],
          timestamp: values[headers.indexOf('timestamp')],
          author: values[headers.indexOf('author')],
          changes: JSON.parse(values[headers.indexOf('changes')]),
          tags: values[headers.indexOf('tags')]
            ? JSON.parse(values[headers.indexOf('tags')])
            : undefined,
        };

        if (!validateVersion(version)) {
          throw new Error(`Invalid version format at line ${i + 1}`);
        }

        versions.push(version);
      }

      return versions;
    } catch (error) {
      throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const parseMarkdown = async (content: string): Promise<TemplateVersion[]> => {
    try {
      const versions: TemplateVersion[] = [];
      const sections = content.split('## Version');

      for (let i = 1; i < sections.length; i++) {
        const section = sections[i].trim();
        const lines = section.split('\n');
        const version: Partial<TemplateVersion> = {
          changes: [],
        };

        for (const line of lines) {
          if (line.startsWith('### ')) {
            const [field, value] = line.slice(4).split(':').map(s => s.trim());
            if (field === 'Changes') {
              version.changes = JSON.parse(value);
            } else {
              (version as Record<string, unknown>)[field.toLowerCase()] = value;
            }
          }
        }

        if (!validateVersion(version)) {
          throw new Error(`Invalid version format in section ${i}`);
        }

        versions.push(version as TemplateVersion);
      }

      return versions;
    } catch (error) {
      throw new Error(`Failed to parse Markdown: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];
    setFile(file);

    try {
      const content = await file.text();
      let data: TemplateVersion[];
      
      if (file.name.endsWith('.json')) {
        data = await parseJson(content);
      } else if (file.name.endsWith('.csv')) {
        data = await parseCsv(content);
      } else if (file.name.endsWith('.md')) {
        data = await parseMarkdown(content);
      } else {
        throw new Error('Unsupported file format');
      }
      
      setPreview(data);
    } catch (err) {
      console.error('Failed to parse file:', err);
      setError('Failed to parse file');
    }
  }, []);

  const handleImport = () => {
    if (!preview) return;

    const versionsToImport = options.preserveTimestamps
      ? preview
      : preview.map(version => ({
          ...version,
          timestamp: new Date().toISOString(),
        }));

    onImport(versionsToImport);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Import Template Versions</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h4>Import Options</h4>
            <div className={styles.options}>
              <div className={styles.option}>
                <label>Format:</label>
                <select
                  value={options.format}
                  onChange={e =>
                    setOptions(prev => ({
                      ...prev,
                      format: e.target.value as ImportFormat,
                    }))
                  }
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="markdown">Markdown</option>
                </select>
              </div>

              <div className={styles.option}>
                <label>
                  <input
                    type="checkbox"
                    checked={options.skipDuplicates}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        skipDuplicates: e.target.checked,
                      }))
                    }
                  />
                  Skip Duplicate Versions
                </label>
              </div>

              <div className={styles.option}>
                <label>
                  <input
                    type="checkbox"
                    checked={options.validateData}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        validateData: e.target.checked,
                      }))
                    }
                  />
                  Validate Data
                </label>
              </div>

              <div className={styles.option}>
                <label>
                  <input
                    type="checkbox"
                    checked={options.preserveTimestamps}
                    onChange={e =>
                      setOptions(prev => ({
                        ...prev,
                        preserveTimestamps: e.target.checked,
                      }))
                    }
                  />
                  Preserve Original Timestamps
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h4>Select File</h4>
            <input
              type="file"
              accept={
                options.format === 'json'
                  ? '.json'
                  : options.format === 'csv'
                  ? '.csv'
                  : '.md'
              }
              onChange={handleFileChange}
              className={styles.fileInput}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {preview && (
            <div className={styles.section}>
              <h4>Preview ({preview.length} versions)</h4>
              <div className={styles.preview}>
                {preview.slice(0, 3).map((version, index) => (
                  <div key={index} className={styles.previewItem}>
                    <div className={styles.previewHeader}>
                      <span>Version {version.version}</span>
                      <span>{new Date(version.timestamp).toLocaleString()}</span>
                    </div>
                    <div className={styles.previewChanges}>
                      {version.changes.slice(0, 2).map((change, i) => (
                        <div key={i} className={styles.change}>
                          {change.field}: {JSON.stringify(change.oldValue)} →{' '}
                          {JSON.stringify(change.newValue)}
                        </div>
                      ))}
                      {version.changes.length > 2 && (
                        <div className={styles.more}>
                          +{version.changes.length - 2} more changes
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {preview.length > 3 && (
                  <div className={styles.more}>
                    +{preview.length - 3} more versions
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.importButton}
              onClick={handleImport}
              disabled={!preview}
            >
              Import Versions
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