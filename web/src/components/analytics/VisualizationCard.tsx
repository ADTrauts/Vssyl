import React from 'react';
import styles from './VisualizationCard.module.css';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface VisualizationCardProps {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'trend';
  data: DataPoint[];
  height?: number;
  width?: number;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const VisualizationCard: React.FC<VisualizationCardProps> = ({
  title,
  type,
  data,
  height = 300,
  width,
  showLegend = true,
  showTooltip = true,
  className,
}) => {
  const renderVisualization = () => {
    switch (type) {
      case 'line':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      case 'gauge':
        return renderGaugeChart();
      case 'trend':
        return renderTrendChart();
      default:
        return null;
    }
  };

  const renderLineChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;

    return (
      <svg width={width || '100%'} height={height} className={styles.lineChart}>
        <g transform="translate(40, 20)">
          {/* Y-axis */}
          <line x1="0" y1={height - 40} x2="0" y2="0" stroke="#ccc" />
          {/* X-axis */}
          <line x1="0" y1={height - 40} x2={width ? width - 80 : 'calc(100% - 80px)'} y2={height - 40} stroke="#ccc" />
          
          {/* Data line */}
          <path
            d={data.map((point, index) => {
              const x = (index * (width ? width - 80 : 'calc(100% - 80px)')) / (data.length - 1);
              const y = height - 40 - ((point.value - minValue) / range) * (height - 60);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#2196f3"
            strokeWidth="2"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = (index * (width ? width - 80 : 'calc(100% - 80px)')) / (data.length - 1);
            const y = height - 40 - ((point.value - minValue) / range) * (height - 60);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#2196f3"
                className={showTooltip ? styles.tooltipTrigger : ''}
              />
            );
          })}

          {/* Labels */}
          {data.map((point, index) => {
            const x = (index * (width ? width - 80 : 'calc(100% - 80px)')) / (data.length - 1);
            return (
              <text
                key={index}
                x={x}
                y={height - 20}
                textAnchor="middle"
                className={styles.label}
              >
                {point.label}
              </text>
            );
          })}
        </g>
      </svg>
    );
  };

  const renderBarChart = () => {
    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = (width ? width - 80 : 'calc(100% - 80px)') / data.length - 10;

    return (
      <svg width={width || '100%'} height={height} className={styles.barChart}>
        <g transform="translate(40, 20)">
          {/* Y-axis */}
          <line x1="0" y1={height - 40} x2="0" y2="0" stroke="#ccc" />
          {/* X-axis */}
          <line x1="0" y1={height - 40} x2={width ? width - 80 : 'calc(100% - 80px)'} y2={height - 40} stroke="#ccc" />
          
          {/* Bars */}
          {data.map((point, index) => {
            const x = index * (barWidth + 10);
            const barHeight = (point.value / maxValue) * (height - 60);
            return (
              <g key={index}>
                <rect
                  x={x}
                  y={height - 40 - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={point.color || '#2196f3'}
                  className={showTooltip ? styles.tooltipTrigger : ''}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - 20}
                  textAnchor="middle"
                  className={styles.label}
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, point) => sum + point.value, 0);
    let currentAngle = 0;

    return (
      <svg width={width || '100%'} height={height} className={styles.pieChart}>
        <g transform={`translate(${width ? width / 2 : '50%'}, ${height / 2})`}>
          {data.map((point, index) => {
            const percentage = point.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            currentAngle += angle;

            const x1 = Math.cos((startAngle - 90) * Math.PI / 180) * 100;
            const y1 = Math.sin((startAngle - 90) * Math.PI / 180) * 100;
            const x2 = Math.cos((currentAngle - 90) * Math.PI / 180) * 100;
            const y2 = Math.sin((currentAngle - 90) * Math.PI / 180) * 100;

            const largeArcFlag = angle > 180 ? 1 : 0;

            return (
              <g key={index}>
                <path
                  d={`M 0 0 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={point.color || `hsl(${(index * 360) / data.length}, 70%, 50%)`}
                  className={showTooltip ? styles.tooltipTrigger : ''}
                />
                {showLegend && (
                  <text
                    x={Math.cos((startAngle + angle / 2 - 90) * Math.PI / 180) * 120}
                    y={Math.sin((startAngle + angle / 2 - 90) * Math.PI / 180) * 120}
                    textAnchor="middle"
                    className={styles.label}
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  const renderGaugeChart = () => {
    const value = data[0]?.value || 0;
    const maxValue = 100;
    const percentage = (value / maxValue) * 100;
    const angle = (percentage / 100) * 180;

    return (
      <svg width={width || '100%'} height={height} className={styles.gaugeChart}>
        <g transform={`translate(${width ? width / 2 : '50%'}, ${height - 20})`}>
          {/* Background arc */}
          <path
            d="M -100 0 A 100 100 0 0 1 100 0"
            fill="none"
            stroke="#eee"
            strokeWidth="20"
          />
          {/* Value arc */}
          <path
            d={`M -100 0 A 100 100 0 0 1 ${Math.cos((angle - 90) * Math.PI / 180) * 100} ${Math.sin((angle - 90) * Math.PI / 180) * 100}`}
            fill="none"
            stroke="#2196f3"
            strokeWidth="20"
          />
          {/* Value text */}
          <text
            x="0"
            y="-50"
            textAnchor="middle"
            className={styles.gaugeValue}
          >
            {value}%
          </text>
          {/* Label */}
          <text
            x="0"
            y="30"
            textAnchor="middle"
            className={styles.label}
          >
            {data[0]?.label || ''}
          </text>
        </g>
      </svg>
    );
  };

  const renderTrendChart = () => {
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue;
    const trend = values[values.length - 1] - values[0];
    const trendPercentage = (trend / values[0]) * 100;

    return (
      <div className={styles.trendChart}>
        <div className={styles.trendValue}>
          {values[values.length - 1]}
          <span className={`${styles.trendIndicator} ${trend >= 0 ? styles.positive : styles.negative}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trendPercentage).toFixed(1)}%
          </span>
        </div>
        <div className={styles.trendLabel}>{data[data.length - 1].label}</div>
        <svg width={width || '100%'} height={height - 60} className={styles.trendLine}>
          <path
            d={values.map((value, index) => {
              const x = (index * (width ? width : '100%')) / (values.length - 1);
              const y = height - 60 - ((value - minValue) / range) * (height - 80);
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke={trend >= 0 ? '#4caf50' : '#f44336'}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className={`${styles.visualizationCard} ${className || ''}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.visualization}>
        {renderVisualization()}
      </div>
      {showLegend && type !== 'gauge' && type !== 'trend' && (
        <div className={styles.legend}>
          {data.map((point, index) => (
            <div key={index} className={styles.legendItem}>
              <span
                className={styles.legendColor}
                style={{ backgroundColor: point.color || `hsl(${(index * 360) / data.length}, 70%, 50%)` }}
              />
              <span className={styles.legendLabel}>{point.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisualizationCard; 