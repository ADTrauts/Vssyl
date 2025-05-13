import React from 'react';
import styles from './FileAnalytics.module.css';

interface FileMetrics {
  totalFiles: number;
  totalSize: string;
  fileTypes: {
    [key: string]: {
      count: number;
      size: string;
      percentage: number;
    };
  };
  recentActivity: {
    timestamp: string;
    action: 'upload' | 'download' | 'edit' | 'delete';
    fileName: string;
    user: string;
  }[];
  storageUsage: {
    used: string;
    available: string;
    percentage: number;
  };
}

interface FileAnalyticsProps {
  metrics: FileMetrics;
}

const FileAnalytics: React.FC<FileAnalyticsProps> = ({ metrics }) => {
  const formatFileType = (type: string) => {
    return type.toUpperCase();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upload':
        return '#4caf50';
      case 'download':
        return '#2196f3';
      case 'edit':
        return '#ff9800';
      case 'delete':
        return '#f44336';
      default:
        return '#666';
    }
  };

  return (
    <div className={styles.fileAnalytics}>
      <h2>File System Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Files</h3>
          <div className={styles.metricValue}>{metrics.totalFiles}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Total Size</h3>
          <div className={styles.metricValue}>{metrics.totalSize}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Storage Usage</h3>
          <div className={styles.storageBar}>
            <div 
              className={styles.storageFill}
              style={{ width: `${metrics.storageUsage.percentage}%` }}
            />
          </div>
          <div className={styles.storageInfo}>
            <span>{metrics.storageUsage.used} used</span>
            <span>{metrics.storageUsage.available} available</span>
          </div>
        </div>
      </div>

      <div className={styles.fileTypes}>
        <h3>File Types</h3>
        <div className={styles.fileTypeGrid}>
          {Object.entries(metrics.fileTypes).map(([type, data]) => (
            <div key={type} className={styles.fileTypeCard}>
              <div className={styles.fileTypeHeader}>
                <span className={styles.fileTypeLabel}>{formatFileType(type)}</span>
                <span className={styles.fileTypeCount}>{data.count}</span>
              </div>
              <div className={styles.fileTypeDetails}>
                <div className={styles.fileTypeSize}>{data.size}</div>
                <div className={styles.fileTypePercentage}>
                  {data.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          {metrics.recentActivity.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div 
                className={styles.activityIcon}
                style={{ backgroundColor: getActionColor(activity.action) }}
              >
                {activity.action.charAt(0).toUpperCase()}
              </div>
              <div className={styles.activityDetails}>
                <div className={styles.activityFileName}>{activity.fileName}</div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityUser}>{activity.user}</span>
                  <span className={styles.activityTime}>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileAnalytics; 