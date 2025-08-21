"use client";

import React from 'react';
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e42', '#ef4444', '#a78bfa'];

type PieChartProps = {
  data: unknown[];
  dataKey: string;
  nameKey: string;
  height?: number;
  width?: number;
};

export const PieChart: React.FC<PieChartProps> = ({ data, dataKey, nameKey, height = 240, width = 400 }) => (
  <ResponsiveContainer width={width} height={height}>
    <RePieChart>
      <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} fill="#2563eb">
        {data.map((_: unknown, idx: number) => (
          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </RePieChart>
  </ResponsiveContainer>
); 