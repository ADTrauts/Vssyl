import React from 'react';
import styles from './PerformanceAnalytics.module.css';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface ResourceUsage {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface SystemLoad {
  category: string;
  current: number;
  peak: number;
  average: number;
  status: 'optimal' | 'normal' | 'high' | 'critical';
}

interface EfficiencyScore {
  metric: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  details: string[];
}

interface PerformanceAnalyticsProps {
  metrics: PerformanceMetric[];
  resourceUsage: ResourceUsage[];
  systemLoad: SystemLoad[];
  efficiency: EfficiencyScore[];
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  metrics,
  resourceUsage,
  systemLoad,
  efficiency,
}) => {
  return (
    <div className={styles.performanceAnalytics}>
      <h2>Performance Analytics</h2>
      
      {/* Summary Metrics */}
      <div className={styles.summaryMetrics}>
        {metrics.map((metric) => (
          <div key={metric.id} className={styles.metricCard}>
            <h3>{metric.name}</h3>
            <div className={styles.metricValue}>
              {metric.value.toLocaleString()} {metric.unit}
              <span className={`${styles.change} ${styles[metric.trend]}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Resource Usage */}
      <div className={styles.resourceUsage}>
        <h3>Resource Usage</h3>
        <div className={styles.usageChart}>
          {resourceUsage.map((usage) => (
            <div key={usage.timestamp} className={styles.usageBar}>
              <div className={styles.cpuFill} style={{ height: `${usage.cpu}%` }} />
              <div className={styles.memoryFill} style={{ height: `${usage.memory}%` }} />
              <div className={styles.diskFill} style={{ height: `${usage.disk}%` }} />
              <div className={styles.networkFill} style={{ height: `${usage.network}%` }} />
              <div className={styles.usageDate}>{usage.timestamp}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System Load */}
      <div className={styles.systemLoad}>
        <h3>System Load</h3>
        <div className={styles.loadGrid}>
          {systemLoad.map((load) => (
            <div key={load.category} className={`${styles.loadCard} ${styles[load.status]}`}>
              <div className={styles.loadHeader}>
                <span className={styles.loadCategory}>{load.category}</span>
                <span className={styles.loadStatus}>{load.status}</span>
              </div>
              <div className={styles.loadValue}>
                Current: {load.current.toLocaleString()}
              </div>
              <div className={styles.loadDetails}>
                <div className={styles.loadDetail}>
                  Peak: {load.peak.toLocaleString()}
                </div>
                <div className={styles.loadDetail}>
                  Average: {load.average.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Efficiency Scores */}
      <div className={styles.efficiencyScores}>
        <h3>Efficiency Scores</h3>
        <div className={styles.efficiencyGrid}>
          {efficiency.map((score) => (
            <div key={score.metric} className={styles.efficiencyCard}>
              <div className={styles.efficiencyHeader}>
                <span className={styles.efficiencyMetric}>{score.metric}</span>
                <div className={`${styles.efficiencyStatus} ${styles[score.status]}`} />
              </div>
              <div className={styles.efficiencyValue}>
                {score.score}/{score.maxScore}
              </div>
              <div className={styles.efficiencyProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ width: `${(score.score / score.maxScore) * 100}%` }}
                />
              </div>
              <div className={styles.efficiencyDetails}>
                {score.details.map((detail, index) => (
                  <span key={index} className={styles.detailItem}>{detail}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics; 