import React from 'react';
import styles from './TaskAnalytics.module.css';

interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageTimeToComplete: string;
  taskStatus: {
    todo: number;
    inProgress: number;
    review: number;
    done: number;
  };
  teamPerformance: {
    member: string;
    tasksCompleted: number;
    averageCompletionTime: string;
    qualityScore: number;
  }[];
  taskTypes: {
    type: string;
    count: number;
    averageDuration: string;
  }[];
  recentActivity: {
    timestamp: string;
    action: 'create' | 'update' | 'complete' | 'reassign';
    taskName: string;
    user: string;
  }[];
}

interface TaskAnalyticsProps {
  metrics: TaskMetrics;
}

const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ metrics }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo':
        return '#ff9800';
      case 'inProgress':
        return '#2196f3';
      case 'review':
        return '#9c27b0';
      case 'done':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return '#4caf50';
      case 'update':
        return '#2196f3';
      case 'complete':
        return '#ff9800';
      case 'reassign':
        return '#9c27b0';
      default:
        return '#666';
    }
  };

  return (
    <div className={styles.taskAnalytics}>
      <h2>Task Management Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Tasks</h3>
          <div className={styles.metricValue}>{metrics.totalTasks}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Completion Rate</h3>
          <div className={styles.metricValue}>{metrics.completionRate.toFixed(1)}%</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Avg. Time to Complete</h3>
          <div className={styles.metricValue}>{metrics.averageTimeToComplete}</div>
        </div>
      </div>

      <div className={styles.taskStatus}>
        <h3>Task Status Distribution</h3>
        <div className={styles.statusGrid}>
          {Object.entries(metrics.taskStatus).map(([status, count]) => (
            <div key={status} className={styles.statusCard}>
              <div 
                className={styles.statusIndicator}
                style={{ backgroundColor: getStatusColor(status) }}
              />
              <div className={styles.statusInfo}>
                <span className={styles.statusLabel}>{status}</span>
                <span className={styles.statusCount}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.teamPerformance}>
        <h3>Team Performance</h3>
        <div className={styles.performanceGrid}>
          {metrics.teamPerformance.map((member, index) => (
            <div key={index} className={styles.performanceCard}>
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.member}</span>
                <span className={styles.tasksCompleted}>
                  {member.tasksCompleted} tasks completed
                </span>
              </div>
              <div className={styles.performanceMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Avg. Time:</span>
                  <span className={styles.metricValue}>{member.averageCompletionTime}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Quality Score:</span>
                  <span className={styles.metricValue}>{member.qualityScore.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.taskTypes}>
        <h3>Task Types</h3>
        <div className={styles.typeGrid}>
          {metrics.taskTypes.map((type, index) => (
            <div key={index} className={styles.typeCard}>
              <div className={styles.typeHeader}>
                <span className={styles.typeLabel}>{type.type}</span>
                <span className={styles.typeCount}>{type.count}</span>
              </div>
              <div className={styles.typeDuration}>
                Avg. Duration: {type.averageDuration}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          {metrics.recentActivity.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div 
                className={styles.activityIcon}
                style={{ backgroundColor: getActionColor(activity.action) }}
              >
                {activity.action.charAt(0).toUpperCase()}
              </div>
              <div className={styles.activityDetails}>
                <div className={styles.activityTaskName}>{activity.taskName}</div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityUser}>{activity.user}</span>
                  <span className={styles.activityTime}>{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskAnalytics; 