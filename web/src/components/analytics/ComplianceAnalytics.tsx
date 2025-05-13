import React from 'react';
import styles from './ComplianceAnalytics.module.css';

interface ComplianceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface PolicyCompliance {
  policy: string;
  status: 'compliant' | 'non-compliant' | 'at-risk';
  lastChecked: string;
  violations: number;
  details: string[];
}

interface AuditResult {
  category: string;
  score: number;
  maxScore: number;
  status: 'passed' | 'warning' | 'failed';
  findings: string[];
}

interface RegulatoryRequirement {
  regulation: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  deadline: string;
  progress: number;
  requirements: string[];
}

interface ComplianceAnalyticsProps {
  metrics: ComplianceMetric[];
  policies: PolicyCompliance[];
  audits: AuditResult[];
  regulations: RegulatoryRequirement[];
}

const ComplianceAnalytics: React.FC<ComplianceAnalyticsProps> = ({
  metrics,
  policies,
  audits,
  regulations,
}) => {
  return (
    <div className={styles.complianceAnalytics}>
      <h2>Compliance Analytics</h2>
      
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

      {/* Policy Compliance */}
      <div className={styles.policyCompliance}>
        <h3>Policy Compliance</h3>
        <div className={styles.policiesGrid}>
          {policies.map((policy) => (
            <div key={policy.policy} className={`${styles.policyCard} ${styles[policy.status]}`}>
              <div className={styles.policyHeader}>
                <span className={styles.policyName}>{policy.policy}</span>
                <span className={styles.policyStatus}>{policy.status}</span>
              </div>
              <div className={styles.policyDetails}>
                <div className={styles.lastChecked}>
                  Last Checked: {policy.lastChecked}
                </div>
                <div className={styles.violations}>
                  Violations: {policy.violations}
                </div>
                <div className={styles.policyInfo}>
                  {policy.details.map((detail, index) => (
                    <span key={index} className={styles.detailItem}>{detail}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Audit Results */}
      <div className={styles.auditResults}>
        <h3>Audit Results</h3>
        <div className={styles.auditsGrid}>
          {audits.map((audit) => (
            <div key={audit.category} className={`${styles.auditCard} ${styles[audit.status]}`}>
              <div className={styles.auditHeader}>
                <span className={styles.auditCategory}>{audit.category}</span>
                <div className={`${styles.auditStatus} ${styles[audit.status]}`} />
              </div>
              <div className={styles.auditScore}>
                {audit.score}/{audit.maxScore}
              </div>
              <div className={styles.auditProgress}>
                <div 
                  className={styles.progressBar}
                  style={{ width: `${(audit.score / audit.maxScore) * 100}%` }}
                />
              </div>
              <div className={styles.auditFindings}>
                {audit.findings.map((finding, index) => (
                  <span key={index} className={styles.findingItem}>{finding}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory Requirements */}
      <div className={styles.regulatoryRequirements}>
        <h3>Regulatory Requirements</h3>
        <div className={styles.regulationsGrid}>
          {regulations.map((regulation) => (
            <div key={regulation.regulation} className={`${styles.regulationCard} ${styles[regulation.status]}`}>
              <div className={styles.regulationHeader}>
                <span className={styles.regulationName}>{regulation.regulation}</span>
                <span className={styles.regulationStatus}>{regulation.status}</span>
              </div>
              <div className={styles.regulationDetails}>
                <div className={styles.deadline}>
                  Deadline: {regulation.deadline}
                </div>
                <div className={styles.regulationProgress}>
                  <div 
                    className={styles.progressBar}
                    style={{ width: `${regulation.progress}%` }}
                  />
                  <span className={styles.progressText}>{regulation.progress}% Complete</span>
                </div>
                <div className={styles.requirements}>
                  {regulation.requirements.map((req, index) => (
                    <span key={index} className={styles.requirementItem}>{req}</span>
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

export default ComplianceAnalytics; 