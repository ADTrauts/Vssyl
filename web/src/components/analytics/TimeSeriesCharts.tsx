import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import styles from './TimeSeriesCharts.module.css';
import TimeSeriesControls, { TimeRange, Aggregation } from './TimeSeriesControls';
import ExportControls, { ExportFormat } from './ExportControls';
import ExportFilter, { ExportFilterOptions } from './ExportFilter';
import ExportTemplates from './ExportTemplates';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

interface TimeSeriesChartsProps {
  threadActivity: TimeSeriesData[];
  userActivity: TimeSeriesData[];
  tagActivity: TimeSeriesData[];
}

const TimeSeriesCharts: React.FC<TimeSeriesChartsProps> = ({
  threadActivity,
  userActivity,
  tagActivity,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [aggregation, setAggregation] = useState<Aggregation>('hour');
  const [exportFilter, setExportFilter] = useState<ExportFilterOptions>({
    includeThreads: true,
    includeUsers: true,
    includeTags: true,
    startDate: '',
    endDate: '',
  });

  const getTimeRangeMs = (range: TimeRange): number => {
    const now = Date.now();
    switch (range) {
      case 'hour':
        return now - 60 * 60 * 1000;
      case '6hours':
        return now - 6 * 60 * 60 * 1000;
      case 'day':
        return now - 24 * 60 * 60 * 1000;
      case 'week':
        return now - 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return now - 30 * 24 * 60 * 60 * 1000;
      case 'all':
        return 0;
    }
  };

  const aggregateData = (data: TimeSeriesData[], agg: Aggregation): TimeSeriesData[] => {
    if (data.length === 0) return [];
    
    const aggregated: { [key: string]: { sum: number; count: number } } = {};
    const startTime = getTimeRangeMs(timeRange);
    
    data.forEach((point) => {
      const timestamp = new Date(point.timestamp).getTime();
      if (timestamp < startTime) return;
      
      let key: string;
      const date = new Date(timestamp);
      
      switch (agg) {
        case 'minute':
          key = date.toISOString().slice(0, 16);
          break;
        case 'hour':
          key = date.toISOString().slice(0, 13);
          break;
        case 'day':
          key = date.toISOString().slice(0, 10);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().slice(0, 10);
          break;
      }
      
      if (!aggregated[key]) {
        aggregated[key] = { sum: 0, count: 0 };
      }
      aggregated[key].sum += point.value;
      aggregated[key].count += 1;
    });
    
    return Object.entries(aggregated).map(([timestamp, { sum, count }]) => ({
      timestamp,
      value: sum / count,
    }));
  };

  const filteredThreadActivity = aggregateData(threadActivity, aggregation);
  const filteredUserActivity = aggregateData(userActivity, aggregation);
  const filteredTagActivity = aggregateData(tagActivity, aggregation);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: aggregation,
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Activity Count',
        },
      },
    },
  };

  const threadData = {
    labels: filteredThreadActivity.map((d) => d.timestamp),
    datasets: [
      {
        label: 'Thread Activity',
        data: filteredThreadActivity.map((d) => d.value),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const userData = {
    labels: filteredUserActivity.map((d) => d.timestamp),
    datasets: [
      {
        label: 'User Activity',
        data: filteredUserActivity.map((d) => d.value),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const tagData = {
    labels: filteredTagActivity.map((d) => d.timestamp),
    datasets: [
      {
        label: 'Tag Activity',
        data: filteredTagActivity.map((d) => d.value),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const filterDataByDate = (data: TimeSeriesData[]): TimeSeriesData[] => {
    if (!exportFilter.startDate && !exportFilter.endDate) {
      return data;
    }

    return data.filter((item) => {
      const timestamp = new Date(item.timestamp).getTime();
      const startDate = exportFilter.startDate ? new Date(exportFilter.startDate).getTime() : 0;
      const endDate = exportFilter.endDate ? new Date(exportFilter.endDate).getTime() : Infinity;
      return timestamp >= startDate && timestamp <= endDate;
    });
  };

  const handleExport = (format: ExportFormat) => {
    const filteredThreadData = filterDataByDate(filteredThreadActivity);
    const filteredUserData = filterDataByDate(filteredUserActivity);
    const filteredTagData = filterDataByDate(filteredTagActivity);

    const data = {
      threadActivity: exportFilter.includeThreads ? filteredThreadData : [],
      userActivity: exportFilter.includeUsers ? filteredUserData : [],
      tagActivity: exportFilter.includeTags ? filteredTagData : [],
    };

    switch (format) {
      case 'csv':
        const headers = ['Timestamp'];
        if (exportFilter.includeThreads) headers.push('Thread Activity');
        if (exportFilter.includeUsers) headers.push('User Activity');
        if (exportFilter.includeTags) headers.push('Tag Activity');

        const csvContent = [
          headers,
          ...filteredThreadData.map((_, index) => {
            const row = [filteredThreadData[index].timestamp];
            if (exportFilter.includeThreads) row.push(filteredThreadData[index].value.toString());
            if (exportFilter.includeUsers) row.push(filteredUserData[index]?.value.toString() || '0');
            if (exportFilter.includeTags) row.push(filteredTagData[index]?.value.toString() || '0');
            return row;
          }),
        ].map(row => row.join(',')).join('\n');
        
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        saveAs(csvBlob, `analytics_${timeRange}_${aggregation}.csv`);
        break;

      case 'json':
        const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(jsonBlob, `analytics_${timeRange}_${aggregation}.json`);
        break;

      case 'excel':
        const ws = XLSX.utils.json_to_sheet(
          filteredThreadData.map((_, index) => {
            const row: Record<string, any> = {
              Timestamp: filteredThreadData[index].timestamp,
            };
            if (exportFilter.includeThreads) row['Thread Activity'] = filteredThreadData[index].value;
            if (exportFilter.includeUsers) row['User Activity'] = filteredUserData[index]?.value || 0;
            if (exportFilter.includeTags) row['Tag Activity'] = filteredTagData[index]?.value || 0;
            return row;
          })
        );
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
        XLSX.writeFile(wb, `analytics_${timeRange}_${aggregation}.xlsx`);
        break;
    }
  };

  const handleTemplateSelect = (templateOptions: ExportFilterOptions) => {
    setExportFilter(templateOptions);
  };

  return (
    <div className={styles.timeSeriesContainer}>
      <TimeSeriesControls
        timeRange={timeRange}
        aggregation={aggregation}
        onTimeRangeChange={setTimeRange}
        onAggregationChange={setAggregation}
      />
      <ExportTemplates
        onTemplateSelect={handleTemplateSelect}
        threadActivity={threadActivity}
        userActivity={userActivity}
        tagActivity={tagActivity}
      />
      <ExportFilter onFilterChange={setExportFilter} initialOptions={exportFilter} />
      <ExportControls onExport={handleExport} />
      <div className={styles.chartSection}>
        <h3>Thread Activity Over Time</h3>
        <div className={styles.chart}>
          <Line options={chartOptions} data={threadData} />
        </div>
      </div>
      <div className={styles.chartSection}>
        <h3>User Activity Over Time</h3>
        <div className={styles.chart}>
          <Line options={chartOptions} data={userData} />
        </div>
      </div>
      <div className={styles.chartSection}>
        <h3>Tag Activity Over Time</h3>
        <div className={styles.chart}>
          <Line options={chartOptions} data={tagData} />
        </div>
      </div>
    </div>
  );
};

export default TimeSeriesCharts; 