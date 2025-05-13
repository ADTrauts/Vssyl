import React from 'react';
import styles from './HealthAnalytics.module.css';

interface HealthMetrics {
  totalWorkouts: number;
  activeGoals: number;
  averageSleep: number;
  averageSteps: number;
  workoutTrends: {
    date: string;
    duration: number;
    calories: number;
  }[];
  sleepPatterns: {
    date: string;
    duration: number;
    quality: number;
  }[];
  activityTypes: {
    type: string;
    count: number;
    duration: number;
    calories: number;
  }[];
  wellnessMetrics: {
    metric: string;
    value: number;
    target: number;
    unit: string;
  }[];
  recentActivities: {
    id: string;
    date: string;
    type: string;
    duration: number;
    calories: number;
    intensity: 'low' | 'medium' | 'high';
  }[];
}

interface HealthAnalyticsProps {
  metrics: HealthMetrics;
}

const HealthAnalytics: React.FC<HealthAnalyticsProps> = ({ metrics }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCalories = (calories: number) => {
    return calories.toLocaleString();
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low':
        return '#4caf50';
      case 'medium':
        return '#ff9800';
      case 'high':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const calculateProgress = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  return (
    <div className={styles.healthAnalytics}>
      <h2>Health Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Workouts</h3>
          <div className={styles.metricValue}>{metrics.totalWorkouts}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Active Goals</h3>
          <div className={styles.metricValue}>{metrics.activeGoals}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Avg. Sleep</h3>
          <div className={styles.metricValue}>{formatDuration(metrics.averageSleep)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Avg. Steps</h3>
          <div className={styles.metricValue}>{metrics.averageSteps.toLocaleString()}</div>
        </div>
      </div>

      <div className={styles.workoutTrends}>
        <h3>Workout Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.workoutTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.duration / 120) * 100}%` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
              <span className={styles.trendCalories}>{formatCalories(trend.calories)} cal</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.sleepPatterns}>
        <h3>Sleep Patterns</h3>
        <div className={styles.patternsGrid}>
          {metrics.sleepPatterns.map((pattern, index) => (
            <div key={index} className={styles.patternCard}>
              <div className={styles.patternHeader}>
                <span className={styles.patternDate}>{pattern.date}</span>
                <span className={styles.patternQuality}>{pattern.quality}/10</span>
              </div>
              <div className={styles.patternBar}>
                <div 
                  className={styles.patternFill}
                  style={{ width: `${(pattern.duration / 8) * 100}%` }}
                />
              </div>
              <div className={styles.patternDuration}>
                {formatDuration(pattern.duration)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.activityTypes}>
        <h3>Activity Types</h3>
        <div className={styles.typesGrid}>
          {metrics.activityTypes.map((type, index) => (
            <div key={index} className={styles.typeCard}>
              <div className={styles.typeHeader}>
                <span className={styles.typeName}>{type.type}</span>
                <span className={styles.typeCount}>{type.count} sessions</span>
              </div>
              <div className={styles.typeMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Duration</span>
                  <span className={styles.metricValue}>{formatDuration(type.duration)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Calories</span>
                  <span className={styles.metricValue}>{formatCalories(type.calories)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.wellnessMetrics}>
        <h3>Wellness Metrics</h3>
        <div className={styles.metricsGrid}>
          {metrics.wellnessMetrics.map((metric, index) => (
            <div key={index} className={styles.metricCard}>
              <div className={styles.metricHeader}>
                <span className={styles.metricName}>{metric.metric}</span>
                <span className={styles.metricTarget}>Target: {metric.target}{metric.unit}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${calculateProgress(metric.value, metric.target)}%` }}
                />
              </div>
              <div className={styles.metricValue}>
                {metric.value}{metric.unit}
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
              <div 
                className={styles.activityType}
                style={{ backgroundColor: getIntensityColor(activity.intensity) }}
              />
              <div className={styles.activityDetails}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityId}>#{activity.id}</span>
                  <span className={styles.activityDate}>{activity.date}</span>
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.type}>{activity.type}</span>
                  <span className={styles.duration}>{formatDuration(activity.duration)}</span>
                  <span className={styles.calories}>{formatCalories(activity.calories)} cal</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HealthAnalytics; 