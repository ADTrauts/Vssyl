import React from 'react';
import styles from './RiskAnalytics.module.css';

interface RiskMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface ThreatAssessment {
  threat: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  probability: number;
  impact: string;
  mitigation: string[];
}

interface RiskScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'safe' | 'warning' | 'danger';
  factors: string[];
}

interface MitigationStrategy {
  strategy: string;
  status: 'implemented' | 'in-progress' | 'planned';
  effectiveness: number;
  timeline: string;
  actions: string[];
}

interface RiskAnalyticsProps {
  metrics: RiskMetric[];
  threats: ThreatAssessment[];
  scores: RiskScore[];
  strategies: MitigationStrategy[];
}

const RiskAnalytics: React.FC<RiskAnalyticsProps> = ({
  metrics,
  threats,
  scores,
  strategies,
}) => {
  return (
    <div className={styles.riskAnalytics}>
      <h2>Risk Analytics</h2>
      
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

      {/* Threat Assessment */}
      <div className={styles.threatAssessment}>
        <h3>Threat Assessment</h3>
        <div className={styles.threatsGrid}>
          {threats.map((threat) => (
            <div key={threat.threat} className={`${styles.threatCard} ${styles[threat.severity]}`}>
              <div className={styles.threatHeader}>
                <span className={styles.threatName}>{threat.threat}</span>
                <span className={styles.threatSeverity}>{threat.severity}</span>
              </div>
              <div className={styles.threatDetails}>
                <div className={styles.probability}>
                  Probability: {threat.probability}%
                </div>
                <div className={styles.impact}>
                  Impact: {threat.impact}
                </div>
                <div className={styles.mitigationList}>
                  {threat.mitigation.map((action, index) => (
                    <span key={index} className={styles.mitigationItem}>{action}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Scores */}
      <div className={styles.riskScores}>
        <h3>Risk Scores</h3>
        <div className={styles.scoresGrid}>
          {scores.map((score) => (
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
              <div className={styles.riskFactors}>
                {score.factors.map((factor, index) => (
                  <span key={index} className={styles.factorItem}>{factor}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mitigation Strategies */}
      <div className={styles.mitigationStrategies}>
        <h3>Mitigation Strategies</h3>
        <div className={styles.strategiesGrid}>
          {strategies.map((strategy) => (
            <div key={strategy.strategy} className={`${styles.strategyCard} ${styles[strategy.status]}`}>
              <div className={styles.strategyHeader}>
                <span className={styles.strategyName}>{strategy.strategy}</span>
                <span className={styles.strategyStatus}>{strategy.status}</span>
              </div>
              <div className={styles.strategyDetails}>
                <div className={styles.effectiveness}>
                  Effectiveness: {strategy.effectiveness}%
                </div>
                <div className={styles.timeline}>
                  Timeline: {strategy.timeline}
                </div>
                <div className={styles.strategyProgress}>
                  <div 
                    className={styles.progressBar}
                    style={{ width: `${strategy.effectiveness}%` }}
                  />
                </div>
                <div className={styles.actions}>
                  {strategy.actions.map((action, index) => (
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

export default RiskAnalytics; 