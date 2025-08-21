import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface DataStream {
  id: string;
  name: string;
  description: string;
  source: 'workflow' | 'ai_model' | 'user_activity' | 'system_metrics' | 'external_api';
  dataType: 'metrics' | 'events' | 'logs' | 'transactions' | 'user_behavior';
  format: 'json' | 'csv' | 'xml' | 'binary' | 'protobuf';
  frequency: number; // milliseconds
  retention: number; // days
  status: 'active' | 'paused' | 'stopped';
  metadata: {
    owner: string;
    team: string;
    tags: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    lastUpdate: Date;
    dataVolume: number; // records per second
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DataPoint {
  id: string;
  streamId: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    quality: number; // 0-1
    tags: string[];
  };
  createdAt: Date;
}

export interface RealTimeMetric {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'business' | 'technical' | 'user' | 'system';
  unit: string;
  aggregation: 'sum' | 'average' | 'min' | 'max' | 'count' | 'custom';
  calculation: string; // JavaScript expression or SQL-like query
  thresholds: {
    warning: number;
    critical: number;
    target: number;
  };
  status: 'normal' | 'warning' | 'critical' | 'unknown';
  lastValue: number;
  lastUpdate: Date;
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  metadata: Record<string, any>;
}

export interface RealTimeAlert {
  id: string;
  metricId: string;
  metricName: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  condition: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface StreamProcessor {
  id: string;
  name: string;
  description: string;
  streamId: string;
  type: 'filter' | 'transform' | 'aggregate' | 'enrich' | 'validate';
  config: {
    filter?: string; // JavaScript expression
    transform?: string; // JavaScript expression
    aggregation?: {
      window: number; // milliseconds
      function: 'sum' | 'average' | 'min' | 'max' | 'count';
      groupBy?: string[];
    };
    enrichment?: Record<string, any>;
    validation?: Record<string, any>;
  };
  status: 'active' | 'paused' | 'error';
  performance: {
    processedRecords: number;
    processingTime: number; // milliseconds
    errorRate: number;
    throughput: number; // records per second
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  category: 'overview' | 'performance' | 'business' | 'technical' | 'custom';
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  refreshInterval: number; // seconds
  status: 'active' | 'inactive' | 'draft';
  access: {
    roles: string[];
    users: string[];
    public: boolean;
  };
  metadata: {
    owner: string;
    team: string;
    tags: string[];
    lastModified: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  type: 'grid' | 'flexible' | 'responsive';
  columns: number;
  rows: number;
  cellSize: {
    width: number;
    height: number;
  };
}

export interface DashboardWidget {
  id: string;
  name: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'map' | 'text' | 'custom';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: {
    dataSource: string;
    chartType?: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'heatmap';
    metrics?: string[];
    dimensions?: string[];
    filters?: Record<string, any>;
    refreshInterval?: number;
    customConfig?: Record<string, any>;
  };
  data?: any;
  lastUpdate: Date;
}

export interface StreamSubscription {
  id: string;
  userId: string;
  streamId: string;
  filters: Record<string, any>;
  delivery: {
    method: 'websocket' | 'webhook' | 'email' | 'push';
    endpoint?: string;
    frequency: number; // milliseconds
  };
  status: 'active' | 'paused' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export class RealTimeAnalyticsEngine extends EventEmitter {
  private prisma: PrismaClient;
  private streams: Map<string, DataStream> = new Map();
  private dataPoints: Map<string, DataPoint[]> = new Map();
  private metrics: Map<string, RealTimeMetric> = new Map();
  private alerts: Map<string, RealTimeAlert[]> = new Map();
  private processors: Map<string, StreamProcessor[]> = new Map();
  private dashboards: Map<string, AnalyticsDashboard> = new Map();
  private subscriptions: Map<string, StreamSubscription[]> = new Map();
  private activeConnections: Map<string, any> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.initializeMockData();
  }

  /**
   * Initialize mock data for demonstration
   */
  private async initializeMockData(): Promise<void> {
    try {
      // Create mock data streams
      const mockStreams: DataStream[] = [
        {
          id: 'stream_1',
          name: 'Workflow Performance Metrics',
          description: 'Real-time metrics from workflow executions',
          source: 'workflow',
          dataType: 'metrics',
          format: 'json',
          frequency: 5000, // 5 seconds
          retention: 30,
          status: 'active',
          metadata: {
            owner: 'Analytics Team',
            team: 'Engineering',
            tags: ['workflow', 'performance', 'real-time'],
            priority: 'high',
            lastUpdate: new Date(),
            dataVolume: 100
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stream_2',
          name: 'AI Model Performance',
          description: 'Real-time AI model performance metrics',
          source: 'ai_model',
          dataType: 'metrics',
          format: 'json',
          frequency: 10000, // 10 seconds
          retention: 60,
          status: 'active',
          metadata: {
            owner: 'AI Team',
            team: 'Machine Learning',
            tags: ['ai', 'performance', 'real-time'],
            priority: 'high',
            lastUpdate: new Date(),
            dataVolume: 50
          },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'stream_3',
          name: 'User Activity Stream',
          description: 'Real-time user activity and behavior data',
          source: 'user_activity',
          dataType: 'events',
          format: 'json',
          frequency: 1000, // 1 second
          retention: 7,
          status: 'active',
          metadata: {
            owner: 'Product Team',
            team: 'Product',
            tags: ['user', 'behavior', 'real-time'],
            priority: 'medium',
            lastUpdate: new Date(),
            dataVolume: 500
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockStreams.forEach(stream => {
        this.streams.set(stream.id, stream);
        this.dataPoints.set(stream.id, []);
        this.processors.set(stream.id, []);
        this.subscriptions.set(stream.id, []);
      });

      // Create mock real-time metrics
      const mockMetrics: RealTimeMetric[] = [
        {
          id: 'metric_1',
          name: 'Workflow Success Rate',
          description: 'Percentage of successful workflow executions',
          category: 'performance',
          unit: 'percentage',
          aggregation: 'average',
          calculation: 'successful_executions / total_executions * 100',
          thresholds: {
            warning: 85,
            critical: 70,
            target: 95
          },
          status: 'normal',
          lastValue: 92.5,
          lastUpdate: new Date(),
          trend: 'stable',
          metadata: {
            dataSource: 'stream_1',
            updateFrequency: 5000
          }
        },
        {
          id: 'metric_2',
          name: 'AI Model Response Time',
          description: 'Average response time for AI model predictions',
          category: 'performance',
          unit: 'milliseconds',
          aggregation: 'average',
          calculation: 'AVG(response_time)',
          thresholds: {
            warning: 500,
            critical: 1000,
            target: 200
          },
          status: 'normal',
          lastValue: 350,
          lastUpdate: new Date(),
          trend: 'decreasing',
          metadata: {
            dataSource: 'stream_2',
            updateFrequency: 10000
          }
        },
        {
          id: 'metric_3',
          name: 'Active Users',
          description: 'Number of currently active users',
          category: 'business',
          unit: 'users',
          aggregation: 'count',
          calculation: 'COUNT(DISTINCT user_id)',
          thresholds: {
            warning: 1000,
            critical: 500,
            target: 2000
          },
          status: 'normal',
          lastValue: 1250,
          lastUpdate: new Date(),
          trend: 'increasing',
          metadata: {
            dataSource: 'stream_3',
            updateFrequency: 1000
          }
        }
      ];

      mockMetrics.forEach(metric => {
        this.metrics.set(metric.id, metric);
        this.alerts.set(metric.id, []);
      });

      // Create mock dashboards
      const mockDashboards: AnalyticsDashboard[] = [
        {
          id: 'dashboard_1',
          name: 'System Overview',
          description: 'Real-time system performance overview',
          category: 'overview',
          layout: {
            type: 'grid',
            columns: 3,
            rows: 2,
            cellSize: { width: 300, height: 200 }
          },
          widgets: [
            {
              id: 'widget_1',
              name: 'Workflow Success Rate',
              type: 'metric',
              position: { x: 0, y: 0, width: 1, height: 1 },
              config: {
                dataSource: 'metric_1'
              },
              lastUpdate: new Date()
            },
            {
              id: 'widget_2',
              name: 'AI Model Response Time',
              type: 'chart',
              position: { x: 1, y: 0, width: 1, height: 1 },
              config: {
                dataSource: 'metric_2',
                chartType: 'line'
              },
              lastUpdate: new Date()
            },
            {
              id: 'widget_3',
              name: 'Active Users',
              type: 'metric',
              position: { x: 2, y: 0, width: 1, height: 1 },
              config: {
                dataSource: 'metric_3'
              },
              lastUpdate: new Date()
            }
          ],
          refreshInterval: 5,
          status: 'active',
          access: {
            roles: ['admin', 'analyst'],
            users: [],
            public: false
          },
          metadata: {
            owner: 'Analytics Team',
            team: 'Engineering',
            tags: ['overview', 'performance', 'real-time'],
            lastModified: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDashboards.forEach(dashboard => {
        this.dashboards.set(dashboard.id, dashboard);
      });

      console.log(`✅ Initialized ${mockStreams.length} data streams, ${mockMetrics.length} metrics, and ${mockDashboards.length} dashboards`);

    } catch (error) {
      console.error('Error initializing analytics data:', error);
    }
  }

  /**
   * Create new data stream
   */
  async createDataStream(streamData: Omit<DataStream, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataStream> {
    try {
      const stream: DataStream = {
        ...streamData,
        id: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.streams.set(stream.id, stream);
      this.dataPoints.set(stream.id, []);
      this.processors.set(stream.id, []);
      this.subscriptions.set(stream.id, []);

      this.emit('stream_created', stream);
      console.log(`✅ Created data stream: ${stream.name}`);
      return stream;

    } catch (error) {
      console.error('Error creating data stream:', error);
      throw error;
    }
  }

  /**
   * Get data streams
   */
  async getDataStreams(filters: {
    source?: string;
    dataType?: string;
    status?: string;
    team?: string;
  } = {}): Promise<DataStream[]> {
    try {
      let streams = Array.from(this.streams.values());

      // Apply filters
      if (filters.source) {
        streams = streams.filter(s => s.source === filters.source);
      }
      if (filters.dataType) {
        streams = streams.filter(s => s.dataType === filters.dataType);
      }
      if (filters.status) {
        streams = streams.filter(s => s.status === filters.status);
      }
      if (filters.team) {
        streams = streams.filter(s => s.metadata.team === filters.team);
      }

      // Sort by creation date (newest first)
      streams.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return streams;

    } catch (error) {
      console.error('Error getting data streams:', error);
      return [];
    }
  }

  /**
   * Add data point to stream
   */
  async addDataPoint(streamId: string, data: Record<string, any>, metadata: {
    source: string;
    version: string;
    quality: number;
    tags: string[];
  }): Promise<DataPoint> {
    try {
      const stream = this.streams.get(streamId);
      if (!stream) {
        throw new Error(`Stream ${streamId} not found`);
      }

      const dataPoint: DataPoint = {
        id: `point_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        streamId,
        timestamp: new Date(),
        data,
        metadata,
        createdAt: new Date()
      };

      // Add to data points
      const streamDataPoints = this.dataPoints.get(streamId) || [];
      streamDataPoints.push(dataPoint);
      this.dataPoints.set(streamId, streamDataPoints);

      // Update stream metadata
      stream.metadata.lastUpdate = new Date();
      stream.metadata.dataVolume = streamDataPoints.length;
      this.streams.set(streamId, stream);

      // Process data through stream processors
      await this.processStreamData(streamId, dataPoint);

      // Check metrics and generate alerts
      await this.checkMetrics(streamId, dataPoint);

      // Emit event for real-time updates
      this.emit('data_point_added', { streamId, dataPoint });

      console.log(`📊 Added data point to stream ${streamId}`);
      return dataPoint;

    } catch (error) {
      console.error('Error adding data point:', error);
      throw error;
    }
  }

  /**
   * Get data points from stream
   */
  async getDataPoints(streamId: string, filters: {
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    tags?: string[];
  } = {}): Promise<DataPoint[]> {
    try {
      const streamDataPoints = this.dataPoints.get(streamId) || [];
      let filteredPoints = [...streamDataPoints];

      // Apply filters
      if (filters.startTime) {
        filteredPoints = filteredPoints.filter(p => p.timestamp >= filters.startTime!);
      }
      if (filters.endTime) {
        filteredPoints = filteredPoints.filter(p => p.timestamp <= filters.endTime!);
      }
      if (filters.tags && filters.tags.length > 0) {
        filteredPoints = filteredPoints.filter(p => 
          filters.tags!.some(tag => p.metadata.tags.includes(tag))
        );
      }

      // Sort by timestamp (newest first)
      filteredPoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply limit
      if (filters.limit) {
        filteredPoints = filteredPoints.slice(0, filters.limit);
      }

      return filteredPoints;

    } catch (error) {
      console.error('Error getting data points:', error);
      return [];
    }
  }

  /**
   * Create real-time metric
   */
  async createRealTimeMetric(metricData: Omit<RealTimeMetric, 'id' | 'lastValue' | 'lastUpdate' | 'status' | 'trend'>): Promise<RealTimeMetric> {
    try {
      const metric: RealTimeMetric = {
        ...metricData,
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastValue: 0,
        lastUpdate: new Date(),
        status: 'unknown',
        trend: 'unknown'
      };

      this.metrics.set(metric.id, metric);
      this.alerts.set(metric.id, []);

      this.emit('metric_created', metric);
      console.log(`✅ Created real-time metric: ${metric.name}`);
      return metric;

    } catch (error) {
      console.error('Error creating real-time metric:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(filters: {
    category?: string;
    status?: string;
    team?: string;
  } = {}): Promise<RealTimeMetric[]> {
    try {
      let metrics = Array.from(this.metrics.values());

      // Apply filters
      if (filters.category) {
        metrics = metrics.filter(m => m.category === filters.category);
      }
      if (filters.status) {
        metrics = metrics.filter(m => m.status === filters.status);
      }
      if (filters.team) {
        metrics = metrics.filter(m => m.metadata.team === filters.team);
      }

      // Sort by last update (newest first)
      metrics.sort((a, b) => b.lastUpdate.getTime() - a.lastUpdate.getTime());

      return metrics;

    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return [];
    }
  }

  /**
   * Create analytics dashboard
   */
  async createAnalyticsDashboard(dashboardData: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalyticsDashboard> {
    try {
      const dashboard: AnalyticsDashboard = {
        ...dashboardData,
        id: `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.dashboards.set(dashboard.id, dashboard);
      this.emit('dashboard_created', dashboard);

      console.log(`✅ Created analytics dashboard: ${dashboard.name}`);
      return dashboard;

    } catch (error) {
      console.error('Error creating analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Get analytics dashboards
   */
  async getAnalyticsDashboards(filters: {
    category?: string;
    status?: string;
    team?: string;
    public?: boolean;
  } = {}): Promise<AnalyticsDashboard[]> {
    try {
      let dashboards = Array.from(this.dashboards.values());

      // Apply filters
      if (filters.category) {
        dashboards = dashboards.filter(d => d.category === filters.category);
      }
      if (filters.status) {
        dashboards = dashboards.filter(d => d.status === filters.status);
      }
      if (filters.team) {
        dashboards = dashboards.filter(d => d.metadata.team === filters.team);
      }
      if (filters.public !== undefined) {
        dashboards = dashboards.filter(d => d.access.public === filters.public);
      }

      // Sort by last modified (newest first)
      dashboards.sort((a, b) => b.metadata.lastModified.getTime() - a.metadata.lastModified.getTime());

      return dashboards;

    } catch (error) {
      console.error('Error getting analytics dashboards:', error);
      return [];
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(dashboardId: string): Promise<{
    dashboard: AnalyticsDashboard;
    widgetData: Record<string, any>;
  }> {
    try {
      const dashboard = this.dashboards.get(dashboardId);
      if (!dashboard) {
        throw new Error(`Dashboard ${dashboardId} not found`);
      }

      // Collect data for each widget
      const widgetData: Record<string, any> = {};
      
      for (const widget of dashboard.widgets) {
        try {
          const data = await this.getWidgetData(widget);
          widgetData[widget.id] = data;
          widget.lastUpdate = new Date();
        } catch (error) {
          console.error(`Error getting data for widget ${widget.id}:`, error);
          widgetData[widget.id] = { error: 'Failed to load data' };
        }
      }

      // Update dashboard
      dashboard.updatedAt = new Date();
      dashboard.metadata.lastModified = new Date();
      this.dashboards.set(dashboardId, dashboard);

      return { dashboard, widgetData };

    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get widget data
   */
  private async getWidgetData(widget: DashboardWidget): Promise<any> {
    try {
      const { dataSource, chartType, metrics, dimensions, filters } = widget.config;

      // Parse data source to determine type
      if (dataSource.startsWith('metric_')) {
        // Get metric data
        const metric = this.metrics.get(dataSource);
        if (!metric) {
          throw new Error(`Metric ${dataSource} not found`);
        }

        return {
          value: metric.lastValue,
          unit: metric.unit,
          status: metric.status,
          trend: metric.trend,
          lastUpdate: metric.lastUpdate,
          thresholds: metric.thresholds
        };

      } else if (dataSource.startsWith('stream_')) {
        // Get stream data
        const dataPoints = await this.getDataPoints(dataSource, {
          limit: 100,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        });

        if (chartType === 'line' || chartType === 'area') {
          return dataPoints.map(dp => ({
            timestamp: dp.timestamp,
            value: dp.data[metrics?.[0] || 'value'] || 0
          }));
        } else if (chartType === 'bar') {
          // Aggregate data by time intervals
          const aggregated = this.aggregateDataByTime(dataPoints, metrics?.[0] || 'value', '1h');
          return aggregated;
        } else {
          return dataPoints.slice(-10); // Last 10 data points
        }
      }

      return { error: 'Unknown data source' };

    } catch (error) {
      console.error('Error getting widget data:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Aggregate data by time intervals
   */
  private aggregateDataByTime(dataPoints: DataPoint[], metricKey: string, interval: string): any[] {
    const intervals: Record<string, { sum: number; count: number }> = {};
    
    dataPoints.forEach(dp => {
      const timestamp = dp.timestamp.getTime();
      const intervalKey = this.getTimeIntervalKey(timestamp, interval);
      
      if (!intervals[intervalKey]) {
        intervals[intervalKey] = { sum: 0, count: 0 };
      }
      
      intervals[intervalKey].sum += dp.data[metricKey] || 0;
      intervals[intervalKey].count += 1;
    });

    return Object.entries(intervals).map(([key, value]) => ({
      timestamp: new Date(parseInt(key)),
      value: value.sum / value.count,
      count: value.count
    }));
  }

  /**
   * Get time interval key
   */
  private getTimeIntervalKey(timestamp: number, interval: string): string {
    const date = new Date(timestamp);
    
    switch (interval) {
      case '1m':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()).getTime().toString();
      case '1h':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime().toString();
      case '1d':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime().toString();
      default:
        return date.getTime().toString();
    }
  }

  /**
   * Process stream data through processors
   */
  private async processStreamData(streamId: string, dataPoint: DataPoint): Promise<void> {
    try {
      const streamProcessors = this.processors.get(streamId) || [];
      
      for (const processor of streamProcessors) {
        if (processor.status !== 'active') continue;

        try {
          // Apply processor logic
          const processedData = await this.applyProcessor(processor, dataPoint);
          
          // Update processor performance metrics
          processor.performance.processedRecords++;
          processor.performance.processingTime = Date.now() - dataPoint.createdAt.getTime();
          processor.performance.throughput = processor.performance.processedRecords / (processor.performance.processingTime / 1000);
          
          this.processors.set(streamId, streamProcessors);
          
        } catch (error) {
          console.error(`Error in processor ${processor.id}:`, error);
          processor.status = 'error';
          processor.performance.errorRate = (processor.performance.errorRate || 0) + 1;
        }
      }

    } catch (error) {
      console.error('Error processing stream data:', error);
    }
  }

  /**
   * Apply processor logic
   */
  private async applyProcessor(processor: StreamProcessor, dataPoint: DataPoint): Promise<any> {
    const { filter, transform, aggregation, enrichment, validation } = processor.config;

    let processedData = { ...dataPoint.data };

    // Apply filter
    if (filter) {
      try {
        const filterFn = new Function('data', `return ${filter}`);
        if (!filterFn(processedData)) {
          return null; // Data filtered out
        }
      } catch (error) {
        console.error('Error applying filter:', error);
      }
    }

    // Apply transform
    if (transform) {
      try {
        const transformFn = new Function('data', `return ${transform}`);
        processedData = transformFn(processedData);
      } catch (error) {
        console.error('Error applying transform:', error);
      }
    }

    // Apply enrichment
    if (enrichment) {
      processedData = { ...processedData, ...enrichment };
    }

    // Apply validation
    if (validation) {
      // Simple validation logic
      for (const [key, rule] of Object.entries(validation)) {
        if (processedData[key] === undefined || processedData[key] === null) {
          throw new Error(`Validation failed: ${key} is required`);
        }
      }
    }

    return processedData;

  } catch (error: unknown) {
    console.error('Error applying processor:', error);
    throw error;
  }

  /**
   * Check metrics and generate alerts
   */
  private async checkMetrics(streamId: string, dataPoint: DataPoint): Promise<void> {
    try {
      const streamMetrics = Array.from(this.metrics.values()).filter(m => 
        m.metadata.dataSource === streamId
      );

      for (const metric of streamMetrics) {
        try {
          // Calculate metric value
          const value = this.calculateMetricValue(metric, dataPoint);
          
          // Update metric
          metric.lastValue = value;
          metric.lastUpdate = new Date();
          
          // Determine status
          if (value <= metric.thresholds.critical) {
            metric.status = 'critical';
          } else if (value <= metric.thresholds.warning) {
            metric.status = 'warning';
          } else {
            metric.status = 'normal';
          }

          // Determine trend (simplified)
          metric.trend = 'stable'; // In real implementation, compare with previous values

          // Generate alert if needed
          if (metric.status === 'warning' || metric.status === 'critical') {
            await this.generateAlert(metric, value);
          }

          this.metrics.set(metric.id, metric);

        } catch (error: unknown) {
          console.error(`Error checking metric ${metric.id}:`, error);
        }
      }

    } catch (error: unknown) {
      console.error('Error checking metrics:', error);
    }
  }

  /**
   * Calculate metric value
   */
  private calculateMetricValue(metric: RealTimeMetric, dataPoint: DataPoint): number {
    // Simple calculation logic - in real implementation, this would be more sophisticated
    const { aggregation, calculation } = metric;
    
    if (calculation.includes('AVG')) {
      return dataPoint.data[Object.keys(dataPoint.data)[0]] || 0;
    } else if (calculation.includes('COUNT')) {
      return 1;
    } else if (calculation.includes('SUM')) {
      return dataPoint.data[Object.keys(dataPoint.data)[0]] || 0;
    } else {
      // Default to first data value
      return dataPoint.data[Object.keys(dataPoint.data)[0]] || 0;
    }
  }

  /**
   * Generate alert
   */
  private async generateAlert(metric: RealTimeMetric, value: number): Promise<void> {
    try {
      const alert: RealTimeAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        metricId: metric.id,
        metricName: metric.name,
        severity: metric.status === 'critical' ? 'critical' : 'warning',
        message: `${metric.name} is ${metric.status} (${value} ${metric.unit})`,
        condition: `${metric.name} ${metric.status === 'critical' ? '<=' : '<='} ${metric.status === 'critical' ? metric.thresholds.critical : metric.thresholds.warning}`,
        currentValue: value,
        threshold: metric.status === 'critical' ? metric.thresholds.critical : metric.thresholds.warning,
        timestamp: new Date(),
        acknowledged: false,
        resolved: false,
        metadata: {
          metricCategory: metric.category,
          metricUnit: metric.unit
        }
      };

      const metricAlerts = this.alerts.get(metric.id) || [];
      metricAlerts.push(alert);
      this.alerts.set(metric.id, metricAlerts);

      // Emit alert event
      this.emit('alert_generated', alert);

      console.log(`🚨 Generated alert: ${alert.message}`);

    } catch (error) {
      console.error('Error generating alert:', error);
    }
  }

  /**
   * Get alerts
   */
  async getAlerts(filters: {
    metricId?: string;
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
  } = {}): Promise<RealTimeAlert[]> {
    try {
      let allAlerts: RealTimeAlert[] = [];
      
      // Collect all alerts from all metrics
      for (const metricAlerts of this.alerts.values()) {
        allAlerts.push(...metricAlerts);
      }

      // Apply filters
      if (filters.metricId) {
        allAlerts = allAlerts.filter(a => a.metricId === filters.metricId);
      }
      if (filters.severity) {
        allAlerts = allAlerts.filter(a => a.severity === filters.severity);
      }
      if (filters.acknowledged !== undefined) {
        allAlerts = allAlerts.filter(a => a.acknowledged === filters.acknowledged);
      }
      if (filters.resolved !== undefined) {
        allAlerts = allAlerts.filter(a => a.resolved === filters.resolved);
      }

      // Sort by timestamp (newest first)
      allAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return allAlerts;

    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<RealTimeAlert | null> {
    try {
      // Find alert in all metrics
      for (const [metricId, metricAlerts] of this.alerts.entries()) {
        const alert = metricAlerts.find(a => a.id === alertId);
        if (alert) {
          alert.acknowledged = true;
          alert.acknowledgedBy = userId;
          alert.acknowledgedAt = new Date();
          
          this.alerts.set(metricId, metricAlerts);
          this.emit('alert_acknowledged', alert);
          
          console.log(`✅ Alert acknowledged: ${alert.message}`);
          return alert;
        }
      }

      return null;

    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return null;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<RealTimeAlert | null> {
    try {
      // Find alert in all metrics
      for (const [metricId, metricAlerts] of this.alerts.entries()) {
        const alert = metricAlerts.find(a => a.id === alertId);
        if (alert) {
          alert.resolved = true;
          alert.resolvedAt = new Date();
          
          this.alerts.set(metricId, metricAlerts);
          this.emit('alert_resolved', alert);
          
          console.log(`✅ Alert resolved: ${alert.message}`);
          return alert;
        }
      }

      return null;

    } catch (error) {
      console.error('Error resolving alert:', error);
      return null;
    }
  }
}
