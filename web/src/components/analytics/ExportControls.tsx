import React from 'react';
import styles from './ExportControls.module.css';

export type ExportFormat = 'csv' | 'json' | 'excel';

interface ExportControlsProps {
  onExport: (format: ExportFormat) => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({ onExport }) => {
  return (
    <div className={styles.exportContainer}>
      <h3>Export Data</h3>
      <div className={styles.exportButtons}>
        <button
          className={styles.exportButton}
          onClick={() => onExport('csv')}
          title="Export as CSV"
        >
          CSV
        </button>
        <button
          className={styles.exportButton}
          onClick={() => onExport('json')}
          title="Export as JSON"
        >
          JSON
        </button>
        <button
          className={styles.exportButton}
          onClick={() => onExport('excel')}
          title="Export as Excel"
        >
          Excel
        </button>
      </div>
    </div>
  );
};

export default ExportControls; 