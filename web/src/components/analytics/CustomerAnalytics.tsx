import React from 'react';
import styles from './CustomerAnalytics.module.css';

interface CustomerMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface CustomerSegment {
  segment: string;
  size: number;
  growth: number;
  lifetimeValue: number;
  characteristics: string[];
}

interface SatisfactionScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs-improvement';
  feedback: string[];
}

interface EngagementMetric {
  channel: string;
  reach: number;
  engagement: number;
  conversion: number;
  trends: string[];
}

interface CustomerAnalyticsProps {
  metrics: CustomerMetric[];
  segments: CustomerSegment[];
  satisfaction: SatisfactionScore[];
  engagement: EngagementMetric[];
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({
  metrics,
  segments,
  satisfaction,
  engagement,
}) => {
  return (
    <div className={styles.customerAnalytics}>
      <h2>Customer Analytics</h2>
      
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

      {/* Customer Segments */}
      <div className={styles.customerSegments}>
        <h3>Customer Segments</h3>
        <div className={styles.segmentsGrid}>
          {segments.map((segment) => (
            <div key={segment.segment} className={styles.segmentCard}>
              <div className={styles.segmentHeader}>
                <span className={styles.segmentName}>{segment.segment}</span>
                <span className={styles.segmentSize}>
                  {segment.size.toLocaleString()} customers
                </span>
              </div>
              <div className={styles.segmentDetails}>
                <div className={styles.growth}>
                  Growth: {segment.growth > 0 ? '+' : ''}{segment.growth}%
                </div>
                <div className={styles.lifetimeValue}>
                  Lifetime Value: ${segment.lifetimeValue.toLocaleString()}
                </div>
                <div className={styles.characteristics}>
                  {segment.characteristics.map((characteristic, index) => (
                    <span key={index} className={styles.characteristicItem}>
                      {characteristic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Satisfaction Scores */}
      <div className={styles.satisfactionScores}>
        <h3>Customer Satisfaction</h3>
        <div className={styles.scoresGrid}>
          {satisfaction.map((score) => (
            <div key={score.category} className={`${styles.scoreCard} ${styles[score.status]}`}>
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
              <div className={styles.feedback}>
                {score.feedback.map((item, index) => (
                  <span key={index} className={styles.feedbackItem}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className={styles.engagementMetrics}>
        <h3>Engagement Metrics</h3>
        <div className={styles.engagementGrid}>
          {engagement.map((metric) => (
            <div key={metric.channel} className={styles.engagementCard}>
              <div className={styles.engagementHeader}>
                <span className={styles.channelName}>{metric.channel}</span>
                <span className={styles.reach}>
                  Reach: {metric.reach.toLocaleString()}
                </span>
              </div>
              <div className={styles.engagementDetails}>
                <div className={styles.engagementRate}>
                  Engagement: {metric.engagement}%
                </div>
                <div className={styles.conversionRate}>
                  Conversion: {metric.conversion}%
                </div>
                <div className={styles.trends}>
                  {metric.trends.map((trend, index) => (
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

export default CustomerAnalytics; 