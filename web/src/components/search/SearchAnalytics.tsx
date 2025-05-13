import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BarChart2, PieChart, TrendingUp, Filter, Download, Search, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Define types for analytics data
interface QueryCount {
  query: string;
  count: number;
}
interface FilterCount {
  filter: string;
  count: number;
}
interface Insight {
  id: string;
  impact: string;
  title: string;
  description: string;
  action?: string;
}
interface AnalyticsData {
  searchVolume?: {
    total?: number;
    byDate?: any[];
  };
  performance?: {
    averageTime?: number;
    successRate?: number;
    byQuery?: QueryCount[];
  };
  patterns?: {
    commonQueries?: QueryCount[];
    relatedQueries?: QueryCount[];
    filters?: FilterCount[];
  };
  insights?: Insight[];
}

export function SearchAnalytics({ searchId }: { searchId: string }) {
  const [timeRange, setTimeRange] = useState('24h');
  const [groupBy] = useState('hour');
  const [settings, setSettings] = useState({
    autoRefresh: true,
    refreshInterval: 30000,
    showCharts: true,
    showTables: true,
    showMetrics: true,
    defaultTimeRange: '24h',
    defaultGroupBy: 'hour',
    maxDataPoints: 1000,
    exportFormat: 'csv'
  });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      const response = await fetch(`/api/search/${searchId}/analytics?timeRange=${timeRange}&groupBy=${groupBy}`);
      if (!response.ok) throw new Error('Failed to load analytics data');
      const data = await response.json();
      return data;
    } catch {
      toast('Failed to load analytics data');
      return null;
    }
  }, [searchId, timeRange, groupBy]);

  const loadSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/search/${searchId}/analytics/settings`);
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      return data;
    } catch {
      toast('Failed to load settings');
      return {
        autoRefresh: true,
        refreshInterval: 30000,
        showCharts: true,
        showTables: true,
        showMetrics: true,
        defaultTimeRange: '24h',
        defaultGroupBy: 'hour',
        maxDataPoints: 1000,
        exportFormat: 'csv'
      };
    }
  }, [searchId]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [analyticsData, settingsData] = await Promise.all([
          loadAnalyticsData(),
          loadSettings()
        ]);
        setData(analyticsData);
        setSettings(settingsData);
      } catch {
        console.error('Failed to initialize analytics data:');
      }
    };
    initializeData();
  }, [loadAnalyticsData, loadSettings]);

  useEffect(() => {
    if (settings.autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        loadAnalyticsData().then(analyticsData => {
          setData(analyticsData);
        });
      }, settings.refreshInterval);
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [settings.autoRefresh, settings.refreshInterval, loadAnalyticsData]);

  const handleExportData = useCallback(async () => {
    try {
      const response = await fetch(`/api/search/${searchId}/analytics/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: settings.exportFormat,
          timeRange,
          groupBy
        }),
      });
      if (!response.ok) throw new Error('Failed to export data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${searchId}-${new Date().toISOString()}.${settings.exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast('Data exported successfully');
    } catch {
      toast('Failed to export data');
    }
  }, [searchId, settings.exportFormat, timeRange, groupBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24 hours</SelectItem>
              <SelectItem value="week">Last week</SelectItem>
              <SelectItem value="month">Last month</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <PieChart className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="insights">
            <TrendingUp className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Total Searches</Label>
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data?.searchVolume?.total?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {data?.searchVolume?.byDate?.length} days
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Average Time</Label>
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-2xl font-bold">
                  {data?.performance?.averageTime?.toFixed(1)}s
                </p>
                <p className="text-sm text-gray-500">
                  {data?.performance?.successRate?.toFixed(1)}% success rate
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Top Queries</Label>
                  <Filter className="h-4 w-4 text-gray-500" />
                </div>
                <div className="space-y-1">
                  {data?.performance?.byQuery?.slice(0, 3).map((item: QueryCount) => (
                    <div key={item.query} className="flex items-center justify-between">
                      <span className="text-sm truncate">{item.query}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
          <Card className="p-4">
            <div className="space-y-4">
              <Label>Search Volume Over Time</Label>
              <div className="h-64">
                {/* Add chart component here */}
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="space-y-4">
                <Label>Common Queries</Label>
                <div className="space-y-2">
                  {data?.patterns?.commonQueries?.map((item: QueryCount) => (
                    <div key={item.query} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-sm">{item.query}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-4">
                <Label>Related Queries</Label>
                <div className="space-y-2">
                  {data?.patterns?.relatedQueries?.map((item: QueryCount) => (
                    <div key={item.query} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-sm">{item.query}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-4">
                <Label>Filter Usage</Label>
                <div className="space-y-2">
                  {data?.patterns?.filters?.map((item: FilterCount) => (
                    <div key={item.filter} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <span className="text-sm">{item.filter}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {data?.insights?.map((insight: Insight) => (
              <Card key={insight.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                        insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {insight.impact}
                      </span>
                      <h3 className="font-medium">{insight.title}</h3>
                    </div>
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInsightSelect(insight)}
                    >
                      Apply
                    </Button> */}
                  </div>
                  <p className="text-sm text-gray-500">{insight.description}</p>
                  {insight.action && (
                    <p className="text-sm font-medium text-blue-600">{insight.action}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SearchAnalytics; 