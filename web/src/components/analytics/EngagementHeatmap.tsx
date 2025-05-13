import { useState } from 'react';
import { useEngagementHeatmap } from '../../hooks/useEngagementHeatmap';
import { format } from 'date-fns';
import { Card, Badge, Avatar } from '../ui';
import { HeatMapGrid } from 'react-grid-heatmap';
import { logger } from '../../utils/logger';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const EngagementHeatmap = () => {
  const {
    selectedThread,
    selectedUser,
    threadHeatmap,
    userHeatmap,
    topThreads,
    isLoading,
    error,
    selectThread,
    selectUser,
    fetchTopEngagedThreads
  } = useEngagementHeatmap();

  const [activeTab, setActiveTab] = useState<'threads' | 'users'>('threads');

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading engagement data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  const formatTime = (hour: number) => {
    return format(new Date().setHours(hour, 0), 'h a');
  };

  const formatEngagement = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const getHeatmapData = (heatmap: any) => {
    const data = Array.from({ length: 24 }, () => Array(7).fill(0));
    heatmap.forEach((item: any) => {
      data[item.hour][item.day] = item.value;
    });
    return data;
  };

  const getMaxValue = (heatmap: any) => {
    return Math.max(...heatmap.map((item: any) => item.value));
  };

  return (
    <div className="engagement-heatmap">
      <div className="heatmap-header">
        <h2>Engagement Heatmap</h2>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'threads' ? 'active' : ''}`}
            onClick={() => setActiveTab('threads')}
          >
            Threads
          </button>
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
        </div>
      </div>

      <div className="heatmap-content">
        {activeTab === 'threads' ? (
          <>
            <div className="threads-list">
              {topThreads.map((thread) => (
                <Card
                  key={thread.threadId}
                  className={`thread-card ${selectedThread === thread.threadId ? 'active' : ''}`}
                  onClick={() => selectThread(thread.threadId)}
                >
                  <h3>{thread.title}</h3>
                  <div className="thread-metrics">
                    <Badge variant="primary">
                      {formatEngagement(thread.totalEngagement)} engagements
                    </Badge>
                    <Badge variant="secondary">
                      Peak: {formatTime(thread.peakHour)} on {DAYS[thread.peakDay]}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>

            {threadHeatmap && (
              <div className="heatmap-container">
                <h3>Engagement Pattern</h3>
                <div className="heatmap">
                  <HeatMapGrid
                    data={getHeatmapData(threadHeatmap.heatmap)}
                    xLabels={DAYS}
                    yLabels={HOURS.map(formatTime)}
                    cellStyle={(_x, _y, ratio) => ({
                      background: `rgb(12, 160, 44, ${ratio})`,
                      fontSize: '11px',
                      color: `rgb(0, 0, 0, ${ratio / 2 + 0.4})`,
                    })}
                    cellHeight="30px"
                    xLabelsPos="top"
                    yLabelsPos="left"
                    xLabelsStyle={() => ({
                      fontSize: '12px',
                      color: '#777',
                    })}
                    yLabelsStyle={() => ({
                      fontSize: '12px',
                      color: '#777',
                    })}
                  />
                </div>
                <div className="heatmap-legend">
                  <span>Low</span>
                  <div className="gradient" />
                  <span>High</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="users-list">
              {/* User list will be implemented here */}
            </div>

            {userHeatmap && (
              <div className="heatmap-container">
                <h3>User Engagement Pattern</h3>
                <div className="heatmap">
                  <HeatMapGrid
                    data={getHeatmapData(userHeatmap.heatmap)}
                    xLabels={DAYS}
                    yLabels={HOURS.map(formatTime)}
                    cellStyle={(_x, _y, ratio) => ({
                      background: `rgb(12, 160, 44, ${ratio})`,
                      fontSize: '11px',
                      color: `rgb(0, 0, 0, ${ratio / 2 + 0.4})`,
                    })}
                    cellHeight="30px"
                    xLabelsPos="top"
                    yLabelsPos="left"
                    xLabelsStyle={() => ({
                      fontSize: '12px',
                      color: '#777',
                    })}
                    yLabelsStyle={() => ({
                      fontSize: '12px',
                      color: '#777',
                    })}
                  />
                </div>
                <div className="heatmap-legend">
                  <span>Low</span>
                  <div className="gradient" />
                  <span>High</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}; 