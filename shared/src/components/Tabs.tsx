"use client";

import React, { createContext, useContext, useState } from 'react';

// Types
type Tab = {
  label: string;
  key: string;
};

type TabsContextType = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

type TabsProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};

type TabsListProps = {
  children: React.ReactNode;
  className?: string;
};

type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};

// Context
const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

// Main Tabs component
export const Tabs: React.FC<TabsProps> & {
  List: React.FC<TabsListProps>;
  Trigger: React.FC<TabsTriggerProps>;
  Content: React.FC<TabsContentProps>;
} = ({ defaultValue, value, onValueChange, children, className = '' }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue || '');
  
  const activeTab = value !== undefined ? value : internalActiveTab;
  
  const setActiveTab = (tab: string) => {
    if (value === undefined) {
      setInternalActiveTab(tab);
    }
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

// TabsList component
const TabsList: React.FC<TabsListProps> = ({ children, className = '' }) => {
  return (
    <div className={`flex border-b mb-4 ${className}`}>
      {children}
    </div>
  );
};

// TabsTrigger component
const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className = '' }) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
        isActive 
          ? 'border-blue-600 text-blue-600 font-medium' 
          : 'border-transparent text-gray-600 hover:text-gray-900'
      } ${className}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
};

// TabsContent component
const TabsContent: React.FC<TabsContentProps> = ({ value, children, className = '' }) => {
  const { activeTab } = useTabsContext();
  
  if (activeTab !== value) {
    return null;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Attach sub-components
Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// Named exports for compatibility
export { TabsList, TabsTrigger, TabsContent }; 