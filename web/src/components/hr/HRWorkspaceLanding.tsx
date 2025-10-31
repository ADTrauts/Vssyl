'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import {
  UserCheck,
  Users,
  Calendar,
  Clock,
  Briefcase,
  TrendingUp,
  Settings,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { businessAPI } from '@/api/business';

interface Business {
  id: string;
  name: string;
  members: Array<{
    id: string;
    role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

interface HRStats {
  totalEmployees: number;
  pendingTimeOff: number;
  activeToday: number;
  upcomingReviews: number;
}

export default function HRWorkspaceLanding({ businessId }: { businessId: string }) {
  const { data: session } = useSession();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE' | null>(null);
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    pendingTimeOff: 0,
    activeToday: 0,
    upcomingReviews: 0
  });

  useEffect(() => {
    if (businessId && session?.user?.id) {
      loadBusinessData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, session?.user?.id]);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const businessResponse = await businessAPI.getBusiness(businessId);
      if (businessResponse.success) {
        const businessData = businessResponse.data as unknown as Business;
        setBusiness(businessData);

        const userMembership = businessData.members.find(
          m => m.user.id === session?.user?.id
        );
        
        if (userMembership) {
          setUserRole(userMembership.role);
          setStats({
            totalEmployees: businessData.members.length,
            pendingTimeOff: 0,
            activeToday: businessData.members.length,
            upcomingReviews: 0
          });
        } else {
          setError('You are not a member of this business');
        }
      } else {
        setError('Failed to load business data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load HR data');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = userRole === 'ADMIN';
  const isManager = userRole === 'MANAGER';
  const isEmployee = userRole === 'EMPLOYEE';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error Loading HR">
          {error || 'HR module not accessible'}
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <UserCheck className="w-8 h-8 text-blue-600" />
            <span>Human Resources</span>
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin && 'Manage your team and HR operations'}
            {isManager && 'Manage your team members'}
            {isEmployee && 'Your personal HR portal'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge color={isAdmin ? 'red' : isManager ? 'blue' : 'green'}>
            {isAdmin && 'Admin'}
            {isManager && 'Manager'}
            {isEmployee && 'Employee'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEmployees}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {(isAdmin || isManager) && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingTimeOff}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeToday}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Reviews</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.upcomingReviews}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Link href={`/business/${businessId}/admin/hr`} className="block w-full">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Manage Employees</h3>
                    <p className="text-sm text-gray-600">View, add, and edit employee records</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full">
                  Open Admin Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Link href={`/business/${businessId}/workspace/hr/team`} className="block w-full">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Time-Off Requests</h3>
                    <p className="text-sm text-gray-600">Review and approve pending requests</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full">
                  View Requests
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </>
        )}

        {isManager && !isAdmin && (
          <>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Link href={`/business/${businessId}/workspace/hr/team`} className="block w-full">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">My Team</h3>
                    <p className="text-sm text-gray-600">View and manage your direct reports</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full">
                  View Team
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <Link href={`/business/${businessId}/workspace/hr/team`} className="block w-full">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Approve Requests</h3>
                    <p className="text-sm text-gray-600">Review team time-off requests</p>
                  </div>
                </div>
                <Button variant="secondary" className="w-full">
                  View Requests
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </Card>
          </>
        )}

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Link href={`/business/${businessId}/workspace/hr/me`} className="block w-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My Profile</h3>
                <p className="text-sm text-gray-600">View and update your personal information</p>
              </div>
            </div>
            <Button variant="secondary" className="w-full">
              View Profile
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <Link href={`/business/${businessId}/workspace/hr/me`} className="block w-full">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Time Off</h3>
                <p className="text-sm text-gray-600">Submit vacation or sick leave requests</p>
              </div>
            </div>
            <Button variant="secondary" className="w-full">
              Request Time Off
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">My Attendance</h3>
              <p className="text-sm text-gray-600">View your attendance history</p>
            </div>
          </div>
          <Badge color="gray">Coming Soon</Badge>
        </Card>
      </div>

      <Card className="p-6 bg-blue-50 border-l-4 border-l-blue-500">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Briefcase className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">HR Module Framework Active</h3>
            <p className="text-gray-700 mb-3">
              The HR module infrastructure is now operational! Core features are being developed and will be released incrementally:
            </p>
            <ul className="space-y-1 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>✅ Employee directory and profiles</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>🔄 Time-off request system (coming soon)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>🔄 Attendance tracking (coming soon)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>🔄 Payroll & performance reviews (Enterprise - coming soon)</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}


