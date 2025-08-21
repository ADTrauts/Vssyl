import React from 'react';

// Dashboard Skeleton Component
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Title */}
          <div className="mb-6">
            <div className="w-48 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
            <div className="w-32 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>

          {/* Widget Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-24 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <div className="w-full h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="w-3/4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="w-1/2 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat Skeleton Component
export const ChatSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar Skeleton */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4">
          <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 rounded">
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="flex-1">
                  <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
                  <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area Skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            <div className="w-32 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-xs ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-blue-500'} rounded-lg p-3`}>
                <div className="w-48 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                <div className="w-32 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mt-2"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Skeleton */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Drive Skeleton Component
export const DriveSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-24 h-6 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          </div>

          {/* File Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded mx-auto mb-3 animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Generic Loading Component
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}; 