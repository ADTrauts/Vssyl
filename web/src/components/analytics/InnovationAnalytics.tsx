import React from 'react';
import styles from './InnovationAnalytics.module.css';

interface InnovationMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface ResearchProject {
  project: string;
  status: 'active' | 'completed' | 'on-hold';
  progress: number;
  team: string;
  milestones: string[];
}

interface DevelopmentInitiative {
  initiative: string;
  phase: 'planning' | 'development' | 'testing' | 'deployment';
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  resources: string[];
}

interface InnovationScore {
  category: string;
  score: number;
  maxScore: number;
  status: 'excellent' | 'good' | 'needs-improvement';
  insights: string[];
}

interface InnovationAnalyticsProps {
  metrics: InnovationMetric[];
  projects: ResearchProject[];
  initiatives: DevelopmentInitiative[];
  scores: InnovationScore[];
}

const InnovationAnalytics: React.FC<InnovationAnalyticsProps> = ({
  metrics,
  projects,
  initiatives,
  scores,
}) => {
  return (
    <div className={styles.innovationAnalytics}>
      <h2>Innovation Analytics</h2>
      
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

      {/* Research Projects */}
      <div className={styles.researchProjects}>
        <h3>Research Projects</h3>
        <div className={styles.projectsGrid}>
          {projects.map((project) => (
            <div key={project.project} className={`${styles.projectCard} ${styles[project.status]}`}>
              <div className={styles.projectHeader}>
                <span className={styles.projectName}>{project.project}</span>
                <span className={styles.projectStatus}>{project.status}</span>
              </div>
              <div className={styles.projectDetails}>
                <div className={styles.team}>
                  Team: {project.team}
                </div>
                <div className={styles.projectProgress}>
                  <div 
                    className={styles.progressBar}
                    style={{ width: `${project.progress}%` }}
                  />
                  <span className={styles.progressText}>{project.progress}% Complete</span>
                </div>
                <div className={styles.milestones}>
                  {project.milestones.map((milestone, index) => (
                    <span key={index} className={styles.milestoneItem}>{milestone}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Development Initiatives */}
      <div className={styles.developmentInitiatives}>
        <h3>Development Initiatives</h3>
        <div className={styles.initiativesGrid}>
          {initiatives.map((initiative) => (
            <div key={initiative.initiative} className={`${styles.initiativeCard} ${styles[initiative.priority]}`}>
              <div className={styles.initiativeHeader}>
                <span className={styles.initiativeName}>{initiative.initiative}</span>
                <span className={styles.initiativePhase}>{initiative.phase}</span>
              </div>
              <div className={styles.initiativeDetails}>
                <div className={styles.timeline}>
                  Timeline: {initiative.timeline}
                </div>
                <div className={styles.resources}>
                  {initiative.resources.map((resource, index) => (
                    <span key={index} className={styles.resourceItem}>{resource}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Innovation Scores */}
      <div className={styles.innovationScores}>
        <h3>Innovation Scores</h3>
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
              <div className={styles.insights}>
                {score.insights.map((insight, index) => (
                  <span key={index} className={styles.insightItem}>{insight}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InnovationAnalytics; 