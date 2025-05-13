import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart2, PieChart, Network,
  Filter, Search, Save, Download,
  Settings, Eye, EyeOff, ZoomIn,
  ZoomOut, RotateCw, Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { DateRangePicker } from '../ui/date-picker';
import { DateRange } from 'react-day-picker';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: string;
  metadata: Record<string, unknown>;
  score?: number;
  tags?: string[];
  author?: string;
  size?: number;
}

interface VisualizationFilters {
  dateRange: DateRange | undefined;
  type: string[];
  size: [number, number];
  relevance: number;
  tags?: string[];
  author?: string;
}

interface SearchVisualizationProps {
  searchId: string;
  results: SearchResult[];
  onFilterChange: (filters: VisualizationFilters) => void;
}

export function SearchVisualization({ 
  searchId,
  results,
  onFilterChange
}: SearchVisualizationProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'network'>('bar');
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [filters, setFilters] = useState<VisualizationFilters>({
    dateRange: undefined,
    type: [],
    size: [0, 100],
    relevance: 0
  });

  const handleViewModeChange = (checked: boolean) => {
    setViewMode(checked ? 'chart' : 'list');
  };

  const handleChartTypeChange = (checked: boolean) => {
    setChartType(checked ? 'pie' : 'bar');
  };

  const handleNetworkViewChange = (checked: boolean) => {
    setChartType(checked ? 'network' : 'bar');
  };

  const handleFilterChange = (updates: Partial<VisualizationFilters>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (date: DateRange | undefined) => {
    handleFilterChange({ dateRange: date });
  };

  const handleSizeRangeChange = (value: [number, number]) => {
    handleFilterChange({ size: value });
  };

  const handleRelevanceChange = (checked: boolean) => {
    handleFilterChange({ relevance: checked ? 1 : 0 });
  };

  const handleTypeFilterChange = (checked: boolean) => {
    const types = checked ? ['file', 'folder'] : [];
    handleFilterChange({ type: types });
  };

  const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
    try {
      const response = await fetch(`/api/search/${searchId}/visualization/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          settings: {
            type: chartType,
            colorScheme: 'default',
            showLabels: true,
            showValues: true,
            animation: true,
            zoom: zoom,
            rotation: rotation
          },
          filters
        }),
      });
      if (!response.ok) throw new Error('Failed to export visualization');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visualization.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Visualization exported successfully');
    } catch (error) {
      toast.error('Failed to export visualization');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="space-y-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date Range</Label>
              <DateRangePicker
                date={filters.dateRange}
                onSelect={handleDateRangeChange}
              />
            </div>
            <div>
              <Label>Size Range</Label>
              <Slider
                value={filters.size}
                onValueChange={handleSizeRangeChange}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={filters.relevance > 0}
                onCheckedChange={handleRelevanceChange}
              />
              <Label>High Relevance Only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={filters.type.length > 0}
                onCheckedChange={handleTypeFilterChange}
              />
              <Label>Filter by Type</Label>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="space-y-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={viewMode === 'chart'}
                onCheckedChange={handleViewModeChange}
              />
              <Label>Chart View</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={chartType === 'pie'}
                onCheckedChange={handleChartTypeChange}
              />
              <Label>Pie Chart</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={chartType === 'network'}
                onCheckedChange={handleNetworkViewChange}
              />
              <Label>Network View</Label>
            </div>
          </div>
        </div>
      )}

      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
        {/* Visualization content will go here */}
      </div>
    </Card>
  );
} 