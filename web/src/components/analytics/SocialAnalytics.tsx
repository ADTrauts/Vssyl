import React from 'react';
import styles from './SocialAnalytics.module.css';

interface SocialMetrics {
  totalConnections: number;
  activeGroups: number;
  engagementRate: number;
  averageResponseTime: number;
  interactionTrends: {
    date: string;
    interactions: number;
    engagement: number;
  }[];
  groupMetrics: {
    group: string;
    members: number;
    activity: number;
    growth: number;
  }[];
  contentTypes: {
    type: string;
    posts: number;
    engagement: number;
    reach: number;
  }[];
  topConnections: {
    name: string;
    interactions: number;
    lastActive: string;
    status: 'active' | 'inactive' | 'new';
  }[];
  recentInteractions: {
    id: string;
    date: string;
    type: string;
    connection: string;
    engagement: number;
  }[];
}

interface SocialAnalyticsProps {
  metrics: SocialMetrics;
}

const SocialAnalytics: React.FC<SocialAnalyticsProps> = ({ metrics }) => {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'inactive':
        return '#f44336';
      case 'new':
        return '#2196f3';
      default:
        return '#666';
    }
  };

  const formatGrowth = (growth: number) => {
    return growth > 0 ? `+${growth}%` : `${growth}%`;
  };

  return (
    <div className={styles.socialAnalytics}>
      <h2>Social Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Connections</h3>
          <div className={styles.metricValue}>{metrics.totalConnections}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Active Groups</h3>
          <div className={styles.metricValue}>{metrics.activeGroups}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Engagement Rate</h3>
          <div className={styles.metricValue}>{formatPercentage(metrics.engagementRate)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Avg. Response Time</h3>
          <div className={styles.metricValue}>{formatTime(metrics.averageResponseTime)}</div>
        </div>
      </div>

      <div className={styles.interactionTrends}>
        <h3>Interaction Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.interactionTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.interactions / Math.max(...metrics.interactionTrends.map(t => t.interactions))) * 100}%` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
              <span className={styles.trendEngagement}>{formatPercentage(trend.engagement)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.groupMetrics}>
        <h3>Group Metrics</h3>
        <div className={styles.groupsGrid}>
          {metrics.groupMetrics.map((group, index) => (
            <div key={index} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <span className={styles.groupName}>{group.group}</span>
                <span className={`${styles.groupGrowth} ${group.growth >= 0 ? styles.positive : styles.negative}`}>
                  {formatGrowth(group.growth)}
                </span>
              </div>
              <div className={styles.groupMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Members</span>
                  <span className={styles.metricValue}>{group.members}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Activity</span>
                  <span className={styles.metricValue}>{formatPercentage(group.activity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.contentTypes}>
        <h3>Content Types</h3>
        <div className={styles.typesGrid}>
          {metrics.contentTypes.map((type, index) => (
            <div key={index} className={styles.typeCard}>
              <div className={styles.typeHeader}>
                <span className={styles.typeName}>{type.type}</span>
                <span className={styles.typePosts}>{type.posts} posts</span>
              </div>
              <div className={styles.typeMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Engagement</span>
                  <span className={styles.metricValue}>{formatPercentage(type.engagement)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Reach</span>
                  <span className={styles.metricValue}>{type.reach.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.topConnections}>
        <h3>Top Connections</h3>
        <div className={styles.connectionsList}>
          {metrics.topConnections.map((connection, index) => (
            <div key={index} className={styles.connectionItem}>
              <div 
                className={styles.connectionStatus}
                style={{ backgroundColor: getStatusColor(connection.status) }}
              />
              <div className={styles.connectionDetails}>
                <div className={styles.connectionHeader}>
                  <span className={styles.connectionName}>{connection.name}</span>
                  <span className={styles.connectionLastActive}>{connection.lastActive}</span>
                </div>
                <div className={styles.connectionInteractions}>
                  {connection.interactions} interactions
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentInteractions}>
        <h3>Recent Interactions</h3>
        <div className={styles.interactionsList}>
          {metrics.recentInteractions.map((interaction, index) => (
            <div key={index} className={styles.interactionItem}>
              <div className={styles.interactionDetails}>
                <div className={styles.interactionHeader}>
                  <span className={styles.interactionId}>#{interaction.id}</span>
                  <span className={styles.interactionDate}>{interaction.date}</span>
                </div>
                <div className={styles.interactionInfo}>
                  <span className={styles.type}>{interaction.type}</span>
                  <span className={styles.connection}>{interaction.connection}</span>
                  <span className={styles.engagement}>{formatPercentage(interaction.engagement)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialAnalytics; 