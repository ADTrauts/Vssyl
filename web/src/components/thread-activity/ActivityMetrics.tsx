import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Metric {
  label: string;
  value: number;
  change?: number;
  unit?: string;
}

interface ActivityMetricsProps {
  data: {
    totalMessages: number;
    activeParticipants: number;
    averageResponseTime: number;
    messageGrowth: number;
    participantGrowth: number;
  };
}

export function ActivityMetrics({ data }: ActivityMetricsProps) {
  const metrics: Metric[] = [
    {
      label: 'Total Messages',
      value: data.totalMessages,
      change: data.messageGrowth,
      unit: 'messages'
    },
    {
      label: 'Active Participants',
      value: data.activeParticipants,
      change: data.participantGrowth,
      unit: 'users'
    },
    {
      label: 'Avg Response Time',
      value: data.averageResponseTime,
      unit: 'minutes'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metric.value.toLocaleString()}
              {metric.unit && <span className="text-sm font-normal ml-1">{metric.unit}</span>}
            </div>
            {metric.change !== undefined && (
              <div className={`text-sm ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 