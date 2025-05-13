'use client';

import React, { useState } from 'react';
import { DecisionThread as DecisionThreadType } from '@/types/thread';
import { Thread } from './Thread';
import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, ClockIcon, AlertCircleIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThreadContext } from '@/contexts/thread-context';
import { MessageInput } from '../chat/messages/MessageInput';
import { Message } from '../chat/messages/Message';
import { useChatContext } from '@/contexts/chat-context';
import { Progress } from '@/components/ui/progress';

interface DecisionThreadProps {
  thread: DecisionThreadType;
  participants: ThreadParticipant[];
  className?: string;
}

export const DecisionThread: React.FC<DecisionThreadProps> = ({
  thread,
  participants,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages } = useChatContext();
  const { addActivity, updateThread } = useThreadContext();

  const decisionMessages = messages.filter((msg) => 
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

  const handleVote = async (optionId: string) => {
    const updatedOptions = thread.options.map((option) => {
      if (option.id === optionId) {
        const votes = option.votes.includes('current-user')
          ? option.votes.filter((id) => id !== 'current-user')
          : [...option.votes, 'current-user'];
        return { ...option, votes };
      }
      return option;
    });

    await updateThread(thread.id, { options: updatedOptions });

    await addActivity(thread.id, {
      type: 'vote',
      userId: 'current-user',
      data: { optionId },
    });
  };

  const handleClose = async () => {
    const totalVotes = thread.options.reduce((sum, option) => sum + option.votes.length, 0);
    const winningOption = thread.options.reduce((prev, current) =>
      current.votes.length > prev.votes.length ? current : prev
    );

    await updateThread(thread.id, {
      status: 'closed',
      result: winningOption.id,
    });

    await addActivity(thread.id, {
      type: 'status',
      userId: 'current-user',
      data: { status: 'closed', result: winningOption.id },
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
          <div className="rounded-lg border p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Voting Options
                </h4>
                {thread.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    className="text-xs"
                  >
                    Close Voting
                  </Button>
                )}
              </div>
              {thread.deadline && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Deadline: {format(new Date(thread.deadline), 'MMM d, yyyy')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {thread.options.map((option) => {
                const voteCount = option.votes.length;
                const totalVotes = thread.options.reduce((sum, opt) => sum + opt.votes.length, 0);
                const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                const hasVoted = option.votes.includes('current-user');

                return (
                  <div
                    key={option.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(option.id)}
                          className={cn(
                            'h-8 w-8 p-0',
                            hasVoted && 'bg-primary text-primary-foreground'
                          )}
                        >
                          <CheckIcon className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">{option.text}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {voteCount} votes
                      </span>
                    </div>
                    <Progress
                      value={percentage}
                      className="mt-2 h-1"
                    />
                  </div>
                );
              })}
            </div>

            {thread.status === 'closed' && thread.result && (
              <div className="mt-4 rounded-lg bg-primary/10 p-3">
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    Decision: {thread.options.find((opt) => opt.id === thread.result)?.text}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {decisionMessages.map((message) => (
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
            placeholder="Add comment..."
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
              Collapse Decision
            </>
          ) : (
            <>
              <ChevronDownIcon className="mr-1 h-3 w-3" />
              Expand Decision ({decisionMessages.length} comments)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}; 