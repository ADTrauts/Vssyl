'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { searchUsers, sendConnectionRequest, User } from '../../api/member';
import { Button, Input, Card, Avatar, Badge, Spinner, Toast, useToast } from 'shared/components';
import { Search, Filter, X, Users, Building2, UserPlus } from 'lucide-react';

interface UserSearchProps {
  onConnectionRequest?: () => void;
}

interface SearchFilters {
  organization: string;
  role: string;
  connectionType: 'all' | 'colleague' | 'regular';
}

export const UserSearch: React.FC<UserSearchProps> = ({ onConnectionRequest }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    organization: '',
    role: '',
    connectionType: 'all'
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<string[]>([]);
  const { showToast } = useToast();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('memberSearchHistory');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Extract unique organizations from users
  useEffect(() => {
    const orgs = Array.from(new Set(users.map(user => user.organization?.name).filter(Boolean) as string[]));
    setOrganizations(orgs);
  }, [users]);

  const saveSearchToHistory = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('memberSearchHistory', JSON.stringify(updated));
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setSearching(true);
    try {
      const result = await searchUsers(query.trim());
      setUsers(result.users);
      saveSearchToHistory(query.trim());
    } catch (error) {
      console.error('Error searching users:', error);
      showToast('Error searching users', { type: 'error' });
    } finally {
      setSearching(false);
    }
  }, [query, showToast]);

  const handleSendRequest = useCallback(async (userId: string) => {
    setPendingRequests(prev => new Set(prev).add(userId));
    setLoading(true);

    try {
      await sendConnectionRequest(userId);
      showToast('Connection request sent!', { type: 'success' });
      onConnectionRequest?.();
      
      // Update the user's connection status
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, connectionStatus: 'pending' as const }
          : user
      ));
    } catch (error) {
      console.error('Error sending connection request:', error);
      showToast('Error sending connection request', { type: 'error' });
    } finally {
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setLoading(false);
    }
  }, [showToast, onConnectionRequest]);

  const getConnectionButtonText = (user: User) => {
    switch (user.connectionStatus) {
      case 'pending':
        return 'Request Sent';
      case 'accepted':
        return 'Connected';
      case 'declined':
        return 'Declined';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Connect';
    }
  };

  const getConnectionButtonVariant = (user: User) => {
    switch (user.connectionStatus) {
      case 'pending':
        return 'secondary';
      case 'accepted':
        return 'primary';
      case 'declined':
      case 'blocked':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const isButtonDisabled = (user: User) => {
    return user.connectionStatus !== 'none' || pendingRequests.has(user.id) || loading;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      organization: '',
      role: '',
      connectionType: 'all'
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesOrg = !filters.organization || user.organization?.name === filters.organization;
    const matchesRole = !filters.role || user.organization?.role === filters.role;
    const matchesConnectionType = filters.connectionType === 'all' || 
      (filters.connectionType === 'colleague' && user.organization) ||
      (filters.connectionType === 'regular' && !user.organization);
    
    return matchesOrg && matchesRole && matchesConnectionType;
  });

  const hasActiveFilters = filters.organization || filters.role || filters.connectionType !== 'all';

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={!query.trim() || searching}
            variant="primary"
          >
            {searching ? <Spinner size={16} /> : 'Search'}
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <Badge color="blue" className="ml-1">
                {Object.values(filters).filter(v => v && v !== 'all').length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && !query && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 mr-2">Recent:</span>
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(search);
                  handleSearch();
                }}
                className="text-sm bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Search Filters</h3>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              )}
            </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <select
                    value={filters.organization}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('organization', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Organizations</option>
                    {organizations.map(org => (
                      <option key={org} value={org}>{org}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MANAGER">Manager</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Connection Type
                  </label>
                  <select
                    value={filters.connectionType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('connectionType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="colleague">Colleagues</option>
                    <option value="regular">Personal</option>
                  </select>
                </div>
              </div>
          </Card>
        )}
      </div>

      {/* Search Results */}
      {filteredUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Search Results ({filteredUsers.length})
            </h3>
            {hasActiveFilters && (
              <span className="text-sm text-gray-500">
                Filtered from {users.length} results
              </span>
            )}
          </div>
          {filteredUsers.map((user) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={undefined}
                    nameOrEmail={user.name || user.email}
                    size={40}
                  />
                  <div>
                    <div className="font-medium">
                      {user.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user.email}
                    </div>
                    {user.organization && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge color="blue" className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {user.organization.name}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {user.organization.role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant={getConnectionButtonVariant(user)}
                  disabled={isButtonDisabled(user)}
                  onClick={() => handleSendRequest(user.id)}
                  className="flex items-center gap-2"
                >
                  {pendingRequests.has(user.id) ? (
                    <Spinner size={16} />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {getConnectionButtonText(user)}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {query && !searching && filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {hasActiveFilters ? (
            <div>
              <p>No users found matching your search and filters</p>
              <Button
                onClick={clearFilters}
                variant="secondary"
                className="mt-2"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <p>No users found matching "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
}; 