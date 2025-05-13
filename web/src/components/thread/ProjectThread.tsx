'use client';

import React, { useState } from 'react';
import { ProjectThread as ProjectThreadType } from '@/types/thread';
import { Thread } from './Thread';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThreadContext } from '@/contexts/thread-context';
import { MessageInput } from '../chat/messages/MessageInput';
import { Message } from '../chat/messages/Message';
import { useChatContext } from '@/contexts/chat-context';
import { Progress } from '@/components/ui/progress';

interface ProjectThreadProps {
  thread: ProjectThreadType;
  participants: ThreadParticipant[];
  className?: string;
}

export const ProjectThread: React.FC<ProjectThreadProps> = ({
  thread,
  participants,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages } = useChatContext();
  const { addActivity, updateThread } = useThreadContext();

  const projectMessages = messages.filter((msg) => 
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

  const handleMilestoneStatusChange = async (milestoneId: string, status: 'pending' | 'in-progress' | 'completed') => {
    const updatedMilestones = thread.milestones.map((milestone) =>
      milestone.id === milestoneId ? { ...milestone, status } : milestone
    );

    const completedCount = updatedMilestones.filter((m) => m.status === 'completed').length;
    const newProgress = (completedCount / updatedMilestones.length) * 100;

    await updateThread(thread.id, {
      milestones: updatedMilestones,
      progress: newProgress,
    });

    await addActivity(thread.id, {
      type: 'milestone',
      userId: 'current-user',
      data: { milestoneId, status },
    });
  };

  const getStatusIcon = (status: 'pending' | 'in-progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircleIcon className="h-4 w-4 text-gray-500" />;
    }
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
          <div className="rounded-lg border p-4">
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Project Progress
              </h4>
              <Progress value={thread.progress} className="h-2" />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>Start: {format(new Date(thread.startDate), 'MMM d, yyyy')}</span>
                {thread.endDate && (
                  <span>End: {format(new Date(thread.endDate), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                Milestones
              </h4>
              {thread.milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(milestone.status)}
                    <div>
                      <h5 className="text-sm font-medium">{milestone.title}</h5>
                      <p className="text-xs text-muted-foreground">
                        {milestone.description}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        Due: {format(new Date(milestone.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMilestoneStatusChange(milestone.id, 'pending')}
                      className={cn(
                        'h-8 w-8 p-0',
                        milestone.status === 'pending' && 'bg-accent'
                      )}
                    >
                      <AlertCircleIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMilestoneStatusChange(milestone.id, 'in-progress')}
                      className={cn(
                        'h-8 w-8 p-0',
                        milestone.status === 'in-progress' && 'bg-accent'
                      )}
                    >
                      <ClockIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMilestoneStatusChange(milestone.id, 'completed')}
                      className={cn(
                        'h-8 w-8 p-0',
                        milestone.status === 'completed' && 'bg-accent'
                      )}
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {projectMessages.map((message) => (
              <Message
                key={message.id}
                message={message}
                conversationId={thread.conversationId}
              />
            ))}
          </div>

          <MessageInput
            conversationId={thread.conversationId}
            threadId={thread.id}
            placeholder="Add project update..."
            onSend={handleReply}
          />
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
              Collapse Project
            </>
          ) : (
            <>
              <ChevronDownIcon className="mr-1 h-3 w-3" />
              Expand Project ({projectMessages.length} updates)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 