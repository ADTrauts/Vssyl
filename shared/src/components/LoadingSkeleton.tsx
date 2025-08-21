import React from 'react';

interface LoadingSkeletonProps {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ width = '100%', height = 16, style, className }) => (
  <div
    className={className}
    style={{
      width, height,
      background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)',
      backgroundSize: '200% 100%',
      borderRadius: 4,
      animation: 'skeleton-loading 1.2s ease-in-out infinite',
      ...style
    }}
  />
);

export default LoadingSkeleton;

// Add this to your global CSS:
// @keyframes skeleton-loading {
//   0% { background-position: 200% 0; }
//   100% { background-position: -200% 0; }
// } 