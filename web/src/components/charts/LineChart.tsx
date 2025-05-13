import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: { x: Date; y: number }[];
}

export const LineChart = ({ data }: LineChartProps) => {
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  const chartData: ChartData<'line'> = {
    labels: data.map(item => item.x.toLocaleDateString()),
    datasets: [
      {
        label: 'Activity',
        data: data.map(item => item.y),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.parsed.y} activities`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div style={{ height: '300px' }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}; 