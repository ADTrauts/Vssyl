import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="text-6xl text-gray-400 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-500 mt-2">{description}</p>
    </div>
  );
}; 