'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useBusinessConfiguration } from '@/contexts/BusinessConfigurationContext';
import { Card, Button, Spinner, Alert, Avatar, Badge } from 'shared/components';
import { getBusinessMembers, getPinnedColleagues, pinColleague, unpinColleague, sendConnectionRequest, type BusinessMember } from '@/api/member';
import toast from 'react-hot-toast';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  Shield,
  UserCheck,
  UserX,
  UserPlus,
  Pin,
  PinOff
} from 'lucide-react';

export default function WorkMembersPage() {
  const params = useParams();
  const { data: session } = useSession();
  const { hasPermission } = useBusinessConfiguration();
  const businessId = params?.id as string;

  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'department'>('list');
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [pinnedUserIds, setPinnedUserIds] = useState<Set<string>>(new Set());
  const [pinLoadingUserId, setPinLoadingUserId] = useState<string | null>(null);

  const currentUserId = session?.user?.id ?? (session?.user as { id?: string })?.id ?? null;

  const handleAddPersonalConnection = async (userId: string, name: string) => {
    if (!userId || connectingUserId) return;
    setConnectingUserId(userId);
    try {
      await sendConnectionRequest(userId);
      toast.success(`Connection request sent to ${name || 'this member'}`);
      await loadBusinessMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send connection request');
    } finally {
      setConnectingUserId(null);
    }
  };

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessMembers();
    }
  }, [businessId, session?.accessToken]);

  const loadBusinessMembers = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      setError(null);
      const [membersRes, pinnedRes] = await Promise.all([
        getBusinessMembers(businessId),
        getPinnedColleagues(businessId),
      ]);
      setMembers(membersRes.members ?? []);
      setPinnedUserIds(new Set(pinnedRes.pinnedUserIds ?? []));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business members');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async (member: BusinessMember) => {
    const userId = member.user.id;
    if (userId === currentUserId || pinLoadingUserId) return;
    setPinLoadingUserId(userId);
    try {
      const isPinned = pinnedUserIds.has(userId);
      if (isPinned) {
        await unpinColleague(businessId, userId);
        setPinnedUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        toast.success(`Unpinned ${member.user.name ?? member.user.email}`);
      } else {
        await pinColleague(businessId, userId);
        setPinnedUserIds((prev) => new Set(Array.from(prev).concat(userId)));
        toast.success(`Pinned ${member.user.name ?? member.user.email}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update pin');
    } finally {
      setPinLoadingUserId(null);
    }
  };

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'Admin';
      case 'MANAGER': return 'Manager';
      case 'EMPLOYEE': return 'Employee';
      default: return role;
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'MANAGER': return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLastActiveText = (lastActive?: string): string => {
    if (!lastActive) return 'Never';
    
    const now = new Date();
    const active = new Date(lastActive);
    const diffInHours = Math.floor((now.getTime() - active.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return active.toLocaleDateString();
  };

  const filteredMembers = members.filter(member => {
    const name = member.user.name ?? member.user.email ?? '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.title && member.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const memberStats = {
    total: members.length,
    admins: members.filter(m => m.role === 'ADMIN').length,
    managers: members.filter(m => m.role === 'MANAGER').length,
    employees: members.filter(m => m.role === 'EMPLOYEE').length,
    active: 0, // API does not return lastActive; can be added later
  };

  // Pinned first for list; split for "People I work with most" section
  const pinnedMembers = filteredMembers.filter((m) => pinnedUserIds.has(m.user.id));
  const unpinnedMembers = filteredMembers.filter((m) => !pinnedUserIds.has(m.user.id));
  const membersPinnedFirst = [...pinnedMembers, ...unpinnedMembers];

  // Group by department for org chart view (department from member or job)
  const getMemberDepartment = (m: BusinessMember) =>
    m.department ?? (m.job as { department?: { name?: string } } | undefined)?.department?.name ?? 'No department';
  const membersByDepartment = viewMode === 'department'
    ? filteredMembers.reduce<Record<string, BusinessMember[]>>((acc, m) => {
        const dept = getMemberDepartment(m);
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(m);
        return acc;
      }, {})
    : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert type="error" title="Error Loading Members">
          {error}
        </Alert>
      </div>
    );
  }

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800">
      <div className="container mx-auto px-6 py-6">
      {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Members</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your business team members</p>
        </div>
          <div className="flex items-center space-x-3">
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            {hasPermission('members', 'invite') && (
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            )}
          </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{memberStats.total}</p>
                </div>
              <Users className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{memberStats.admins}</p>
                </div>
              <Shield className="w-8 h-8 text-red-500" />
              </div>
            </Card>
          <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{memberStats.managers}</p>
                </div>
              <UserCheck className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{memberStats.employees}</p>
                </div>
              <Users className="w-8 h-8 text-green-500" />
                </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{memberStats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center space-x-4 flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE')}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="MANAGER">Managers</option>
                  <option value="EMPLOYEE">Employees</option>
                </select>
                <div className="flex rounded-lg border border-gray-300 dark:border-slate-600 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('department')}
                    className={`px-3 py-2 text-sm font-medium ${viewMode === 'department' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    By department
                  </button>
                </div>
              </div>
            </div>

          {/* Members List */}
          <Card className="p-6">
          <div className="space-y-4">
                  {viewMode === 'department' ? (
                    Object.entries(membersByDepartment)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dept, deptMembers]) => (
                        <div key={dept}>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-slate-700 pb-1">
                            {dept}
                          </h3>
                          <div className="space-y-2 pl-2">
                            {deptMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800"
                              >
                                <div className="flex items-center space-x-4">
                                  <Avatar size={40} nameOrEmail={member.user.name ?? member.user.email} />
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{member.user.name ?? member.user.email}</h3>
                                      <Badge className={getRoleColor(member.role)}>
                                        {getRoleDisplayName(member.role)}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{member.user.email}</p>
                                    {member.title && <p className="text-sm text-gray-500 dark:text-gray-400">{member.title}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                                  </span>
                                  {currentUserId && member.user.id !== currentUserId && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTogglePin(member)}
                                        disabled={pinLoadingUserId === member.user.id}
                                        title={pinnedUserIds.has(member.user.id) ? 'Unpin' : 'Pin (people I work with most)'}
                                      >
                                        {pinLoadingUserId === member.user.id ? (
                                          <Spinner size={14} />
                                        ) : pinnedUserIds.has(member.user.id) ? (
                                          <PinOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                        ) : (
                                          <Pin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        )}
                                      </Button>
                                      {member.connectionStatus === 'none' && (
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          onClick={() => handleAddPersonalConnection(member.user.id, member.user.name ?? member.user.email)}
                                          disabled={connectingUserId === member.user.id}
                                        >
                                          {connectingUserId === member.user.id ? (
                                            <Spinner size={14} />
                                          ) : (
                                            <>
                                              <UserPlus className="w-4 h-4 mr-1" />
                                              Add as personal connection
                                            </>
                                            )}
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  ) : (
                  <>
                    {pinnedMembers.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">People I work with most</h3>
                        <div className="space-y-2">
                          {pinnedMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800 bg-amber-50/50"
                            >
                              <div className="flex items-center space-x-4">
                                <Avatar size={48} nameOrEmail={member.user.name ?? member.user.email} />
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{member.user.name ?? member.user.email}</h3>
                                    <Badge className={getRoleColor(member.role)}>{getRoleDisplayName(member.role)}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.user.email}</p>
                                  {member.title && <p className="text-sm text-gray-500 dark:text-gray-400">{member.title}</p>}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Last active</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{getLastActiveText(member.lastActive ?? undefined)}</p>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleTogglePin(member)} disabled={pinLoadingUserId === member.user.id} title="Unpin">
                                  {pinLoadingUserId === member.user.id ? <Spinner size={14} /> : <PinOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                                </Button>
                                <Button variant="ghost" size="sm"><Mail className="w-4 h-4" /></Button>
                                {currentUserId && member.user.id !== currentUserId && member.connectionStatus === 'none' && (
                                  <Button variant="secondary" size="sm" onClick={() => handleAddPersonalConnection(member.user.id, member.user.name ?? member.user.email)} disabled={connectingUserId === member.user.id}>
                                    <UserPlus className="w-4 h-4 mr-1" /> Add as personal connection
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {unpinnedMembers.length > 0 && (
                      <div>
                        {pinnedMembers.length > 0 && <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">All members</h3>}
                        <div className="space-y-2">
                          {unpinnedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800"
              >
                <div className="flex items-center space-x-4">
                  <Avatar size={48} nameOrEmail={member.user.name ?? member.user.email} />
                          <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{member.user.name ?? member.user.email}</h3>
                      <Badge className={getRoleColor(member.role)}>
                          {getRoleDisplayName(member.role)}
                        </Badge>
                        </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{member.user.email}</p>
                    {member.title && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.title}</p>
                    )}
                    {member.department && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.department}</p>
                    )}
            </div>
                          </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last active</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {getLastActiveText(member.lastActive ?? undefined)}
              </p>
            </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                  
                                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Mail className="w-4 h-4" />
                    </Button>
                    {currentUserId && member.user.id !== currentUserId && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(member)}
                          disabled={pinLoadingUserId === member.user.id}
                          title={pinnedUserIds.has(member.user.id) ? 'Unpin' : 'Pin (people I work with most)'}
                        >
                          {pinLoadingUserId === member.user.id ? <Spinner size={14} /> : pinnedUserIds.has(member.user.id) ? <PinOff className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <Pin className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                        </Button>
                        {member.connectionStatus === 'none' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAddPersonalConnection(member.user.id, member.user.name ?? member.user.email)}
                        disabled={connectingUserId === member.user.id}
                      >
                        {connectingUserId === member.user.id ? (
                          <Spinner size={14} />
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Add as personal connection
                          </>
                        )}
                      </Button>
                        )}
                      </>
                    )}
                    {hasPermission('members', 'manage') && (
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    )}
                                  </div>
                                </div>
                                </div>
            ))}
                        </div>
                      </div>
                    )}
                  </>
                  )}
          
          {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm || roleFilter !== 'all' ? 'No members found' : 'No members yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Invite your first team member to get started'
                }
              </p>
              {!searchTerm && roleFilter === 'all' && hasPermission('members', 'invite') && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Member
                </Button>
              )}
        </div>
      )}
          </div>
            </Card>
                </div>
                </div>
  );
} 