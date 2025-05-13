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

interface CollaborativeEditorProps {
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

export function CollaborativeEditor({ 
  searchId,
  query,
  filters,
  results,
  onUpdate
}: CollaborativeEditorProps) {
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

  // ... rest of the component remains unchanged ...
} 