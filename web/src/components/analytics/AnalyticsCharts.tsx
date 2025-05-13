import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import styles from './AnalyticsCharts.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsChartsProps {
  threadAnalytics: {
    id: string;
    title: string;
    messageCount: number;
    viewCount: number;
    reactionCount: number;
    participantCount: number;
    advanced?: {
      performanceScore: number;
      engagementRate: number;
      growthRate: number;
      retentionRate: number;
      sentimentScore: number;
      topicRelevance: number;
      userDiversity: number;
      timeToFirstResponse: number;
      averageResponseTime: number;
      peakActivityHours: number[];
      trendingScore: number;
    };
  };
  userAnalytics: {
    id: string;
    username: string;
    threadCount: number;
    messageCount: number;
    reactionCount: number;
    viewCount: number;
    advanced?: {
      engagementScore: number;
      activityScore: number;
      influenceScore: number;
      participationRate: number;
      responseTime: number;
      threadCreationRate: number;
      messageQualityScore: number;
      peakActivityHours: number[];
      preferredTags: string[];
    };
  };
  tagAnalytics: {
    id: string;
    name: string;
    usageCount: number;
    advanced?: {
      engagementScore: number;
      growthRate: number;
      userDiversity: number;
      trendingScore: number;
      relatedTags: string[];
      peakActivityHours: number[];
    };
  };
}

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  threadAnalytics,
  userAnalytics,
  tagAnalytics
}) => {
  const engagementData = {
    labels: ['Messages', 'Views', 'Reactions', 'Participants'],
    datasets: [
      {
        label: 'Thread Engagement',
        data: [
          threadAnalytics.messageCount,
          threadAnalytics.viewCount,
          threadAnalytics.reactionCount,
          threadAnalytics.participantCount
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const performanceData = {
    labels: ['Performance', 'Engagement', 'Growth', 'Retention', 'Sentiment', 'Relevance', 'Diversity'],
    datasets: [
      {
        label: 'Thread Performance Metrics',
        data: [
          threadAnalytics.advanced?.performanceScore || 0,
          threadAnalytics.advanced?.engagementRate || 0,
          threadAnalytics.advanced?.growthRate || 0,
          threadAnalytics.advanced?.retentionRate || 0,
          threadAnalytics.advanced?.sentimentScore || 0,
          threadAnalytics.advanced?.topicRelevance || 0,
          threadAnalytics.advanced?.userDiversity || 0
        ],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };

  const userMetricsData = {
    labels: ['Engagement', 'Activity', 'Influence', 'Participation', 'Response Time', 'Creation Rate', 'Quality'],
    datasets: [
      {
        label: 'User Metrics',
        data: [
          userAnalytics.advanced?.engagementScore || 0,
          userAnalytics.advanced?.activityScore || 0,
          userAnalytics.advanced?.influenceScore || 0,
          userAnalytics.advanced?.participationRate || 0,
          userAnalytics.advanced?.responseTime || 0,
          userAnalytics.advanced?.threadCreationRate || 0,
          userAnalytics.advanced?.messageQualityScore || 0
        ],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  };

  const tagMetricsData = {
    labels: ['Engagement', 'Growth', 'Diversity', 'Trending'],
    datasets: [
      {
        label: 'Tag Metrics',
        data: [
          tagAnalytics.advanced?.engagementScore || 0,
          tagAnalytics.advanced?.growthRate || 0,
          tagAnalytics.advanced?.userDiversity || 0,
          tagAnalytics.advanced?.trendingScore || 0
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Analytics Metrics'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1
      }
    }
  };

  return (
    <div className={styles.chartsContainer}>
      <div className={styles.chartSection}>
        <h3>Thread Engagement</h3>
        <div className={styles.chart}>
          <Pie data={engagementData} options={chartOptions} />
        </div>
      </div>

      <div className={styles.chartSection}>
        <h3>Thread Performance</h3>
        <div className={styles.chart}>
          <Bar data={performanceData} options={chartOptions} />
        </div>
      </div>

      <div className={styles.chartSection}>
        <h3>User Metrics</h3>
        <div className={styles.chart}>
          <Line data={userMetricsData} options={chartOptions} />
        </div>
      </div>

      <div className={styles.chartSection}>
        <h3>Tag Metrics</h3>
        <div className={styles.chart}>
          <Bar data={tagMetricsData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts; 