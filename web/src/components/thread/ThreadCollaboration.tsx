import React, { useState } from 'react';
import { useThreadCollaboration } from '../../hooks/useThreadCollaboration';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select } from '../ui/select';
import { Card } from '../ui/card';
import { formatDistanceToNow } from 'date-fns';

interface ThreadCollaborationProps {
  threadId: string;
}

export function ThreadCollaboration({ threadId }: ThreadCollaborationProps) {
  const {
    collaborators,
    versions,
    comments,
    insights,
    isLoading,
    error,
    addCollaborator,
    removeCollaborator,
    createVersion,
    addComment,
    addInsight
  } = useThreadCollaboration(threadId);

  const [newComment, setNewComment] = useState('');
  const [newInsightType, setNewInsightType] = useState<'SUMMARY' | 'ACTION_ITEM' | 'DECISION' | 'QUESTION' | 'NOTE'>('NOTE');
  const [newInsightContent, setNewInsightContent] = useState('');

  if (isLoading) {
    return <div>Loading collaboration data...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Collaborators Section */}
      <div className="md:col-span-1">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Collaborators</h3>
          <div className="space-y-2">
            {collaborators.map(collaborator => (
              <div key={collaborator.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Avatar src={collaborator.user.avatarUrl} alt={collaborator.user.name} />
                  <div>
                    <p className="font-medium">{collaborator.user.name}</p>
                    <p className="text-sm text-gray-500">{collaborator.role}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCollaborator(collaborator.userId)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Comments Section */}
      <div className="md:col-span-2">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Comments</h3>
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="flex space-x-2">
                <Avatar src={comment.user.avatarUrl} alt={comment.user.name} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{comment.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="mb-2"
              />
              <Button
                onClick={async () => {
                  if (newComment.trim()) {
                    await addComment(newComment);
                    setNewComment('');
                  }
                }}
              >
                Add Comment
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Insights Section */}
      <div className="md:col-span-3">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Insights</h3>
          <div className="space-y-4">
            {insights.map(insight => (
              <div key={insight.id} className="flex space-x-2">
                <Avatar src={insight.user.avatarUrl} alt={insight.user.name} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{insight.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                    </p>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {insight.type}
                    </span>
                  </div>
                  <p className="mt-1">{insight.content}</p>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <Select
                value={newInsightType}
                onChange={(e) => setNewInsightType(e.target.value as any)}
                className="mb-2"
              >
                <option value="SUMMARY">Summary</option>
                <option value="ACTION_ITEM">Action Item</option>
                <option value="DECISION">Decision</option>
                <option value="QUESTION">Question</option>
                <option value="NOTE">Note</option>
              </Select>
              <Textarea
                value={newInsightContent}
                onChange={(e) => setNewInsightContent(e.target.value)}
                placeholder="Add an insight..."
                className="mb-2"
              />
              <Button
                onClick={async () => {
                  if (newInsightContent.trim()) {
                    await addInsight(newInsightType, newInsightContent);
                    setNewInsightContent('');
                  }
                }}
              >
                Add Insight
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Version History Section */}
      <div className="md:col-span-3">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Version History</h3>
          <div className="space-y-4">
            {versions.map(version => (
              <div key={version.id} className="flex space-x-2">
                <Avatar src={version.user.avatarUrl} alt={version.user.name} />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{version.user.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                    </p>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      Version {version.version}
                    </span>
                  </div>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-sm overflow-x-auto">
                    {JSON.stringify(version.content, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 