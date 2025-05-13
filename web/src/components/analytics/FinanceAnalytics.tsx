import React from 'react';
import styles from './FinanceAnalytics.module.css';

interface FinanceMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  revenueTrends: {
    date: string;
    amount: number;
  }[];
  expenseCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  topRevenueSources: {
    source: string;
    amount: number;
    percentage: number;
  }[];
  financialHealth: {
    metric: string;
    value: number;
    target: number;
    status: 'good' | 'warning' | 'critical';
  }[];
  recentTransactions: {
    date: string;
    description: string;
    amount: number;
    type: 'revenue' | 'expense';
    category: string;
  }[];
}

interface FinanceAnalyticsProps {
  metrics: FinanceMetrics;
}

const FinanceAnalytics: React.FC<FinanceAnalyticsProps> = ({ metrics }) => {
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
      case 'good':
        return '#4caf50';
      case 'warning':
        return '#ff9800';
      case 'critical':
        return '#f44336';
      default:
        return '#666';
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'revenue' ? '#4caf50' : '#f44336';
  };

  return (
    <div className={styles.financeAnalytics}>
      <h2>Financial Analytics</h2>
      
      <div className={styles.summaryMetrics}>
        <div className={styles.metricCard}>
          <h3>Total Revenue</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.totalRevenue)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Total Expenses</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.totalExpenses)}</div>
        </div>
        <div className={styles.metricCard}>
          <h3>Net Income</h3>
          <div className={styles.metricValue}>{formatCurrency(metrics.netIncome)}</div>
        </div>
      </div>

      <div className={styles.revenueTrends}>
        <h3>Revenue Trends</h3>
        <div className={styles.trendsChart}>
          {metrics.revenueTrends.map((trend, index) => (
            <div key={index} className={styles.trendBar}>
              <div 
                className={styles.barFill}
                style={{ height: `${(trend.amount / metrics.totalRevenue) * 150}px` }}
              />
              <span className={styles.trendDate}>{trend.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.expenseCategories}>
        <h3>Expense Categories</h3>
        <div className={styles.categoriesGrid}>
          {metrics.expenseCategories.map((category, index) => (
            <div key={index} className={styles.categoryCard}>
              <div className={styles.categoryHeader}>
                <span className={styles.categoryLabel}>{category.category}</span>
                <span className={styles.categoryPercentage}>{category.percentage}%</span>
              </div>
              <div className={styles.categoryAmount}>
                {formatCurrency(category.amount)}
              </div>
              <div className={styles.categoryBar}>
                <div 
                  className={styles.barFill}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.revenueSources}>
        <h3>Top Revenue Sources</h3>
        <div className={styles.sourcesGrid}>
          {metrics.topRevenueSources.map((source, index) => (
            <div key={index} className={styles.sourceCard}>
              <div className={styles.sourceHeader}>
                <span className={styles.sourceLabel}>{source.source}</span>
                <span className={styles.sourcePercentage}>{source.percentage}%</span>
              </div>
              <div className={styles.sourceAmount}>
                {formatCurrency(source.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.financialHealth}>
        <h3>Financial Health</h3>
        <div className={styles.healthGrid}>
          {metrics.financialHealth.map((metric, index) => (
            <div key={index} className={styles.healthCard}>
              <div className={styles.healthHeader}>
                <span className={styles.healthMetric}>{metric.metric}</span>
                <div 
                  className={styles.healthStatus}
                  style={{ backgroundColor: getStatusColor(metric.status) }}
                />
              </div>
              <div className={styles.healthValue}>
                {metric.value.toFixed(1)} / {metric.target.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.recentTransactions}>
        <h3>Recent Transactions</h3>
        <div className={styles.transactionsList}>
          {metrics.recentTransactions.map((transaction, index) => (
            <div key={index} className={styles.transactionItem}>
              <div className={styles.transactionDate}>{transaction.date}</div>
              <div className={styles.transactionDetails}>
                <div className={styles.transactionDescription}>
                  {transaction.description}
                </div>
                <div className={styles.transactionCategory}>
                  {transaction.category}
                </div>
              </div>
              <div 
                className={styles.transactionAmount}
                style={{ color: getTransactionColor(transaction.type) }}
              >
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinanceAnalytics; 