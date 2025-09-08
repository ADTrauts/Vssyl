import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

export interface BusinessMetric {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'customer' | 'product' | 'marketing' | 'sales';
  type: 'count' | 'sum' | 'average' | 'percentage' | 'ratio' | 'custom';
  calculation: string;
  unit: string;
  target: number;
  current: number;
  previous: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
  status: 'on_track' | 'at_risk' | 'off_track' | 'exceeded';
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastUpdated: Date;
  metadata: Record<string, unknown>;
}

export interface KPIDashboard {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'departmental' | 'project';
  metrics: string[]; // Metric IDs
  layout: DashboardLayout;
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
  cellSize: { width: number; height: number; };
}

export interface ChartWidget {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'gauge' | 'funnel';
  position: { x: number; y: number; width: number; height: number; };
  dataSource: string;
  config: {
    title: string;
    xAxis?: string;
    yAxis?: string;
    series?: string[];
    colors?: string[];
    options?: Record<string, unknown>;
  };
  data?: Record<string, unknown>;
  lastUpdate: Date;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'executive' | 'operational' | 'analytical' | 'custom';
  sections: ReportSection[];
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand';
    cronExpression?: string;
    timezone: string;
    recipients: string[];
    deliveryMethod: 'email' | 'slack' | 'webhook' | 'download';
  };
  status: 'active' | 'inactive' | 'draft';
  metadata: {
    owner: string;
    team: string;
    version: string;
    lastGenerated?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'text' | 'chart' | 'table' | 'metric' | 'image';
  content: string | Record<string, unknown>;
  order: number;
  config?: Record<string, unknown>;
}

export interface DataQuery {
  id: string;
  name: string;
  description: string;
  type: 'sql' | 'mongodb' | 'elasticsearch' | 'api' | 'custom';
  query: string;
  parameters: Record<string, unknown>;
  dataSource: string;
  cacheDuration: number; // seconds
  lastExecuted?: Date;
  executionTime?: number; // milliseconds
  resultCount?: number;
  metadata: {
    owner: string;
    team: string;
    tags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'recommendation';
  category: 'business' | 'operational' | 'strategic' | 'tactical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  data: {
    source: string;
    metrics: string[];
    timeRange: { start: Date; end: Date };
    values: Record<string, any>;
  };
  insights: string[];
  recommendations: string[];
  actions: string[];
  impact: {
    financial?: number;
    operational?: string;
    customer?: string;
    strategic?: string;
  };
  metadata: {
    generatedBy: string;
    modelId?: string;
    tags: string[];
  };
  createdAt: Date;
  expiresAt?: Date;
}

export class BusinessIntelligenceEngine extends EventEmitter {
  private prisma: PrismaClient;
  private metrics: Map<string, BusinessMetric> = new Map();
  private kpiDashboards: Map<string, KPIDashboard> = new Map();
  private reportTemplates: Map<string, ReportTemplate> = new Map();
  private dataQueries: Map<string, DataQuery> = new Map();
  private insights: Map<string, BusinessInsight[]> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.initializeMockData();
  }

  private async initializeMockData(): Promise<void> {
    try {
      // Create mock business metrics
      const mockMetrics: BusinessMetric[] = [
        {
          id: 'metric_1',
          name: 'Monthly Recurring Revenue (MRR)',
          description: 'Total monthly recurring revenue from all subscriptions',
          category: 'financial',
          type: 'sum',
          calculation: 'SUM(subscription_amount)',
          unit: 'USD',
          target: 100000,
          current: 95000,
          previous: 92000,
          trend: 'increasing',
          status: 'on_track',
          frequency: 'monthly',
          lastUpdated: new Date(),
          metadata: { currency: 'USD', growthRate: 0.032 }
        },
        {
          id: 'metric_2',
          name: 'Customer Acquisition Cost (CAC)',
          description: 'Average cost to acquire a new customer',
          category: 'marketing',
          type: 'average',
          calculation: 'AVG(acquisition_cost)',
          unit: 'USD',
          target: 150,
          current: 145,
          previous: 160,
          trend: 'decreasing',
          status: 'exceeded',
          frequency: 'monthly',
          lastUpdated: new Date(),
          metadata: { improvement: 0.094, industryBenchmark: 200 }
        },
        {
          id: 'metric_3',
          name: 'Customer Satisfaction Score (CSAT)',
          description: 'Average customer satisfaction rating',
          category: 'customer',
          type: 'average',
          calculation: 'AVG(satisfaction_score)',
          unit: 'score',
          target: 4.5,
          current: 4.6,
          previous: 4.4,
          trend: 'increasing',
          status: 'exceeded',
          frequency: 'weekly',
          lastUpdated: new Date(),
          metadata: { scale: '1-5', responseRate: 0.78 }
        },
        {
          id: 'metric_4',
          name: 'System Uptime',
          description: 'Percentage of time system is operational',
          category: 'operational',
          type: 'percentage',
          calculation: 'uptime_hours / total_hours * 100',
          unit: 'percentage',
          target: 99.9,
          current: 99.95,
          previous: 99.92,
          trend: 'increasing',
          status: 'exceeded',
          frequency: 'daily',
          lastUpdated: new Date(),
          metadata: { sla: '99.9%', downtime: '0.05%' }
        }
      ];

      mockMetrics.forEach(metric => {
        this.metrics.set(metric.id, metric);
      });

      // Create mock KPI dashboards
      const mockDashboards: KPIDashboard[] = [
        {
          id: 'dashboard_1',
          name: 'Executive Overview',
          description: 'High-level business metrics for executive team',
          category: 'executive',
          metrics: ['metric_1', 'metric_2', 'metric_3', 'metric_4'],
          layout: {
            type: 'grid',
            columns: 2,
            rows: 2,
            cellSize: { width: 400, height: 300 }
          },
          refreshInterval: 300,
          status: 'active',
          access: {
            roles: ['executive', 'admin'],
            users: [],
            public: false
          },
          metadata: {
            owner: 'Executive Team',
            team: 'Leadership',
            tags: ['executive', 'overview', 'kpi'],
            lastModified: new Date()
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDashboards.forEach(dashboard => {
        this.kpiDashboards.set(dashboard.id, dashboard);
      });

      // Create mock report templates
      const mockReports: ReportTemplate[] = [
        {
          id: 'report_1',
          name: 'Monthly Business Review',
          description: 'Comprehensive monthly business performance review',
          type: 'executive',
          sections: [
            {
              id: 'section_1',
              name: 'Executive Summary',
              type: 'text',
              content: 'Monthly business performance overview with key highlights and challenges.',
              order: 1
            },
            {
              id: 'section_2',
              name: 'Financial Performance',
              type: 'chart',
              content: { chartType: 'line', dataSource: 'financial_metrics' },
              order: 2,
              config: { title: 'Revenue Trends' }
            },
            {
              id: 'section_3',
              name: 'Key Metrics',
              type: 'table',
              content: { dataSource: 'kpi_summary' },
              order: 3
            }
          ],
          schedule: {
            frequency: 'monthly',
            cronExpression: '0 9 1 * *',
            timezone: 'UTC',
            recipients: ['executives@company.com'],
            deliveryMethod: 'email'
          },
          status: 'active',
          metadata: {
            owner: 'Analytics Team',
            team: 'Business Intelligence',
            version: '1.0.0'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockReports.forEach(report => {
        this.reportTemplates.set(report.id, report);
      });

      // Create mock business insights
      const mockInsights: BusinessInsight[] = [
        {
          id: 'insight_1',
          title: 'MRR Growth Acceleration',
          description: 'Monthly recurring revenue is growing faster than expected',
          type: 'opportunity',
          category: 'business',
          priority: 'high',
          confidence: 0.92,
          data: {
            source: 'financial_system',
            metrics: ['metric_1'],
            timeRange: {
              start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              end: new Date()
            },
            values: {
              current: 95000,
              previous: 92000,
              growth: 0.032
            }
          },
          insights: [
            'MRR growth rate increased from 2.8% to 3.2% month-over-month',
            'New customer acquisition is driving 70% of growth',
            'Expansion revenue from existing customers contributes 30%'
          ],
          recommendations: [
            'Increase investment in customer acquisition channels',
            'Focus on customer success to drive expansion revenue',
            'Consider pricing optimization for new products'
          ],
          actions: [
            'Allocate additional budget to top-performing marketing channels',
            'Implement customer success program for enterprise customers',
            'Conduct pricing analysis for new product lines'
          ],
          impact: {
            financial: 5000,
            operational: 'Improved cash flow and predictability',
            customer: 'Better service delivery capacity',
            strategic: 'Stronger market position'
          },
          metadata: {
            generatedBy: 'business_intelligence_engine',
            tags: ['revenue', 'growth', 'opportunity']
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];

      // Group insights by category
      mockInsights.forEach(insight => {
        const category = insight.category;
        if (!this.insights.has(category)) {
          this.insights.set(category, []);
        }
        this.insights.get(category)!.push(insight);
      });

      console.log(`✅ Initialized ${mockMetrics.length} business metrics, ${mockDashboards.length} KPI dashboards, ${mockReports.length} report templates, and ${mockInsights.length} insight categories`);

    } catch (error) {
      console.error('Error initializing business intelligence data:', error);
    }
  }

  async getBusinessMetrics(filters: {
    category?: string;
    type?: string;
    status?: string;
    team?: string;
  } = {}): Promise<BusinessMetric[]> {
    try {
      let metrics = Array.from(this.metrics.values());

      if (filters.category) {
        metrics = metrics.filter(m => m.category === filters.category);
      }
      if (filters.type) {
        metrics = metrics.filter(m => m.type === filters.type);
      }
      if (filters.status) {
        metrics = metrics.filter(m => m.status === filters.status);
      }
      if (filters.team) {
        metrics = metrics.filter(m => m.metadata.team === filters.team);
      }

      metrics.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
      return metrics;

    } catch (error) {
      console.error('Error getting business metrics:', error);
      return [];
    }
  }

  async createBusinessMetric(metricData: Omit<BusinessMetric, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessMetric> {
    try {
      const metric: BusinessMetric = {
        ...metricData,
        id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastUpdated: new Date()
      };

      this.metrics.set(metric.id, metric);
      this.emit('metric_created', metric);
      console.log(`✅ Created business metric: ${metric.name}`);
      return metric;

    } catch (error) {
      console.error('Error creating business metric:', error);
      throw error;
    }
  }

  async getKPIDashboards(filters: {
    category?: string;
    status?: string;
    team?: string;
    public?: boolean;
  } = {}): Promise<KPIDashboard[]> {
    try {
      let dashboards = Array.from(this.kpiDashboards.values());

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

      dashboards.sort((a, b) => b.metadata.lastModified.getTime() - a.metadata.lastModified.getTime());
      return dashboards;

    } catch (error) {
      console.error('Error getting KPI dashboards:', error);
      return [];
    }
  }

  async getBusinessInsights(filters: {
    type?: string;
    category?: string;
    priority?: string;
    team?: string;
    limit?: number;
  } = {}): Promise<BusinessInsight[]> {
    try {
      let allInsights: BusinessInsight[] = [];
      
      for (const categoryInsights of this.insights.values()) {
        allInsights.push(...categoryInsights);
      }

      if (filters.type) {
        allInsights = allInsights.filter(i => i.type === filters.type);
      }
      if (filters.category) {
        allInsights = allInsights.filter(i => i.category === filters.category);
      }
      if (filters.priority) {
        allInsights = allInsights.filter(i => i.priority === filters.priority);
      }
      if (filters.team) {
        allInsights = allInsights.filter(i => i.metadata.generatedBy.includes(filters.team!));
      }

      allInsights = allInsights.filter(i => !i.expiresAt || i.expiresAt > new Date());
      allInsights.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (filters.limit) {
        allInsights = allInsights.slice(0, filters.limit);
      }

      return allInsights;

    } catch (error) {
      console.error('Error getting business insights:', error);
      return [];
    }
  }

  async generateReport(templateId: string, parameters: Record<string, unknown> = {}): Promise<{
    reportId: string;
    template: ReportTemplate;
    generatedAt: Date;
    sections: ReportSection[];
  }> {
    try {
      const template = this.reportTemplates.get(templateId);
      if (!template) {
        throw new Error(`Report template ${templateId} not found`);
      }

      // Mock report generation
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const generatedAt = new Date();
      
      // Update template metadata
      template.metadata.lastGenerated = generatedAt;
      this.reportTemplates.set(templateId, template);

      console.log(`📊 Generated report: ${template.name}`);
      
      return {
        reportId,
        template,
        generatedAt,
        sections: template.sections.map(section => ({
          ...section,
          generatedContent: `Generated content for ${section.name}`
        }))
      };

    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }
}
