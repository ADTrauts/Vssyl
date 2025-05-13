'use client';

import React from 'react';
import { Milestone as MilestoneType } from '@/types/enterprise';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';

interface MilestoneProps {
  milestone: MilestoneType;
  onUpdate: (milestoneId: string, completed: boolean) => void;
}

export const Milestone: React.FC<MilestoneProps> = ({ milestone, onUpdate }) => {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={milestone.completed}
          onCheckedChange={(checked) => onUpdate(milestone.id, checked as boolean)}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
              {milestone.title}
            </h3>
            <span className="text-sm text-muted-foreground">
              Due {formatDistanceToNow(new Date(milestone.dueDate), { addSuffix: true })}
            </span>
          </div>
          {milestone.description && (
            <p className={`text-sm mt-1 ${milestone.completed ? 'text-muted-foreground' : ''}`}>
              {milestone.description}
            </p>
          )}
          {milestone.completed && milestone.completedBy && (
            <p className="text-sm text-muted-foreground mt-2">
              Completed by {milestone.completedBy} {formatDistanceToNow(new Date(milestone.completedAt || ''), { addSuffix: true })}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}; 