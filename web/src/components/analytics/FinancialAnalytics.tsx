import React from 'react';
import styles from './FinancialAnalytics.module.css';

interface FinancialMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface RevenueStream {
  source: string;
  amount: number;
  growth: number;
  contribution: number;
  forecast: number;
}

interface CostAnalysis {
  category: string;
  amount: number;
  budget: number;
  status: 'under-budget' | 'on-budget' | 'over-budget';
  breakdown: {
    item: string;
    amount: number;
  }[];
}

interface FinancialHealth {
  metric: string;
  value: number;
  target: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: string[];
}

interface FinancialAnalyticsProps {
  metrics: FinancialMetric[];
  revenue: RevenueStream[];
  costs: CostAnalysis[];
  health: FinancialHealth[];
}

const FinancialAnalytics: React.FC<FinancialAnalyticsProps> = ({
  metrics,
  revenue,
  costs,
  health,
}) => {
  return (
    <div className={styles.financialAnalytics}>
      <h2>Financial Analytics</h2>
      
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

      {/* Revenue Streams */}
      <div className={styles.revenueStreams}>
        <h3>Revenue Streams</h3>
        <div className={styles.revenueGrid}>
          {revenue.map((stream) => (
            <div key={stream.source} className={styles.revenueCard}>
              <div className={styles.revenueHeader}>
                <span className={styles.sourceName}>{stream.source}</span>
                <span className={styles.contribution}>
                  {stream.contribution}% of total
                </span>
              </div>
              <div className={styles.revenueDetails}>
                <div className={styles.amount}>
                  ${stream.amount.toLocaleString()}
                </div>
                <div className={styles.growth}>
                  Growth: {stream.growth > 0 ? '+' : ''}{stream.growth}%
                </div>
                <div className={styles.forecast}>
                  Forecast: ${stream.forecast.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Analysis */}
      <div className={styles.costAnalysis}>
        <h3>Cost Analysis</h3>
        <div className={styles.costsGrid}>
          {costs.map((cost) => (
            <div key={cost.category} className={`${styles.costCard} ${styles[cost.status]}`}>
              <div className={styles.costHeader}>
                <span className={styles.categoryName}>{cost.category}</span>
                <div className={`${styles.costStatus} ${styles[cost.status]}`} />
              </div>
              <div className={styles.costDetails}>
                <div className={styles.amount}>
                  ${cost.amount.toLocaleString()}
                </div>
                <div className={styles.budget}>
                  Budget: ${cost.budget.toLocaleString()}
                </div>
                <div className={styles.breakdown}>
                  {cost.breakdown.map((item, index) => (
                    <div key={index} className={styles.breakdownItem}>
                      <span>{item.item}</span>
                      <span>${item.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Health */}
      <div className={styles.financialHealth}>
        <h3>Financial Health</h3>
        <div className={styles.healthGrid}>
          {health.map((metric) => (
            <div key={metric.metric} className={`${styles.healthCard} ${styles[metric.status]}`}>
              <div className={styles.healthHeader}>
                <span className={styles.metricName}>{metric.metric}</span>
                <div className={`${styles.healthStatus} ${styles[metric.status]}`} />
              </div>
              <div className={styles.healthDetails}>
                <div className={styles.value}>
                  {metric.value.toLocaleString()}
                </div>
                <div className={styles.target}>
                  Target: {metric.target.toLocaleString()}
                </div>
                <div className={styles.trends}>
                  {metric.trend.map((trend, index) => (
                    <span key={index} className={styles.trendItem}>{trend}</span>
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

export default FinancialAnalytics; 