'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import { Button, Card, Input, Textarea, Spinner, Modal } from 'shared/components';
import { Plus, Pin, PinOff, Search, FileEdit, Eye, FolderPlus, Share2, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDashboard } from '@/contexts/DashboardContext';
import * as notesAPI from '@/api/notes';
import type { Note, NoteFolder, NoteShareEntry } from '@/api/notes';

interface NotesModuleProps {
  dashboardId?: string | null;
  businessId?: string | null;
}

const NOTE_TEMPLATES = [
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    title: 'Meeting notes',
    content: `## Meeting
**Date:** 
**Attendees:** 

## Agenda
- 

## Notes
- 

## Action items
- [ ] 
- [ ] 
`,
  },
  {
    id: 'daily-standup',
    name: 'Daily standup',
    title: 'Daily standup',
    content: `## Standup — [Date]

### Yesterday
- 

### Today
- 

### Blockers
- 
`,
  },
  {
    id: 'project-brief',
    name: 'Project brief',
    title: 'Project brief',
    content: `## Project brief

### Overview
 

### Goals
- 

### Scope
- In scope: 
- Out of scope: 

### Timeline
- 

### Success criteria
- 
`,
  },
  {
    id: 'blank',
    name: 'Blank',
    title: 'Untitled note',
    content: '',
  },
] as const;

export function NotesModule({ dashboardId, businessId }: NotesModuleProps) {
  const { data: session } = useSession();
  const { currentDashboardId } = useDashboard();
  const effectiveDashboardId = dashboardId || currentDashboardId;

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sharedWithMe, setSharedWithMe] = useState(false);
  const [search, setSearch] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [noteShares, setNoteShares] = useState<NoteShareEntry[]>([]);
  const [shareUserQuery, setShareUserQuery] = useState('');
  const [shareUserResults, setShareUserResults] = useState<Array<{ id: string; name: string | null; email: string | null }>>([]);
  const [sharing, setSharing] = useState(false);
  const [noteDetail, setNoteDetail] = useState<(Note & { canEdit?: boolean; isOwner?: boolean }) | null>(null);
  const [creating, setCreating] = useState(false);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  const loadFolders = useCallback(async () => {
    if (!session?.accessToken || !effectiveDashboardId) return;
    setFoldersLoading(true);
    try {
      const list = await notesAPI.getFolders(session.accessToken, {
        dashboardId: effectiveDashboardId,
        businessId: businessId ?? undefined,
      });
      setFolders(list);
    } catch (err) {
      console.error('Failed to load folders:', err);
      toast.error('Failed to load folders');
    } finally {
      setFoldersLoading(false);
    }
  }, [session?.accessToken, effectiveDashboardId, businessId]);

  const loadNotes = useCallback(async () => {
    if (!session?.accessToken || !effectiveDashboardId) return;

    setLoading(true);
    try {
      const list = await notesAPI.getNotes(session.accessToken, {
        dashboardId: effectiveDashboardId,
        businessId: businessId ?? undefined,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(sharedWithMe ? { sharedWithMe: true } : {}),
        ...(!sharedWithMe && selectedFolderId !== null
          ? { folderId: selectedFolderId === '' ? 'none' : selectedFolderId }
          : {}),
      });
      setNotes(list);
      setSelectedNote((prev) => (prev && list.some((n) => n.id === prev.id) ? prev : null));
    } catch (err) {
      console.error('Failed to load notes:', err);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken, effectiveDashboardId, businessId, search, selectedFolderId, sharedWithMe]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditContent(selectedNote.content);
      setEditTags(selectedNote.tags ?? []);
      setEditFolderId(selectedNote.folderId ?? null);
      setViewMode('edit');
      setNoteDetail(null);
      const fetchDetail = async () => {
        if (!session?.accessToken) return;
        try {
          const detail = await notesAPI.getNoteById(session.accessToken, selectedNote.id);
          if (detail) setNoteDetail(detail as Note & { canEdit?: boolean; isOwner?: boolean });
        } catch {
          setNoteDetail(selectedNote);
        }
      };
      fetchDetail();
    } else {
      setNoteDetail(null);
    }
  }, [selectedNote, session?.accessToken]);

  const handleCreate = async () => {
    if (!session?.accessToken || !effectiveDashboardId) return;

    setCreating(true);
    try {
      const created = await notesAPI.createNote(session.accessToken, {
        title: 'Untitled note',
        content: '',
        dashboardId: effectiveDashboardId,
        businessId: businessId ?? undefined,
        folderId: selectedFolderId && selectedFolderId !== '' ? selectedFolderId : undefined,
      });
      setNotes((prev) => [created, ...prev]);
      setSelectedNote(created);
      setEditTitle(created.title);
      setEditContent(created.content);
      setEditTags(created.tags ?? []);
      setEditFolderId(created.folderId ?? null);
    } catch (err) {
      console.error('Failed to create note:', err);
      toast.error('Failed to create note');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFromTemplate = async (template: (typeof NOTE_TEMPLATES)[number]) => {
    if (!session?.accessToken || !effectiveDashboardId) return;
    setCreatingFromTemplate(true);
    try {
      const created = await notesAPI.createNote(session.accessToken, {
        title: template.title,
        content: template.content,
        dashboardId: effectiveDashboardId,
        businessId: businessId ?? undefined,
        folderId: selectedFolderId && selectedFolderId !== '' ? selectedFolderId : undefined,
      });
      setNotes((prev) => [created, ...prev]);
      setSelectedNote(created);
      setEditTitle(created.title);
      setEditContent(created.content);
      setEditTags(created.tags ?? []);
      setEditFolderId(created.folderId ?? null);
      setTemplateModalOpen(false);
      toast.success('Note created from template');
    } catch (err) {
      console.error('Failed to create note from template:', err);
      toast.error('Failed to create note');
    } finally {
      setCreatingFromTemplate(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!session?.accessToken || !effectiveDashboardId) return;
    const name = typeof window !== 'undefined' ? window.prompt('Folder name') : null;
    if (!name?.trim()) return;
    setCreatingFolder(true);
    try {
      await notesAPI.createFolder(session.accessToken, {
        name: name.trim(),
        dashboardId: effectiveDashboardId,
        businessId: businessId ?? undefined,
      });
      await loadFolders();
      toast.success('Folder created');
    } catch (err) {
      console.error('Failed to create folder:', err);
      toast.error('Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  useEffect(() => {
    if (shareModalOpen && selectedNote && session?.accessToken) {
      notesAPI.getNoteShares(session.accessToken, selectedNote.id).then(setNoteShares).catch(() => toast.error('Failed to load shares'));
    } else {
      setNoteShares([]);
    }
  }, [shareModalOpen, selectedNote?.id, session?.accessToken]);

  const handleShareUserSearch = useCallback(async () => {
    if (shareUserQuery.trim().length < 2) {
      setShareUserResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/user/search?query=${encodeURIComponent(shareUserQuery.trim())}`, {
        headers: { Authorization: `Bearer ${session?.accessToken}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) setShareUserResults(data.data);
      else setShareUserResults([]);
    } catch {
      setShareUserResults([]);
    }
  }, [shareUserQuery, session?.accessToken]);

  const handleAddShare = async (sharedWithUserId: string, role: 'viewer' | 'editor') => {
    if (!session?.accessToken || !selectedNote) return;
    setSharing(true);
    try {
      await notesAPI.shareNote(session.accessToken, selectedNote.id, sharedWithUserId, role);
      const list = await notesAPI.getNoteShares(session.accessToken, selectedNote.id);
      setNoteShares(list);
      setShareUserQuery('');
      setShareUserResults([]);
      toast.success('Note shared');
    } catch (err) {
      toast.error('Failed to share note');
    } finally {
      setSharing(false);
    }
  };

  const handleRevokeShare = async (targetUserId: string) => {
    if (!session?.accessToken || !selectedNote) return;
    try {
      await notesAPI.revokeNoteShare(session.accessToken, selectedNote.id, targetUserId);
      setNoteShares((prev) => prev.filter((s) => s.sharedWithUserId !== targetUserId));
      toast.success('Share removed');
    } catch {
      toast.error('Failed to revoke share');
    }
  };

  const handleNoteFolderChange = async (folderId: string | null) => {
    if (!session?.accessToken || !selectedNote) return;
    setEditFolderId(folderId);
    try {
      const updated = await notesAPI.updateNote(session.accessToken, selectedNote.id, {
        folderId: folderId ?? null,
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
    } catch (err) {
      console.error('Failed to move note:', err);
      toast.error('Failed to move note');
      setEditFolderId(selectedNote.folderId ?? null);
    }
  };

  const handleSave = async () => {
    if (!session?.accessToken || !selectedNote) return;

    setSaving(true);
    try {
      const updated = await notesAPI.updateNote(session.accessToken, selectedNote.id, {
        title: editTitle.trim() || 'Untitled note',
        content: editContent,
        tags: editTags,
        folderId: editFolderId ?? null,
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
      toast.success('Note saved');
    } catch (err) {
      console.error('Failed to save note:', err);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!session?.accessToken || !selectedNote) return;
    if (!confirm('Delete this note?')) return;

    try {
      await notesAPI.deleteNote(session.accessToken, selectedNote.id);
      setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
      setSelectedNote(null);
      toast.success('Note deleted');
    } catch (err) {
      console.error('Failed to delete note:', err);
      toast.error('Failed to delete note');
    }
  };

  const handleTogglePin = async () => {
    if (!session?.accessToken || !selectedNote) return;

    try {
      const updated = await notesAPI.updateNote(session.accessToken, selectedNote.id, {
        pinned: !selectedNote.pinned,
      });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelectedNote(updated);
    } catch (err) {
      console.error('Failed to update pin:', err);
      toast.error('Failed to update note');
    }
  };

  if (!effectiveDashboardId) {
    return (
      <div className="p-6 text-gray-700 dark:text-gray-300">
        <p>Select a dashboard to view notes.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left: note list */}
      <div className="w-72 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:text-gray-400 text-sm"
            />
          </div>
          <div className="flex gap-1 mt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? <Spinner size={16} /> : <Plus className="w-4 h-4 inline mr-1" />}
              New note
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              title="New from template"
              onClick={() => setTemplateModalOpen(true)}
              disabled={creatingFromTemplate}
            >
              {creatingFromTemplate ? <Spinner size={16} /> : <FileText className="w-4 h-4" />}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              title="New folder"
              onClick={handleCreateFolder}
              disabled={creatingFolder}
            >
              {creatingFolder ? <Spinner size={16} /> : <FolderPlus className="w-4 h-4" />}
            </Button>
          </div>
          <div className="mt-2">
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Folder</label>
            <select
              value={sharedWithMe ? 'shared' : selectedFolderId ?? 'all'}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'shared') {
                  setSharedWithMe(true);
                  setSelectedFolderId(null);
                } else {
                  setSharedWithMe(false);
                  setSelectedFolderId(v === 'all' ? null : v === 'none' ? '' : v);
                }
              }}
              className="w-full py-1.5 px-2 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-gray-100 text-sm"
            >
              <option value="all">All notes</option>
              <option value="shared">Shared with me</option>
              <option value="none">Unfiled</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f._count != null ? `(${f._count.notes})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={24} />
            </div>
          ) : notes.length === 0 ? (
            <div className="p-4 text-center text-gray-700 dark:text-gray-300 text-sm">
              No notes yet. Create one to get started.
            </div>
          ) : (
            <ul className="py-2">
              {notes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedNote(n)}
                    className={`w-full text-left px-4 py-2.5 text-sm border-l-2 transition-colors ${
                      selectedNote?.id === n.id
                        ? 'border-blue-600 bg-blue-50 text-gray-900'
                        : 'border-transparent hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="font-medium truncate block">{n.title || 'Untitled note'}</span>
                    {n.tags && n.tags.length > 0 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate block">
                        {n.tags.join(', ')}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right: editor / empty state */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-800">
        {selectedNote ? (
          <>
            <div className="border-b border-gray-200 dark:border-slate-700 px-4 py-2 flex items-center justify-between gap-2 flex-wrap">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSave}
                placeholder="Note title"
                className="flex-1 min-w-0 text-lg font-medium border-0 border-b border-transparent focus:border-gray-300 dark:focus:border-slate-500 rounded-none"
                readOnly={noteDetail?.canEdit === false}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={editFolderId ?? 'none'}
                  onChange={(e) => {
                    const v = e.target.value;
                    handleNoteFolderChange(v === 'none' ? null : v);
                  }}
                  className="py-1.5 px-2 border border-gray-300 dark:border-slate-600 rounded text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 text-sm"
                  title="Move to folder"
                >
                  <option value="none">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                {(noteDetail?.isOwner ?? selectedNote?.isOwner) && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShareModalOpen(true)} title="Share">
                    <Share2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleTogglePin}
                  title={selectedNote.pinned ? 'Unpin' : 'Pin'}
                >
                  {selectedNote.pinned ? (
                    <PinOff className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Pin className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                  )}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={handleSave} disabled={saving || noteDetail?.canEdit === false}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                {(noteDetail?.isOwner ?? selectedNote?.isOwner) && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleDelete} className="text-red-600">
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-slate-700 px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-slate-900">
              {noteDetail?.canEdit !== false && (
                <>
                  <Button
                    type="button"
                    variant={viewMode === 'edit' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('edit')}
                  >
                    <FileEdit className="w-4 h-4 inline mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'preview' ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('preview')}
                  >
                    <Eye className="w-4 h-4 inline mr-1" />
                    Preview
                  </Button>
                </>
              )}
              {noteDetail?.canEdit === false && (
                <span className="text-sm text-gray-700 dark:text-gray-300">View only</span>
              )}
              <span className="text-xs text-gray-700 dark:text-gray-300 ml-2">
                Markdown: **bold** *italic* lists [links](url)
              </span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {viewMode === 'edit' && noteDetail?.canEdit !== false ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onBlur={handleSave}
                  placeholder="Write your note... Markdown supported: **bold**, *italic*, lists, [links](url)"
                  className="min-h-[200px] w-full resize-y text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:text-gray-400 font-mono text-sm"
                  rows={12}
                />
              ) : (
                <div className="min-h-[200px] notes-markdown max-w-none text-gray-800 dark:text-gray-200">
                  {editContent.trim() ? (
                    <ReactMarkdown
                      components={{
                        a: ({ href, children, ...props }) => (
                          <a href={href} className="text-blue-600 underline hover:text-blue-700" target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} {...props}>
                            {children}
                          </a>
                        ),
                        ul: ({ children, ...props }) => <ul className="list-disc list-inside my-2 space-y-1 text-gray-700 dark:text-gray-300" {...props}>{children}</ul>,
                        ol: ({ children, ...props }) => <ol className="list-decimal list-inside my-2 space-y-1 text-gray-700 dark:text-gray-300" {...props}>{children}</ol>,
                        h1: ({ children, ...props }) => <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-2" {...props}>{children}</h1>,
                        h2: ({ children, ...props }) => <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-3 mb-2" {...props}>{children}</h2>,
                        h3: ({ children, ...props }) => <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-2 mb-1" {...props}>{children}</h3>,
                        p: ({ children, ...props }) => <p className="my-2 text-gray-700 dark:text-gray-300" {...props}>{children}</p>,
                        strong: ({ children, ...props }) => <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>{children}</strong>,
                        code: ({ children, ...props }) => <code className="bg-gray-100 dark:bg-slate-700 text-gray-800 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>,
                      }}
                    >
                      {editContent}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">Nothing to preview. Switch to Edit to write.</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-700 dark:text-gray-300 p-8">
            <div className="text-center">
              <p className="text-lg font-medium mb-1">Select a note or create one</p>
              <p className="text-sm mb-4">Use the list on the left to open a note, or click New note.</p>
              <Button type="button" variant="primary" onClick={handleCreate} disabled={creating}>
                <Plus className="w-4 h-4 inline mr-1" />
                New note
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title="New from template" size="medium">
        <div className="space-y-2">
          <p className="text-sm text-gray-700 dark:text-gray-300">Choose a template to create a new note.</p>
          <ul className="space-y-1">
            {NOTE_TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => handleCreateFromTemplate(t)}
                  disabled={creatingFromTemplate}
                  className="w-full text-left px-3 py-2.5 rounded border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 hover:border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 text-sm font-medium disabled:opacity-50"
                >
                  {t.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Modal>

      <Modal open={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share note" size="medium">
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">People with access</p>
          <ul className="space-y-2 max-h-32 overflow-y-auto">
            {noteShares.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-sm text-gray-900 dark:text-gray-100">
                  {s.sharedWith?.name || s.sharedWith?.email || s.sharedWithUserId} — {s.role}
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRevokeShare(s.sharedWithUserId)} className="text-red-600">
                  Revoke
                </Button>
              </li>
            ))}
            {noteShares.length === 0 && <li className="text-sm text-gray-500 dark:text-gray-400">Not shared with anyone yet.</li>}
          </ul>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Add person (search by name or email)</label>
            <div className="flex gap-2">
              <Input
                value={shareUserQuery}
                onChange={(e) => setShareUserQuery(e.target.value)}
                onBlur={handleShareUserSearch}
                placeholder="Type 2+ chars to search"
                className="flex-1 text-sm"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleShareUserSearch}>
                Search
              </Button>
            </div>
            {shareUserResults.length > 0 && (
              <ul className="mt-2 border border-gray-200 dark:border-slate-700 rounded divide-y max-h-40 overflow-y-auto">
                {shareUserResults
                  .filter((u) => !noteShares.some((s) => s.sharedWithUserId === u.id))
                  .map((u) => (
                    <li key={u.id} className="flex items-center justify-between px-2 py-2">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{u.name || u.email || u.id}</span>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="sm" onClick={() => handleAddShare(u.id, 'viewer')} disabled={sharing}>
                          Viewer
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => handleAddShare(u.id, 'editor')} disabled={sharing}>
                          Editor
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
