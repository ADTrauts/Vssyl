'use client';

import React, { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'shared/components';
import { BarChart3, Sparkles, Lightbulb } from 'lucide-react';
import LearningDashboard from './LearningDashboard';
import SmartPatternInsights from './SmartPatternInsights';
import PredictiveIntelligenceDashboard from './PredictiveIntelligenceDashboard';
import IntelligentRecommendationsDashboard from './IntelligentRecommendationsDashboard';
import InsightsActivityStrip from './InsightsActivityStrip';

/** Insights sub-tabs (More → Insights). Legacy `intel` values map via `resolveInsightsSubTab`. */
export type InsightsSubTab = 'analytics' | 'patterns' | 'suggestions';

/** @deprecated Use InsightsSubTab — kept for URL param typing during redirect. */
export type IntelligenceSubTab = InsightsSubTab | 'review' | 'predictions' | 'recommendations';

const LEGACY_INTEL_MAP: Record<string, InsightsSubTab> = {
  review: 'analytics',
  analytics: 'analytics',
  patterns: 'patterns',
  predictions: 'suggestions',
  recommendations: 'suggestions',
  suggestions: 'suggestions',
};

export function resolveInsightsSubTab(intel: string | null | undefined): InsightsSubTab {
  if (intel && LEGACY_INTEL_MAP[intel]) {
    return LEGACY_INTEL_MAP[intel];
  }
  return 'analytics';
}

interface AIIntelligenceHubProps {
  initialSubTab?: IntelligenceSubTab | InsightsSubTab;
}

/**
 * Advanced personal AI analytics — lives under /ai → More → Insights.
 * Learning review lives on the Learning tab; this surface is optional depth only.
 */
export default function AIIntelligenceHub({ initialSubTab }: AIIntelligenceHubProps) {
  const resolvedInitial = useMemo(
    () => resolveInsightsSubTab(initialSubTab),
    [initialSubTab]
  );
  const [subTab, setSubTab] = useState<InsightsSubTab>(resolvedInitial);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Insights</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
          Optional depth beyond your everyday AI Identity — analytics, patterns, and suggestions from
          how you use your twin. For saving learnings from chat, use the Learning tab.
        </p>
      </div>

      <InsightsActivityStrip />

      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as InsightsSubTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <LearningDashboard embedded />
        </TabsContent>
        <TabsContent value="patterns" className="mt-6">
          <SmartPatternInsights embedded />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Predictions
            </h3>
            <PredictiveIntelligenceDashboard embedded />
          </section>
          <section>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Recommendations
            </h3>
            <IntelligentRecommendationsDashboard embedded />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
