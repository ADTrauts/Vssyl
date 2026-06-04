import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-v-12 bg-v-surface-muted rounded-v-card border-2 border-dashed border-v-border">
      <div className="text-6xl text-v-text-muted mb-v-4">{icon}</div>
      <h3 className="text-xl font-semibold text-v-text-primary">{title}</h3>
      <p className="text-v-text-muted mt-v-2">{description}</p>
    </div>
  );
};
