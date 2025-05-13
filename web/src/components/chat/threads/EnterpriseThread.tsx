'use client';

import React from 'react';
import { EnterpriseThread as EnterpriseThreadType, ThreadType } from '@/types/enterprise';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Vote } from './Vote';
import { Action } from './Action';
import { Milestone } from './Milestone';
import { MessageList } from '../MessageList';
import { MessageInput } from '../MessageInput';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Message } from '@/types/chat';

interface EnterpriseThreadProps {
  thread: EnterpriseThreadType;
  messages: Message[];
  onVote: (vote: 'approve' | 'reject' | 'abstain', comment?: string) => void;
  onActionUpdate: (actionId: string, status: 'pending' | 'in_progress' | 'completed') => void;
  onMilestoneUpdate: (milestoneId: string, completed: boolean) => void;
  onMessageSend: (content: string) => Promise<void>;
}

export const EnterpriseThread: React.FC<EnterpriseThreadProps> = ({
  thread,
  messages,
  onVote,
  onActionUpdate,
  onMilestoneUpdate,
  onMessageSend,
}) => {
  const getThreadIcon = (type: ThreadType) => {
    switch (type) {
      case 'topic':
        return '📝';
      case 'project':
        return '📊';
      case 'decision':
        return '✅';
      case 'documentation':
        return '📚';
      default:
        return '💬';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{getThreadIcon(thread.type)}</span>
        <div>
          <h2 className="text-xl font-semibold">{thread.title}</h2>
          <p className="text-sm text-muted-foreground">
            Created {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
          </p>
        </div>
        <Badge variant={thread.status === 'active' ? 'default' : 'secondary'}>
          {thread.status}
        </Badge>
      </div>

      {thread.description && (
        <p className="text-muted-foreground mb-4">{thread.description}</p>
      )}

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          {thread.type === 'decision' && (
            <TabsTrigger value="votes">Votes</TabsTrigger>
          )}
          {thread.type === 'project' && (
            <>
              <TabsTrigger value="actions">Actions</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </>
          )}
          {thread.type === 'documentation' && (
            <TabsTrigger value="versions">Versions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="messages">
          <MessageList messages={messages} />
          <MessageInput onSend={onMessageSend} />
        </TabsContent>

        {thread.type === 'decision' && (
          <TabsContent value="votes">
            <div className="space-y-4">
              {thread.votes.map((vote) => (
                <Vote
                  key={vote.userId}
                  vote={vote}
                  onVote={onVote}
                />
              ))}
            </div>
          </TabsContent>
        )}

        {thread.type === 'project' && (
          <>
            <TabsContent value="actions">
              <div className="space-y-4">
                {thread.actions.map((action) => (
                  <Action
                    key={action.id}
                    action={action}
                    onUpdate={onActionUpdate}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="milestones">
              <div className="space-y-4">
                {thread.milestones.map((milestone) => (
                  <Milestone
                    key={milestone.id}
                    milestone={milestone}
                    onUpdate={onMilestoneUpdate}
                  />
                ))}
                {thread.progress !== undefined && (
                  <div className="mt-4">
                    <div className="flex justify-between mb-2">
                      <span>Overall Progress</span>
                      <span>{thread.progress}%</span>
                    </div>
                    <Progress value={thread.progress} />
                  </div>
                )}
              </div>
            </TabsContent>
          </>
        )}

        {thread.type === 'documentation' && (
          <TabsContent value="versions">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Current Version: {thread.version}</span>
                <span className="text-sm text-muted-foreground">
                  Last edited by {thread.lastEditedBy} {formatDistanceToNow(new Date(thread.lastEditedAt || ''), { addSuffix: true })}
                </span>
              </div>
              {/* Add version history component here */}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Card>
  );
}; 