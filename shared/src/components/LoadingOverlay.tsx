import React from 'react';

type LoadingOverlayProps = {
  message: string;
  progress?: number;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, progress }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-v-surface rounded-v-modal shadow-v-modal p-v-6 w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-v-primary mb-v-4" />
          <p className="text-v-text-secondary mb-v-2">{message}</p>
          {progress !== undefined && (
            <div className="w-full bg-v-surface-muted rounded-full h-2 mb-v-2">
              <div
                className="bg-v-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {progress !== undefined && (
            <p className="text-sm text-v-text-muted">{Math.round(progress)}%</p>
          )}
        </div>
      </div>
    </div>
  );
};
