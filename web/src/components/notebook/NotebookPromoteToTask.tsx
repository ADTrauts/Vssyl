'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, Input, Textarea, Modal } from 'shared/components';
import { ListPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as todoAPI from '@/api/todo';
import * as notebookLinksAPI from '@/api/notebookLinks';
import type { CreateTaskInput } from '@/api/todo';

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

interface NotebookPromoteToTaskProps {
  dashboardId: string;
  businessId?: string | null;
  pageId?: string;
  pageTitle?: string;
  pageContent?: string;
  onTaskCreated?: () => void;
}

export function NotebookPromoteToTask({
  dashboardId,
  businessId,
  pageId,
  pageTitle,
  pageContent,
  onTaskCreated,
}: NotebookPromoteToTaskProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const openModal = () => {
    const selection = getTextareaSelection();
    const firstLine =
      selection ||
      (pageContent || '')
        .split('\n')
        .map((l) => l.replace(/^[-*#\s\[\]x]+/i, '').trim())
        .find((l) => l.length > 0) ||
      pageTitle ||
      'New task';
    setTitle(firstLine.slice(0, 200));
    setDescription(selection ? '' : (pageContent || '').slice(0, 2000));
    setOpen(true);
  };

  const handleCreate = async () => {
    if (!session?.accessToken || !title.trim()) return;
    setSaving(true);
    try {
      const input: CreateTaskInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        dashboardId,
        businessId: businessId ?? undefined,
        status: 'TODO',
        priority: 'MEDIUM',
      };
      const task = await todoAPI.createTask(session.accessToken, input);
      if (pageId) {
        try {
          const snippet = description.trim() || title.trim();
          let calendarEventId: string | undefined;
          try {
            const eventLinks = await notebookLinksAPI.getPageLinks(session.accessToken, pageId, {
              targetType: 'CALENDAR_EVENT',
            });
            calendarEventId = eventLinks.links[0]?.targetId;
          } catch {
            calendarEventId = undefined;
          }
          const linkMeta: Record<string, unknown> = {
            actionSource: 'promote_to_task',
            ...(snippet ? { promotedText: snippet.slice(0, 500) } : {}),
            ...(calendarEventId ? { calendarEventId } : {}),
          };
          await notebookLinksAPI.createPageLink(session.accessToken, pageId, {
            targetType: 'TASK',
            targetId: task.id,
            relationshipType: 'ACTION_SOURCE',
            metadata: linkMeta,
          });
        } catch (linkErr: unknown) {
          const linkMsg = linkErr instanceof Error ? linkErr.message : 'Task created but link failed';
          toast.error(linkMsg);
        }
      }
      toast.success('Task created');
      setOpen(false);
      onTaskCreated?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={openModal} title="Create task from page content">
        <ListPlus className="w-4 h-4 inline mr-1" />
        Promote to task
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Create task from page" size="medium">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Task title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Description (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleCreate} disabled={saving || !title.trim()}>
              {saving ? 'Creating…' : 'Create task'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
