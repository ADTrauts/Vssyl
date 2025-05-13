import React from 'react';
import styles from './EducationAnalytics.module.css';

interface EducationMetrics {
  totalStudents: number;
  activeCourses: number;
  averageCompletionRate: number;
  averageGrade: number;
  enrollmentTrends: {
    date: string;
    count: number;
  }[];
  coursePerformance: {
    courseName: string;
    enrollment: number;
    completionRate: number;
    averageGrade: number;
  }[];
  studentSegments: {
    segment: string;
    count: number;
    averageGrade: number;
    engagementScore: number;
  }[];
  learningChannels: {
    channel: string;
    usage: number;
    percentage: number;
    growth: number;
  }[];
  recentActivities: {
    activityId: string;
    date: string;
    student: string;
    course: string;
    type: 'enrollment' | 'completion' | 'assessment' | 'interaction';
    score?: number;
  }[];
}

interface EducationAnalyticsProps {
  metrics: EducationMetrics;
}

const EducationAnalytics: React.FC<EducationAnalyticsProps> = ({ metrics }) => {
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'enrollment':
        return '#2196f3';
      case 'completion':
        return '#4caf50';
      case 'assessment':
        return '#9c27b0';
      case 'interaction':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  const formatGrowth = (growth: number) => {
    return growth > 0 ? `+${growth}%` : `${growth}%`;
  };

  return (
    <div className={styles.educationAnalytics}>
      <h2>Education Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Students</h3>
          <div className={styles.metricValue}>{metrics.totalStudents}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Active Courses</h3>
          <div className={styles.metricValue}>{metrics.activeCourses}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Average Completion Rate</h3>
          <div className={styles.metricValue}>{formatPercentage(metrics.averageCompletionRate)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Average Grade</h3>
          <div className={styles.metricValue}>{metrics.averageGrade.toFixed(1)}</div>
        </div>
      </div>

      <div className={styles.enrollmentTrends}>
        <h3>Enrollment Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.enrollmentTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.count / metrics.totalStudents) * 150}px` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.coursePerformance}>
        <h3>Course Performance</h3>
        <div className={styles.coursesGrid}>
          {metrics.coursePerformance.map((course, index) => (
            <div key={index} className={styles.courseCard}>
              <div className={styles.courseHeader}>
                <span className={styles.courseName}>{course.courseName}</span>
                <span className={styles.enrollment}>{course.enrollment} students</span>
              </div>
              <div className={styles.courseMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Completion Rate</span>
                  <span className={styles.metricValue}>{formatPercentage(course.completionRate)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Average Grade</span>
                  <span className={styles.metricValue}>{course.averageGrade.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.studentSegments}>
        <h3>Student Segments</h3>
        <div className={styles.segmentsGrid}>
          {metrics.studentSegments.map((segment, index) => (
            <div key={index} className={styles.segmentCard}>
              <div className={styles.segmentHeader}>
                <span className={styles.segmentLabel}>{segment.segment}</span>
                <span className={styles.segmentCount}>{segment.count} students</span>
              </div>
              <div className={styles.segmentMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Avg. Grade</span>
                  <span className={styles.metricValue}>{segment.averageGrade.toFixed(1)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Engagement</span>
                  <span className={styles.metricValue}>{segment.engagementScore}/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.learningChannels}>
        <h3>Learning Channels</h3>
        <div className={styles.channelsGrid}>
          {metrics.learningChannels.map((channel, index) => (
            <div key={index} className={styles.channelCard}>
              <div className={styles.channelHeader}>
                <span className={styles.channelLabel}>{channel.channel}</span>
                <span className={`${styles.channelGrowth} ${channel.growth >= 0 ? styles.positive : styles.negative}`}>
                  {formatGrowth(channel.growth)}
                </span>
              </div>
              <div className={styles.channelMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Usage</span>
                  <span className={styles.metricValue}>{channel.usage}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Share</span>
                  <span className={styles.metricValue}>{channel.percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentActivities}>
        <h3>Recent Activities</h3>
        <div className={styles.activitiesList}>
          {metrics.recentActivities.map((activity, index) => (
            <div key={index} className={styles.activityItem}>
              <div 
                className={styles.activityType}
                style={{ backgroundColor: getActivityColor(activity.type) }}
              />
              <div className={styles.activityDetails}>
                <div className={styles.activityHeader}>
                  <span className={styles.activityId}>#{activity.activityId}</span>
                  <span className={styles.activityDate}>{activity.date}</span>
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.studentName}>{activity.student}</span>
                  <span className={styles.courseName}>{activity.course}</span>
                </div>
              </div>
              {activity.score !== undefined && (
                <div className={styles.activityScore}>
                  {activity.score.toFixed(1)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EducationAnalytics; 