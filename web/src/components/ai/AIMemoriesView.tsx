'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, Button, Spinner, Badge, Input, Textarea, ConfirmModal } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';
import {
  listMemoryFacts,
  createMemoryFact,
  updateMemoryFact,
  deleteMemoryFact,
  memoryFactCategoryLabel,
  memoryFactSourceLabel,
  memoryFactWhyExplanation,
  isMemoryFactPinned,
  MEMORY_PINNED_CONFIDENCE,
  type UserMemoryFact,
  type MemoryFactCategory,
  type MemoryFactSourceType,
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
  ChevronDown,
  ChevronUp,
  Pencil,
  Pin,
} from 'lucide-react';
import type { AIMoreSection } from '../../lib/aiControlCenterTabs';
import { useDashboard } from '../../contexts/DashboardContext';
import { resolveBusinessIdFromDashboard } from '../../lib/resolveBusinessIdFromDashboard';

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

const MEMORY_CATEGORY_OPTIONS: MemoryFactCategory[] = [
  'preference',
  'person',
  'project',
  'constraint',
  'location',
  'other',
];

const MEMORY_SOURCE_OPTIONS: MemoryFactSourceType[] = [
  'explicit_user',
  'remember_that',
  'inferred_chat',
  'questionnaire',
  'import',
];

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : '';
}

function dateInputToIso(date: string): string | null {
  if (!date.trim()) return null;
  return new Date(`${date}T23:59:59.000Z`).toISOString();
}

export default function AIMemoriesView({ onNavigateToTab }: AIMemoriesViewProps) {
  const { data: session } = useSession();
  const { currentDashboard, getDashboardType } = useDashboard();
  const businessId = currentDashboard
    ? resolveBusinessIdFromDashboard(currentDashboard, getDashboardType(currentDashboard))
    : undefined;
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
  const [expandedFactId, setExpandedFactId] = useState<string | null>(null);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editPredicate, setEditPredicate] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryFactCategory>('other');
  const [editExpiresAt, setEditExpiresAt] = useState('');
  const [savingFactId, setSavingFactId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<MemoryFactCategory>('other');
  const [newExpiresAt, setNewExpiresAt] = useState('');
  const [filterCategory, setFilterCategory] = useState<MemoryFactCategory | ''>('');
  const [filterSource, setFilterSource] = useState<MemoryFactSourceType | ''>('');
  const [filterScope, setFilterScope] = useState<'personal' | 'business' | ''>('');
  const [pendingMemoryToForget, setPendingMemoryToForget] = useState<{
    id: string;
    subject: string;
  } | null>(null);

  const buildListOptions = () => {
    const options: Parameters<typeof listMemoryFacts>[1] = {};
    if (businessId) {
      if (filterScope === 'business') {
        options.scope = 'business';
        options.businessId = businessId;
      } else if (filterScope === 'personal') {
        options.scope = 'personal';
      } else {
        options.businessId = businessId;
      }
    } else if (filterScope) {
      options.scope = filterScope;
    }
    if (filterCategory) options.category = filterCategory;
    if (filterSource) options.sourceType = filterSource;
    return Object.keys(options).length > 0 ? options : undefined;
  };

  useEffect(() => {
    if (session?.accessToken) {
      void loadData();
    }
  }, [session?.accessToken, businessId, filterCategory, filterSource, filterScope]);

  const loadData = async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const token = session.accessToken;
      const [contextRes, patternsRes, facts] = await Promise.all([
        authenticatedApiCall<{ success: boolean; data: UserAIContextItem[] }>(
          '/api/ai/user-context',
          { method: 'GET' },
          token
        ),
        authenticatedApiCall<{ success: boolean; patterns: LearnedPatternSummary[] }>(
          '/api/ai/learning/my-patterns',
          { method: 'GET' },
          token
        ).catch(() => ({ success: false, patterns: [] as LearnedPatternSummary[] })),
        listMemoryFacts(token, buildListOptions()).catch(
          () => [] as UserMemoryFact[]
        ),
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
      await authenticatedApiCall(`/api/ai/user-context/${id}`, { method: 'DELETE' }, session.accessToken);
      setContexts((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Failed to delete context:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleForgetMemoryFact = (id: string, subject: string) => {
    if (!session?.accessToken) return;
    setPendingMemoryToForget({ id, subject });
  };

  const executeForgetMemoryFact = async () => {
    const pending = pendingMemoryToForget;
    if (!session?.accessToken || !pending) return;

    const { id } = pending;
    setDeletingId(id);
    try {
      await deleteMemoryFact(session.accessToken, id);
      setMemoryFacts((prev) => prev.filter((f) => f.id !== id));
      if (editingFactId === id) setEditingFactId(null);
      if (expandedFactId === id) setExpandedFactId(null);
      setPendingMemoryToForget(null);
    } catch (err) {
      console.error('Failed to forget memory fact:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const startEditMemoryFact = (fact: UserMemoryFact) => {
    setEditingFactId(fact.id);
    setEditSubject(fact.subject);
    setEditPredicate(fact.predicate);
    setEditCategory(fact.category);
    setEditExpiresAt(toDateInputValue(fact.expiresAt));
    setExpandedFactId(null);
  };

  const cancelEditMemoryFact = () => {
    setEditingFactId(null);
    setEditSubject('');
    setEditPredicate('');
    setEditCategory('other');
    setEditExpiresAt('');
  };

  const handleSaveMemoryFactEdit = async (id: string) => {
    if (!session?.accessToken || !editSubject.trim() || !editPredicate.trim()) return;
    setSavingFactId(id);
    try {
      const updated = await updateMemoryFact(session.accessToken, id, {
        subject: editSubject.trim(),
        predicate: editPredicate.trim(),
        category: editCategory,
        expiresAt: dateInputToIso(editExpiresAt),
      });
      setMemoryFacts((prev) => prev.map((f) => (f.id === id ? updated : f)));
      cancelEditMemoryFact();
    } catch (err) {
      console.error('Failed to update memory fact:', err);
    } finally {
      setSavingFactId(null);
    }
  };

  const handleTogglePin = async (fact: UserMemoryFact) => {
    if (!session?.accessToken) return;
    const pinned = isMemoryFactPinned(fact);
    setSavingFactId(fact.id);
    try {
      const updated = await updateMemoryFact(session.accessToken, fact.id, {
        confidence: pinned ? 0.85 : MEMORY_PINNED_CONFIDENCE,
      });
      setMemoryFacts((prev) => prev.map((f) => (f.id === fact.id ? updated : f)));
    } catch (err) {
      console.error('Failed to pin memory fact:', err);
    } finally {
      setSavingFactId(null);
    }
  };

  const handleAddMemoryFact = async () => {
    if (!session?.accessToken || !newSubject.trim() || !newPredicate.trim()) return;
    setAddingFact(true);
    try {
      const fact = await createMemoryFact(session.accessToken, {
        subject: newSubject.trim(),
        predicate: newPredicate.trim(),
        category: newCategory,
        expiresAt: dateInputToIso(newExpiresAt),
        ...(businessId ? { scope: 'business' as const, businessId } : {}),
      });
      setMemoryFacts((prev) => [fact, ...prev]);
      setNewSubject('');
      setNewPredicate('');
      setNewCategory('other');
      setNewExpiresAt('');
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
    <>
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
            onClick={() => onNavigateToTab('suggestions')}
          >
            Suggestions
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
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Category
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryFactCategory)}
                  className="mt-1 block w-full rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm px-2 py-1.5"
                >
                  {MEMORY_CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {memoryFactCategoryLabel(c)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-600 dark:text-gray-400">
                Expires (optional)
                <Input
                  type="date"
                  value={newExpiresAt}
                  onChange={(e) => setNewExpiresAt(e.target.value)}
                  className="mt-1"
                />
              </label>
            </div>
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
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value as MemoryFactSourceType | '')}
            className="text-sm rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5"
            aria-label="Filter by source"
          >
            <option value="">All sources</option>
            {MEMORY_SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {memoryFactSourceLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as MemoryFactCategory | '')}
            className="text-sm rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {MEMORY_CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {memoryFactCategoryLabel(c)}
              </option>
            ))}
          </select>
          {businessId ? (
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value as 'personal' | 'business' | '')}
              className="text-sm rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5"
              aria-label="Filter by scope"
            >
              <option value="">Personal + workspace</option>
              <option value="personal">Personal only</option>
              <option value="business">This workspace only</option>
            </select>
          ) : null}
        </div>
        {memoryFacts.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filterCategory || filterSource || filterScope
              ? 'No memories match these filters.'
              : 'No structured memories yet. Say "remember that…" in chat or add one above.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {memoryFacts.map((fact) => {
              const pinned = isMemoryFactPinned(fact);
              const isEditing = editingFactId === fact.id;
              return (
              <li
                key={fact.id}
                id={`fact-${fact.id}`}
                className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 flex justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder="Topic"
                      />
                      <Textarea
                        value={editPredicate}
                        onChange={(e) => setEditPredicate(e.target.value)}
                        rows={3}
                      />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as MemoryFactCategory)}
                          className="text-sm rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5"
                        >
                          {MEMORY_CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {memoryFactCategoryLabel(c)}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="date"
                          value={editExpiresAt}
                          onChange={(e) => setEditExpiresAt(e.target.value)}
                          aria-label="Expiration date"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={
                            savingFactId === fact.id ||
                            !editSubject.trim() ||
                            !editPredicate.trim()
                          }
                          onClick={() => void handleSaveMemoryFactEdit(fact.id)}
                        >
                          {savingFactId === fact.id ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={cancelEditMemoryFact}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {fact.subject}
                    </span>
                    {pinned && (
                      <Badge size="sm" color="yellow">
                        Pinned
                      </Badge>
                    )}
                    <Badge size="sm" color={fact.isExplicit ? 'blue' : 'gray'}>
                      {memoryFactSourceLabel(fact.sourceType)}
                    </Badge>
                    {fact.category !== 'other' && (
                      <Badge size="sm" color="gray">
                        {memoryFactCategoryLabel(fact.category)}
                      </Badge>
                    )}
                    {fact.scope === 'business' && (
                      <Badge size="sm" color="gray">
                        Workspace
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{fact.predicate}</p>
                  {fact.expiresAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Expires {new Date(fact.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFactId((current) => (current === fact.id ? null : fact.id))
                    }
                    className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2"
                    aria-expanded={expandedFactId === fact.id}
                  >
                    Why I remembered this
                    {expandedFactId === fact.id ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                  {expandedFactId === fact.id && (
                    <div className="mt-2 p-2 rounded-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      <p>{memoryFactWhyExplanation(fact)}</p>
                      {fact.sourceConversationId && (
                        <Link
                          href={`/ai-chat?conversation=${encodeURIComponent(fact.sourceConversationId)}`}
                          className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Open source conversation
                        </Link>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>
                {!isEditing && (
                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    onClick={() => startEditMemoryFact(fact)}
                    variant="ghost"
                    size="sm"
                    aria-label="Edit memory"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    onClick={() => void handleTogglePin(fact)}
                    variant="ghost"
                    size="sm"
                    disabled={savingFactId === fact.id}
                    aria-label={pinned ? 'Unpin memory' : 'Pin memory'}
                  >
                    <Pin
                      className={`w-4 h-4 ${pinned ? 'text-amber-500 fill-amber-500' : 'text-gray-500'}`}
                    />
                  </Button>
                  <Button
                    onClick={() => void handleForgetMemoryFact(fact.id, fact.subject)}
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === fact.id}
                    aria-label="Forget memory"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
                )}
              </li>
            );
            })}
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

    <ConfirmModal
      open={pendingMemoryToForget !== null}
      onClose={() => setPendingMemoryToForget(null)}
      onConfirm={executeForgetMemoryFact}
      title="Forget memory?"
      description={
        pendingMemoryToForget
          ? `Forget “${pendingMemoryToForget.subject}”? Your twin will stop using this in future replies.`
          : ''
      }
      variant="destructive"
      confirmLabel="Forget"
      loading={
        pendingMemoryToForget !== null &&
        deletingId === pendingMemoryToForget.id
      }
    />
    </>
  );
}
