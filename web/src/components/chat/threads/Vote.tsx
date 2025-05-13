'use client';

import React from 'react';
import { Vote as VoteType } from '@/types/enterprise';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface VoteProps {
  vote: VoteType;
  onVote: (vote: 'approve' | 'reject' | 'abstain', comment?: string) => void;
}

export const Vote: React.FC<VoteProps> = ({ vote, onVote }) => {
  const [comment, setComment] = useState(vote.comment || '');

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-medium">{vote.userId}</span>
          <span className="text-sm text-muted-foreground ml-2">
            {formatDistanceToNow(new Date(vote.timestamp), { addSuffix: true })}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={vote.vote === 'approve' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onVote('approve', comment)}
          >
            Approve
          </Button>
          <Button
            variant={vote.vote === 'reject' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => onVote('reject', comment)}
          >
            Reject
          </Button>
          <Button
            variant={vote.vote === 'abstain' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onVote('abstain', comment)}
          >
            Abstain
          </Button>
        </div>
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Add a comment..."
        className="mt-2"
      />
    </Card>
  );
}; 