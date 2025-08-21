'use client';

import React, { useState, useEffect } from 'react';
import { getConnections, Connection } from '../../api/member';
import { Card, Badge, Spinner } from 'shared/components';
import { Users, Building2, TrendingUp, Calendar, UserPlus, Network } from 'lucide-react';

interface ConnectionAnalyticsProps {
  className?: string;
}

interface AnalyticsData {
  totalConnections: number;
  colleagueConnections: number;
  personalConnections: number;
  organizations: { name: string; count: number }[];
  recentConnections: number;
  connectionGrowth: number;
  topOrganizations: { name: string; count: number }[];
}

export const ConnectionAnalytics: React.FC<ConnectionAnalyticsProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load all connections
      const [allResponse, colleagueResponse, personalResponse] = await Promise.all([
        getConnections('all'),
        getConnections('colleague'),
        getConnections('regular')
      ]);

      const allConnections = allResponse.connections;
      const colleagueConnections = colleagueResponse.connections;
      const personalConnections = personalResponse.connections;

      // Calculate analytics
      const organizationMap = new Map<string, number>();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      allConnections.forEach(connection => {
        if (connection.user.organization) {
          const orgName = connection.user.organization.name;
          organizationMap.set(orgName, (organizationMap.get(orgName) || 0) + 1);
        }
      });

      const organizations = Array.from(organizationMap.entries()).map(([name, count]) => ({
        name,
        count
      })).sort((a, b) => b.count - a.count);

      const recentConnections = allConnections.filter(connection => 
        new Date(connection.createdAt) > thirtyDaysAgo
      ).length;

      const analyticsData: AnalyticsData = {
        totalConnections: allConnections.length,
        colleagueConnections: colleagueConnections.length,
        personalConnections: personalConnections.length,
        organizations,
        recentConnections,
        connectionGrowth: recentConnections,
        topOrganizations: organizations.slice(0, 3)
      };

      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load connection analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Analytics</h3>
        <p className="text-sm text-gray-600">Insights about your professional network</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Connections</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalConnections}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Colleagues</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.colleagueConnections}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Personal</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.personalConnections}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recent (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.recentConnections}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Organization Distribution */}
      {analytics.organizations.length > 0 && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Organization Distribution</h4>
            <Badge color="blue">{analytics.organizations.length} organizations</Badge>
          </div>
          
          <div className="space-y-3">
            {analytics.topOrganizations.map((org, index) => (
              <div key={org.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">{org.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${(org.count / analytics.totalConnections) * 100}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">
                    {org.count}
                  </span>
                </div>
              </div>
            ))}
            
            {analytics.organizations.length > 3 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  +{analytics.organizations.length - 3} more organizations
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Network Insights */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Network Insights</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Connection Diversity</span>
            </div>
            <Badge color={analytics.organizations.length > 5 ? 'green' : 'yellow'}>
              {analytics.organizations.length > 5 ? 'High' : 'Medium'}
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Growth Rate</span>
            </div>
            <Badge color={analytics.recentConnections > 5 ? 'green' : 'blue'}>
              {analytics.recentConnections} new connections
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Professional Network</span>
            </div>
            <Badge color={analytics.colleagueConnections > analytics.personalConnections ? 'blue' : 'gray'}>
              {analytics.colleagueConnections > analytics.personalConnections ? 'Colleague-focused' : 'Balanced'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}; 