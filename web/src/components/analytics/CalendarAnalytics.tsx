import React from 'react';
import styles from './CalendarAnalytics.module.css';

interface CalendarMetrics {
  totalEvents: number;
  upcomingEvents: number;
  averageAttendance: number;
  eventTypes: {
    type: string;
    count: number;
    averageDuration: string;
  }[];
  attendanceTrends: {
    date: string;
    attendance: number;
  }[];
  popularTimes: {
    day: string;
    hour: number;
    eventCount: number;
  }[];
  recentEvents: {
    title: string;
    date: string;
    type: string;
    attendance: number;
    status: 'upcoming' | 'ongoing' | 'completed';
  }[];
}

interface CalendarAnalyticsProps {
  metrics: CalendarMetrics;
}

const CalendarAnalytics: React.FC<CalendarAnalyticsProps> = ({ metrics }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#2196f3';
      case 'ongoing':
        return '#4caf50';
      case 'completed':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'meeting':
        return '#2196f3';
      case 'workshop':
        return '#ff9800';
      case 'training':
        return '#4caf50';
      case 'social':
        return '#9c27b0';
      default:
        return '#666';
    }
  };

  return (
    <div className={styles.calendarAnalytics}>
      <h2>Calendar Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Events</h3>
          <div className={styles.metricValue}>{metrics.totalEvents}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Upcoming Events</h3>
          <div className={styles.metricValue}>{metrics.upcomingEvents}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Average Attendance</h3>
          <div className={styles.metricValue}>{metrics.averageAttendance.toFixed(1)}%</div>
        </div>
      </div>

      <div className={styles.eventTypes}>
        <h3>Event Types</h3>
        <div className={styles.typeGrid}>
          {metrics.eventTypes.map((type, index) => (
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

      <div className={styles.attendanceTrends}>
        <h3>Attendance Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.attendanceTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.attendance / 100) * 150}px` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.popularTimes}>
        <h3>Popular Times</h3>
        <div className={styles.timesGrid}>
          {metrics.popularTimes.map((time, index) => (
            <div key={index} className={styles.timeCard}>
              <div className={styles.timeHeader}>
                <span className={styles.timeDay}>{time.day}</span>
                <span className={styles.timeHour}>{time.hour}:00</span>
              </div>
              <div className={styles.eventCount}>
                {time.eventCount} events
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentEvents}>
        <h3>Recent Events</h3>
        <div className={styles.eventsList}>
          {metrics.recentEvents.map((event, index) => (
            <div key={index} className={styles.eventItem}>
              <div 
                className={styles.eventStatus}
                style={{ backgroundColor: getStatusColor(event.status) }}
              />
              <div className={styles.eventDetails}>
                <div className={styles.eventTitle}>{event.title}</div>
                <div className={styles.eventInfo}>
                  <span className={styles.eventDate}>{event.date}</span>
                  <span 
                    className={styles.eventType}
                    style={{ color: getEventTypeColor(event.type) }}
                  >
                    {event.type}
                  </span>
                  <span className={styles.eventAttendance}>
                    {event.attendance}% attendance
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarAnalytics; 