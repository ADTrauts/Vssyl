import { useEffect, useCallback } from 'react';
import { useActivity } from '@/contexts/activity-context';
import { ActivityUser, ActivityType } from '@/types/activity';

interface UseThreadActivityOptions {
  threadId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export const useThreadActivity = ({
  threadId,
  userId,
  userName,
  userAvatar,
}: UseThreadActivityOptions) => {
  const {
    updatePresence,
    removePresence,
    startActivity,
    endActivity,
    addActivity,
  } = useActivity();

  // Update user presence
  useEffect(() => {
    const user: ActivityUser = {
      id: userId,
      name: userName,
      avatar: userAvatar,
      status: 'online',
      lastActive: new Date(),
    };

    updatePresence(threadId, user);

    // Heartbeat to keep presence active
    const heartbeat = setInterval(() => {
      updatePresence(threadId, {
        ...user,
        lastActive: new Date(),
      });
    }, 30000); // Every 30 seconds

    // Cleanup presence on unmount
    return () => {
      clearInterval(heartbeat);
      removePresence(threadId, userId);
    };
  }, [threadId, userId, userName, userAvatar, updatePresence, removePresence]);

  // Track viewing activity
  useEffect(() => {
    startActivity(threadId, 'view');
    
    return () => {
      endActivity(threadId, 'view');
    };
  }, [threadId, startActivity, endActivity]);

  // Helper functions for common activities
  const logEdit = useCallback((description: string, changes?: Record<string, any>) => {
    addActivity({
      threadId,
      type: 'edit',
      userId,
      status: 'completed',
      metadata: {
        title: 'Thread edited',
        description,
        changes,
      },
    });
  }, [threadId, userId, addActivity]);

  const logComment = useCallback((content: string) => {
    addActivity({
      threadId,
      type: 'comment',
      userId,
      status: 'completed',
      metadata: {
        title: 'New comment',
        description: content,
      },
    });
  }, [threadId, userId, addActivity]);

  const logTagUpdate = useCallback((tags: string[]) => {
    addActivity({
      threadId,
      type: 'tag_update',
      userId,
      status: 'completed',
      metadata: {
        title: 'Tags updated',
        changes: { tags },
      },
    });
  }, [threadId, userId, addActivity]);

  const logParticipantChange = useCallback((
    action: 'add' | 'remove',
    participantId: string,
    participantName: string,
  ) => {
    addActivity({
      threadId,
      type: 'participant_change',
      userId,
      status: 'completed',
      metadata: {
        title: `Participant ${action}ed`,
        description: `${action === 'add' ? 'Added' : 'Removed'} ${participantName}`,
        changes: {
          action,
          participantId,
          participantName,
        },
      },
    });
  }, [threadId, userId, addActivity]);

  const logReaction = useCallback((
    emoji: string,
    targetId: string,
    targetType: 'message' | 'comment',
  ) => {
    addActivity({
      threadId,
      type: 'reaction',
      userId,
      status: 'completed',
      metadata: {
        title: 'Added reaction',
        description: `Reacted with ${emoji}`,
        changes: {
          emoji,
          targetId,
          targetType,
        },
      },
    });
  }, [threadId, userId, addActivity]);

  const startTyping = useCallback(() => {
    startActivity(threadId, 'edit');
  }, [threadId, startActivity]);

  const stopTyping = useCallback(() => {
    endActivity(threadId, 'edit');
  }, [threadId, endActivity]);

  return {
    logEdit,
    logComment,
    logTagUpdate,
    logParticipantChange,
    logReaction,
    startTyping,
    stopTyping,
  };
}; 