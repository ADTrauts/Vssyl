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
  BookOpen,
  MessageSquare,
  FileText,
  Heart,
  Workflow,
  Sparkles,
  Trash2,
  Plus,
} from 'lucide-react';
import type { AIMoreSection } from '../../lib/aiControlCenterTabs';

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

interface LearnedPatternSummary {
  id: string;
  description: string;
  type: string;
}

interface AIMemoriesViewProps {
  onNavigateToTab: (
    tab: string,
    options?: { section?: AIMoreSection; intel?: string; onboarding?: boolean }
  ) => void;
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
  const [patterns, setPatterns] = useState<LearnedPatternSummary[]>([]);
  const [memoryFacts, setMemoryFacts] = useState<UserMemoryFact[]>([]);
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
      const [contextRes, patternsRes, facts] = await Promise.all([
        authenticatedApiCall<{ success: boolean; data: UserAIContextItem[] }>(
          '/api/ai/context',
          { method: 'GET' },
          token
        ),
        authenticatedApiCall<{ success: boolean; patterns: LearnedPatternSummary[] }>(
          '/api/ai/learning/my-patterns',
          { method: 'GET' },
          token
        ).catch(() => ({ success: false, patterns: [] as LearnedPatternSummary[] })),
        listMemoryFacts(token).catch(() => [] as UserMemoryFact[]),
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
      if (patternsRes.success && Array.isArray(patternsRes.patterns)) {
        setPatterns(patternsRes.patterns);
      } else {
        setPatterns([]);
      }
      setMemoryFacts(facts);
    } catch (err) {
      console.error('Error loading memories:', err);
      setError('Failed to load memory. Please try again.');
      setContexts([]);
      setPatterns([]);
      setMemoryFacts([]);
    } finally {
      setLoading(false);
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
  const hasMemoryFacts = memoryFacts.length > 0;
  const isEmpty = !hasAnyContext && !hasMemoryFacts;

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
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-600" />
          Memory
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
          Durable knowledge your twin keeps across chats — facts you asked it to remember, context
          you added, and learnings you saved from conversations. Pending suggestions live in{' '}
          <button
            type="button"
            className="text-purple-600 dark:text-purple-400 underline-offset-2 hover:underline"
            onClick={() => onNavigateToTab('learning')}
          >
            Learning
          </button>
          .
        </p>
      </div>

      {isEmpty ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Nothing saved yet
          </h3>
          <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-md mx-auto">
            Chat with your twin, say &quot;remember that…&quot;, or add a memory below.
          </p>
          <Button onClick={() => setShowAddFact(true)} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Add a memory
          </Button>
        </Card>
      ) : null}

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
              placeholder="Topic (e.g. Travel preferences)"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <Textarea
              placeholder="What should your twin remember?"
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
                  <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {fact.subject}
                  </span>
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

      {learnedContexts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Saved from conversations
          </h3>
          <ul className="space-y-2">
            {learnedContexts.map((item) => (
              <li
                key={item.id}
                className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 flex justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {item.title}
                    </span>
                    <Badge size="sm" color="green">
                      Permanent
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
                  aria-label="Remove saved learning"
                >
                  <Trash2 className="w-4 h-4 text-gray-500" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {hasAnyContext && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Your context & instructions
          </h3>
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
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {item.title}
                          </span>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Patterns over time
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
            Patterns emerge as you use your twin — a quiet signal of how you work.
          </p>
        )}
      </Card>
    </div>
  );
}
