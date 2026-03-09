'use client';

import React, { useState, useCallback, useRef } from 'react';
import {
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Link as LinkIcon,
  X,
  Check,
  GripVertical,
} from 'lucide-react';

interface BookmarksWidgetProps {
  id: string;
  config?: BookmarksWidgetConfig;
  onConfigChange?: (config: BookmarksWidgetConfig) => void;
  dashboardId: string;
  dashboardType: 'personal' | 'business' | 'educational' | 'household';
  dashboardName: string;
}

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

interface BookmarksWidgetConfig {
  bookmarks: BookmarkItem[];
  compactMode: boolean;
}

const defaultConfig: BookmarksWidgetConfig = {
  bookmarks: [],
  compactMode: false,
};

export default function BookmarksWidget({
  id,
  config,
  onConfigChange,
  dashboardId,
  dashboardType,
  dashboardName,
}: BookmarksWidgetProps) {
  const safeConfig = config || defaultConfig;
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(safeConfig.bookmarks || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveBookmarks = useCallback(
    (updated: BookmarkItem[]) => {
      if (!onConfigChange) return;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onConfigChange({ ...safeConfig, bookmarks: updated });
      }, 300);
    },
    [onConfigChange, safeConfig]
  );

  const addBookmark = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const newBookmark: BookmarkItem = {
      id: `bm-${Date.now()}`,
      title: newTitle.trim(),
      url: newUrl.trim().startsWith('http') ? newUrl.trim() : `https://${newUrl.trim()}`,
    };
    const updated = [...bookmarks, newBookmark];
    setBookmarks(updated);
    saveBookmarks(updated);
    setNewTitle('');
    setNewUrl('');
    setShowAddForm(false);
  };

  const updateBookmark = (bookmarkId: string, title: string, url: string) => {
    const updated = bookmarks.map((b) =>
      b.id === bookmarkId
        ? { ...b, title: title.trim(), url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}` }
        : b
    );
    setBookmarks(updated);
    saveBookmarks(updated);
    setEditingId(null);
  };

  const deleteBookmark = (bookmarkId: string) => {
    const updated = bookmarks.filter((b) => b.id !== bookmarkId);
    setBookmarks(updated);
    saveBookmarks(updated);
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-3">
      {/* Bookmarks list */}
      {bookmarks.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Bookmark className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-600 mb-2">No bookmarks yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add bookmark
          </button>
        </div>
      ) : (
        <div className={`grid gap-2 ${safeConfig.compactMode ? 'grid-cols-4' : 'grid-cols-2'}`}>
          {bookmarks.map((bookmark) => {
            const favicon = getFavicon(bookmark.url);
            const isEditing = editingId === bookmark.id;

            if (isEditing) {
              return (
                <EditBookmarkForm
                  key={bookmark.id}
                  bookmark={bookmark}
                  onSave={(t, u) => updateBookmark(bookmark.id, t, u)}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors group"
              >
                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {favicon ? (
                    <img src={favicon} alt="" className="w-4 h-4" />
                  ) : (
                    <LinkIcon className="w-3 h-3 text-gray-500" />
                  )}
                </div>
                <span className="flex-1 text-sm text-gray-900 truncate">{bookmark.title}</span>
                <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingId(bookmark.id);
                    }}
                    className="p-1 rounded hover:bg-gray-200 text-gray-500"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      deleteBookmark(bookmark.id);
                    }}
                    className="p-1 rounded hover:bg-red-100 text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Add bookmark form */}
      {showAddForm && (
        <div className="p-3 bg-gray-50 rounded-lg space-y-2">
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            autoFocus
          />
          <input
            type="text"
            placeholder="URL (e.g., google.com)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            onKeyDown={(e) => e.key === 'Enter' && addBookmark()}
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTitle('');
                setNewUrl('');
              }}
              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={addBookmark}
              disabled={!newTitle.trim() || !newUrl.trim()}
              className="px-3 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {bookmarks.length > 0 && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-1.5 w-full py-2 text-xs text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg border border-dashed border-gray-300 hover:border-indigo-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add bookmark
        </button>
      )}
    </div>
  );
}

function EditBookmarkForm({
  bookmark,
  onSave,
  onCancel,
}: {
  bookmark: BookmarkItem;
  onSave: (title: string, url: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(bookmark.title);
  const [url, setUrl] = useState(bookmark.url);

  return (
    <div className="p-2 rounded-lg border border-indigo-300 bg-indigo-50/50 space-y-1.5">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
        autoFocus
      />
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-400"
      />
      <div className="flex items-center gap-1 justify-end">
        <button onClick={onCancel} className="p-1 rounded hover:bg-gray-200 text-gray-500">
          <X className="w-3 h-3" />
        </button>
        <button
          onClick={() => onSave(title, url)}
          disabled={!title.trim() || !url.trim()}
          className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50"
        >
          <Check className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
