import React from 'react';
import styles from './SecurityAnalytics.module.css';

interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
  status: 'secure' | 'warning' | 'critical';
}

interface ThreatActivity {
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  action: string;
}

interface SecurityScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  details: string[];
}

interface ProtectionStatus {
  system: string;
  status: 'protected' | 'vulnerable' | 'compromised';
  lastScan: string;
  threats: number;
  actions: string[];
}

interface SecurityAnalyticsProps {
  metrics: SecurityMetric[];
  threatActivities: ThreatActivity[];
  securityScores: SecurityScore[];
  protectionStatus: ProtectionStatus[];
}

const SecurityAnalytics: React.FC<SecurityAnalyticsProps> = ({
  metrics,
  threatActivities,
  securityScores,
  protectionStatus,
}) => {
  return (
    <div className={styles.securityAnalytics}>
      <h2>Security Analytics</h2>
      
      {/* Summary Metrics */}
      <div className={styles.summaryMetrics}>
        {metrics.map((metric) => (
          <div key={metric.id} className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <h3>{metric.name}</h3>
              <div className={`${styles.statusIndicator} ${styles[metric.status]}`} />
            </div>
            <div className={styles.metricValue}>
              {metric.value.toLocaleString()}
              <span className={`${styles.change} ${styles[metric.trend]}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Threat Activity */}
      <div className={styles.threatActivity}>
        <h3>Threat Activity</h3>
        <div className={styles.activityList}>
          {threatActivities.map((activity) => (
            <div key={activity.timestamp} className={`${styles.activityItem} ${styles[activity.severity]}`}>
              <div className={styles.activityHeader}>
                <span className={styles.activityTimestamp}>{activity.timestamp}</span>
                <span className={styles.activityType}>{activity.type}</span>
              </div>
              <div className={styles.activityDetails}>
                <span className={styles.activitySource}>Source: {activity.source}</span>
                <span className={styles.activityAction}>Action: {activity.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Scores */}
      <div className={styles.securityScores}>
        <h3>Security Scores</h3>
        <div className={styles.scoresGrid}>
          {securityScores.map((score) => (
            <div key={score.category} className={styles.scoreCard}>
              <div className={styles.scoreHeader}>
                <span className={styles.scoreCategory}>{score.category}</span>
                <div className={`${styles.scoreStatus} ${styles[score.status]}`} />
              </div>
              <div className={styles.scoreValue}>
                {score.score}/{score.maxScore}
              </div>
              <div className={styles.scoreProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ width: `${(score.score / score.maxScore) * 100}%` }}
                />
              </div>
              <div className={styles.scoreDetails}>
                {score.details.map((detail, index) => (
                  <span key={index} className={styles.detailItem}>{detail}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protection Status */}
      <div className={styles.protectionStatus}>
        <h3>Protection Status</h3>
        <div className={styles.protectionGrid}>
          {protectionStatus.map((status) => (
            <div key={status.system} className={`${styles.protectionCard} ${styles[status.status]}`}>
              <div className={styles.protectionHeader}>
                <span className={styles.systemName}>{status.system}</span>
                <span className={styles.lastScan}>Last Scan: {status.lastScan}</span>
              </div>
              <div className={styles.protectionDetails}>
                <div className={styles.threatCount}>
                  Active Threats: {status.threats}
                </div>
                <div className={styles.actionList}>
                  {status.actions.map((action, index) => (
                    <span key={index} className={styles.actionItem}>{action}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityAnalytics; 