/**
 * Employee Self-Service HR Page
 * 
 * Employee view of their own HR data
 * Access: All business employees
 * Location: /business/[id]/workspace/hr/me
 * 
 * Framework: Displays employee's own HR information
 * Features will be implemented incrementally
 */

'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useHRFeatures } from '@/hooks/useHRFeatures';
import Link from 'next/link';

interface EmployeeData {
  id: string;
  user: {
    name: string;
    email: string;
  };
  position: {
    title: string;
    department?: {
      name: string;
    };
  };
  hrProfile?: {
    hireDate?: string;
    employeeType?: string;
  };
}

export default function EmployeeSelfService() {
  const params = useParams();
  const { data: session } = useSession();
  const businessId = (params?.id as string) || '';
  
  const [businessTier, setBusinessTier] = useState<string>('business_advanced');
  const hrFeatures = useHRFeatures(businessTier);
  
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  
  useEffect(() => {
    // TODO: Fetch employee's own HR data from API
    // For now, simulate loading
    setTimeout(() => {
      setLoading(false);
      // Mock data
      setEmployeeData({
        id: '1',
        user: {
          name: session?.user?.name || 'Employee',
          email: session?.user?.email || 'employee@example.com'
        },
        position: {
          title: 'Software Engineer',
          department: {
            name: 'Engineering'
          }
        },
        hrProfile: {
          hireDate: '2024-01-15',
          employeeType: 'FULL_TIME'
        }
      });
    }, 500);
  }, [businessId, session]);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!hrFeatures.hasHRAccess) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">HR Self-Service Not Available</h1>
        <p className="text-gray-600">
          Your company needs Business Advanced or Enterprise tier to access HR features.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My HR</h1>
        <p className="text-gray-600 mt-2">
          View and manage your employee information
        </p>
      </div>
      
      {/* Employee Profile Card */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">My Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600">Name</label>
            <p className="font-medium">{employeeData?.user.name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <p className="font-medium">{employeeData?.user.email}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Position</label>
            <p className="font-medium">{employeeData?.position.title}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Department</label>
            <p className="font-medium">{employeeData?.position.department?.name || 'N/A'}</p>
          </div>
          {employeeData?.hrProfile?.hireDate && (
            <div>
              <label className="text-sm text-gray-600">Hire Date</label>
              <p className="font-medium">
                {new Date(employeeData.hrProfile.hireDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {employeeData?.hrProfile?.employeeType && (
            <div>
              <label className="text-sm text-gray-600">Employment Type</label>
              <p className="font-medium">
                {employeeData.hrProfile.employeeType.replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Self-Service Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Off */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">🏖️</div>
          <h3 className="text-lg font-semibold mb-2">Time Off</h3>
          <p className="text-gray-600 text-sm mb-4">
            Request vacation, sick leave, and view your balance
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
        
        {/* Pay Stubs */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">💵</div>
          <h3 className="text-lg font-semibold mb-2">Pay Stubs</h3>
          <p className="text-gray-600 text-sm mb-4">
            View your pay history and download pay stubs
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
        
        {/* Benefits */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">🏥</div>
          <h3 className="text-lg font-semibold mb-2">My Benefits</h3>
          <p className="text-gray-600 text-sm mb-4">
            View and manage your benefits enrollment
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
        
        {/* Performance */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="text-3xl mb-3">⭐</div>
          <h3 className="text-lg font-semibold mb-2">My Reviews</h3>
          <p className="text-gray-600 text-sm mb-4">
            View your performance reviews and goals
          </p>
          <p className="text-sm text-gray-500">
            Feature coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

