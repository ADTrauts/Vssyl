'use client';

import React, { useEffect, useState } from 'react';
import { Card, Button } from 'shared/components';
import { Brain, Sparkles, BookOpen, User, X } from 'lucide-react';
import {
  hasSeenAIIdentityTour,
  markAIIdentityTourSeen,
} from '../../lib/aiIdentityTour';
import type { AITabValue } from '../../lib/aiControlCenterTabs';

const TOUR_STEPS = [
  {
    id: 'style',
    icon: User,
    title: 'Your style',
    body: 'Behavior is where you set how I communicate — tone, length, and how much initiative I take. It’s the heart of your AI Identity.',
    tab: 'behavior' as AITabValue,
  },
  {
    id: 'learning',
    icon: Sparkles,
    title: 'Learning',
    body: 'When I notice something worth learning, I’ll wait here for you. Nothing is saved until you choose “Save to AI Identity.”',
    tab: 'learning' as AITabValue,
  },
  {
    id: 'knowledge',
    icon: BookOpen,
    title: 'Knowledge',
    body: 'Facts, preferences, and instructions you want me to keep long-term live in Knowledge — separate from everyday chat.',
    tab: 'memory' as AITabValue,
  },
] as const;

interface AIIdentityTourProps {
  enabled: boolean;
  onNavigateToTab: (tab: string) => void;
  onFinished?: () => void;
}

export default function AIIdentityTour({
  enabled,
  onNavigateToTab,
  onFinished,
}: AIIdentityTourProps) {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setVisible(false);
      return;
    }
    if (!hasSeenAIIdentityTour()) {
      setVisible(true);
      setStepIndex(0);
    }
  }, [enabled]);

  if (!visible) return null;

  const step = TOUR_STEPS[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const finish = () => {
    markAIIdentityTourSeen();
    setVisible(false);
    onNavigateToTab('identity');
    onFinished?.();
  };

  const handleNext = () => {
    if (isLast) {
      finish();
      return;
    }
    const next = TOUR_STEPS[stepIndex + 1];
    setStepIndex(stepIndex + 1);
    onNavigateToTab(next.tab);
  };

  const handleSkip = () => {
    finish();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-identity-tour-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Dismiss tour"
        onClick={handleSkip}
      />
      <Card className="relative w-full max-w-md p-6 shadow-xl z-10 border-purple-200 dark:border-purple-800">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex gap-3">
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/50 p-2">
              <Icon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                Step {stepIndex + 1} of {TOUR_STEPS.length}
              </p>
              <h2
                id="ai-identity-tour-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5"
              >
                {step.title}
              </h2>
            </div>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close tour" onClick={handleSkip}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{step.body}</p>

        <div className="flex items-center gap-1.5 mb-5">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? 'w-6 bg-purple-600'
                  : i < stepIndex
                    ? 'w-1.5 bg-purple-400'
                    : 'w-1.5 bg-gray-300 dark:bg-slate-600'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-between">
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip tour
          </Button>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const prev = TOUR_STEPS[stepIndex - 1];
                  setStepIndex(stepIndex - 1);
                  onNavigateToTab(prev.tab);
                }}
              >
                Back
              </Button>
            )}
            <Button variant="primary" size="sm" onClick={handleNext}>
              {isLast ? 'Done' : 'Next'}
            </Button>
          </div>
        </div>

        {stepIndex === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            You can return to AI Identity anytime from the sidebar or chat.
          </p>
        )}
      </Card>
    </div>
  );
}
