import React from 'react';
import styles from './TemplatePreview.module.css';
import { ExportTemplate } from './ExportTemplates';
import { TimeSeriesData } from './TimeSeriesCharts';

interface TemplatePreviewProps {
  template: ExportTemplate;
  threadActivity: TimeSeriesData[];
  userActivity: TimeSeriesData[];
  tagActivity: TimeSeriesData[];
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  template,
  threadActivity,
  userActivity,
  tagActivity,
}) => {
  const filterDataByDate = (data: TimeSeriesData[]): TimeSeriesData[] => {
    if (!template.options.startDate && !template.options.endDate) {
      return data;
    }

    return data.filter((item) => {
      const timestamp = new Date(item.timestamp).getTime();
      const startDate = template.options.startDate ? new Date(template.options.startDate).getTime() : 0;
      const endDate = template.options.endDate ? new Date(template.options.endDate).getTime() : Infinity;
      return timestamp >= startDate && timestamp <= endDate;
    });
  };

  const filteredThreadData = filterDataByDate(threadActivity);
  const filteredUserData = filterDataByDate(userActivity);
  const filteredTagData = filterDataByDate(tagActivity);

  const getDataSummary = (data: TimeSeriesData[]) => {
    if (data.length === 0) return 'No data';
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return `${data.length} data points (min: ${min.toFixed(1)}, max: ${max.toFixed(1)}, avg: ${avg.toFixed(1)})`;
  };

  return (
    <div className={styles.previewContainer}>
      <h3>Preview: {template.name}</h3>
      <p className={styles.description}>{template.description}</p>
      
      <div className={styles.dataSummary}>
        {template.options.includeThreads && (
          <div className={styles.summaryItem}>
            <h4>Thread Activity</h4>
            <p>{getDataSummary(filteredThreadData)}</p>
          </div>
        )}
        {template.options.includeUsers && (
          <div className={styles.summaryItem}>
            <h4>User Activity</h4>
            <p>{getDataSummary(filteredUserData)}</p>
          </div>
        )}
        {template.options.includeTags && (
          <div className={styles.summaryItem}>
            <h4>Tag Activity</h4>
            <p>{getDataSummary(filteredTagData)}</p>
          </div>
        )}
      </div>

      <div className={styles.dateRange}>
        <p>
          <strong>Date Range:</strong>{' '}
          {template.options.startDate || 'Start'} to {template.options.endDate || 'End'}
        </p>
      </div>
    </div>
  );
};

export default TemplatePreview; 