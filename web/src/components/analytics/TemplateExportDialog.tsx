import React, { useState } from 'react';
import styles from './TemplateExportDialog.module.css';
import { ExportTemplate } from './ExportTemplates';
import { templateExportService, ExportData } from '../../services/templateExportService';

interface TemplateExportDialogProps {
  template: ExportTemplate;
  onClose: () => void;
}

const TemplateExportDialog: React.FC<TemplateExportDialogProps> = ({
  template,
  onClose,
}) => {
  const [exportData, setExportData] = useState<ExportData>({});
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = (field: string, value: string) => {
    setExportData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      await templateExportService.downloadTemplate(template, exportData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export template');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h3>Export Template: {template.name}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.templateInfo}>
            <p>{template.description}</p>
            <div className={styles.meta}>
              <span>Format: {template.format.toUpperCase()}</span>
              <span>Version: {template.version}</span>
            </div>
          </div>

          <div className={styles.fields}>
            <h4>Enter Data</h4>
            {template.fields.map((field) => (
              <div key={field} className={styles.field}>
                <label htmlFor={field}>{field}</label>
                <input
                  id={field}
                  type="text"
                  value={exportData[field] || ''}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  placeholder={`Enter ${field}`}
                  className={styles.input}
                />
              </div>
            ))}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              className={styles.exportButton}
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateExportDialog; 