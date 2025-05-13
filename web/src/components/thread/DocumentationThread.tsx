'use client';

import React, { useState } from 'react';
import { DocumentationThread as DocumentationThreadType } from '@/types/thread';
import { Thread } from './Thread';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, FileTextIcon, EditIcon, HistoryIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThreadContext } from '@/contexts/thread-context';
import { MessageInput } from '../chat/messages/MessageInput';
import { Message } from '../chat/messages/Message';
import { useChatContext } from '@/contexts/chat-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface DocumentationThreadProps {
  thread: DocumentationThreadType;
  participants: ThreadParticipant[];
  className?: string;
}

export const DocumentationThread: React.FC<DocumentationThreadProps> = ({
  thread,
  participants,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const { messages } = useChatContext();
  const { addActivity, updateThread } = useThreadContext();

  const documentationMessages = messages.filter((msg) => 
    msg.threadId === thread.id && msg.conversationId === thread.conversationId
  );

  const handleReply = async (content: string) => {
    const newMessage = {
      id: crypto.randomUUID(),
      content,
      type: 'text',
      senderId: 'current-user',
      userId: 'current-user',
      conversationId: thread.conversationId,
      threadId: thread.id,
      status: 'sending',
      sender: {
        id: 'current-user',
        name: 'Current User',
        avatar: '/avatars/default.png',
        status: 'online',
      },
    };

    await addActivity(thread.id, {
      type: 'message',
      userId: 'current-user',
      data: { messageId: newMessage.id },
    });
  };

  const handleUpdate = async (content: string) => {
    const newVersion = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date().toISOString(),
      userId: 'current-user',
    };

    await updateThread(thread.id, {
      content: content,
      versions: [...thread.versions, newVersion],
    });

    await addActivity(thread.id, {
      type: 'update',
      userId: 'current-user',
      data: { versionId: newVersion.id },
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Thread
        thread={thread}
        participants={participants}
        className={cn(
          'cursor-pointer transition-colors hover:bg-accent/5',
          isExpanded && 'bg-accent/5'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="ml-8 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="history">
                <HistoryIcon className="mr-2 h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="discussion">
                <EditIcon className="mr-2 h-4 w-4" />
                Discussion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <div className="rounded-lg border p-4">
                <div className="prose max-w-none">
                  {thread.content}
                </div>
                <div className="mt-4">
                  <MessageInput
                    conversationId={thread.conversationId}
                    threadId={thread.id}
                    placeholder="Update documentation..."
                    onSend={handleUpdate}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="rounded-lg border p-4">
                <div className="space-y-4">
                  {thread.versions.map((version) => (
                    <div
                      key={version.id}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {format(new Date(version.timestamp), 'MMM d, yyyy HH:mm')}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {version.userId}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        {version.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="discussion" className="mt-4">
              <div className="space-y-4">
                {documentationMessages.map((message) => (
                  <Message
                    key={message.id}
                    message={message}
                    conversationId={thread.conversationId}
                  />
                ))}
                <MessageInput
                  conversationId={thread.conversationId}
                  threadId={thread.id}
                  placeholder="Add comment..."
                  onSend={handleReply}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <div className="flex justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="mr-1 h-3 w-3" />
              Collapse Documentation
            </>
          ) : (
            <>
              <ChevronDownIcon className="mr-1 h-3 w-3" />
              Expand Documentation ({documentationMessages.length} comments)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 