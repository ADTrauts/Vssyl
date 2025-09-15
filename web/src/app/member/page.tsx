'use client';

import React, { useState } from 'react';
import { UserSearch } from '../../components/member/UserSearch';
import { ConnectionList } from '../../components/member/ConnectionList';
import { PendingRequestsList } from '../../components/member/PendingRequestsList';
import { SentRequestsList } from '../../components/member/SentRequestsList';
import { ConnectionAnalytics } from '../../components/member/ConnectionAnalytics';
import { Card, ToastProvider } from 'shared/components';
import { Users, Search, Clock, BarChart3, Send } from 'lucide-react';

type TabType = 'search' | 'connections' | 'pending' | 'sent' | 'analytics';

export default function MemberManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>('search');

  const tabs = [
    { id: 'search', label: 'Search & Connect', icon: Search },
    { id: 'connections', label: 'Connections', icon: Users },
    { id: 'pending', label: 'Pending Requests', icon: Clock },
    { id: 'sent', label: 'Sent Requests', icon: Send },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Search & Connect</h2>
            <UserSearch 
              onConnectionRequest={() => {
                // Connection request sent
              }}
            />
          </Card>
        );
      case 'connections':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Your Connections</h2>
            <ConnectionList />
          </Card>
        );
      case 'pending':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
            <p className="text-gray-600 mb-4">Connection requests sent to you</p>
            <PendingRequestsList 
              onRequestUpdated={() => {
                // Request updated
              }}
            />
          </Card>
        );
      case 'sent':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Sent Requests</h2>
            <p className="text-gray-600 mb-4">Connection requests you've sent to others</p>
            <SentRequestsList 
              onRequestUpdated={() => {
                // Request updated
              }}
            />
          </Card>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <ConnectionAnalytics />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Member Management
            </h1>
            <p className="text-gray-600">
              Search for users, manage your connections, respond to pending requests, and analyze your network.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 inline" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </ToastProvider>
  );
} 