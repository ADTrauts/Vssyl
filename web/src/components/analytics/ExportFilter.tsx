import React, { useState } from 'react';
import styles from './ExportFilter.module.css';
import ExportTemplates from './ExportTemplates';
import { TimeSeriesData } from './TimeSeriesCharts';
import { ExportTemplate } from './ExportTemplates';

export interface ExportFilterOptions {
  includeThreads: boolean;
  includeUsers: boolean;
  includeTags: boolean;
  startDate: string;
  endDate: string;
}

interface ExportFilterProps {
  onExport: (options: ExportFilterOptions) => void;
  threadActivity: TimeSeriesData[];
  userActivity: TimeSeriesData[];
  tagActivity: TimeSeriesData[];
}

const ExportFilter: React.FC<ExportFilterProps> = ({
  onExport,
  threadActivity,
  userActivity,
  tagActivity,
}) => {
  const [options, setOptions] = useState<ExportFilterOptions>({
    includeThreads: true,
    includeUsers: true,
    includeTags: true,
    startDate: '',
    endDate: '',
  });

  const handleTemplateSelect = (template: ExportTemplate) => {
    setOptions(template.options);
  };

  const handleExport = () => {
    onExport(options);
  };

  return (
    <div className={styles.filterContainer}>
      <ExportTemplates
        onTemplateSelect={handleTemplateSelect}
        currentOptions={options}
        threadActivity={threadActivity}
        userActivity={userActivity}
        tagActivity={tagActivity}
      />
      <div className={styles.filterOptions}>
        <div className={styles.optionGroup}>
          <h4>Data Types</h4>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={options.includeThreads}
              onChange={(e) =>
                setOptions({ ...options, includeThreads: e.target.checked })
              }
            />
            Thread Activity
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={options.includeUsers}
              onChange={(e) =>
                setOptions({ ...options, includeUsers: e.target.checked })
              }
            />
            User Activity
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={options.includeTags}
              onChange={(e) =>
                setOptions({ ...options, includeTags: e.target.checked })
              }
            />
            Tag Activity
          </label>
        </div>
        <div className={styles.optionGroup}>
          <h4>Date Range</h4>
          <div className={styles.dateInputs}>
            <div className={styles.dateInput}>
              <label htmlFor="startDate">Start Date:</label>
              <input
                id="startDate"
                type="date"
                value={options.startDate}
                onChange={(e) =>
                  setOptions({ ...options, startDate: e.target.value })
                }
              />
            </div>
            <div className={styles.dateInput}>
              <label htmlFor="endDate">End Date:</label>
              <input
                id="endDate"
                type="date"
                value={options.endDate}
                onChange={(e) =>
                  setOptions({ ...options, endDate: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
      <button className={styles.exportButton} onClick={handleExport}>
        Export Data
      </button>
    </div>
  );
};

export default ExportFilter; 