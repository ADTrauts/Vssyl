'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useBusinessConfiguration } from '@/contexts/BusinessConfigurationContext';
import { Card, Button, Spinner, Alert, Avatar, Badge } from 'shared/components';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';

interface BusinessMember {
  id: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  title?: string;
  department?: string;
  canInvite: boolean;
  canManage: boolean;
  canBilling: boolean;
  joinedAt: string;
  lastActive?: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function WorkMembersPage() {
  const params = useParams();
  const { data: session } = useSession();
  const { hasPermission } = useBusinessConfiguration();
  const businessId = params.id as string;

  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('all');

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadBusinessMembers();
    }
  }, [businessId, session?.accessToken]);

  const loadBusinessMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call to get business members
      // const response = await businessAPI.getBusinessMembers(businessId);
      
      // Mock data for now
      const mockMembers: BusinessMember[] = [
        {
          id: '1',
          role: 'ADMIN',
          title: 'CEO',
          department: 'Executive',
          canInvite: true,
          canManage: true,
          canBilling: true,
          joinedAt: '2023-01-15T00:00:00Z',
          lastActive: '2024-01-15T10:30:00Z',
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@company.com'
          }
        },
        {
          id: '2',
          role: 'MANAGER',
          title: 'Project Manager',
          department: 'Engineering',
          canInvite: true,
          canManage: true,
          canBilling: false,
          joinedAt: '2023-03-20T00:00:00Z',
          lastActive: '2024-01-15T09:15:00Z',
          user: {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@company.com'
          }
        },
        {
          id: '3',
          role: 'EMPLOYEE',
          title: 'Software Developer',
          department: 'Engineering',
          canInvite: false,
          canManage: false,
          canBilling: false,
          joinedAt: '2023-06-10T00:00:00Z',
          lastActive: '2024-01-15T08:45:00Z',
          user: {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike@company.com'
          }
        },
        {
          id: '4',
          role: 'EMPLOYEE',
          title: 'Marketing Specialist',
          department: 'Marketing',
          canInvite: false,
          canManage: false,
          canBilling: false,
          joinedAt: '2023-08-05T00:00:00Z',
          lastActive: '2024-01-14T16:20:00Z',
          user: {
            id: '4',
            name: 'Sarah Wilson',
            email: 'sarah@company.com'
          }
        },
        {
          id: '5',
          role: 'EMPLOYEE',
          title: 'Sales Representative',
          department: 'Sales',
          canInvite: false,
          canManage: false,
          canBilling: false,
          joinedAt: '2023-09-12T00:00:00Z',
          lastActive: '2024-01-14T14:30:00Z',
          user: {
            id: '5',
            name: 'David Brown',
            email: 'david@company.com'
          }
        }
      ];

      setMembers(mockMembers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business members');
    } finally {
      setLoading(false);
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
    const matchesSearch = member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    active: members.filter(m => {
      if (!m.lastActive) return false;
      const lastActive = new Date(m.lastActive);
      const now = new Date();
      const diffInHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
      return diffInHours < 24;
    }).length
  };

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
      {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600">Manage your business team members</p>
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
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{memberStats.total}</p>
                </div>
              <Users className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{memberStats.admins}</p>
                </div>
              <Shield className="w-8 h-8 text-red-500" />
              </div>
            </Card>
          <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{memberStats.managers}</p>
                </div>
              <UserCheck className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-gray-600">Employees</p>
                <p className="text-2xl font-bold text-gray-900">{memberStats.employees}</p>
                </div>
              <Users className="w-8 h-8 text-green-500" />
                </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Today</p>
                <p className="text-2xl font-bold text-gray-900">{memberStats.active}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </Card>
          </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="MANAGER">Managers</option>
                  <option value="EMPLOYEE">Employees</option>
                </select>
              </div>
            </div>

          {/* Members List */}
          <Card className="p-6">
          <div className="space-y-4">
                  {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <Avatar size={48} nameOrEmail={member.user.name} />
                          <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900">{member.user.name}</h3>
                      <Badge className={getRoleColor(member.role)}>
                          {getRoleDisplayName(member.role)}
                        </Badge>
                        </div>
                    <p className="text-sm text-gray-600">{member.user.email}</p>
                    {member.title && (
                      <p className="text-sm text-gray-500">{member.title}</p>
                    )}
                    {member.department && (
                      <p className="text-sm text-gray-500">{member.department}</p>
                    )}
            </div>
                          </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Last active</p>
                    <p className="text-sm font-medium text-gray-900">
                      {getLastActiveText(member.lastActive)}
              </p>
            </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Joined</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                  
                                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Mail className="w-4 h-4" />
                    </Button>
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
          
          {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || roleFilter !== 'all' ? 'No members found' : 'No members yet'}
              </h3>
              <p className="text-gray-600 mb-4">
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
            </Card>
                </div>
                </div>
  );
} 