import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Badge, Spinner } from 'shared/components';
// import { BarChart, LineChart, PieChart } from 'shared/components';
import { 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar,
  Activity,
  Zap
} from 'lucide-react';

interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  totalReactions: number;
  averageMessagesPerConversation: number;
  mostActiveConversations: Array<{
    id: string;
    name: string;
    messageCount: number;
    lastActivity: string;
  }>;
  messageActivityByDay: Array<{
    date: string;
    count: number;
  }>;
  topReactors: Array<{
    user: {
      id: string;
      name: string;
      email: string;
    };
    count: number;
  }>;
  responseTimeStats: {
    averageResponseTime: number;
    medianResponseTime: number;
    fastestResponse: number;
    slowestResponse: number;
  };
}

interface ChatAnalyticsProps {
  dashboardId?: string;
  className?: string;
}

export default function ChatAnalytics({ dashboardId, className = '' }: ChatAnalyticsProps) {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, 1y

  useEffect(() => {
    if (!session?.accessToken) return;

    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const endDate = new Date().toISOString();
        const startDate = new Date();
        
        switch (dateRange) {
          case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
          case '1y':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        }

        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate,
          ...(dashboardId && { dashboardId })
        });

        const response = await fetch(`/api/chat/analytics?${params}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.data);
        }
      } catch (error) {
        console.error('Failed to load chat analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [session?.accessToken, dashboardId, dateRange]);

  if (!session?.accessToken) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          Please log in to view chat analytics
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <Spinner size={32} />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          No analytics data available
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Analytics</h2>
          <p className="text-gray-600">Activity and engagement insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalMessages}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalConversations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reactions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalReactions}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Messages/Conv</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.averageMessagesPerConversation}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Activity Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Activity</h3>
          <div style={{ padding: '20px', textAlign: 'center', color: '#666', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Message Activity Chart (Temporarily Disabled)
          </div>
        </Card>

        {/* Top Reactors Chart */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Reactors</h3>
          <div style={{ padding: '20px', textAlign: 'center', color: '#666', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Top Reactors Chart (Temporarily Disabled)
          </div>
        </Card>
      </div>

      {/* Response Time Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Average</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics.responseTimeStats.averageResponseTime}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Median</p>
            <p className="text-xl font-bold text-gray-900">
              {analytics.responseTimeStats.medianResponseTime}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Fastest</p>
            <p className="text-xl font-bold text-green-600">
              {analytics.responseTimeStats.fastestResponse}m
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Slowest</p>
            <p className="text-xl font-bold text-red-600">
              {analytics.responseTimeStats.slowestResponse}m
            </p>
          </div>
        </div>
      </Card>

      {/* Most Active Conversations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Conversations</h3>
        <div className="space-y-3">
          {analytics.mostActiveConversations.map((conversation, index) => (
            <div key={conversation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Badge color="blue" className="mr-3">
                  #{index + 1}
                </Badge>
                <div>
                  <p className="font-medium text-gray-900">{conversation.name}</p>
                  <p className="text-sm text-gray-500">
                    Last activity: {new Date(conversation.lastActivity).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{conversation.messageCount}</p>
                <p className="text-sm text-gray-500">messages</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 