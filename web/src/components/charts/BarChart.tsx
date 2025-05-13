import { useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarChartProps {
  data: { x: Date; y: number }[];
}

export const BarChart = ({ data }: BarChartProps) => {
  const chartRef = useRef<ChartJS<'bar'> | null>(null);

  const chartData: ChartData<'bar'> = {
    labels: data.map(item => item.x.toLocaleDateString()),
    datasets: [
      {
        label: 'Participants',
        data: data.map(item => item.y),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
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
            return `${context.parsed.y} participants`;
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
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}; 