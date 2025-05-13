import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { X, Share2, Link, Mail, MessageSquare, Copy, Check } from 'lucide-react';
import { toast } from '../ui/use-toast';
import { api } from '../../lib/api';

interface ShareSearchProps {
  searchQuery: string;
  filters: any;
  results: any[];
  onShare: (shareData: any) => void;
}

export function ShareSearch({ searchQuery, filters, results, onShare }: ShareSearchProps) {
  const [activeTab, setActiveTab] = useState('link');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareLink = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/search/share', {
        query: searchQuery,
        filters,
        results: results.map(r => r.id),
      });
      
      const shareLink = `${window.location.origin}/s/${response.data.id}`;
      return shareLink;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    const link = await generateShareLink();
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast({
        title: 'Success',
        description: 'Share link copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareEmail = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const link = await generateShareLink();
      if (link) {
        await api.post('/search/share/email', {
          email,
          message,
          link,
          query: searchQuery,
          resultCount: results.length,
        });
        
        toast({
          title: 'Success',
          description: 'Search results shared via email',
        });
        setEmail('');
        setMessage('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share via email',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareChat = async () => {
    try {
      setIsLoading(true);
      const link = await generateShareLink();
      if (link) {
        await api.post('/search/share/chat', {
          message,
          link,
          query: searchQuery,
          resultCount: results.length,
        });
        
        toast({
          title: 'Success',
          description: 'Search results shared in chat',
        });
        setMessage('');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share in chat',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="link">
            <Link className="h-4 w-4 mr-2" />
            Link
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-4">
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                readOnly
                className="flex-1"
                placeholder="Generating share link..."
              />
              <Button
                onClick={handleCopyLink}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{results.length} results</Badge>
            {filters.type && <Badge variant="outline">Type: {filters.type}</Badge>}
            {filters.tags?.map((tag: string) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
            />
          </div>
          <div className="space-y-2">
            <Label>Message (Optional)</Label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
            />
          </div>
          <Button
            onClick={handleShareEmail}
            disabled={isLoading || !email}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            Share via Email
          </Button>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="space-y-2">
            <Label>Message</Label>
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
            />
          </div>
          <Button
            onClick={handleShareChat}
            disabled={isLoading}
            className="w-full"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Share in Chat
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
} 