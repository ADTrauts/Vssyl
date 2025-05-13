import { useState } from 'react';
import { useContentPerformance } from '../../hooks/useContentPerformance';
import { formatDistanceToNow, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Eye, Users, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const ContentPerformance = () => {
  const {
    selectedThread,
    threadMetrics,
    topThreads,
    isLoading,
    error,
    selectThread
  } = useContentPerformance();

  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'engagement'>('overview');

  if (isLoading) {
    return <div className="content-performance-loading">Loading content performance data...</div>;
  }

  if (error) {
    return <div className="content-performance-error">{error}</div>;
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min`;
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div className="content-performance">
      <div className="threads-list">
        <h2>Top Performing Threads</h2>
        {topThreads.map(thread => (
          <Card
            key={thread.threadId}
            className={`thread-card ${selectedThread === thread.threadId ? 'active' : ''}`}
            onClick={() => selectThread(thread.threadId)}
          >
            <h3>{thread.title}</h3>
            <div className="thread-meta">
              <span className="author">
                <Avatar src={`/api/users/${thread.authorId}/avatar`} alt={thread.authorName} />
                {thread.authorName}
              </span>
              <span className="date">
                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
              </span>
            </div>
            <div className="thread-stats">
              <Badge variant="outline">
                <Eye size={12} />
                {thread.totalViews}
              </Badge>
              <Badge variant="outline">
                <Users size={12} />
                {thread.uniqueViews}
              </Badge>
              <Badge variant="outline">
                <Clock size={12} />
                {formatTime(thread.averageTimeSpent)}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {selectedThread && threadMetrics && (
        <div className="thread-details">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`tab ${activeTab === 'audience' ? 'active' : ''}`}
              onClick={() => setActiveTab('audience')}
            >
              Audience
            </button>
            <button
              className={`tab ${activeTab === 'engagement' ? 'active' : ''}`}
              onClick={() => setActiveTab('engagement')}
            >
              Engagement
            </button>
          </div>

          {activeTab === 'overview' && (
            <div className="overview-grid">
              <Card className="stat-card">
                <Eye size={24} />
                <div className="stat-content">
                  <span className="stat-value">{threadMetrics.totalViews}</span>
                  <span className="stat-label">Total Views</span>
                </div>
              </Card>

              <Card className="stat-card">
                <Users size={24} />
                <div className="stat-content">
                  <span className="stat-value">{threadMetrics.uniqueViews}</span>
                  <span className="stat-label">Unique Views</span>
                </div>
              </Card>

              <Card className="stat-card">
                <Clock size={24} />
                <div className="stat-content">
                  <span className="stat-value">{formatTime(threadMetrics.averageTimeSpent)}</span>
                  <span className="stat-label">Avg. Time Spent</span>
                </div>
              </Card>

              <Card className="stat-card">
                <TrendingUp size={24} />
                <div className="stat-content">
                  <span className="stat-value">{formatPercentage(threadMetrics.engagementRate)}</span>
                  <span className="stat-label">Engagement Rate</span>
                </div>
              </Card>

              <Card className="stat-card">
                <CheckCircle size={24} />
                <div className="stat-content">
                  <span className="stat-value">{formatPercentage(threadMetrics.completionRate)}</span>
                  <span className="stat-label">Completion Rate</span>
                </div>
              </Card>

              <Card className="stat-card">
                <XCircle size={24} />
                <div className="stat-content">
                  <span className="stat-value">{formatPercentage(threadMetrics.bounceRate)}</span>
                  <span className="stat-label">Bounce Rate</span>
                </div>
              </Card>

              <Card className="chart-card">
                <h3>Performance Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={threadMetrics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM d')} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#8884d8" />
                    <Line type="monotone" dataKey="engagement" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="audience-grid">
              <Card className="chart-card">
                <h3>Top Referrers</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={threadMetrics.topReferrers}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="source" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>User Segments</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={threadMetrics.userSegments}
                      dataKey="count"
                      nameKey="segment"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {threadMetrics.userSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>Device Types</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={threadMetrics.deviceTypes}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {threadMetrics.deviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>Geographic Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={threadMetrics.geographicData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="engagement-grid">
              <Card className="chart-card">
                <h3>Engagement Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={threadMetrics.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM d')} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement" stroke="#82ca9d" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="chart-card">
                <h3>Engagement Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'High', value: threadMetrics.engagementRate * 100 },
                        { name: 'Medium', value: (1 - threadMetrics.engagementRate) * 50 },
                        { name: 'Low', value: (1 - threadMetrics.engagementRate) * 50 }
                      ]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {['#82ca9d', '#ffc658', '#ff8042'].map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 