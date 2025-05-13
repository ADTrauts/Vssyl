import React from 'react';
import styles from './QualityAnalytics.module.css';

interface QualityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface DefectTrend {
  timestamp: string;
  critical: number;
  major: number;
  minor: number;
  total: number;
}

interface QualityScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  details: string[];
}

interface TestCoverage {
  type: string;
  covered: number;
  total: number;
  percentage: number;
  status: 'complete' | 'partial' | 'incomplete';
}

interface QualityAnalyticsProps {
  metrics: QualityMetric[];
  defectTrends: DefectTrend[];
  qualityScores: QualityScore[];
  testCoverage: TestCoverage[];
}

const QualityAnalytics: React.FC<QualityAnalyticsProps> = ({
  metrics,
  defectTrends,
  qualityScores,
  testCoverage,
}) => {
  return (
    <div className={styles.qualityAnalytics}>
      <h2>Quality Analytics</h2>
      
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

      {/* Defect Trends */}
      <div className={styles.defectTrends}>
        <h3>Defect Trends</h3>
        <div className={styles.trendChart}>
          {defectTrends.map((trend) => (
            <div key={trend.timestamp} className={styles.trendBar}>
              <div className={styles.criticalFill} style={{ height: `${(trend.critical / Math.max(...defectTrends.map(t => t.total))) * 100}%` }} />
              <div className={styles.majorFill} style={{ height: `${(trend.major / Math.max(...defectTrends.map(t => t.total))) * 100}%` }} />
              <div className={styles.minorFill} style={{ height: `${(trend.minor / Math.max(...defectTrends.map(t => t.total))) * 100}%` }} />
              <div className={styles.trendDate}>{trend.timestamp}</div>
              <div className={styles.trendTotal}>
                Total: {trend.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quality Scores */}
      <div className={styles.qualityScores}>
        <h3>Quality Scores</h3>
        <div className={styles.scoresGrid}>
          {qualityScores.map((score) => (
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

      {/* Test Coverage */}
      <div className={styles.testCoverage}>
        <h3>Test Coverage</h3>
        <div className={styles.coverageGrid}>
          {testCoverage.map((coverage) => (
            <div key={coverage.type} className={`${styles.coverageCard} ${styles[coverage.status]}`}>
              <div className={styles.coverageHeader}>
                <span className={styles.coverageType}>{coverage.type}</span>
                <span className={styles.coverageStatus}>{coverage.status}</span>
              </div>
              <div className={styles.coverageValue}>
                {coverage.covered}/{coverage.total} ({coverage.percentage}%)
              </div>
              <div className={styles.coverageProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ width: `${coverage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QualityAnalytics; 