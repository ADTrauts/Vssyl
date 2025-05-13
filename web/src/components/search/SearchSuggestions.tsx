import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Search, TrendingUp, Clock, Star,
  Plus, X, Check, Settings,
  Tag, User, Folder, FileText,
  ArrowRight, ArrowLeft, RefreshCw
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from '../ui/use-toast';

interface SearchSuggestionsProps {
  query: string;
  filters: any;
  onSelect: (suggestion: any) => void;
}

export function SearchSuggestions({ query, filters, onSelect }: SearchSuggestionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    {
      id: '1',
      type: 'query',
      text: 'project documentation latest',
      relevance: 0.85,
      source: 'popular',
    },
    {
      id: '2',
      type: 'filter',
      text: 'type:file date:this-week',
      relevance: 0.75,
      source: 'history',
    },
    {
      id: '3',
      type: 'related',
      text: 'user feedback analysis',
      relevance: 0.65,
      source: 'semantic',
    },
  ]);
  const [recommendations, setRecommendations] = useState([
    {
      id: '1',
      type: 'popular',
      title: 'Weekly Team Updates',
      description: 'Most viewed team updates from last week',
      icon: 'trending',
      count: 25,
    },
    {
      id: '2',
      type: 'recent',
      title: 'Project Documentation',
      description: 'Recently updated project documentation',
      icon: 'file',
      count: 12,
    },
    {
      id: '3',
      type: 'related',
      title: 'User Feedback',
      description: 'Related user feedback and suggestions',
      icon: 'user',
      count: 8,
    },
  ]);

  const handleRefreshSuggestions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/search/suggestions', {
        params: { query, filters },
      });
      setSuggestions(response.data);
      toast({
        title: 'Success',
        description: 'Suggestions refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/search/recommendations', {
        params: { query, filters },
      });
      setRecommendations(response.data);
      toast({
        title: 'Success',
        description: 'Recommendations refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="h-4 w-4" />;
      case 'folder':
        return <Folder className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="suggestions">
        <TabsList>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Search Suggestions</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshSuggestions}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-2">
              {suggestions.map(suggestion => (
                <div
                  key={suggestion.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => onSelect(suggestion)}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(suggestion.type)}
                    <div>
                      <p className="font-medium">{suggestion.text}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{suggestion.source}</span>
                        <span>•</span>
                        <span>{Math.round(suggestion.relevance * 100)}% relevant</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Recommended Searches</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshRecommendations}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="space-y-4">
              {recommendations.map(recommendation => (
                <div
                  key={recommendation.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => onSelect(recommendation)}
                >
                  <div className="flex items-center gap-2">
                    {getIcon(recommendation.icon)}
                    <div>
                      <p className="font-medium">{recommendation.title}</p>
                      <p className="text-sm text-gray-500">{recommendation.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>{recommendation.count} results</span>
                        <span>•</span>
                        <span>{recommendation.type}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 