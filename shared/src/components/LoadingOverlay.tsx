import React from 'react';

type LoadingOverlayProps = {
  message: string;
  progress?: number;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message, progress }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-700 mb-2">{message}</p>
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {progress !== undefined && (
            <p className="text-sm text-gray-500">{Math.round(progress)}%</p>
          )}
        </div>
      </div>
    </div>
  );
}; 