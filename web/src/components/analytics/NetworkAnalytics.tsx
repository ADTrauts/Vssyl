import React from 'react';
import styles from './NetworkAnalytics.module.css';

interface NetworkMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface TrafficPattern {
  timestamp: string;
  incoming: number;
  outgoing: number;
  total: number;
}

interface ConnectionStatus {
  endpoint: string;
  status: 'connected' | 'disconnected' | 'degraded';
  latency: number;
  packetLoss: number;
  lastCheck: string;
}

interface NetworkHealth {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  details: string[];
}

interface NetworkAnalyticsProps {
  metrics: NetworkMetric[];
  trafficPatterns: TrafficPattern[];
  connections: ConnectionStatus[];
  health: NetworkHealth[];
}

const NetworkAnalytics: React.FC<NetworkAnalyticsProps> = ({
  metrics,
  trafficPatterns,
  connections,
  health,
}) => {
  return (
    <div className={styles.networkAnalytics}>
      <h2>Network Analytics</h2>
      
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

      {/* Traffic Patterns */}
      <div className={styles.trafficPatterns}>
        <h3>Traffic Patterns</h3>
        <div className={styles.trafficChart}>
          {trafficPatterns.map((pattern) => (
            <div key={pattern.timestamp} className={styles.trafficBar}>
              <div className={styles.incomingFill} style={{ height: `${(pattern.incoming / Math.max(...trafficPatterns.map(p => p.total))) * 100}%` }} />
              <div className={styles.outgoingFill} style={{ height: `${(pattern.outgoing / Math.max(...trafficPatterns.map(p => p.total))) * 100}%` }} />
              <div className={styles.trafficDate}>{pattern.timestamp}</div>
              <div className={styles.trafficTotal}>
                Total: {pattern.total.toLocaleString()} MB
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className={styles.connectionStatus}>
        <h3>Connection Status</h3>
        <div className={styles.connectionsGrid}>
          {connections.map((connection) => (
            <div key={connection.endpoint} className={`${styles.connectionCard} ${styles[connection.status]}`}>
              <div className={styles.connectionHeader}>
                <span className={styles.endpointName}>{connection.endpoint}</span>
                <span className={styles.lastCheck}>Last Check: {connection.lastCheck}</span>
              </div>
              <div className={styles.connectionDetails}>
                <div className={styles.latency}>
                  Latency: {connection.latency}ms
                </div>
                <div className={styles.packetLoss}>
                  Packet Loss: {connection.packetLoss}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Health */}
      <div className={styles.networkHealth}>
        <h3>Network Health</h3>
        <div className={styles.healthGrid}>
          {health.map((item) => (
            <div key={item.category} className={styles.healthCard}>
              <div className={styles.healthHeader}>
                <span className={styles.healthCategory}>{item.category}</span>
                <div className={`${styles.healthStatus} ${styles[item.status]}`} />
              </div>
              <div className={styles.healthValue}>
                {item.score}/{item.maxScore}
              </div>
              <div className={styles.healthProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                />
              </div>
              <div className={styles.healthDetails}>
                {item.details.map((detail, index) => (
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

export default NetworkAnalytics; 