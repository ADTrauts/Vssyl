import React from 'react';
import styles from './LifeAnalytics.module.css';

interface LifeMetrics {
  totalActivities: number;
  activeGoals: number;
  completionRate: number;
  averageHappiness: number;
  activityTrends: {
    date: string;
    count: number;
  }[];
  goalProgress: {
    goalName: string;
    progress: number;
    target: number;
    category: string;
  }[];
  lifestyleSegments: {
    segment: string;
    count: number;
    averageHappiness: number;
    engagementScore: number;
  }[];
  wellnessChannels: {
    channel: string;
    usage: number;
    percentage: number;
    growth: number;
  }[];
  recentActivities: {
    activityId: string;
    date: string;
    category: string;
    type: 'health' | 'fitness' | 'mindfulness' | 'social' | 'learning';
    duration: number;
    mood?: number;
  }[];
}

interface LifeAnalyticsProps {
  metrics: LifeMetrics;
}

const LifeAnalytics: React.FC<LifeAnalyticsProps> = ({ metrics }) => {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'health':
        return '#4caf50';
      case 'fitness':
        return '#2196f3';
      case 'mindfulness':
        return '#9c27b0';
      case 'social':
        return '#ff9800';
      case 'learning':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const formatGrowth = (growth: number) => {
    return growth > 0 ? `+${growth}%` : `${growth}%`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className={styles.lifeAnalytics}>
      <h2>Life Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Activities</h3>
          <div className={styles.metricValue}>{metrics.totalActivities}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Active Goals</h3>
          <div className={styles.metricValue}>{metrics.activeGoals}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Completion Rate</h3>
          <div className={styles.metricValue}>{formatPercentage(metrics.completionRate)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Average Happiness</h3>
          <div className={styles.metricValue}>{metrics.averageHappiness.toFixed(1)}/10</div>
        </div>
      </div>

      <div className={styles.activityTrends}>
        <h3>Activity Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.activityTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.count / metrics.totalActivities) * 150}px` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.goalProgress}>
        <h3>Goal Progress</h3>
        <div className={styles.goalsGrid}>
          {metrics.goalProgress.map((goal, index) => (
            <div key={index} className={styles.goalCard}>
              <div className={styles.goalHeader}>
                <span className={styles.goalName}>{goal.goalName}</span>
                <span className={styles.goalCategory}>{goal.category}</span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${(goal.progress / goal.target) * 100}%` }}
                />
              </div>
              <div className={styles.goalMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Progress</span>
                  <span className={styles.metricValue}>{formatPercentage((goal.progress / goal.target) * 100)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Target</span>
                  <span className={styles.metricValue}>{goal.target}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.lifestyleSegments}>
        <h3>Lifestyle Segments</h3>
        <div className={styles.segmentsGrid}>
          {metrics.lifestyleSegments.map((segment, index) => (
            <div key={index} className={styles.segmentCard}>
              <div className={styles.segmentHeader}>
                <span className={styles.segmentLabel}>{segment.segment}</span>
                <span className={styles.segmentCount}>{segment.count} activities</span>
              </div>
              <div className={styles.segmentMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Avg. Happiness</span>
                  <span className={styles.metricValue}>{segment.averageHappiness.toFixed(1)}/10</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Engagement</span>
                  <span className={styles.metricValue}>{segment.engagementScore}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.wellnessChannels}>
        <h3>Wellness Channels</h3>
        <div className={styles.channelsGrid}>
          {metrics.wellnessChannels.map((channel, index) => (
            <div key={index} className={styles.channelCard}>
              <div className={styles.channelHeader}>
                <span className={styles.channelLabel}>{channel.channel}</span>
                <span className={`${styles.channelGrowth} ${channel.growth >= 0 ? styles.positive : styles.negative}`}>
                  {formatGrowth(channel.growth)}
                </span>
              </div>
              <div className={styles.channelMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Usage</span>
                  <span className={styles.metricValue}>{channel.usage}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Share</span>
                  <span className={styles.metricValue}>{channel.percentage}%</span>
                </div>
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
                style={{ backgroundColor: getActivityColor(activity.type) }}
              />
              <div className={styles.activityDetails}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityId}>#{activity.activityId}</span>
                  <span className={styles.activityDate}>{activity.date}</span>
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.category}>{activity.category}</span>
                  <span className={styles.duration}>{formatDuration(activity.duration)}</span>
                </div>
              </div>
              {activity.mood !== undefined && (
                <div className={styles.moodScore}>
                  {activity.mood.toFixed(1)}/10
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LifeAnalytics; 