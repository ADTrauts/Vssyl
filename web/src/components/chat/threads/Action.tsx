'use client';

import React from 'react';
import { Action as ActionType } from '@/types/enterprise';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface ActionProps {
  action: ActionType;
  onUpdate: (actionId: string, status: 'pending' | 'in_progress' | 'completed') => void;
}

export const Action: React.FC<ActionProps> = ({ action, onUpdate }) => {
  const getStatusColor = (status: ActionType['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-medium">{action.title}</h3>
          {action.description && (
            <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
          )}
        </div>
        <Badge className={getStatusColor(action.status)}>
          {action.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          <div>Assigned to: {action.assignee?.name || action.assigneeId}</div>
          {action.dueDate && (
            <div>
              Due: {formatDistanceToNow(new Date(action.dueDate), { addSuffix: true })}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate(action.id, 'pending')}
            disabled={action.status === 'pending'}
          >
            Pending
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate(action.id, 'in_progress')}
            disabled={action.status === 'in_progress'}
          >
            In Progress
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdate(action.id, 'completed')}
            disabled={action.status === 'completed'}
          >
            Complete
          </Button>
        </div>
      </div>
    </Card>
  );
}; 