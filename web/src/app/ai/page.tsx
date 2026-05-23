'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Card,
  Button,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from 'shared/components';
import {
  Brain,
  BookOpen,
  Sparkles,
  User,
  ChevronDown,
  Settings,
  Zap,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import AIIdentityHome from '../../components/ai/AIIdentityHome';
import AILearningHub from '../../components/ai/AILearningHub';
import AIMemoriesView from '../../components/ai/AIMemoriesView';
import AIBehaviorHub from '../../components/ai/AIBehaviorHub';
import CustomContext from '../../components/ai/CustomContext';
import ProviderSettings from '../../components/ai/ProviderSettings';
import AutonomousActions from '../../components/ai/AutonomousActions';
import AIIntelligenceHub, { resolveInsightsSubTab } from '../../components/ai/AIIntelligenceHub';
import AmbientSuggestionsView from '../../components/ai/AmbientSuggestionsView';
import AIIdentityTour from '../../components/ai/AIIdentityTour';
import { clearAIIdentityTourSeen } from '../../lib/aiIdentityTour';
import { authenticatedApiCall } from '../../lib/apiUtils';
import { fetchAIIdentitySnapshot, type AIIdentitySnapshot } from '../../api/aiIdentity';
import { getSuggestions } from '../../api/aiSuggestions';
import { useDashboard } from '../../contexts/DashboardContext';
import { resolveBusinessIdFromDashboard } from '../../lib/resolveBusinessIdFromDashboard';
import {
  normalizeAITabFromQuery,
  buildAITabSearchParams,
  aiTabNeedsRedirect,
  type AITabValue,
  type AIMoreSection,
} from '../../lib/aiControlCenterTabs';
import { isAIActionsUIEnabled } from '../../lib/aiFeatureFlags';

const MORE_SECTIONS: { id: AIMoreSection; label: string; icon: typeof Settings }[] = [
  { id: 'provider', label: 'Provider', icon: Brain },
  ...(isAIActionsUIEnabled() ? [{ id: 'actions' as const, label: 'Actions', icon: Zap }] : []),
  { id: 'insights', label: 'Insights', icon: BarChart3 },
];

export default function AIPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { currentDashboard, getDashboardType } = useDashboard();

  const tabParam = searchParams?.get('tab') ?? null;
  const intelParam = searchParams?.get('intel') ?? null;
  const sectionParam = searchParams?.get('section') ?? null;

  const normalized = normalizeAITabFromQuery(tabParam, intelParam, sectionParam);
  const [activeTab, setActiveTab] = useState<AITabValue>(normalized.tab);
  const [moreSection, setMoreSection] = useState<AIMoreSection>(
    normalized.section ?? 'provider'
  );
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [learningBadge, setLearningBadge] = useState(0);
  const [suggestionsBadge, setSuggestionsBadge] = useState(0);
  const [identitySnapshot, setIdentitySnapshot] = useState<AIIdentitySnapshot | null>(null);
  const [showPersonalityOnboarding, setShowPersonalityOnboarding] = useState(false);
  const [profileCheckDone, setProfileCheckDone] = useState(false);
  const [tourReplayToken, setTourReplayToken] = useState(0);

  const personalityOnboardingQuery = searchParams?.get('onboarding') === '1';
  const tourEnabled =
    profileCheckDone && !showPersonalityOnboarding && !personalityOnboardingQuery;

  useEffect(() => {
    const redirect = aiTabNeedsRedirect(tabParam, intelParam, sectionParam);
    if (redirect) {
      const params = buildAITabSearchParams(redirect.tab, {
        section: redirect.section,
        intel: redirect.intel,
        onboarding: searchParams?.get('onboarding') === '1',
      });
      const qs = params.toString();
      router.replace(qs ? `/ai?${qs}` : '/ai', { scroll: false });
    }
  }, [tabParam, intelParam, sectionParam, router, searchParams]);

  useEffect(() => {
    const next = normalizeAITabFromQuery(tabParam, intelParam, sectionParam);
    if (next.section === 'actions' && !isAIActionsUIEnabled()) {
      const params = buildAITabSearchParams('more', { section: 'insights' });
      router.replace(`/ai?${params.toString()}`, { scroll: false });
      return;
    }
    setActiveTab(next.tab);
    if (next.section) setMoreSection(next.section);
    if (next.tab === 'more') setMoreMenuOpen(true);
  }, [tabParam, intelParam, sectionParam, router]);

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
          if (activeTab !== 'behavior') {
            const params = buildAITabSearchParams('behavior', { onboarding: forceOnboarding });
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
  }, [session?.accessToken, searchParams, router, activeTab]);

  const loadIdentitySnapshot = useCallback(async () => {
    if (!session?.accessToken) return;
    const businessId = resolveBusinessIdFromDashboard(
      currentDashboard,
      currentDashboard ? getDashboardType(currentDashboard) : 'personal'
    );
    try {
      const data = await fetchAIIdentitySnapshot(session.accessToken, {
        businessId,
        dashboardId: currentDashboard?.id,
      });
      if (data) {
        setIdentitySnapshot(data);
        setLearningBadge(data.learning.pendingCount);
      }
    } catch {
      setLearningBadge(0);
    }
  }, [session?.accessToken, currentDashboard, getDashboardType]);

  useEffect(() => {
    void loadIdentitySnapshot();
  }, [loadIdentitySnapshot, activeTab]);

  useEffect(() => {
    const loadSuggestionBadge = async () => {
      if (!session?.accessToken) {
        setSuggestionsBadge(0);
        return;
      }
      try {
        const businessId = resolveBusinessIdFromDashboard(
          currentDashboard,
          currentDashboard ? getDashboardType(currentDashboard) : 'personal'
        );
        const { getSuggestions } = await import('../../api/aiSuggestions');
        const items = await getSuggestions(session.accessToken, {
          dashboardId: currentDashboard?.id,
          businessId,
          scope: 'pending',
        });
        setSuggestionsBadge(items.length);
      } catch {
        setSuggestionsBadge(0);
      }
    };
    void loadSuggestionBadge();
  }, [session?.accessToken, currentDashboard, getDashboardType, activeTab]);

  const navigateToTab = (
    tab: string,
    options?: { section?: AIMoreSection; intel?: string; onboarding?: boolean }
  ) => {
    const tabValue = tab as AITabValue;
    setActiveTab(tabValue);
    if (tabValue === 'more' && options?.section) {
      setMoreSection(options.section);
      setMoreMenuOpen(true);
    } else if (tabValue !== 'more') {
      setMoreMenuOpen(false);
    }
    const params = buildAITabSearchParams(tabValue, {
      section: options?.section ?? (tabValue === 'more' ? moreSection : undefined),
      intel: options?.intel,
      onboarding: options?.onboarding,
    });
    const qs = params.toString();
    router.push(qs ? `/ai?${qs}` : '/ai', { scroll: false });
  };

  const handlePrimaryTabChange = (tab: string) => {
    if (tab === 'more') {
      if (activeTab === 'more') {
        setMoreMenuOpen((o) => !o);
      } else {
        navigateToTab('more', { section: moreSection });
        setMoreMenuOpen(true);
      }
      return;
    }
    setMoreMenuOpen(false);
    navigateToTab(tab);
  };

  const handleMoreSection = (section: AIMoreSection) => {
    setMoreSection(section);
    setMoreMenuOpen(false);
    navigateToTab('more', { section });
  };

  const behaviorInitialSection =
    tabParam === 'autonomy' ? ('autonomy' as const) : ('personality' as const);

  const insightsIntel = resolveInsightsSubTab(intelParam);

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-8 text-center">
          <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to manage your AI Identity.
          </p>
        </Card>
      </div>
    );
  }

  const showMoreContent = activeTab === 'more' || moreMenuOpen;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Identity
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-xl">
            How I behave, learn, and remember for you — adaptive, transparent, and always yours to
            shape.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearAIIdentityTourSeen();
              setTourReplayToken((n) => n + 1);
              navigateToTab('identity');
            }}
          >
            Tour
          </Button>
          <Button variant="secondary" size="sm" onClick={() => router.push('/ai-chat')}>
            Open chat
          </Button>
        </div>
      </div>

      <AIIdentityTour
        key={tourReplayToken}
        enabled={tourEnabled}
        onNavigateToTab={navigateToTab}
        onFinished={() => void loadIdentitySnapshot()}
      />

      <Tabs value={activeTab === 'more' ? 'more' : activeTab} onValueChange={handlePrimaryTabChange}>
        <div className="flex flex-col gap-2">
          <TabsList className="flex flex-wrap w-full gap-1 h-auto">
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Identity
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-2 relative">
              <Sparkles className="w-4 h-4" />
              Learning
              {learningBadge > 0 && (
                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-amber-500 text-white text-xs font-medium flex items-center justify-center">
                  {learningBadge > 9 ? '9+' : learningBadge}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2 relative">
              <Lightbulb className="w-4 h-4" />
              Suggestions
              {suggestionsBadge > 0 && (
                <span className="ml-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-purple-500 text-white text-xs font-medium flex items-center justify-center">
                  {suggestionsBadge > 9 ? '9+' : suggestionsBadge}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Memory
            </TabsTrigger>
            <TabsTrigger value="behavior" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Behavior
            </TabsTrigger>
            <TabsTrigger value="more" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              More
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showMoreContent ? 'rotate-180' : ''}`}
              />
            </TabsTrigger>
          </TabsList>

          {(activeTab === 'more' || moreMenuOpen) && (
            <div className="flex flex-wrap gap-2 pl-1">
              {MORE_SECTIONS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={moreSection === id && activeTab === 'more' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => handleMoreSection(id)}
                >
                  <Icon className="w-4 h-4 mr-1.5" />
                  {label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <TabsContent value="identity" className="mt-6">
          <AIIdentityHome
            onNavigateToTab={navigateToTab}
            snapshot={identitySnapshot}
            onSnapshotLoaded={(data) => {
              setIdentitySnapshot(data);
              setLearningBadge(data.learning.pendingCount);
            }}
          />
        </TabsContent>

        <TabsContent value="learning" className="mt-6">
          <AILearningHub onLearningChanged={() => void loadIdentitySnapshot()} />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-6">
          <AmbientSuggestionsView />
        </TabsContent>

        <TabsContent value="memory" className="mt-6 space-y-10">
          <AIMemoriesView onNavigateToTab={navigateToTab} />
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Add context & instructions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Teach your twin facts, preferences, and workflows it should keep in mind.
            </p>
            <CustomContext />
          </section>
        </TabsContent>

        <TabsContent value="behavior" className="mt-6">
          {profileCheckDone ? (
            <AIBehaviorHub
              showPersonalityOnboarding={showPersonalityOnboarding}
              profileCheckDone={profileCheckDone}
              onOnboardingComplete={() => {
                setShowPersonalityOnboarding(false);
                void loadIdentitySnapshot();
                navigateToTab('identity');
              }}
              initialSection={behaviorInitialSection}
            />
          ) : (
            <div className="flex justify-center py-12">
              <Spinner size={32} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="more" className="mt-6">
          {moreSection === 'provider' && <ProviderSettings />}
          {moreSection === 'actions' && <AutonomousActions />}
          {moreSection === 'insights' && (
            <AIIntelligenceHub key={insightsIntel} initialSubTab={insightsIntel} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
