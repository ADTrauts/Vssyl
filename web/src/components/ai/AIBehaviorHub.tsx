'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'shared/components';
import { User, Settings } from 'lucide-react';
import PersonalityQuestionnaire from './PersonalityQuestionnaire';
import AutonomyControls from './AutonomyControls';
import AIOnboardingFlow from './AIOnboardingFlow';

interface AIBehaviorHubProps {
  showPersonalityOnboarding: boolean;
  profileCheckDone: boolean;
  onOnboardingComplete: () => void;
  initialSection?: 'personality' | 'autonomy';
}

export default function AIBehaviorHub({
  showPersonalityOnboarding,
  profileCheckDone,
  onOnboardingComplete,
  initialSection = 'personality',
}: AIBehaviorHubProps) {
  const [section, setSection] = useState<'personality' | 'autonomy'>(initialSection);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Behavior</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
          How your twin communicates and how much initiative it takes. These settings shape your AI
          Identity — separate from workspace policies your organization may add.
        </p>
      </div>

      <Tabs value={section} onValueChange={(v) => setSection(v as 'personality' | 'autonomy')}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="personality" className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            Personality & style
          </TabsTrigger>
          <TabsTrigger value="autonomy" className="flex items-center gap-1.5">
            <Settings className="w-4 h-4" />
            Action boundaries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personality" className="mt-6">
          {profileCheckDone && showPersonalityOnboarding ? (
            <AIOnboardingFlow embedded onComplete={onOnboardingComplete} />
          ) : (
            <PersonalityQuestionnaire onComplete={onOnboardingComplete} />
          )}
        </TabsContent>

        <TabsContent value="autonomy" className="mt-6">
          <AutonomyControls />
        </TabsContent>
      </Tabs>
    </div>
  );
}
