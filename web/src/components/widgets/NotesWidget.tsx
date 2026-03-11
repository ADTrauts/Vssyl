'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Plus } from 'lucide-react';
import { Button, Spinner, Alert } from 'shared/components';
import { getNotes } from '../../api/notes';
import type { Note } from '../../api/notes';

interface NotesWidgetProps {
  id: string;
  config?: NotesWidgetConfig;
  onConfigChange?: (config: NotesWidgetConfig) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
  businessId?: string | null;
}

interface NotesWidgetConfig {
  maxNotesToShow: number;
}

const defaultConfig: NotesWidgetConfig = {
  maxNotesToShow: 5,
};

export default function NotesWidget({
  config = defaultConfig,
  dashboardId,
  dashboardType,
  dashboardName,
  businessId = null,
}: NotesWidgetProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);

  const safeConfig = config || defaultConfig;

  useEffect(() => {
    if (!session?.accessToken || !dashboardId) return;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await getNotes(session.accessToken, {
          dashboardId,
          businessId: dashboardType === 'business' ? businessId ?? undefined : null,
        });
        setNotes(list.slice(0, safeConfig.maxNotesToShow));
      } catch (err) {
        const name = dashboardName || 'dashboard';
        setError(`Failed to load ${name} notes`);
        console.error('Error loading notes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [session?.accessToken, dashboardId, dashboardType, businessId, safeConfig.maxNotesToShow, dashboardName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size={24} />
        <span className="ml-2 text-gray-700">Loading notes...</span>
      </div>
    );
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => (window.location.href = '/notes')}
          className="flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span>New note</span>
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-6 text-gray-700 text-sm">
          No notes yet. Create one to get started.
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                onClick={() => (window.location.href = '/notes')}
                className="w-full text-left flex items-start gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {note.title || 'Untitled note'}
                  </p>
                  {note.tags && note.tags.length > 0 && (
                    <p className="text-xs text-gray-600 truncate">{note.tags.join(', ')}</p>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {notes.length > 0 && (
        <Button size="sm" variant="ghost" onClick={() => (window.location.href = '/notes')} className="w-full">
          Open Notes
        </Button>
      )}
    </div>
  );
}
