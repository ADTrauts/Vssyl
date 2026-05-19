'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Badge, Spinner, Tabs, TabsList, TabsTrigger, TabsContent } from 'shared/components';
import { 
  Brain, 
  BarChart3, 
  Settings, 
  User, 
  Zap,
  MessageSquare,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  BookOpen,
  Sparkles
} from 'lucide-react';
import AIIntelligenceHub, { type IntelligenceSubTab } from '../../components/ai/AIIntelligenceHub';
import AutonomyControls from '../../components/ai/AutonomyControls';
import PersonalityQuestionnaire from '../../components/ai/PersonalityQuestionnaire';
import AutonomousActions from '../../components/ai/AutonomousActions';
import CustomContext from '../../components/ai/CustomContext';
import ProviderSettings from '../../components/ai/ProviderSettings';
import AIMemoriesView from '../../components/ai/AIMemoriesView';
import AIOnboardingFlow from '../../components/ai/AIOnboardingFlow';
import { authenticatedApiCall } from '../../lib/apiUtils';

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

export default function AIPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPersonalityOnboarding, setShowPersonalityOnboarding] = useState(false);
  const [profileCheckDone, setProfileCheckDone] = useState(false);

  // Sync tab with URL query parameter
  useEffect(() => {
    const tab = searchParams?.get('tab') || 'overview';
    setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    const checkPersonalityProfile = async () => {
      if (!session?.accessToken) {
        setProfileCheckDone(true);
        return;
      }
      try {
        const res = await authenticatedApiCall<{
          success: boolean;
          profile: { data?: { questionnaireCompleted?: boolean } } | null;
        }>('/api/ai/personality/profile', { method: 'GET' }, session.accessToken);

        const completed = res.success && res.profile?.data?.questionnaireCompleted === true;
        const forceOnboarding = searchParams?.get('onboarding') === '1';

        if (forceOnboarding || !completed) {
          setShowPersonalityOnboarding(true);
          if (searchParams?.get('tab') !== 'personality') {
            const params = new URLSearchParams(searchParams?.toString() || '');
            params.set('tab', 'personality');
            if (forceOnboarding) params.set('onboarding', '1');
            router.replace(`/ai?${params.toString()}`, { scroll: false });
          }
        }
      } catch {
        // allow manual setup
      } finally {
        setProfileCheckDone(true);
      }
    };
    void checkPersonalityProfile();
  }, [session?.accessToken, searchParams, router]);

  // Load AI stats when overview tab is active
  useEffect(() => {
    if (activeTab === 'overview' && session?.accessToken) {
      loadAIStats();
    }
  }, [activeTab, session]);

  const loadAIStats = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedApiCall<{ success: boolean; stats: AIStats }>(
        '/api/ai-stats/stats',
        { method: 'GET' },
        session.accessToken
      );

      if (response.success && response.stats) {
        setAiStats(response.stats);
      } else {
        setError('Failed to load AI statistics');
      }
    } catch (err) {
      console.error('Error loading AI stats:', err);
      setError('Failed to load AI statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without page reload
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.push(`/ai?${params.toString()}`, { scroll: false });
  };

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400">Please log in to access the AI Control Center.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Control Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your AI Digital Life Twin settings, personality, and autonomous actions
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap w-full gap-1 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="memories" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Memories
          </TabsTrigger>
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Provider
          </TabsTrigger>
          <TabsTrigger value="autonomy" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Autonomy
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Personality
          </TabsTrigger>
          <TabsTrigger value="context" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Context
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="intelligence" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Intelligence
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size={32} />
            </div>
          ) : error ? (
            <Card className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadAIStats} variant="secondary">
                  Retry
                </Button>
              </div>
            </Card>
          ) : aiStats ? (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Conversations</h3>
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{aiStats.totalConversations}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI interactions</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Actions</h3>
                    <Zap className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{aiStats.totalActions}</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Autonomous actions</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Confidence</h3>
                    <TrendingUp className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{aiStats.averageConfidence}%</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">AI response confidence</p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Autonomy Level</h3>
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{aiStats.autonomyLevel}%</div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall autonomy</p>
                </Card>
              </div>

              {/* Learning Progress */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Learning Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">AI Understanding</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{aiStats.learningProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        aiStats.learningProgress >= 80 ? 'bg-green-600' :
                        aiStats.learningProgress >= 60 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${aiStats.learningProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {aiStats.learningProgress >= 80 
                      ? "Excellent! Your AI has a strong understanding of your preferences."
                      : aiStats.learningProgress >= 60
                      ? "Good progress. Continue using the AI to improve understanding."
                      : "Learning in progress. More interactions will improve AI understanding."
                    }
                  </p>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                  <Button onClick={loadAIStats} variant="ghost" size="sm">
                    <Clock className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                {aiStats.recentConversations.length > 0 ? (
                  <div className="space-y-3">
                    {aiStats.recentConversations.map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{conv.type}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{conv.timestamp}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <Badge 
                            color={conv.confidence >= 80 ? 'green' : conv.confidence >= 60 ? 'yellow' : 'red'}
                            size="sm"
                          >
                            {conv.confidence}% confidence
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                  </div>
                )}
              </Card>

              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => handleTabChange('intelligence')}
                    variant="secondary"
                    className="justify-start h-auto p-4"
                  >
                    <Sparkles className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Intelligence hub</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Review learning events and insights
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleTabChange('autonomy')}
                    variant="secondary"
                    className="justify-start h-auto p-4"
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Configure Autonomy</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Adjust AI autonomy levels</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleTabChange('personality')}
                    variant="secondary"
                    className="justify-start h-auto p-4"
                  >
                    <User className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Personality Profile</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Customize AI personality</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleTabChange('actions')}
                    variant="secondary"
                    className="justify-start h-auto p-4"
                  >
                    <Zap className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">Autonomous Actions</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">View and manage actions</div>
                    </div>
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-6">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">No data available</p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Memories Tab */}
        <TabsContent value="memories" className="mt-6">
          <AIMemoriesView onNavigateToTab={handleTabChange} />
        </TabsContent>

        {/* Provider Tab */}
        <TabsContent value="provider" className="mt-6">
          <ProviderSettings />
        </TabsContent>

        {/* Autonomy Tab */}
        <TabsContent value="autonomy" className="mt-6">
          <AutonomyControls />
        </TabsContent>

        {/* Personality Tab */}
        <TabsContent value="personality" className="mt-6">
          {profileCheckDone && showPersonalityOnboarding ? (
            <AIOnboardingFlow
              embedded
              onComplete={() => {
                setShowPersonalityOnboarding(false);
                handleTabChange('memories');
              }}
            />
          ) : (
            <PersonalityQuestionnaire
              onComplete={() => {
                setShowPersonalityOnboarding(false);
                handleTabChange('memories');
              }}
            />
          )}
        </TabsContent>

        {/* Custom Context Tab */}
        <TabsContent value="context" className="mt-6">
          <CustomContext />
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="mt-6">
          <AutonomousActions />
        </TabsContent>

        {/* Intelligence Tab */}
        <TabsContent value="intelligence" className="mt-6">
          <AIIntelligenceHub
            key={searchParams?.get('intel') ?? 'review'}
            initialSubTab={
              (['review', 'analytics', 'patterns', 'predictions', 'recommendations'] as const).includes(
                (searchParams?.get('intel') ?? '') as IntelligenceSubTab
              )
                ? (searchParams?.get('intel') as IntelligenceSubTab)
                : 'review'
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
