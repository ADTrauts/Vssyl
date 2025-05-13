import React from 'react';
import styles from './CrossPillarCorrelation.module.css';

interface CorrelationData {
  sourcePillar: 'enterprise' | 'life' | 'education';
  targetPillar: 'enterprise' | 'life' | 'education';
  correlation: number;
  metrics: {
    sharedUsers: number;
    activityOverlap: number;
    contentSimilarity: number;
  };
}

interface CrossPillarCorrelationProps {
  correlations: CorrelationData[];
}

const CrossPillarCorrelation: React.FC<CrossPillarCorrelationProps> = ({ correlations }) => {
  const getPillarColor = (pillar: string) => {
    switch (pillar) {
      case 'enterprise':
        return '#2196f3';
      case 'life':
        return '#4caf50';
      case 'education':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  const formatCorrelation = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className={styles.correlationContainer}>
      <h2>Cross-Pillar Correlations</h2>
      <div className={styles.correlationGrid}>
        {correlations.map((correlation, index) => (
          <div key={index} className={styles.correlationCard}>
            <div className={styles.pillarConnection}>
              <span 
                className={styles.pillarLabel} 
                style={{ color: getPillarColor(correlation.sourcePillar) }}
              >
                {correlation.sourcePillar}
              </span>
              <div className={styles.connectionLine} />
              <span 
                className={styles.pillarLabel} 
                style={{ color: getPillarColor(correlation.targetPillar) }}
              >
                {correlation.targetPillar}
              </span>
            </div>
            <div className={styles.correlationValue}>
              Correlation: {formatCorrelation(correlation.correlation)}
            </div>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Shared Users:</span>
                <span className={styles.metricValue}>{correlation.metrics.sharedUsers}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Activity Overlap:</span>
                <span className={styles.metricValue}>{formatCorrelation(correlation.metrics.activityOverlap)}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Content Similarity:</span>
                <span className={styles.metricValue}>{formatCorrelation(correlation.metrics.contentSimilarity)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CrossPillarCorrelation; 