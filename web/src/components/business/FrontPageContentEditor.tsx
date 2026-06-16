'use client';

import React from 'react';
import { Card, Input, Textarea } from 'shared/components';
import { MessageSquare, Image as ImageIcon, AlertCircle } from 'lucide-react';

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
// MAIN COMPONENT
// ============================================================================

export default function FrontPageContentEditor({
  content,
  onChange,
  className = '',
}: FrontPageContentEditorProps) {
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Welcome Message</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Greeting shown when employees open the front page</p>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hero Image</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Background or banner image for the front page</p>
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
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</p>
              <div className="relative w-full h-40 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
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

        {/* Company Announcements — managed in Workforce Communications */}
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Company Announcements</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Announcements are published from Workforce Communications. Enable &quot;Show on front page&quot; when composing.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Legacy inline announcements in front-page config are no longer edited here.
            {content.companyAnnouncements && content.companyAnnouncements.length > 0 && (
              <span className="block mt-2 text-amber-800">
                {content.companyAnnouncements.length} legacy announcement(s) remain in config until migrated.
              </span>
            )}
          </p>
          <a
            href="../workspace/workforce-comms"
            className="inline-flex items-center text-sm font-medium text-blue-700 hover:underline"
          >
            Manage announcements in Workforce Communications →
          </a>
        </Card>
      </div>
    </div>
  );
}

