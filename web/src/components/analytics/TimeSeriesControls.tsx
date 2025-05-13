import React from 'react';
import styles from './TimeSeriesControls.module.css';

export type TimeRange = 'hour' | '6hours' | 'day' | 'week' | 'month' | 'all';
export type Aggregation = 'minute' | 'hour' | 'day' | 'week';

interface TimeSeriesControlsProps {
  timeRange: TimeRange;
  aggregation: Aggregation;
  onTimeRangeChange: (range: TimeRange) => void;
  onAggregationChange: (aggregation: Aggregation) => void;
}

const TimeSeriesControls: React.FC<TimeSeriesControlsProps> = ({
  timeRange,
  aggregation,
  onTimeRangeChange,
  onAggregationChange,
}) => {
  return (
    <div className={styles.controlsContainer}>
      <div className={styles.controlGroup}>
        <label htmlFor="timeRange">Time Range:</label>
        <select
          id="timeRange"
          className={styles.select}
          value={timeRange}
          onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
        >
          <option value="hour">Last Hour</option>
          <option value="6hours">Last 6 Hours</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <div className={styles.controlGroup}>
        <label htmlFor="aggregation">Aggregation:</label>
        <select
          id="aggregation"
          className={styles.select}
          value={aggregation}
          onChange={(e) => onAggregationChange(e.target.value as Aggregation)}
        >
          <option value="minute">Minute</option>
          <option value="hour">Hour</option>
          <option value="day">Day</option>
          <option value="week">Week</option>
        </select>
      </div>
    </div>
  );
};

export default TimeSeriesControls; 