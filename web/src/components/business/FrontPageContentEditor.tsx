'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Textarea } from 'shared/components';
import { MessageSquare, Image as ImageIcon, Plus, Trash2, Save, X, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface Announcement {
  id?: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expiresAt?: string;
  createdAt?: string;
}

export interface ContentData {
  welcomeMessage?: string;
  heroImage?: string;
  companyAnnouncements?: Announcement[];
}

interface FrontPageContentEditorProps {
  content: ContentData;
  onChange: (content: ContentData) => void;
  className?: string;
}

// ============================================================================
// PRIORITY BADGE
// ============================================================================

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${styles[priority as keyof typeof styles]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// ============================================================================
// ANNOUNCEMENT EDITOR
// ============================================================================

interface AnnouncementEditorProps {
  announcement: Announcement | null;
  onSave: (announcement: Announcement) => void;
  onCancel: () => void;
}

function AnnouncementEditor({ announcement, onSave, onCancel }: AnnouncementEditorProps) {
  const [formData, setFormData] = useState<Announcement>(
    announcement || {
      title: '',
      content: '',
      priority: 'medium',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.content.trim()) newErrors.content = 'Content is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  return (
    <Card className="p-4 border-2 border-blue-500 bg-blue-50">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">
            {announcement ? 'Edit Announcement' : 'New Announcement'}
          </h4>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-blue-100 rounded"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Announcement title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="Announcement details..."
            rows={4}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires At (Optional)
            </label>
            <Input
              type="datetime-local"
              value={formData.expiresAt || ''}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save</span>
          </Button>
        </div>
      </form>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FrontPageContentEditor({
  content,
  onChange,
  className = '',
}: FrontPageContentEditorProps) {
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSaveAnnouncement = (announcement: Announcement) => {
    const announcements = content.companyAnnouncements || [];

    if (announcement.id) {
      // Update existing
      const updated = announcements.map((a) =>
        a.id === announcement.id ? announcement : a
      );
      onChange({ ...content, companyAnnouncements: updated });
    } else {
      // Add new
      const newAnnouncement = {
        ...announcement,
        id: `ann-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      onChange({
        ...content,
        companyAnnouncements: [...announcements, newAnnouncement],
      });
    }

    setEditingAnnouncement(null);
    setIsAddingNew(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      const updated = (content.companyAnnouncements || []).filter((a) => a.id !== id);
      onChange({ ...content, companyAnnouncements: updated });
    }
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setIsAddingNew(false);
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Welcome Message */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Welcome Message</h3>
              <p className="text-sm text-gray-600">Greeting shown when employees open the front page</p>
            </div>
          </div>

          <Textarea
            value={content.welcomeMessage || ''}
            onChange={(e) => onChange({ ...content, welcomeMessage: e.target.value })}
            placeholder="Welcome to our workspace! Here's what's happening today..."
            rows={4}
            className="w-full"
          />

          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Use a friendly, motivating tone. This message is the first thing employees see each day!
            </p>
          </div>
        </Card>

        {/* Hero Image */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <ImageIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Hero Image</h3>
              <p className="text-sm text-gray-600">Background or banner image for the front page</p>
            </div>
          </div>

          <Input
            type="url"
            value={content.heroImage || ''}
            onChange={(e) => onChange({ ...content, heroImage: e.target.value })}
            placeholder="https://example.com/hero-image.jpg"
          />

          {content.heroImage && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
              <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={content.heroImage}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </Card>

        {/* Company Announcements */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Company Announcements</h3>
                <p className="text-sm text-gray-600">Important updates and news for your team</p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddingNew(true)}
              className="flex items-center space-x-2"
              disabled={isAddingNew || !!editingAnnouncement}
            >
              <Plus className="w-4 h-4" />
              <span>Add Announcement</span>
            </Button>
          </div>

          {/* Add/Edit Form */}
          {(isAddingNew || editingAnnouncement) && (
            <div className="mb-4">
              <AnnouncementEditor
                announcement={editingAnnouncement}
                onSave={handleSaveAnnouncement}
                onCancel={() => {
                  setIsAddingNew(false);
                  setEditingAnnouncement(null);
                }}
              />
            </div>
          )}

          {/* Announcements List */}
          <div className="space-y-3">
            {content.companyAnnouncements && content.companyAnnouncements.length > 0 ? (
              content.companyAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                        <PriorityBadge priority={announcement.priority} />
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{announcement.content}</p>
                      {announcement.expiresAt && (
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(announcement.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditAnnouncement(announcement)}
                        className="p-2 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                        title="Edit"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAnnouncement(announcement.id!)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No announcements yet</p>
                <p className="text-sm text-gray-500 mt-1">Click "Add Announcement" to create one</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

