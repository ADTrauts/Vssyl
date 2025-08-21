import React, { useState, useRef, useCallback } from 'react';
import { Input, Button, Avatar, Badge, Spinner } from 'shared/components';
import { ChatUser, ChatUserSelectionProps } from 'shared/types/chat';
import { sendConnectionRequest } from '../../api/member';
import { useToast } from 'shared/components';
import { 
  User, 
  Users, 
  Building, 
  GraduationCap, 
  Link, 
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';

export default function UserAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  showConnectionActions = true,
  onConnectRequest,
  dashboardId 
}: ChatUserSelectionProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pendingConnections, setPendingConnections] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: q,
        limit: '20',
        ...(dashboardId && { dashboardId })
      });
      
      const res = await fetch(`/api/chat/users/search?${params}`);
      const data = await res.json();
      if (data.success) {
        // Exclude already selected users
        setSuggestions(data.data.filter((u: ChatUser) => !value.some(v => v.id === u.id)));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [value, dashboardId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    fetchSuggestions(q);
    setShowSuggestions(true);
  };

  const handleSelect = (user: ChatUser) => {
    onChange([...value, user]);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemove = (user: ChatUser) => {
    onChange(value.filter(u => u.id !== user.id));
  };

  const handleConnectRequest = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onConnectRequest) {
      await onConnectRequest(userId);
      return;
    }

    setPendingConnections(prev => new Set(prev).add(userId));
    
    try {
      await sendConnectionRequest(userId);
      showToast('Connection request sent!', { type: 'success' });
      
      // Update the user's connection status in suggestions
      setSuggestions(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, connectionStatus: 'pending' as const, canConnect: false }
          : user
      ));
    } catch (error) {
      console.error('Error sending connection request:', error);
      showToast('Error sending connection request', { type: 'error' });
    } finally {
      setPendingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getConnectionStatusBadge = (user: ChatUser) => {
    switch (user.connectionStatus) {
      case 'accepted':
        return <Badge color="green">Connected</Badge>;
      case 'pending':
        return <Badge color="yellow">Pending</Badge>;
      case 'declined':
        return <Badge color="red">Declined</Badge>;
      case 'blocked':
        return <Badge color="gray">Blocked</Badge>;
      default:
        return null;
    }
  };

  const getOrganizationIcon = (user: ChatUser) => {
    if (!user.organization) return null;
    
    switch (user.organization.type) {
      case 'business':
        return <Building className="w-3 h-3" />;
      case 'institution':
        return <GraduationCap className="w-3 h-3" />;
      default:
        return <Users className="w-3 h-3" />;
    }
  };

  const getConnectionButton = (user: ChatUser) => {
    if (!showConnectionActions || user.connectionStatus !== 'none') return null;

    const isPending = pendingConnections.has(user.id);
    
    return (
      <Button
        variant="secondary"
        disabled={isPending}
        onClick={(e) => handleConnectRequest(user.id, e)}
        className="ml-2"
      >
        {isPending ? (
          <Spinner size={12} />
        ) : (
          <>
            <UserPlus className="w-3 h-3 mr-1" />
            Connect
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="relative">
      {/* Selected Users */}
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map(user => (
          <span key={user.id} className="flex items-center bg-blue-100 text-blue-800 rounded px-2 py-1 text-xs">
            <Avatar src={''} alt={user.name || user.email} size={16} />
            <span className="ml-1">{user.name || user.email}</span>
            {user.organization && (
              <span className="ml-1 text-blue-600">
                {getOrganizationIcon(user)}
              </span>
            )}
            {getConnectionStatusBadge(user)}
            <button 
              type="button" 
              className="ml-1 text-blue-500 hover:text-blue-700" 
              onClick={() => handleRemove(user)}
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      {/* Search Input */}
      <Input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder || 'Search users by name or email...'}
        onFocus={() => query.length >= 2 && setShowSuggestions(true)}
        autoComplete="off"
      />

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded shadow w-full mt-1 max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-3 text-center text-gray-500">
              <Spinner size={16} />
              <div className="mt-1">Searching...</div>
            </div>
          )}
          
          {!loading && suggestions.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelect(user)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Avatar src={''} alt={user.name || user.email} size={32} />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm truncate">
                      {user.name || user.email}
                    </span>
                    {user.isColleague && (
                      <Badge color="blue">Colleague</Badge>
                    )}
                    {getConnectionStatusBadge(user)}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span className="truncate">{user.email}</span>
                    {user.organization && (
                      <>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          {getOrganizationIcon(user)}
                          <span>{user.organization.name}</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {getConnectionButton(user)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 