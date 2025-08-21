"use client";

import React from 'react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type BarChartProps = {
  data: unknown[];
  xKey: string;
  barKey?: string;
  yKey?: string;
  height?: number;
  width?: number;
};

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  xKey, 
  barKey, 
  yKey,
  height = 240, 
  width = 400 
}) => {
  // Support both barKey and yKey for compatibility
  const dataKey = barKey || yKey || 'value';
  
  return (
    <ResponsiveContainer width={width} height={height}>
      <ReBarChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={dataKey} fill="#2563eb" />
      </ReBarChart>
    </ResponsiveContainer>
  );
}; 