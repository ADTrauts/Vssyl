'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Badge, Input, Textarea } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';
import {
  listMemoryFacts,
  createMemoryFact,
  deleteMemoryFact,
  type UserMemoryFact,
} from '../../api/aiMemoryFacts';
import {
  fetchEffectivePreferencesPreview,
  type EffectivePreferencesPreview,
} from '../../api/aiEffectivePreferences';
import {
  fetchPendingLearnings,
  reviewPendingLearning,
  type PendingLearningItem,
} from '../../api/aiContextLearning';
import {
  BookOpen,
  User,
  MessageSquare,
  FileText,
  Heart,
  Workflow,
  Sparkles,
  Trash2,
  Plus,
  Settings2,
  Brain,
} from 'lucide-react';

interface UserAIContextItem {
  id: string;
  contextType: string;
  title: string;
  content: string;
  scope: string;
  active: boolean;
  createdAt: string;
  source?: 'user' | 'conversation' | null;
  learningStatus?: string;
}

interface PersonalityProfile {
  id: string;
  data?: Record<string, unknown> & {
    traits?: Record<string, number>;
    preferences?: Record<string, unknown>;
    communicationStyle?: string;
    questionnaireCompleted?: boolean;
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

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function AIMemoriesView({ onNavigateToTab }: AIMemoriesViewProps) {
  const { data: session } = useSession();
  const [contexts, setContexts] = useState<UserAIContextItem[]>([]);
  const [personality, setPersonality] = useState<PersonalityProfile | null>(null);
  const [patterns, setPatterns] = useState<LearnedPatternSummary[]>([]);
  const [memoryFacts, setMemoryFacts] = useState<UserMemoryFact[]>([]);
  const [effectivePreview, setEffectivePreview] = useState<EffectivePreferencesPreview | null>(null);
  const [pendingLearnings, setPendingLearnings] = useState<PendingLearningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddFact, setShowAddFact] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newPredicate, setNewPredicate] = useState('');
  const [addingFact, setAddingFact] = useState(false);

  useEffect(() => {
    if (session?.accessToken) {
      void loadData();
    }
  }, [session?.accessToken]);

  const loadData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const token = session.accessToken;
      const [contextRes, personalityRes, patternsRes, facts, preview, pending] = await Promise.all([
        authenticatedApiCall<{ success: boolean; data: UserAIContextItem[] }>(
          '/api/ai/context',
          { method: 'GET' },
          token
        ),
        authenticatedApiCall<{ success: boolean; profile: PersonalityProfile | null }>(
          '/api/ai/personality/profile',
          { method: 'GET' },
          token
        ),
        authenticatedApiCall<{ success: boolean; patterns: LearnedPatternSummary[] }>(
          '/api/ai/learning/my-patterns',
          { method: 'GET' },
          token
        ).catch(() => ({ success: false, patterns: [] as LearnedPatternSummary[] })),
        listMemoryFacts(token).catch(() => [] as UserMemoryFact[]),
        fetchEffectivePreferencesPreview(token),
        fetchPendingLearnings(token).catch(() => [] as PendingLearningItem[]),
      ]);

      if (contextRes.success && Array.isArray(contextRes.data)) {
        setContexts(
          contextRes.data.filter(
            (c) => c.active && (c.learningStatus === 'active' || !c.learningStatus)
          )
        );
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
      setMemoryFacts(facts);
      setEffectivePreview(preview);
      setPendingLearnings(pending);
    } catch (err) {
      console.error('Error loading memories:', err);
      setError('Failed to load memories. Please try again.');
      setContexts([]);
      setPersonality(null);
      setPatterns([]);
      setMemoryFacts([]);
      setEffectivePreview(null);
      setPendingLearnings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPending = async (id: string, action: 'promote' | 'dismiss') => {
    if (!session?.accessToken) return;
    setDeletingId(id);
    try {
      await reviewPendingLearning(session.accessToken, id, action);
      setPendingLearnings((prev) => prev.filter((p) => p.id !== id));
      if (action === 'promote') {
        await loadData();
      }
    } catch (err) {
      console.error('Failed to review pending learning:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteContext = async (id: string) => {
    if (!session?.accessToken) return;
    setDeletingId(id);
    try {
      await authenticatedApiCall(`/api/ai/context/${id}`, { method: 'DELETE' }, session.accessToken);
      setContexts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete context:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteMemoryFact = async (id: string) => {
    if (!session?.accessToken) return;
    setDeletingId(id);
    try {
      await deleteMemoryFact(session.accessToken, id);
      setMemoryFacts((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Failed to delete memory fact:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddMemoryFact = async () => {
    if (!session?.accessToken || !newSubject.trim() || !newPredicate.trim()) return;
    setAddingFact(true);
    try {
      const fact = await createMemoryFact(session.accessToken, {
        subject: newSubject.trim(),
        predicate: newPredicate.trim(),
      });
      setMemoryFacts((prev) => [fact, ...prev]);
      setNewSubject('');
      setNewPredicate('');
      setShowAddFact(false);
      const preview = await fetchEffectivePreferencesPreview(session.accessToken);
      setEffectivePreview(preview);
    } catch (err) {
      console.error('Failed to add memory fact:', err);
    } finally {
      setAddingFact(false);
    }
  };

  const userContexts = contexts.filter((c) => c.source === 'user' || !c.source);
  const learnedContexts = contexts.filter((c) => c.source === 'conversation');

  const byType = userContexts.reduce<Record<string, UserAIContextItem[]>>((acc, item) => {
    const type = item.contextType in CONTEXT_TYPE_LABELS ? item.contextType : 'fact';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  const hasAnyContext = userContexts.length > 0 || learnedContexts.length > 0;
  const hasPersonality = personality?.data != null;
  const hasMemoryFacts = memoryFacts.length > 0;
  const hasPending = pendingLearnings.length > 0;
  const isEmpty =
    !hasAnyContext && !hasPersonality && !hasMemoryFacts && !effectivePreview && !hasPending;

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
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
        <Button onClick={() => void loadData()} variant="secondary">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-700 dark:text-gray-300 text-sm">
        What your Digital Life Twin remembers and how it will behave on your next personal chat.
        In a business workspace, your business admin&apos;s AI policies apply separately from these
        personal settings.
      </p>

      {effectivePreview?.scopeNote && (
        <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          {effectivePreview.scopeNote}
        </p>
      )}

      {effectivePreview && (
        <Card className="p-6 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Next chat behavior
            </h3>
            <Button
              onClick={() => onNavigateToTab('personality')}
              variant="ghost"
              size="sm"
              className="text-gray-700 dark:text-gray-300"
            >
              <Settings2 className="w-4 h-4 mr-1" />
              Adjust
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Communication</p>
              <p>
                {capitalize(effectivePreview.communication.tone)} ·{' '}
                {capitalize(effectivePreview.communication.verbosity)}
              </p>
              {effectivePreview.communication.styleSummary && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                  {effectivePreview.communication.styleSummary}
                </p>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">Responses</p>
              <p>
                {capitalize(effectivePreview.response.structure)} ·{' '}
                {capitalize(effectivePreview.response.recommendationStyle)} recommendations
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Provider: {effectivePreview.provider.provider}
                {effectivePreview.provider.modelLabel
                  ? ` · ${effectivePreview.provider.modelLabel}`
                  : ''}
              </p>
            </div>
          </div>
          {effectivePreview.actionBoundaries.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                Action limits (not chat tone)
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {effectivePreview.actionBoundaries.slice(0, 4).map((line) => (
                  <li key={line} className="line-clamp-1">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!effectivePreview.setup.hasPersonalityProfile && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-4">
              Complete your personality profile for more accurate style matching.
            </p>
          )}
        </Card>
      )}

      {isEmpty ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Nothing saved yet</h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Chat with your AI or add memories below to build what it knows about you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => setShowAddFact(true)} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add a memory
            </Button>
            <Button onClick={() => onNavigateToTab('context')} variant="secondary">
              <MessageSquare className="w-4 h-4 mr-2" />
              Custom Context
            </Button>
            <Button onClick={() => onNavigateToTab('personality')} variant="secondary">
              <User className="w-4 h-4 mr-2" />
              Personality
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Structured memory facts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Long-term memories</h3>
          <Button
            onClick={() => setShowAddFact((v) => !v)}
            variant="ghost"
            size="sm"
            className="text-gray-700 dark:text-gray-300"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
        {showAddFact && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg space-y-3">
            <Input
              placeholder="Subject (e.g. Diet)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <Textarea
              placeholder="What should the AI remember?"
              value={newPredicate}
              onChange={(e) => setNewPredicate(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => void handleAddMemoryFact()}
                variant="primary"
                size="sm"
                disabled={addingFact || !newSubject.trim() || !newPredicate.trim()}
              >
                {addingFact ? 'Saving…' : 'Save memory'}
              </Button>
              <Button onClick={() => setShowAddFact(false)} variant="secondary" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}
        {memoryFacts.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No structured memories yet. Say &quot;remember that…&quot; in chat or add one above.
          </p>
        ) : (
          <ul className="space-y-2">
            {memoryFacts.map((fact) => (
              <li
                key={fact.id}
                className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 flex justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{fact.subject}</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{fact.predicate}</p>
                </div>
                <Button
                  onClick={() => void handleDeleteMemoryFact(fact.id)}
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === fact.id}
                  aria-label="Delete memory"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {pendingLearnings.length > 0 && (
        <Card className="p-6 border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Waiting for your approval
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            The AI noticed these from recent chats. They are not used until you save them.
          </p>
          <ul className="space-y-2">
            {pendingLearnings.map((item) => (
              <li
                key={item.id}
                className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-100 flex flex-col sm:flex-row sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {item.title}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.content}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={deletingId === item.id}
                    onClick={() => void handleReviewPending(item.id, 'promote')}
                  >
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={deletingId === item.id}
                    onClick={() => void handleReviewPending(item.id, 'dismiss')}
                  >
                    Dismiss
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Learned from conversations */}
      {learnedContexts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Learned from conversations
          </h3>
          <ul className="space-y-2">
            {learnedContexts.map((item) => (
              <li
                key={item.id}
                className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 flex justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.title}</span>
                    <Badge size="sm" color="green">
                      From chat
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{item.content}</p>
                </div>
                <Button
                  onClick={() => void handleDeleteContext(item.id)}
                  variant="ghost"
                  size="sm"
                  disabled={deletingId === item.id}
                  aria-label="Remove learned item"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </Button>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
            Removing an item stops the AI from using it in future chats.
          </p>
        </Card>
      )}

      {hasAnyContext && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Your context entries</h3>
            <Button
              onClick={() => onNavigateToTab('context')}
              variant="ghost"
              size="sm"
              className="text-gray-700 dark:text-gray-300"
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
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-purple-600" />
                    {label}
                  </h4>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 flex justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {item.title}
                            </span>
                            <Badge size="sm" color="blue">
                              You added
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {item.content}
                          </p>
                        </div>
                        <Button
                          onClick={() => void handleDeleteContext(item.id)}
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === item.id}
                          aria-label="Delete context"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Personality</h3>
          <Button
            onClick={() => onNavigateToTab('personality')}
            variant="ghost"
            size="sm"
            className="text-gray-700 dark:text-gray-300"
          >
            Edit
          </Button>
        </div>
        {hasPersonality ? (
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {personality.data?.traits && Object.keys(personality.data.traits).length > 0 && (
              <p>
                <span className="font-medium text-gray-900 dark:text-gray-100">Traits:</span>{' '}
                {Object.entries(personality.data.traits)
                  .slice(0, 4)
                  .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').trim()}: ${v}`)
                  .join(', ')}
              </p>
            )}
            {personality.lastUpdated && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Last updated: {new Date(personality.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              No personality profile yet.
            </p>
            <Button onClick={() => onNavigateToTab('personality')} variant="secondary" size="sm">
              <User className="w-4 h-4 mr-2" />
              Set up Personality
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Learned patterns
        </h3>
        {patterns.length > 0 ? (
          <ul className="space-y-2">
            {patterns.map((p) => (
              <li
                key={p.id}
                className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 text-sm text-gray-700 dark:text-gray-300"
              >
                {p.description}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No patterns yet. Keep using the AI and it will learn your habits over time.
          </p>
        )}
      </Card>
    </div>
  );
}
