import React from 'react';
import { ThreadSearchResult } from '@/types/thread';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ThreadType } from '@/types/thread';

interface ThreadSearchResultsProps {
  results: ThreadSearchResult[];
  onSelect: (threadId: string) => void;
}

const getThreadTypeColor = (type: ThreadType) => {
  switch (type) {
    case 'message':
      return 'bg-blue-100 text-blue-800';
    case 'topic':
      return 'bg-green-100 text-green-800';
    case 'project':
      return 'bg-purple-100 text-purple-800';
    case 'decision':
      return 'bg-yellow-100 text-yellow-800';
    case 'documentation':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const ThreadSearchResults: React.FC<ThreadSearchResultsProps> = ({
  results,
  onSelect,
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No threads found matching your search
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map(({ thread, relevance, highlights }) => (
        <Card
          key={thread.id}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelect(thread.id)}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{thread.title}</h3>
                <Badge className={getThreadTypeColor(thread.type)}>
                  {thread.type}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {thread.description || 'No description available'}
              </p>
              <div className="flex flex-wrap gap-2">
                {thread.metadata?.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
            </div>
          </div>

          {highlights.length > 0 && (
            <div className="mt-4 space-y-2">
              {highlights.map((highlight, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{highlight.field}:</span>{' '}
                  {highlight.matches.map((match, matchIndex) => (
                    <span key={matchIndex}>
                      {highlight.value.slice(0, match.start)}
                      <span className="bg-yellow-200">
                        {highlight.value.slice(match.start, match.end)}
                      </span>
                      {highlight.value.slice(match.end)}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div>
              {thread.participants.length} participant
              {thread.participants.length !== 1 ? 's' : ''}
            </div>
            <div>Relevance: {(relevance * 100).toFixed(1)}%</div>
          </div>
        </Card>
      ))}
    </div>
  );
}; 