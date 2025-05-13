import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  Eye, Download, Share2, Link, Star, MoreVertical, 
  FileText, Folder, MessageSquare, Clock, User, 
  ChevronDown, ChevronUp, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../../lib/api';
import { toast } from '../ui/use-toast';

interface SearchResultProps {
  result: {
    id: string;
    type: 'thread' | 'file' | 'folder';
    title: string;
    content: string;
    metadata: {
      author?: string;
      date?: string;
      size?: number;
      tags?: string[];
      preview?: string;
    };
    relevance: number;
  };
  query: string;
  onSelect: (result: any) => void;
}

export function SearchResult({ result, query, onSelect }: SearchResultProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const handleQuickAction = async (action: string) => {
    try {
      setIsLoading(true);
      switch (action) {
        case 'view':
          onSelect(result);
          break;
        case 'download':
          await api.post(`/download/${result.id}`);
          toast({
            title: 'Success',
            description: 'Download started',
          });
          break;
        case 'share':
          const shareLink = await api.post('/share', { id: result.id });
          navigator.clipboard.writeText(shareLink);
          toast({
            title: 'Success',
            description: 'Share link copied to clipboard',
          });
          break;
        case 'favorite':
          await api.post(`/favorite/${result.id}`);
          setIsFavorited(true);
          toast({
            title: 'Success',
            description: 'Added to favorites',
          });
          break;
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to perform action',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = () => {
    switch (result.type) {
      case 'thread':
        return <MessageSquare className="h-4 w-4" />;
      case 'file':
        return <FileText className="h-4 w-4" />;
      case 'folder':
        return <Folder className="h-4 w-4" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const highlightText = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, i) => 
      regex.test(part) ? <span key={i} className="bg-yellow-200">{part}</span> : part
    );
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <h3 className="font-medium">{highlightText(result.title)}</h3>
            <Badge variant="outline" className="ml-2">
              {Math.round(result.relevance * 100)}% match
            </Badge>
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            {highlightText(result.content)}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {result.metadata.author && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {result.metadata.author}
              </Badge>
            )}
            {result.metadata.date && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(result.metadata.date))} ago
              </Badge>
            )}
            {result.metadata.size && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {formatSize(result.metadata.size)}
              </Badge>
            )}
            {result.metadata.tags?.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1"
          >
            {showPreview ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleQuickAction('view')}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('download')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('share')}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleQuickAction('favorite')}>
                <Star className="h-4 w-4 mr-2" />
                {isFavorited ? 'Remove Favorite' : 'Add to Favorites'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showPreview && result.metadata.preview && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            {result.metadata.preview}
          </div>
        </div>
      )}
    </Card>
  );
} 