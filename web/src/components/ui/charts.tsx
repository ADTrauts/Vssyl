import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts"

interface ChartData {
  [key: string]: string | number
}

interface ChartProps {
  data: ChartData[]
  xAxisKey: string
  yAxisKey: string
  className?: string
}

export function LineChart({ data, xAxisKey, yAxisKey, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={yAxisKey}
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function BarChart({ data, xAxisKey, yAxisKey, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={yAxisKey} fill="#8884d8" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
} 