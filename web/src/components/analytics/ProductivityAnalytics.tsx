import React from 'react';
import styles from './ProductivityAnalytics.module.css';

interface ProductivityMetrics {
  totalTasks: number;
  completedTasks: number;
  averageCompletionTime: number;
  focusScore: number;
  taskTrends: {
    date: string;
    completed: number;
    planned: number;
  }[];
  projectMetrics: {
    project: string;
    tasks: number;
    completion: number;
    efficiency: number;
  }[];
  timeAllocation: {
    category: string;
    hours: number;
    percentage: number;
  }[];
  productivityHealth: {
    metric: string;
    value: number;
    target: number;
    status: 'good' | 'warning' | 'critical';
  }[];
  recentActivities: {
    id: string;
    date: string;
    type: string;
    duration: number;
    efficiency: number;
  }[];
}

interface ProductivityAnalyticsProps {
  metrics: ProductivityMetrics;
}

const ProductivityAnalytics: React.FC<ProductivityAnalyticsProps> = ({ metrics }) => {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'critical':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const formatEfficiency = (value: number) => {
    return value > 0 ? `+${value}%` : `${value}%`;
  };

  return (
    <div className={styles.productivityAnalytics}>
      <h2>Productivity Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Tasks</h3>
          <div className={styles.metricValue}>{metrics.totalTasks}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Completed Tasks</h3>
          <div className={styles.metricValue}>{metrics.completedTasks}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Avg. Completion Time</h3>
          <div className={styles.metricValue}>{formatDuration(metrics.averageCompletionTime)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Focus Score</h3>
          <div className={styles.metricValue}>{formatPercentage(metrics.focusScore)}</div>
        </div>
      </div>

      <div className={styles.taskTrends}>
        <h3>Task Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.taskTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.completed / Math.max(...metrics.taskTrends.map(t => t.planned))) * 100}%` }}
              />
              <div 
                className={styles.plannedFill}
                style={{ height: `${(trend.planned / Math.max(...metrics.taskTrends.map(t => t.planned))) * 100}%` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
              <span className={styles.trendTasks}>{trend.completed}/{trend.planned}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.projectMetrics}>
        <h3>Project Metrics</h3>
        <div className={styles.projectsGrid}>
          {metrics.projectMetrics.map((project, index) => (
            <div key={index} className={styles.projectCard}>
              <div className={styles.projectHeader}>
                <span className={styles.projectName}>{project.project}</span>
                <span className={styles.projectCompletion}>{formatPercentage(project.completion)}</span>
              </div>
              <div className={styles.projectDetails}>
                <div className={styles.projectTasks}>
                  {project.tasks} tasks
                </div>
                <div className={`${styles.projectEfficiency} ${project.efficiency >= 0 ? styles.positive : styles.negative}`}>
                  {formatEfficiency(project.efficiency)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.timeAllocation}>
        <h3>Time Allocation</h3>
        <div className={styles.categoriesGrid}>
          {metrics.timeAllocation.map((category, index) => (
            <div key={index} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryName}>{category.category}</span>
                <span className={styles.categoryHours}>{formatDuration(category.hours)}</span>
              </div>
              <div className={styles.categoryPercentage}>
                {formatPercentage(category.percentage)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.productivityHealth}>
        <h3>Productivity Health</h3>
        <div className={styles.healthGrid}>
          {metrics.productivityHealth.map((metric, index) => (
            <div key={index} className={styles.healthCard}>
              <div className={styles.healthHeader}>
                <span className={styles.healthMetric}>{metric.metric}</span>
                <div 
                  className={styles.healthStatus}
                  style={{ backgroundColor: getStatusColor(metric.status) }}
                />
              </div>
              <div className={styles.healthValue}>
                {formatPercentage(metric.value)}
              </div>
              <div className={styles.healthTarget}>
                Target: {formatPercentage(metric.target)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentActivities}>
        <h3>Recent Activities</h3>
        <div className={styles.activitiesList}>
          {metrics.recentActivities.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div className={styles.activityDetails}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityId}>#{activity.id}</span>
                  <span className={styles.activityDate}>{activity.date}</span>
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityType}>{activity.type}</span>
                  <span className={styles.activityDuration}>{formatDuration(activity.duration)}</span>
                  <span className={`${styles.activityEfficiency} ${activity.efficiency >= 0 ? styles.positive : styles.negative}`}>
                    {formatEfficiency(activity.efficiency)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductivityAnalytics; 