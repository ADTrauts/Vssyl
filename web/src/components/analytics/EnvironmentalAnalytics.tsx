import React from 'react';
import styles from './EnvironmentalAnalytics.module.css';

interface EnvironmentalMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface ResourceUsage {
  category: string;
  current: number;
  previous: number;
  target: number;
  unit: string;
}

interface CarbonFootprint {
  date: string;
  emissions: number;
  offset: number;
  net: number;
}

interface SustainabilityScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface EnvironmentalAnalyticsProps {
  metrics: EnvironmentalMetric[];
  resourceUsage: ResourceUsage[];
  carbonFootprint: CarbonFootprint[];
  sustainabilityScores: SustainabilityScore[];
}

const EnvironmentalAnalytics: React.FC<EnvironmentalAnalyticsProps> = ({
  metrics,
  resourceUsage,
  carbonFootprint,
  sustainabilityScores,
}) => {
  return (
    <div className={styles.environmentalAnalytics}>
      <h2>Environmental Analytics</h2>
      
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
        <div className={styles.resourcesGrid}>
          {resourceUsage.map((resource) => (
            <div key={resource.category} className={styles.resourceCard}>
              <div className={styles.resourceHeader}>
                <span className={styles.resourceCategory}>{resource.category}</span>
                <span className={styles.resourceUnit}>{resource.unit}</span>
              </div>
              <div className={styles.resourceDetails}>
                <div className={styles.resourceCurrent}>
                  {resource.current.toLocaleString()}
                </div>
                <div className={styles.resourcePrevious}>
                  Previous: {resource.previous.toLocaleString()}
                </div>
                <div className={styles.resourceTarget}>
                  Target: {resource.target.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carbon Footprint */}
      <div className={styles.carbonFootprint}>
        <h3>Carbon Footprint</h3>
        <div className={styles.footprintChart}>
          {carbonFootprint.map((footprint) => (
            <div key={footprint.date} className={styles.footprintBar}>
              <div className={styles.emissionsFill} style={{ height: `${(footprint.emissions / Math.max(...carbonFootprint.map(f => f.emissions))) * 100}%` }} />
              <div className={styles.offsetFill} style={{ height: `${(footprint.offset / Math.max(...carbonFootprint.map(f => f.offset))) * 100}%` }} />
              <div className={styles.footprintDate}>{footprint.date}</div>
              <div className={styles.footprintNet}>
                Net: {footprint.net.toLocaleString()} tCO₂e
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sustainability Scores */}
      <div className={styles.sustainabilityScores}>
        <h3>Sustainability Scores</h3>
        <div className={styles.scoresGrid}>
          {sustainabilityScores.map((score) => (
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnvironmentalAnalytics; 