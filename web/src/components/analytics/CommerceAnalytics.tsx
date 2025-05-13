import React from 'react';
import styles from './CommerceAnalytics.module.css';

interface CommerceMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  salesTrends: {
    date: string;
    amount: number;
  }[];
  topProducts: {
    name: string;
    sales: number;
    revenue: number;
    unitsSold: number;
  }[];
  customerSegments: {
    segment: string;
    count: number;
    averageOrderValue: number;
    repeatPurchaseRate: number;
  }[];
  salesChannels: {
    channel: string;
    sales: number;
    percentage: number;
    growth: number;
  }[];
  recentOrders: {
    orderId: string;
    date: string;
    customer: string;
    amount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    items: number;
  }[];
}

interface CommerceAnalyticsProps {
  metrics: CommerceMetrics;
}

const CommerceAnalytics: React.FC<CommerceAnalyticsProps> = ({ metrics }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'processing':
        return '#2196f3';
      case 'shipped':
        return '#9c27b0';
      case 'delivered':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const formatGrowth = (growth: number) => {
    return growth > 0 ? `+${growth}%` : `${growth}%`;
  };

  return (
    <div className={styles.commerceAnalytics}>
      <h2>Commerce Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Sales</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.totalSales)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Total Orders</h3>
          <div className={styles.metricValue}>{metrics.totalOrders}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Average Order Value</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.averageOrderValue)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Conversion Rate</h3>
          <div className={styles.metricValue}>{metrics.conversionRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className={styles.salesTrends}>
        <h3>Sales Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.salesTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.amount / metrics.totalSales) * 150}px` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.topProducts}>
        <h3>Top Products</h3>
        <div className={styles.productsGrid}>
          {metrics.topProducts.map((product, index) => (
            <div key={index} className={styles.productCard}>
              <div className={styles.productHeader}>
                <span className={styles.productName}>{product.name}</span>
                <span className={styles.unitsSold}>{product.unitsSold} units</span>
              </div>
              <div className={styles.productMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Revenue</span>
                  <span className={styles.metricValue}>{formatCurrency(product.revenue)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Sales</span>
                  <span className={styles.metricValue}>{product.sales}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.customerSegments}>
        <h3>Customer Segments</h3>
        <div className={styles.segmentsGrid}>
          {metrics.customerSegments.map((segment, index) => (
            <div key={index} className={styles.segmentCard}>
              <div className={styles.segmentHeader}>
                <span className={styles.segmentLabel}>{segment.segment}</span>
                <span className={styles.segmentCount}>{segment.count} customers</span>
              </div>
              <div className={styles.segmentMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Avg. Order Value</span>
                  <span className={styles.metricValue}>{formatCurrency(segment.averageOrderValue)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Repeat Rate</span>
                  <span className={styles.metricValue}>{segment.repeatPurchaseRate}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.salesChannels}>
        <h3>Sales Channels</h3>
        <div className={styles.channelsGrid}>
          {metrics.salesChannels.map((channel, index) => (
            <div key={index} className={styles.channelCard}>
              <div className={styles.channelHeader}>
                <span className={styles.channelLabel}>{channel.channel}</span>
                <span className={`${styles.channelGrowth} ${channel.growth >= 0 ? styles.positive : styles.negative}`}>
                  {formatGrowth(channel.growth)}
                </span>
              </div>
              <div className={styles.channelMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Sales</span>
                  <span className={styles.metricValue}>{formatCurrency(channel.sales)}</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Share</span>
                  <span className={styles.metricValue}>{channel.percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentOrders}>
        <h3>Recent Orders</h3>
        <div className={styles.ordersList}>
          {metrics.recentOrders.map((order, index) => (
            <div key={index} className={styles.orderItem}>
              <div 
                className={styles.orderStatus}
                style={{ backgroundColor: getStatusColor(order.status) }}
              />
              <div className={styles.orderDetails}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderId}>#{order.orderId}</span>
                  <span className={styles.orderDate}>{order.date}</span>
                </div>
                <div className={styles.orderInfo}>
                  <span className={styles.customerName}>{order.customer}</span>
                  <span className={styles.itemsCount}>{order.items} items</span>
                </div>
              </div>
              <div className={styles.orderAmount}>
                {formatCurrency(order.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommerceAnalytics; 