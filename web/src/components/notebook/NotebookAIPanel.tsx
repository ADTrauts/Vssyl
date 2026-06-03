'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input } from 'shared/components';
import { Sparkles, ListChecks, FileText, Link2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as notebookAI from '@/api/notebookAI';
import type { NotebookActionItemProposal } from '@/api/notebookAI';

interface NotebookAIPanelProps {
  pageId: string;
  onTasksChanged?: () => void;
}

function getTextareaSelection(): string {
  if (typeof document === 'undefined') return '';
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement) {
    const { selectionStart, selectionEnd, value } = active;
    if (selectionStart !== selectionEnd) {
      return value.slice(selectionStart, selectionEnd).trim();
    }
  }
  return '';
}

export function NotebookAIPanel({ pageId, onTasksChanged }: NotebookAIPanelProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);
  const [summary, setSummary] = useState<notebookAI.NotebookPageSummaryResult | null>(null);
  const [proposals, setProposals] = useState<NotebookActionItemProposal[]>([]);
  const [recap, setRecap] = useState<notebookAI.NotebookMeetingRecapResult | null>(null);
  const [suggestions, setSuggestions] = useState<notebookAI.NotebookLinkSuggestion[]>([]);
  const [confirming, setConfirming] = useState(false);

  const run = async (key: string, fn: () => Promise<void>) => {
    if (!session?.accessToken) return;
    setLoading(key);
    try {
      await fn();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setLoading(null);
    }
  };

  const handleSummarize = () =>
    run('summary', async () => {
      const result = await notebookAI.summarizePage(session!.accessToken!, pageId);
      setSummary(result);
      if (result.warnings.length) {
        toast(result.warnings[0], { icon: '⚠️' });
      }
    });

  const handleExtract = () =>
    run('extract', async () => {
      const selection = getTextareaSelection();
      const result = await notebookAI.extractActionItems(session!.accessToken!, pageId, {
        selectedText: selection || undefined,
      });
      setProposals(result.proposals);
      if (!result.proposals.length) toast('No action items found');
    });

  const handleRecap = () =>
    run('recap', async () => {
      const result = await notebookAI.meetingRecap(session!.accessToken!, pageId);
      setRecap(result);
    });

  const handleSuggest = () =>
    run('suggest', async () => {
      const result = await notebookAI.suggestLinks(session!.accessToken!, pageId);
      setSuggestions(result.suggestions);
    });

  const handleConfirm = async () => {
    if (!session?.accessToken || !proposals.length) return;
    setConfirming(true);
    try {
      const result = await notebookAI.confirmActionItems(
        session.accessToken,
        pageId,
        proposals.map(({ title, description, dueDate, priority }) => ({
          title,
          description,
          dueDate,
          priority,
        }))
      );
      if (result.created.length) {
        toast.success(`Created ${result.created.length} task(s)`);
        setProposals([]);
        onTasksChanged?.();
      }
      if (result.errors.length) {
        toast.error(result.errors.map((e) => e.error).join('; '));
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create tasks');
    } finally {
      setConfirming(false);
    }
  };

  const updateProposal = (index: number, field: 'title' | 'dueDate', value: string) => {
    setProposals((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value || (field === 'title' ? '' : null) } : p))
    );
  };

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 flex flex-col min-h-0 max-h-64 overflow-y-auto">
      <div className="px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5" />
        Notebook AI
      </div>
      <div className="px-2 pb-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs"
          disabled={!!loading}
          onClick={handleSummarize}
        >
          {loading === 'summary' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
          <span className="ml-1">Summarize</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs"
          disabled={!!loading}
          onClick={handleExtract}
        >
          {loading === 'extract' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ListChecks className="w-3 h-3" />}
          <span className="ml-1">Extract</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs"
          disabled={!!loading}
          onClick={handleRecap}
        >
          {loading === 'recap' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          <span className="ml-0.5">Recap</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="text-xs"
          disabled={!!loading}
          onClick={handleSuggest}
        >
          {loading === 'suggest' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
          <span className="ml-1">Suggest</span>
        </Button>
      </div>

      {summary && (
        <div className="px-2 pb-2 text-xs text-gray-700 dark:text-gray-300 space-y-1">
          <p className="font-medium">Summary</p>
          <p className="whitespace-pre-wrap">{summary.summary}</p>
          {summary.keyDecisions.length > 0 && (
            <ul className="list-disc pl-4">
              {summary.keyDecisions.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {proposals.length > 0 && (
        <div className="px-2 pb-2 space-y-2">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Proposed tasks</p>
          {proposals.map((p, i) => (
            <div key={i} className="space-y-1">
              <Input
                value={p.title}
                onChange={(e) => updateProposal(i, 'title', e.target.value)}
                className="text-xs"
              />
              <Input
                value={p.dueDate ?? ''}
                onChange={(e) => updateProposal(i, 'dueDate', e.target.value)}
                placeholder="Due (ISO optional)"
                className="text-xs"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full text-xs"
            disabled={confirming}
            onClick={handleConfirm}
          >
            {confirming ? 'Creating…' : 'Confirm & create tasks'}
          </Button>
        </div>
      )}

      {recap && (
        <div className="px-2 pb-2 text-xs text-gray-700 dark:text-gray-300">
          <p className="font-medium">Meeting recap</p>
          <p className="whitespace-pre-wrap mt-1">{recap.recap}</p>
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="px-2 pb-2 text-xs space-y-1">
          {suggestions.map((s) => (
            <li key={`${s.targetType}-${s.targetId}`} className="text-gray-600 dark:text-gray-400">
              <span className="font-medium">{s.label}</span> — {s.reason}
            </li>
          ))}
          <li className="text-gray-500 italic">Link manually from the panels below.</li>
        </ul>
      )}
    </div>
  );
}
