'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from 'shared/components';
import { 
  BarChart3, 
  Settings, 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  FileText, 
  Calendar,
  Users,
  Activity,
  Zap,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import AutonomyControls from '../../components/ai/AutonomyControls';
import PersonalityQuestionnaire from '../../components/ai/PersonalityQuestionnaire';
import ErrorBoundary from '../../components/ErrorBoundary';
import AIProviderTest from '../../components/AIProviderTest';

interface AIStats {
  totalConversations: number;
  totalActions: number;
  averageConfidence: number;
  autonomyLevel: number;
  learningProgress: number;
  recentConversations: Array<{
    id: string;
    type: string;
    confidence: number;
    timestamp: string;
  }>;
}

function AIPageContent() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'autonomy', 'personality'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);
  const [aiStats, setAiStats] = useState<AIStats>({
    totalConversations: 0,
    totalActions: 0,
    averageConfidence: 0,
    autonomyLevel: 0,
    learningProgress: 0,
    recentConversations: []
  });
  const [recentConversations, setRecentConversations] = useState<Array<{
    id: string;
    type: string;
    confidence: number;
    timestamp: string;
  }>>([]);
  const [personalityCompleted, setPersonalityCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      loadAIData();
    } catch (err) {
      console.error('Error in AI page useEffect:', err);
      setError('Failed to load AI data');
      setLoading(false);
    }
  }, []);

  const loadAIData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Mock data for now - replace with real API calls later
      const mockStats: AIStats = {
        totalConversations: 127,
        totalActions: 89,
        averageConfidence: 87,
        autonomyLevel: 65,
        learningProgress: 73,
        recentConversations: [
          { id: '1', type: 'Schedule Meeting', confidence: 92, timestamp: '2 hours ago' },
          { id: '2', type: 'File Organization', confidence: 88, timestamp: '4 hours ago' },
          { id: '3', type: 'Message Response', confidence: 85, timestamp: '6 hours ago' },
          { id: '4', type: 'Task Creation', confidence: 79, timestamp: '8 hours ago' }
        ]
      };

      setAiStats(mockStats);
      setRecentConversations(mockStats.recentConversations);
      
      // Check if personality is completed (mock for now)
      setPersonalityCompleted(false);
      
    } catch (error) {
      console.error('Failed to load AI data:', error);
      setError('Failed to load AI data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalityComplete = (personalityData: any) => {
    try {
      console.log('Personality completed:', personalityData);
      setPersonalityCompleted(true);
      // You can add additional logic here, such as updating the AI's understanding
    } catch (error) {
      console.error('Error handling personality completion:', error);
      setError('Failed to save personality data. Please try again.');
    }
  };

  const handleRetry = () => {
    setError(null);
    loadAIData();
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </Alert>
          <div className="mt-4">
            <Button onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading AI Control Center...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Control Center</h1>
        <p className="text-gray-600">
          Manage your AI Digital Life Twin's autonomy, personality, and learning
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('autonomy')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'autonomy'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Autonomy
          </button>
          <button
            onClick={() => setActiveTab('personality')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personality'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Brain className="h-4 w-4 inline mr-2" />
            Personality
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI System Status */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">AI System Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <MessageSquare className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{aiStats.totalConversations}</div>
                <div className="text-sm text-gray-600">Conversations</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Zap className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{aiStats.totalActions}</div>
                <div className="text-sm text-gray-600">Actions Taken</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{aiStats.averageConfidence}%</div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Settings className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">{aiStats.autonomyLevel}%</div>
                <div className="text-sm text-gray-600">Autonomy</div>
              </div>
            </div>
          </Card>

          {/* Learning Progress */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Learning Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">AI Understanding</span>
                  <span className="text-sm text-gray-600">{aiStats.learningProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${aiStats.learningProgress}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Your AI is learning your preferences and working style. Complete the personality questionnaire to accelerate learning.
              </p>
            </div>
          </Card>

          {/* AI Provider Test */}
          <AIProviderTest />

          {/* Recent Activity */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {recentConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{conversation.type}</div>
                      <div className="text-sm text-gray-600">{conversation.timestamp}</div>
                    </div>
                  </div>
                  <Badge color={conversation.confidence >= 80 ? 'green' : conversation.confidence >= 60 ? 'blue' : 'yellow'}>
                    {conversation.confidence}% confidence
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab('autonomy')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Settings className="h-6 w-6" />
                <span>Configure Autonomy</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab('personality')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Brain className="h-6 w-6" />
                <span>Set Personality</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/dashboard'}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <BarChart3 className="h-6 w-6" />
                <span>View Dashboard</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'autonomy' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5" />
            <h2 className="text-xl font-semibold">AI Autonomy Settings</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Control how much autonomy your AI has in different areas. Higher levels mean the AI can take more actions without your approval.
          </p>
          <AutonomyControls />
        </Card>
      )}

      {activeTab === 'personality' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5" />
            <h2 className="text-xl font-semibold">AI Personality Configuration</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Help your AI understand your personality, preferences, and working style. This information helps your AI make better decisions and provide more personalized assistance.
          </p>
          <PersonalityQuestionnaire onComplete={handlePersonalityComplete} />
        </Card>
      )}
    </div>
  );
}

export default function AIPage() {
  return (
    <ErrorBoundary>
      <AIPageContent />
    </ErrorBoundary>
  );
}