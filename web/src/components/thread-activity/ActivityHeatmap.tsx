import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeatMapGrid } from 'react-grid-heatmap';

interface ActivityHeatmapProps {
  data: {
    xLabels: string[];
    yLabels: string[];
    data: number[][];
  };
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const cellStyle = (_x: number, _y: number, ratio: number) => ({
    background: `rgb(12, 160, 44, ${ratio})`,
    fontSize: '11px',
    color: ratio > 0.5 ? 'white' : 'black',
  });

  const cellRender = (x: number, y: number, value: number) => {
    return value > 0 ? value : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] overflow-x-auto">
          <HeatMapGrid
            data={data.data}
            xLabels={data.xLabels}
            yLabels={data.yLabels}
            cellStyle={cellStyle}
            cellRender={cellRender}
            cellHeight="2rem"
            cellWidth="2rem"
            title="Activity Distribution"
          />
        </div>
      </CardContent>
    </Card>
  );
} 