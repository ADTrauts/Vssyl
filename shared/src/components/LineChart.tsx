"use client";

import React from 'react';
import { LineChart as ReLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type LineChartProps = {
  data: unknown[];
  xKey: string;
  lineKey?: string;
  yKey?: string;
  height?: number;
  width?: number;
};

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  xKey, 
  lineKey, 
  yKey,
  height = 240, 
  width = 400 
}) => {
  // Support both lineKey and yKey for compatibility
  const dataKey = lineKey || yKey || 'value';
  
  return (
    <ResponsiveContainer width={width} height={height}>
      <ReLineChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke="#2563eb" strokeWidth={2} />
      </ReLineChart>
    </ResponsiveContainer>
  );
}; 