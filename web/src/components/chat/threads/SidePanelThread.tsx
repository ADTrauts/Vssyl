'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Thread } from '@/types/thread';
import { useThread } from '@/contexts/thread-context';
import { MessageReactions } from './MessageReactions';

interface SidePanelThreadProps {
  thread: Thread;
}

export function SidePanelThread({ thread }: SidePanelThreadProps) {
  const { replyToThread, closeThread } = useThread();
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    replyToThread(thread.id, replyContent);
    setReplyContent('');
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-gray-200 shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Thread</h3>
          <p className="text-sm text-gray-500">{thread.messages.length} replies</p>
        </div>
        <button
          onClick={closeThread}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Original Message */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {/* TODO: Add user avatar */}
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-medium">User Name</span>
                <span className="text-sm text-gray-500">
                  {new Date(thread.messages[0].createdAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-900">{thread.messages[0].content}</p>
              <MessageReactions
                messageId={thread.messages[0].id}
                reactions={thread.messages[0].reactions}
              />
            </div>
          </div>
        </div>

        {/* Thread Replies */}
        {thread.messages.slice(1).map((message) => (
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
      </div>

      {/* Reply Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Reply to thread..."
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!replyContent.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 