'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'shared/components';
import { Brain, BarChart3, Sparkles, TrendingUp, Lightbulb, ClipboardCheck } from 'lucide-react';
import PersonalLearningEventsReview from './PersonalLearningEventsReview';
import LearningDashboard from './LearningDashboard';
import SmartPatternInsights from './SmartPatternInsights';
import PredictiveIntelligenceDashboard from './PredictiveIntelligenceDashboard';
import IntelligentRecommendationsDashboard from './IntelligentRecommendationsDashboard';

export type IntelligenceSubTab =
  | 'review'
  | 'analytics'
  | 'patterns'
  | 'predictions'
  | 'recommendations';

interface AIIntelligenceHubProps {
  initialSubTab?: IntelligenceSubTab;
}

export default function AIIntelligenceHub({ initialSubTab = 'review' }: AIIntelligenceHubProps) {
  const [subTab, setSubTab] = useState<IntelligenceSubTab>(initialSubTab);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-600" />
          Intelligence
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Review learned behaviors, analytics, patterns, predictions, and recommendations from your personal AI.
        </p>
      </div>

      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as IntelligenceSubTab)}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="review" className="flex items-center gap-1.5">
            <ClipboardCheck className="w-4 h-4" />
            Review
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Predictions
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-6">
          <PersonalLearningEventsReview embedded />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <LearningDashboard embedded />
        </TabsContent>
        <TabsContent value="patterns" className="mt-6">
          <SmartPatternInsights embedded />
        </TabsContent>
        <TabsContent value="predictions" className="mt-6">
          <PredictiveIntelligenceDashboard embedded />
        </TabsContent>
        <TabsContent value="recommendations" className="mt-6">
          <IntelligentRecommendationsDashboard embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
