import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityHeatmap } from './ActivityHeatmap';
import { ActivityMetrics } from './ActivityMetrics';

type TimeRange = 'day' | 'week' | 'month';

export function ThreadActivityVisualization() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        const response = await fetch(`/api/thread-activity-visualizations?timeRange=${timeRange}`);
        const data = await response.json();
        setActivityData(data);
      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [timeRange]);

  if (loading) {
    return <div>Loading activity data...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activity Visualization</CardTitle>
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <ActivityMetrics data={activityData.metrics} />
          <ActivityTimeline data={activityData.timeline} />
          <ActivityHeatmap data={activityData.heatmap} />
        </div>
      </CardContent>
    </Card>
  );
} 