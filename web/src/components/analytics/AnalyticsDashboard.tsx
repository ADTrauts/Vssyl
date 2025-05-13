import React, { useState, useEffect } from 'react';
import styles from './AnalyticsDashboard.module.css';
import ComplianceAnalytics from './ComplianceAnalytics';
import RiskAnalytics from './RiskAnalytics';
import InnovationAnalytics from './InnovationAnalytics';
import CustomerAnalytics from './CustomerAnalytics';
import FinancialAnalytics from './FinancialAnalytics';
import OperationalAnalytics from './OperationalAnalytics';
import SupplyChainAnalytics from './SupplyChainAnalytics';
import VisualizationCard from './VisualizationCard';
import useAnalyticsWebSocket from '../../hooks/useAnalyticsWebSocket';

type AnalyticsSection = 
  | 'compliance'
  | 'risk'
  | 'innovation'
  | 'customer'
  | 'financial'
  | 'operational'
  | 'supply-chain';

interface TimeRange {
  label: string;
  value: string;
}

const timeRanges: TimeRange[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
];

// Mock data for demonstration
const mockData = {
  compliance: {
    metrics: [
      { id: '1', name: 'Policy Compliance', value: 95, unit: '%', change: 2, trend: 'improving' },
      { id: '2', name: 'Audit Score', value: 88, unit: '%', change: -1, trend: 'declining' }
    ],
    policies: [
      { id: '1', name: 'Data Protection', status: 'compliant', lastReview: '2024-03-01' },
      { id: '2', name: 'Security Standards', status: 'pending', lastReview: '2024-02-15' }
    ],
    audits: [
      { id: '1', name: 'Q1 Security Audit', status: 'completed', score: 92 },
      { id: '2', name: 'Compliance Review', status: 'in-progress', score: 85 }
    ],
    regulations: [
      { id: '1', name: 'GDPR', status: 'compliant', nextReview: '2024-06-01' },
      { id: '2', name: 'HIPAA', status: 'compliant', nextReview: '2024-05-15' }
    ]
  },
  risk: {
    metrics: [
      { id: '1', name: 'Risk Score', value: 65, unit: '%', change: -5, trend: 'improving' },
      { id: '2', name: 'Threat Level', value: 'Medium', change: 0, trend: 'stable' }
    ],
    threats: [
      { id: '1', name: 'Data Breach', severity: 'high', status: 'mitigated' },
      { id: '2', name: 'System Outage', severity: 'medium', status: 'monitoring' }
    ],
    scores: [
      { id: '1', category: 'Security', score: 85, status: 'good' },
      { id: '2', category: 'Operations', score: 70, status: 'warning' }
    ],
    strategies: [
      { id: '1', name: 'Enhanced Monitoring', effectiveness: 90, status: 'implemented' },
      { id: '2', name: 'Backup Systems', effectiveness: 85, status: 'in-progress' }
    ]
  },
  innovation: {
    metrics: [
      { id: '1', name: 'R&D Investment', value: 2500000, unit: '$', change: 15, trend: 'improving' },
      { id: '2', name: 'Patents Filed', value: 12, unit: '', change: 3, trend: 'improving' }
    ],
    projects: [
      { id: '1', name: 'AI Integration', status: 'active', progress: 75 },
      { id: '2', name: 'Cloud Migration', status: 'completed', progress: 100 }
    ],
    initiatives: [
      { id: '1', name: 'Digital Transformation', phase: 'implementation', priority: 'high' },
      { id: '2', name: 'Product Innovation', phase: 'planning', priority: 'medium' }
    ],
    scores: [
      { id: '1', category: 'Innovation', score: 85, status: 'good' },
      { id: '2', category: 'Research', score: 78, status: 'good' }
    ]
  },
  customer: {
    metrics: [
      { id: '1', name: 'Customer Satisfaction', value: 92, unit: '%', change: 3, trend: 'improving' },
      { id: '2', name: 'Net Promoter Score', value: 75, unit: '', change: 5, trend: 'improving' }
    ],
    segments: [
      { id: '1', name: 'Enterprise', size: 150, growth: 12 },
      { id: '2', name: 'SMB', size: 500, growth: 25 }
    ],
    satisfaction: [
      { id: '1', category: 'Product', score: 90, status: 'excellent' },
      { id: '2', category: 'Support', score: 85, status: 'good' }
    ],
    engagement: [
      { id: '1', channel: 'Web', rate: 65, conversion: 12 },
      { id: '2', channel: 'Mobile', rate: 75, conversion: 15 }
    ]
  },
  financial: {
    metrics: [
      { id: '1', name: 'Revenue', value: 15000000, unit: '$', change: 8, trend: 'improving' },
      { id: '2', name: 'Profit Margin', value: 25, unit: '%', change: 2, trend: 'improving' }
    ],
    revenue: [
      { id: '1', source: 'Product Sales', amount: 10000000, growth: 10 },
      { id: '2', source: 'Services', amount: 5000000, growth: 15 }
    ],
    costs: [
      { id: '1', category: 'Operations', amount: 5000000, budget: 5500000 },
      { id: '2', category: 'Marketing', amount: 2000000, budget: 2500000 }
    ],
    health: [
      { id: '1', metric: 'Cash Flow', value: 85, target: 90, status: 'good' },
      { id: '2', metric: 'Debt Ratio', value: 0.4, target: 0.5, status: 'good' }
    ]
  },
  operational: {
    metrics: [
      { id: '1', name: 'Efficiency', value: 88, unit: '%', change: 4, trend: 'improving' },
      { id: '2', name: 'Productivity', value: 92, unit: '%', change: 2, trend: 'improving' }
    ],
    processes: [
      { id: '1', name: 'Order Fulfillment', efficiency: 90, throughput: 1000 },
      { id: '2', name: 'Customer Support', efficiency: 85, throughput: 500 }
    ],
    resources: [
      { id: '1', name: 'Production Line', utilization: 85, capacity: 100 },
      { id: '2', name: 'Warehouse', utilization: 75, capacity: 100 }
    ],
    health: [
      { id: '1', category: 'Operations', score: 88, status: 'good' },
      { id: '2', category: 'Resources', score: 82, status: 'good' }
    ]
  },
  supplyChain: {
    metrics: [
      { id: '1', name: 'Inventory Turnover', value: 12, unit: 'x', change: 1, trend: 'improving' },
      { id: '2', name: 'Order Fulfillment', value: 95, unit: '%', change: 2, trend: 'improving' }
    ],
    inventory: [
      { id: '1', item: 'Raw Materials', quantity: 5000, reorderPoint: 2000, leadTime: 7 },
      { id: '2', item: 'Finished Goods', quantity: 2000, reorderPoint: 1000, leadTime: 3 }
    ],
    logistics: [
      { id: '1', route: 'North Region', deliveryTime: 48, cost: 5000, reliability: 98 },
      { id: '2', route: 'South Region', deliveryTime: 72, cost: 7500, reliability: 95 }
    ],
    suppliers: [
      { id: '1', supplier: 'Supplier A', score: 95, status: 'excellent' },
      { id: '2', supplier: 'Supplier B', score: 85, status: 'good' }
    ]
  }
};

const AnalyticsDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AnalyticsSection>('compliance');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('month');

  const { isConnected, sendMessage } = useAnalyticsWebSocket({
    url: 'wss://your-analytics-websocket-server',
    onMessage: (message) => {
      // Handle incoming real-time data updates
      console.log('Received real-time update:', message);
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: (event) => {
      console.log('WebSocket closed:', event);
    },
  });

  useEffect(() => {
    // Subscribe to analytics data for the selected section and time range
    if (isConnected) {
      sendMessage({
        type: 'subscribe',
        section: activeSection,
        timeRange: selectedTimeRange,
      });
    }
  }, [isConnected, activeSection, selectedTimeRange, sendMessage]);

  const sections: { id: AnalyticsSection; label: string }[] = [
    { id: 'compliance', label: 'Compliance' },
    { id: 'risk', label: 'Risk' },
    { id: 'innovation', label: 'Innovation' },
    { id: 'customer', label: 'Customer' },
    { id: 'financial', label: 'Financial' },
    { id: 'operational', label: 'Operational' },
    { id: 'supply-chain', label: 'Supply Chain' },
  ];

  const renderAnalyticsSection = () => {
    switch (activeSection) {
      case 'compliance':
        return <ComplianceAnalytics {...mockData.compliance} />;
      case 'risk':
        return <RiskAnalytics {...mockData.risk} />;
      case 'innovation':
        return <InnovationAnalytics {...mockData.innovation} />;
      case 'customer':
        return <CustomerAnalytics {...mockData.customer} />;
      case 'financial':
        return <FinancialAnalytics {...mockData.financial} />;
      case 'operational':
        return <OperationalAnalytics {...mockData.operational} />;
      case 'supply-chain':
        return <SupplyChainAnalytics {...mockData.supplyChain} />;
      default:
        return null;
    }
  };

  const renderOverviewMetrics = () => {
    // Example overview metrics visualization
    const metricsData = [
      { label: 'Jan', value: 65 },
      { label: 'Feb', value: 75 },
      { label: 'Mar', value: 85 },
      { label: 'Apr', value: 80 },
      { label: 'May', value: 90 },
      { label: 'Jun', value: 95 },
    ];

    return (
      <div className={styles.overviewMetrics}>
        <VisualizationCard
          title="Performance Overview"
          type="line"
          data={metricsData}
          height={200}
          showLegend={false}
        />
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Analytics Dashboard</h1>
          <div className={styles.connectionStatus}>
            <span className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`} />
            <span className={styles.statusText}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className={styles.dateRange}>
          <select
            className={styles.dateSelect}
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <nav className={styles.navigation}>
        {sections.map((section) => (
          <button
            key={section.id}
            className={`${styles.navButton} ${activeSection === section.id ? styles.active : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <main className={styles.content}>
        {renderOverviewMetrics()}
        {renderAnalyticsSection()}
      </main>
    </div>
  );
};

export default AnalyticsDashboard; 