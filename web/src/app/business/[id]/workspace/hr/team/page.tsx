/**
 * Manager Team HR Page
 * 
 * Manager view of team HR data
 * Access: Managers with direct reports only
 * Location: /business/[id]/workspace/hr/team
 * 
 * Framework: Displays team member information
 * Features will be implemented incrementally
 */

'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useHRFeatures } from '@/hooks/useHRFeatures';
import Link from 'next/link';

interface TeamMember {
  id: string;
  user: {
    name: string;
    email: string;
    image?: string;
  };
  position: {
    title: string;
  };
}

export default function ManagerTeamView() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = (params?.id as string) || '';
  
  const [businessTier, setBusinessTier] = useState<string>('business_advanced');
  const hrFeatures = useHRFeatures(businessTier);
  
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [hasDirectReports, setHasDirectReports] = useState(false);
  
  useEffect(() => {
    // TODO: Fetch team members from API
    // For now, simulate loading
    setTimeout(() => {
      setLoading(false);
      // Mock: Check if user has direct reports
      setHasDirectReports(false); // Will be true when org chart is connected
    }, 500);
  }, [businessId, session]);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!hrFeatures.hasHRAccess) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Team HR Not Available</h1>
        <p className="text-gray-600">
          Your company needs Business Advanced or Enterprise tier to access HR features.
        </p>
      </div>
    );
  }
  
  if (!hasDirectReports) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">No Team Members</h1>
        <p className="text-gray-600 mb-4">
          You don't have any direct reports. Team HR features are available when you manage a team.
        </p>
        <Link 
          href={`/business/${businessId}/workspace`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Workspace
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Team HR</h1>
        <p className="text-gray-600 mt-2">
          Manage your team's HR information and approvals
        </p>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Team Members</div>
          <div className="text-2xl font-bold">{teamMembers.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Pending Approvals</div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-gray-500 mt-1">Feature coming soon</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Out Today</div>
          <div className="text-2xl font-bold">0</div>
          <div className="text-xs text-gray-500 mt-1">Feature coming soon</div>
        </div>
      </div>
      
      {/* Team Management Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Members */}
        <div className="border rounded-lg p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="text-lg font-semibold mb-2">Team Members</h3>
          <p className="text-gray-600 text-sm mb-4">
            View your team's profiles and information
          </p>
          <p className="text-sm text-gray-500">
            {teamMembers.length} direct reports
          </p>
        </div>
        
        {/* Time-Off Approvals */}
        <div className="border rounded-lg p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">✅</div>
          <h3 className="text-lg font-semibold mb-2">Time-Off Approvals</h3>
          <p className="text-gray-600 text-sm mb-4">
            Approve or deny team time-off requests
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
        
        {/* Team Attendance */}
        <div className="border rounded-lg p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">📊</div>
          <h3 className="text-lg font-semibold mb-2">Team Attendance</h3>
          <p className="text-gray-600 text-sm mb-4">
            View team attendance and schedules
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
        
        {/* Team Reports */}
        <div className="border rounded-lg p-6 bg-white hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">📈</div>
          <h3 className="text-lg font-semibold mb-2">Team Reports</h3>
          <p className="text-gray-600 text-sm mb-4">
            Generate team performance and attendance reports
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
      </div>
      
      {/* Note about manager approvals */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">📝 Note for Managers</h3>
        <p className="text-sm text-blue-800">
          Your own time-off requests and HR actions require approval from your manager 
          (the position above you in the org chart). You cannot approve your own requests.
        </p>
      </div>
    </div>
  );
}

