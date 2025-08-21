import React from 'react';
import { Card } from 'shared/components';

interface AdminStatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  icon: React.ComponentType<any>;
  color?: string;
  description?: string;
}

export const AdminStatCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color = 'blue',
  description 
}: AdminStatCardProps) => {
  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? '↗' : '↘';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-1 ${getTrendColor(trend)}`}>
              <span className="text-sm font-medium">{getTrendIcon(trend)} {Math.abs(trend)}%</span>
            </div>
          )}
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );
}; 