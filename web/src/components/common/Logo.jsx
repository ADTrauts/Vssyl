'use client';

export default function Logo({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {/* Lock body */}
      <div className="absolute inset-0 bg-blue-600 rounded-lg transform rotate-45">
        {/* Blocks */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-blue-700 rounded-tl-lg"></div>
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-700 rounded-tr-lg"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-blue-700 rounded-bl-lg"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-700 rounded-br-lg"></div>
        
        {/* Lock shackle */}
        <div className="absolute -top-1/4 left-1/4 w-1/2 h-1/4 bg-blue-500 rounded-t-full"></div>
      </div>
    </div>
  );
} 