import React from 'react';
import styles from './OperationalAnalytics.module.css';

interface OperationalMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface ProcessEfficiency {
  process: string;
  efficiency: number;
  throughput: number;
  cycleTime: number;
  bottlenecks: string[];
}

interface ResourceUtilization {
  resource: string;
  utilization: number;
  capacity: number;
  status: 'optimal' | 'underutilized' | 'overutilized';
  metrics: {
    name: string;
    value: number;
  }[];
}

interface OperationalHealth {
  category: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  metrics: {
    name: string;
    value: number;
    target: number;
  }[];
}

interface OperationalAnalyticsProps {
  metrics: OperationalMetric[];
  processes: ProcessEfficiency[];
  resources: ResourceUtilization[];
  health: OperationalHealth[];
}

const OperationalAnalytics: React.FC<OperationalAnalyticsProps> = ({
  metrics,
  processes,
  resources,
  health,
}) => {
  return (
    <div className={styles.operationalAnalytics}>
      <h2>Operational Analytics</h2>
      
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

      {/* Process Efficiency */}
      <div className={styles.processEfficiency}>
        <h3>Process Efficiency</h3>
        <div className={styles.processesGrid}>
          {processes.map((process) => (
            <div key={process.process} className={styles.processCard}>
              <div className={styles.processHeader}>
                <span className={styles.processName}>{process.process}</span>
                <span className={styles.efficiency}>
                  {process.efficiency}% Efficient
                </span>
              </div>
              <div className={styles.processDetails}>
                <div className={styles.throughput}>
                  Throughput: {process.throughput.toLocaleString()} units/day
                </div>
                <div className={styles.cycleTime}>
                  Cycle Time: {process.cycleTime} hours
                </div>
                <div className={styles.bottlenecks}>
                  {process.bottlenecks.map((bottleneck, index) => (
                    <span key={index} className={styles.bottleneckItem}>
                      {bottleneck}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Utilization */}
      <div className={styles.resourceUtilization}>
        <h3>Resource Utilization</h3>
        <div className={styles.resourcesGrid}>
          {resources.map((resource) => (
            <div key={resource.resource} className={`${styles.resourceCard} ${styles[resource.status]}`}>
              <div className={styles.resourceHeader}>
                <span className={styles.resourceName}>{resource.resource}</span>
                <div className={`${styles.utilizationStatus} ${styles[resource.status]}`} />
              </div>
              <div className={styles.resourceDetails}>
                <div className={styles.utilization}>
                  Utilization: {resource.utilization}%
                </div>
                <div className={styles.capacity}>
                  Capacity: {resource.capacity.toLocaleString()} units
                </div>
                <div className={styles.metrics}>
                  {resource.metrics.map((metric, index) => (
                    <div key={index} className={styles.metricItem}>
                      <span>{metric.name}</span>
                      <span>{metric.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Health */}
      <div className={styles.operationalHealth}>
        <h3>Operational Health</h3>
        <div className={styles.healthGrid}>
          {health.map((category) => (
            <div key={category.category} className={`${styles.healthCard} ${styles[category.status]}`}>
              <div className={styles.healthHeader}>
                <span className={styles.categoryName}>{category.category}</span>
                <div className={`${styles.healthStatus} ${styles[category.status]}`} />
              </div>
              <div className={styles.healthDetails}>
                <div className={styles.score}>
                  Score: {category.score}/100
                </div>
                <div className={styles.metrics}>
                  {category.metrics.map((metric, index) => (
                    <div key={index} className={styles.metricItem}>
                      <span>{metric.name}</span>
                      <span>
                        {metric.value.toLocaleString()} / {metric.target.toLocaleString()}
                      </span>
                    </div>
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

export default OperationalAnalytics; 