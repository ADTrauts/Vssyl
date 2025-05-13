import { useState } from 'react';
import { useUserSegmentation } from '../../hooks/useUserSegmentation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, TrendingUp, Clock, Tag, Activity } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { logger } from '../../utils/logger';

export const UserSegmentation = () => {
  const {
    segments,
    selectedSegment,
    segmentStats,
    segmentUsers,
    isLoading,
    error,
    selectSegment
  } = useUserSegmentation();

  const [activeTab, setActiveTab] = useState<'stats' | 'users'>('stats');

  if (isLoading) {
    return <div className="segmentation-loading">Loading segmentation data...</div>;
  }

  if (error) {
    return <div className="segmentation-error">{error}</div>;
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (60 * 1000));
    return `${minutes} min`;
  };

  const formatScore = (score: number) => {
    return Math.round(score * 100) / 100;
  };

  return (
    <div className="user-segmentation">
      <div className="segments-list">
        {segments.map(segment => (
          <Card
            key={segment.id}
            className={`segment-card ${selectedSegment === segment.id ? 'active' : ''}`}
            onClick={() => selectSegment(segment.id)}
          >
            <h3>{segment.name}</h3>
            <p>{segment.description}</p>
            <div className="segment-criteria">
              <Badge variant="outline">
                <TrendingUp size={12} />
                Engagement: {formatScore(segment.criteria.engagementScore)}
              </Badge>
              <Badge variant="outline">
                <Activity size={12} />
                Activity: {segment.criteria.activityLevel}
              </Badge>
              <Badge variant="outline">
                <Users size={12} />
                Participation: {segment.criteria.threadParticipation}
              </Badge>
              <Badge variant="outline">
                <Clock size={12} />
                Response: {segment.criteria.responseTime}m
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {selectedSegment && segmentStats && (
        <div className="segment-details">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Statistics
            </button>
            <button
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </div>

          {activeTab === 'stats' && (
            <div className="stats-grid">
              <Card className="stat-card">
                <Users size={24} />
                <div className="stat-content">
                  <span className="stat-value">{segmentStats.userCount}</span>
                  <span className="stat-label">Total Users</span>
                </div>
              </Card>

              <Card className="stat-card">
                <TrendingUp size={24} />
                <div className="stat-content">
                  <span className="stat-value">{formatScore(segmentStats.averageEngagement)}</span>
                  <span className="stat-label">Avg. Engagement</span>
                </div>
              </Card>

              <Card className="stat-card">
                <Activity size={24} />
                <div className="stat-content">
                  <span className="stat-value">{formatScore(segmentStats.averageActivity)}</span>
                  <span className="stat-label">Avg. Activity</span>
                </div>
              </Card>

              <Card className="stat-card">
                <Clock size={24} />
                <div className="stat-content">
                  <span className="stat-value">{formatTime(segmentStats.averageResponseTime)}</span>
                  <span className="stat-label">Avg. Response Time</span>
                </div>
              </Card>

              <Card className="chart-card">
                <h3>Activity by Hour</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={segmentStats.activeHours.map((count, hour) => ({ hour, count }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="var(--primary)" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="tags-card">
                <h3>Top Tags</h3>
                <div className="tags-list">
                  {segmentStats.topTags.map(tag => (
                    <Badge key={tag} variant="outline">
                      <Tag size={12} />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-list">
              {segmentUsers.map(user => (
                <Card key={user.id} className="user-card">
                  <div className="user-header">
                    <Avatar src={user.avatarUrl} alt={user.name} />
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <span className="email">{user.email}</span>
                    </div>
                  </div>
                  <div className="user-stats">
                    <Badge variant="outline">
                      <TrendingUp size={12} />
                      {formatScore(user.engagementScore)}
                    </Badge>
                    <Badge variant="outline">
                      <Activity size={12} />
                      {user.threadParticipation}
                    </Badge>
                    <Badge variant="outline">
                      <Clock size={12} />
                      {formatTime(user.averageResponseTime)}
                    </Badge>
                  </div>
                  <div className="last-active">
                    Last active {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 