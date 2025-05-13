'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Thread } from '@/types/thread';
import { useThread } from '@/contexts/thread-context';
import { MessageReactions } from './MessageReactions';

interface InlineThreadProps {
  thread: Thread;
}

export function InlineThread({ thread }: InlineThreadProps) {
  const { replyToThread } = useThread();
  const [replyContent, setReplyContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    replyToThread(thread.id, replyContent);
    setReplyContent('');
  };

  return (
    <div className="pl-8 border-l-2 border-gray-200 my-2">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {isExpanded ? '▼' : '►'} {thread.messages.length} replies
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {thread.messages.map((message) => (
            <div key={message.id} className="group">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {/* TODO: Add user avatar */}
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">User Name</span>
                    <span className="text-sm text-gray-500">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-900">{message.content}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {message.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="inline-block max-w-xs p-2 bg-gray-50 rounded"
                        >
                          {attachment.type === 'image' ? (
                            <div className="relative h-40 w-full">
                              <Image
                                src={attachment.url}
                                alt={attachment.name}
                                fill
                                className="rounded object-contain"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span>📎</span>
                              <span className="truncate">{attachment.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <MessageReactions
                    messageId={message.id}
                    reactions={message.reactions}
                  />
                </div>
              </div>
            </div>
          ))}

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Reply to thread..."
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={1}
                />
              </div>
              <button
                type="submit"
                disabled={!replyContent.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 