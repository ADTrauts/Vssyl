import React from 'react';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width = '100%',
  height = 16,
  style,
  className = '',
}) => (
  <div
    className={`v-skeleton ${className}`.trim()}
    style={{ width, height, ...style }}
  />
);

export default LoadingSkeleton;
