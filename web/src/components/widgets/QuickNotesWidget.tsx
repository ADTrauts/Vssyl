'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StickyNote, Plus, Trash2, Pin, PinOff } from 'lucide-react';

interface QuickNotesWidgetProps {
  id: string;
  config?: QuickNotesWidgetConfig;
  onConfigChange?: (config: QuickNotesWidgetConfig) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
}

interface Note {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuickNotesWidgetConfig {
  notes: Note[];
  activeNoteId: string | null;
}

const defaultConfig: QuickNotesWidgetConfig = {
  notes: [],
  activeNoteId: null,
};

export default function QuickNotesWidget({
  id,
  config,
  onConfigChange,
  dashboardId,
  dashboardType,
  dashboardName,
}: QuickNotesWidgetProps) {
  const safeConfig = config || defaultConfig;
  const [notes, setNotes] = useState<Note[]>(safeConfig.notes || []);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    safeConfig.activeNoteId || (notes[0]?.id ?? null)
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || null;

  const saveNotes = useCallback(
    (updatedNotes: Note[], newActiveId?: string | null) => {
      if (!onConfigChange) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onConfigChange({
          notes: updatedNotes,
          activeNoteId: newActiveId !== undefined ? newActiveId : activeNoteId,
        });
      }, 500);
    },
    [onConfigChange, activeNoteId]
  );

  const createNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      content: '',
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...notes, newNote];
    setNotes(updated);
    setActiveNoteId(newNote.id);
    saveNotes(updated, newNote.id);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const updateNoteContent = (content: string) => {
    if (!activeNote) return;
    const updated = notes.map((n) =>
      n.id === activeNote.id ? { ...n, content, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updated);
    saveNotes(updated);
  };

  const togglePin = (noteId: string) => {
    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() } : n
    );
    setNotes(updated);
    saveNotes(updated);
  };

  const deleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    if (activeNoteId === noteId) {
      const newActive = updated[0]?.id || null;
      setActiveNoteId(newActive);
      saveNotes(updated, newActive);
    } else {
      saveNotes(updated);
    }
  };

  // Sort: pinned first, then by updatedAt
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Create initial note if none exist
  useEffect(() => {
    if (notes.length === 0 && onConfigChange) {
      createNote();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Note tabs */}
      <div className="flex items-center gap-1 pb-2 border-b border-gray-100 overflow-x-auto">
        {sortedNotes.map((note) => (
          <button
            key={note.id}
            onClick={() => setActiveNoteId(note.id)}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
              note.id === activeNoteId
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {note.pinned && <Pin className="w-3 h-3" />}
            {note.content.slice(0, 12) || 'Untitled'}
            {note.content.length > 12 && '...'}
          </button>
        ))}
        <button
          onClick={createNote}
          className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          title="New note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Note content */}
      {activeNote ? (
        <div className="flex-1 flex flex-col mt-2">
          <textarea
            ref={textareaRef}
            value={activeNote.content}
            onChange={(e) => updateNoteContent(e.target.value)}
            placeholder="Type your note here..."
            className="flex-1 w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            style={{ minHeight: '100px' }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {activeNote.content.length} chars
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => togglePin(activeNote.id)}
                className={`p-1 rounded hover:bg-gray-100 ${
                  activeNote.pinned ? 'text-yellow-600' : 'text-gray-500'
                }`}
                title={activeNote.pinned ? 'Unpin' : 'Pin'}
              >
                {activeNote.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
              </button>
              {notes.length > 1 && (
                <button
                  onClick={() => deleteNote(activeNote.id)}
                  className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={createNote}
            className="flex items-center gap-2 px-4 py-2 text-sm text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg"
          >
            <StickyNote className="w-4 h-4" />
            Create your first note
          </button>
        </div>
      )}
    </div>
  );
}
