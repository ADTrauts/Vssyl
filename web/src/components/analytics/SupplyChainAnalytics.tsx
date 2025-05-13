import React from 'react';
import styles from './SupplyChainAnalytics.module.css';

interface SupplyChainMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface InventoryStatus {
  item: string;
  quantity: number;
  reorderPoint: number;
  leadTime: number;
  status: 'optimal' | 'low' | 'overstocked';
  metrics: {
    name: string;
    value: number;
  }[];
}

interface LogisticsPerformance {
  route: string;
  deliveryTime: number;
  cost: number;
  reliability: number;
  status: 'on-time' | 'delayed' | 'at-risk';
  metrics: {
    name: string;
    value: number;
  }[];
}

interface SupplierPerformance {
  supplier: string;
  score: number;
  status: 'excellent' | 'good' | 'needs-improvement';
  metrics: {
    name: string;
    value: number;
    target: number;
  }[];
}

interface SupplyChainAnalyticsProps {
  metrics: SupplyChainMetric[];
  inventory: InventoryStatus[];
  logistics: LogisticsPerformance[];
  suppliers: SupplierPerformance[];
}

const SupplyChainAnalytics: React.FC<SupplyChainAnalyticsProps> = ({
  metrics,
  inventory,
  logistics,
  suppliers,
}) => {
  return (
    <div className={styles.supplyChainAnalytics}>
      <h2>Supply Chain Analytics</h2>
      
      {/* Summary Metrics */}
      <div className={styles.summaryMetrics}>
        {metrics.map((metric) => (
          <div key={metric.id} className={styles.metricCard}>
            <h3>{metric.name}</h3>
            <div className={styles.metricValue}>
              {metric.value.toLocaleString()} {metric.unit}
              <span className={`${styles.change} ${styles[metric.trend]}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Status */}
      <div className={styles.inventoryStatus}>
        <h3>Inventory Status</h3>
        <div className={styles.inventoryGrid}>
          {inventory.map((item) => (
            <div key={item.item} className={`${styles.inventoryCard} ${styles[item.status]}`}>
              <div className={styles.inventoryHeader}>
                <span className={styles.itemName}>{item.item}</span>
                <div className={`${styles.inventoryStatus} ${styles[item.status]}`} />
              </div>
              <div className={styles.inventoryDetails}>
                <div className={styles.quantity}>
                  Quantity: {item.quantity.toLocaleString()}
                </div>
                <div className={styles.reorderPoint}>
                  Reorder Point: {item.reorderPoint.toLocaleString()}
                </div>
                <div className={styles.leadTime}>
                  Lead Time: {item.leadTime} days
                </div>
                <div className={styles.metrics}>
                  {item.metrics.map((metric, index) => (
                    <div key={index} className={styles.metricItem}>
                      <span>{metric.name}</span>
                      <span>{metric.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logistics Performance */}
      <div className={styles.logisticsPerformance}>
        <h3>Logistics Performance</h3>
        <div className={styles.logisticsGrid}>
          {logistics.map((route) => (
            <div key={route.route} className={`${styles.logisticsCard} ${styles[route.status]}`}>
              <div className={styles.logisticsHeader}>
                <span className={styles.routeName}>{route.route}</span>
                <div className={`${styles.deliveryStatus} ${styles[route.status]}`} />
              </div>
              <div className={styles.logisticsDetails}>
                <div className={styles.deliveryTime}>
                  Delivery Time: {route.deliveryTime} hours
                </div>
                <div className={styles.cost}>
                  Cost: ${route.cost.toLocaleString()}
                </div>
                <div className={styles.reliability}>
                  Reliability: {route.reliability}%
                </div>
                <div className={styles.metrics}>
                  {route.metrics.map((metric, index) => (
                    <div key={index} className={styles.metricItem}>
                      <span>{metric.name}</span>
                      <span>{metric.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Supplier Performance */}
      <div className={styles.supplierPerformance}>
        <h3>Supplier Performance</h3>
        <div className={styles.suppliersGrid}>
          {suppliers.map((supplier) => (
            <div key={supplier.supplier} className={`${styles.supplierCard} ${styles[supplier.status]}`}>
              <div className={styles.supplierHeader}>
                <span className={styles.supplierName}>{supplier.supplier}</span>
                <div className={`${styles.performanceStatus} ${styles[supplier.status]}`} />
              </div>
              <div className={styles.supplierDetails}>
                <div className={styles.score}>
                  Score: {supplier.score}/100
                </div>
                <div className={styles.metrics}>
                  {supplier.metrics.map((metric, index) => (
                    <div key={index} className={styles.metricItem}>
                      <span>{metric.name}</span>
                      <span>
                        {metric.value.toLocaleString()} / {metric.target.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupplyChainAnalytics; 