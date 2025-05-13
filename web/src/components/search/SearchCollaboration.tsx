import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Users, MessageSquare, AtSign, Bell,
  Check, X, Trash2, Edit2, Share2,
  Copy, Mail, Twitter, Facebook, LinkedIn,
  MoreVertical, UserPlus, UserMinus, Lock,
  Unlock, Eye, EyeOff, Clock, Calendar,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { useHotkeys } from 'react-hotkeys-hook';

interface SearchCollaborationProps {
  searchId: string;
  query: string;
  filters: Record<string, unknown>;
  results: unknown[];
  onUpdate: (updates: Record<string, unknown>) => void;
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  lastActive: string;
  email?: string;
}

interface Comment {
  id: string;
  content: string;
  author: Collaborator;
  timestamp: string;
  mentions: string[];
  replies: Comment[];
  isResolved: boolean;
}

interface CollaborationSettings {
  allowComments: boolean;
  allowMentions: boolean;
  allowReplies: boolean;
  notifyOnMention: boolean;
  notifyOnComment: boolean;
  notifyOnReply: boolean;
  defaultRole: 'editor' | 'viewer';
  requireApproval: boolean;
  expiration: number | null;
}

export function SearchCollaboration({ 
  searchId,
  query,
  filters,
  results,
  onUpdate
}: SearchCollaborationProps) {
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [settings, setSettings] = useState<CollaborationSettings>({
    allowComments: true,
    allowMentions: true,
    allowReplies: true,
    notifyOnMention: true,
    notifyOnComment: true,
    notifyOnReply: true,
    defaultRole: 'viewer',
    requireApproval: false,
    expiration: null
  });
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCollaborators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/collaborators`);
      if (!response.ok) throw new Error('Failed to load collaborators');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load collaborators');
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/comments`);
      if (!response.ok) throw new Error('Failed to load comments');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load comments');
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/collaboration/settings`);
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load settings');
      return {
        allowComments: true,
        allowMentions: true,
        allowReplies: true,
        notifyOnMention: true,
        notifyOnComment: true,
        notifyOnReply: true,
        defaultRole: 'viewer',
        requireApproval: false,
        expiration: null
      };
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [collaboratorsData, commentsData, settingsData] = await Promise.all([
          loadCollaborators(),
          loadComments(),
          loadSettings()
        ]);
        setCollaborators(collaboratorsData);
        setComments(commentsData);
        setSettings(settingsData);
        setError(null);
      } catch (error) {
        console.error('Failed to initialize collaboration data:', error);
        setError('Failed to load collaboration data');
      }
    };
    initializeData();
  }, [loadCollaborators, loadComments, loadSettings]);

  const handleInviteCollaborator = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/collaborators/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: settings.defaultRole,
          requireApproval: settings.requireApproval
        }),
      });
      if (!response.ok) throw new Error('Failed to invite collaborator');
      const updatedCollaborators = await loadCollaborators();
      setCollaborators(updatedCollaborators);
      setInviteEmail('');
      setShowInviteModal(false);
      toast.success('Invitation sent successfully');
    } catch (error) {
      toast.error('Failed to invite collaborator');
    } finally {
      setLoading(false);
    }
  }, [searchId, inviteEmail, settings.defaultRole, settings.requireApproval, loadCollaborators]);

  const handleUpdateRole = useCallback(async (collaboratorId: string, role: Collaborator['role']) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/collaborators/${collaboratorId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update role');
      const updatedCollaborators = await loadCollaborators();
      setCollaborators(updatedCollaborators);
      toast.success('Role updated successfully');
    } catch (error) {
      toast.error('Failed to update role');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadCollaborators]);

  const handleRemoveCollaborator = useCallback(async (collaboratorId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove collaborator');
      const updatedCollaborators = await loadCollaborators();
      setCollaborators(updatedCollaborators);
      toast.success('Collaborator removed successfully');
    } catch (error) {
      toast.error('Failed to remove collaborator');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadCollaborators]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          mentions: selectedCollaborators,
          replyTo: replyingTo
        }),
      });
      if (!response.ok) throw new Error('Failed to add comment');
      const updatedComments = await loadComments();
      setComments(updatedComments);
      setNewComment('');
      setSelectedCollaborators([]);
      setReplyingTo(null);
      toast.success('Comment added successfully');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  }, [searchId, newComment, selectedCollaborators, replyingTo, loadComments]);

  const handleUpdateComment = useCallback(async (commentId: string, content: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update comment');
      const updatedComments = await loadComments();
      setComments(updatedComments);
      toast.success('Comment updated successfully');
    } catch (error) {
      toast.error('Failed to update comment');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadComments]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/comments/${commentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete comment');
      const updatedComments = await loadComments();
      setComments(updatedComments);
      toast.success('Comment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete comment');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadComments]);

  const handleResolveComment = useCallback(async (commentId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/comments/${commentId}/resolve`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to resolve comment');
      const updatedComments = await loadComments();
      setComments(updatedComments);
      toast.success('Comment resolved successfully');
    } catch (error) {
      toast.error('Failed to resolve comment');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadComments]);

  const handleUpdateSettings = useCallback(async (updates: Partial<CollaborationSettings>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/collaboration/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  useHotkeys('ctrl+enter, cmd+enter', () => {
    if (commentRef.current === document.activeElement) {
      handleAddComment();
    }
  }, [handleAddComment]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="collaborators">
        <TabsList>
          <TabsTrigger value="collaborators">
            <Users className="h-4 w-4 mr-2" />
            Collaborators
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="h-4 w-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Collaborators</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </div>

              <div className="space-y-2">
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collaborator.avatar} />
                        <AvatarFallback>
                          {collaborator.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{collaborator.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Badge variant="outline">{collaborator.role}</Badge>
                          <span>•</span>
                          <span>Joined {formatDistanceToNow(new Date(collaborator.joinedAt))} ago</span>
                          <span>•</span>
                          <span>Last active {formatDistanceToNow(new Date(collaborator.lastActive))} ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={collaborator.role}
                        onValueChange={(value: Collaborator['role']) => 
                          handleUpdateRole(collaborator.id, value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  ref={commentRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment... (Press Ctrl+Enter to send)"
                  className="min-h-[100px]"
                  onKeyDown={(e) => {
                    if (e.key === '@') {
                      setShowMentions(true);
                    }
                  }}
                />
                {showMentions && (
                  <div className="border rounded-lg p-2">
                    <Input
                      value={mentionQuery}
                      onChange={(e) => setMentionQuery(e.target.value)}
                      placeholder="Search collaborators..."
                      className="mb-2"
                    />
                    <div className="space-y-1">
                      {collaborators
                        .filter(c => 
                          c.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
                          c.email?.toLowerCase().includes(mentionQuery.toLowerCase())
                        )
                        .map(collaborator => (
                          <div
                            key={collaborator.id}
                            className="flex items-center justify-between p-1 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => {
                              setSelectedCollaborators(prev => [...prev, collaborator.id]);
                              setNewComment(prev => prev + ` @${collaborator.name} `);
                              setShowMentions(false);
                              setMentionQuery('');
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={collaborator.avatar} />
                                <AvatarFallback>
                                  {collaborator.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{collaborator.name}</span>
                            </div>
                            {selectedCollaborators.includes(collaborator.id) && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                  >
                    Add Comment
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatar} />
                          <AvatarFallback>
                            {comment.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{comment.author.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(comment.timestamp))} ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!comment.isResolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolveComment(comment.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                    {comment.mentions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {comment.mentions.map(mention => (
                          <Badge key={mention} variant="outline">
                            @{mention}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {comment.replies.length > 0 && (
                      <div className="pl-8 space-y-2">
                        {comment.replies.map(reply => (
                          <div
                            key={reply.id}
                            className="border-l-2 pl-4"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={reply.author.avatar} />
                                <AvatarFallback>
                                  {reply.author.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{reply.author.name}</span>
                              <span className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(reply.timestamp))} ago
                              </span>
                            </div>
                            <p className="text-gray-700">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Collaboration Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Allow Comments</span>
                    <Switch
                      checked={settings.allowComments}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ allowComments: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Allow Mentions</span>
                    <Switch
                      checked={settings.allowMentions}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ allowMentions: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Allow Replies</span>
                    <Switch
                      checked={settings.allowReplies}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ allowReplies: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Notify on Mention</span>
                    <Switch
                      checked={settings.notifyOnMention}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ notifyOnMention: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Notify on Comment</span>
                    <Switch
                      checked={settings.notifyOnComment}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ notifyOnComment: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Notify on Reply</span>
                    <Switch
                      checked={settings.notifyOnReply}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ notifyOnReply: checked })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Role</Label>
                    <Select
                      value={settings.defaultRole}
                      onValueChange={(value: 'editor' | 'viewer') => 
                        handleUpdateSettings({ defaultRole: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Require Approval</span>
                    <Switch
                      checked={settings.requireApproval}
                      onCheckedChange={(checked) => 
                        handleUpdateSettings({ requireApproval: checked })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiration</Label>
                    <Select
                      value={settings.expiration?.toString() || 'never'}
                      onValueChange={(value) => 
                        handleUpdateSettings({ 
                          expiration: value === 'never' ? null : parseInt(value)
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="3600">1 Hour</SelectItem>
                        <SelectItem value="86400">24 Hours</SelectItem>
                        <SelectItem value="604800">7 Days</SelectItem>
                        <SelectItem value="2592000">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Invite Collaborator</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInviteCollaborator}
                  disabled={!inviteEmail || loading}
                >
                  Send Invitation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 