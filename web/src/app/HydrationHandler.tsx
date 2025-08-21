'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface HydrationContextType {
  isHydrated: boolean;
}

const HydrationContext = createContext<HydrationContextType>({ isHydrated: false });

export const useHydration = () => useContext(HydrationContext);

export default function HydrationHandler({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window !== 'undefined') {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    // Remove any data-cjcrx attributes that might have been added by extensions
    if (typeof window !== 'undefined') {
      const body = document.body;
      if (body.hasAttribute('data-cjcrx')) {
        body.removeAttribute('data-cjcrx');
      }
    }
  }, []);

  // Always render the context provider to maintain hook consistency
  return (
    <HydrationContext.Provider value={{ isHydrated }}>
      {!isHydrated ? (
        // Enhanced loading screen during hydration
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Block on Block</h2>
            <p className="text-gray-600 dark:text-gray-400">Loading your workspace...</p>
            <div className="mt-4 flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </HydrationContext.Provider>
  );
} 