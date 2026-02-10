'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Badge } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';
import { BookOpen, User, MessageSquare, FileText, Heart, Workflow, Sparkles } from 'lucide-react';

interface UserAIContextItem {
  id: string;
  contextType: string;
  title: string;
  content: string;
  scope: string;
  active: boolean;
  createdAt: string;
  source?: 'user' | 'conversation' | null;
}

interface PersonalityProfile {
  id: string;
  data?: Record<string, unknown> & {
    traits?: Record<string, number>;
    preferences?: Record<string, unknown>;
    communicationStyle?: string;
  };
  lastUpdated: string | null;
  createdAt: string;
}

interface LearnedPatternSummary {
  id: string;
  description: string;
  type: string;
}

interface AIMemoriesViewProps {
  onNavigateToTab: (tab: string) => void;
}

const CONTEXT_TYPE_LABELS: Record<string, { label: string; icon: typeof FileText }> = {
  fact: { label: 'Facts', icon: FileText },
  preference: { label: 'Preferences', icon: Heart },
  instruction: { label: 'Instructions', icon: MessageSquare },
  workflow: { label: 'Workflows', icon: Workflow },
};

export default function AIMemoriesView({ onNavigateToTab }: AIMemoriesViewProps) {
  const { data: session } = useSession();
  const [contexts, setContexts] = useState<UserAIContextItem[]>([]);
  const [personality, setPersonality] = useState<PersonalityProfile | null>(null);
  const [patterns, setPatterns] = useState<LearnedPatternSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) {
      loadData();
    }
  }, [session?.accessToken]);

  const loadData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [contextRes, personalityRes, patternsRes] = await Promise.all([
        authenticatedApiCall<{ success: boolean; data: UserAIContextItem[] }>(
          '/api/ai/context',
          { method: 'GET' },
          session.accessToken
        ),
        authenticatedApiCall<{ success: boolean; profile: PersonalityProfile | null }>(
          '/api/ai/personality/profile',
          { method: 'GET' },
          session.accessToken
        ),
        authenticatedApiCall<{ success: boolean; patterns: LearnedPatternSummary[] }>(
          '/api/ai/learning/my-patterns',
          { method: 'GET' },
          session.accessToken
        ).catch(() => ({ success: false, patterns: [] as LearnedPatternSummary[] })),
      ]);
      if (contextRes.success && Array.isArray(contextRes.data)) {
        setContexts(contextRes.data.filter((c) => c.active));
      } else {
        setContexts([]);
      }
      if (personalityRes.success && personalityRes.profile) {
        setPersonality(personalityRes.profile);
      } else {
        setPersonality(null);
      }
      if (patternsRes.success && Array.isArray(patternsRes.patterns)) {
        setPatterns(patternsRes.patterns);
      } else {
        setPatterns([]);
      }
    } catch (err) {
      console.error('Error loading memories:', err);
      setError('Failed to load memories. Please try again.');
      setContexts([]);
      setPersonality(null);
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  };

  const byType = contexts.reduce<Record<string, UserAIContextItem[]>>((acc, item) => {
    const type = item.contextType in CONTEXT_TYPE_LABELS ? item.contextType : 'fact';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const hasAnyContext = contexts.length > 0;
  const hasPersonality = personality?.data != null;
  const isEmpty = !hasAnyContext && !hasPersonality;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-gray-700 mb-4">{error}</p>
        <Button onClick={loadData} variant="secondary">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-700 text-sm">
        Your Digital Life Twin uses the following to personalize answers. You can edit or add more in
        Custom Context and Personality Profile.
      </p>

      {isEmpty ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nothing saved yet</h3>
          <p className="text-gray-700 mb-6 max-w-md mx-auto">
            Chat with your AI or add instructions in Custom Context to build what it knows about you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => onNavigateToTab('context')} variant="primary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add in Custom Context
            </Button>
            <Button onClick={() => onNavigateToTab('personality')} variant="secondary">
              <User className="w-4 h-4 mr-2" />
              Set up Personality
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Facts & preferences (UserAIContext) */}
          {hasAnyContext && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Facts & preferences</h3>
                <Button
                  onClick={() => onNavigateToTab('context')}
                  variant="ghost"
                  size="sm"
                  className="text-gray-700"
                >
                  Edit in Custom Context
                </Button>
              </div>
              <div className="space-y-6">
                {(['fact', 'preference', 'instruction', 'workflow'] as const).map((type) => {
                  const items = byType[type] || [];
                  if (items.length === 0) return null;
                  const { label, icon: Icon } = CONTEXT_TYPE_LABELS[type] ?? CONTEXT_TYPE_LABELS.fact;
                  return (
                    <div key={type}>
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                        <Icon className="w-4 h-4 text-purple-600" />
                        {label}
                      </h4>
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li
                            key={item.id}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900 text-sm">{item.title}</span>
                              {item.source === 'user' && (
                                <Badge size="sm" color="blue">You added</Badge>
                              )}
                              {item.source === 'conversation' && (
                                <Badge size="sm" color="green">Saved from a conversation</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.content}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Personality summary */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Personality</h3>
              <Button
                onClick={() => onNavigateToTab('personality')}
                variant="ghost"
                size="sm"
                className="text-gray-700"
              >
                Edit in Personality Profile
              </Button>
            </div>
            {hasPersonality ? (
              <div className="space-y-2 text-sm text-gray-700">
                {personality.data?.traits && Object.keys(personality.data.traits).length > 0 && (
                  <p>
                    <span className="font-medium text-gray-900">Traits:</span>{' '}
                    {Object.entries(personality.data.traits)
                      .slice(0, 4)
                      .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
                      .join(', ')}
                  </p>
                )}
                {personality.data?.communicationStyle && (
                  <p>
                    <span className="font-medium text-gray-900">Communication:</span>{' '}
                    {String(personality.data.communicationStyle)}
                  </p>
                )}
                {personality.lastUpdated && (
                  <p className="text-xs text-gray-600 mt-2">
                    Last updated: {new Date(personality.lastUpdated).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-gray-600 text-sm mb-3">
                  No personality profile yet. Set one so the AI can match your style.
                </p>
                <Button onClick={() => onNavigateToTab('personality')} variant="secondary" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Set up Personality Profile
                </Button>
              </div>
            )}
          </Card>

          {/* Learned patterns */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Learned patterns
            </h3>
            {patterns.length > 0 ? (
              <ul className="space-y-2">
                {patterns.map((p) => (
                  <li
                    key={p.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-700"
                  >
                    {p.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">
                No patterns yet. Keep using the AI and it will learn your habits over time.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
