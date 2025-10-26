/**
 * HR Administration Dashboard
 * 
 * Business Admin view of HR module
 * Access: Business owners and admins only
 * Location: /business/[id]/admin/hr
 * 
 * Framework: Displays available features based on tier
 * Features will be implemented incrementally
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useHRFeatures } from '@/hooks/useHRFeatures';
import Link from 'next/link';

export default function HRAdminDashboard() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const businessId = (params?.id as string) || '';
  
  // TODO: Get actual business tier from API
  const [businessTier, setBusinessTier] = useState<string>('business_advanced');
  const hrFeatures = useHRFeatures(businessTier);
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: Fetch business tier from API
    // For now, simulate loading
    setTimeout(() => setLoading(false), 500);
  }, [businessId]);
  
  if (loading || hrFeatures.loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (!hrFeatures.hasHRAccess) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">HR Module Not Available</h1>
        <p className="text-gray-600 mb-4">
          Upgrade to Business Advanced or Enterprise to access HR features.
        </p>
        <Link 
          href="/billing/upgrade"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          HR Administration
          {hrFeatures.tier === 'business_advanced' && (
            <span className="text-sm font-normal ml-2 text-gray-600">
              (Limited Features)
            </span>
          )}
        </h1>
        <p className="text-gray-600 mt-2">
          Manage employees, attendance, payroll, and more
        </p>
      </div>
      
      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Employees - Available on Business Advanced+ */}
        <FeatureCard
          title="Employees"
          description="Manage employee directory and profiles"
          icon="👥"
          available={hrFeatures.employees.enabled}
          tier={hrFeatures.tier!}
          limitInfo={
            hrFeatures.employees.limit 
              ? `Limited to ${hrFeatures.employees.limit} employees`
              : 'Unlimited employees'
          }
          href={`/business/${businessId}/admin/hr/employees`}
        />
        
        {/* Attendance - Available on Business Advanced+ */}
        <FeatureCard
          title="Attendance"
          description="Track time-off, schedules, and attendance"
          icon="📅"
          available={hrFeatures.attendance.enabled}
          tier={hrFeatures.tier!}
          limitInfo={
            !hrFeatures.attendance.clockInOut
              ? 'Time-off only (no clock in/out)'
              : 'Full attendance tracking'
          }
          href={`/business/${businessId}/admin/hr/attendance`}
        />
        
        {/* Payroll - Enterprise only */}
        <FeatureCard
          title="Payroll"
          description="Process payroll and manage compensation"
          icon="💰"
          available={hrFeatures.payroll}
          tier={hrFeatures.tier!}
          requiresTier="enterprise"
          upgradeMessage={hrFeatures.getFeatureUpgradeMessage('payroll')}
          href={`/business/${businessId}/admin/hr/payroll`}
        />
        
        {/* Recruitment - Enterprise only */}
        <FeatureCard
          title="Recruitment"
          description="Applicant tracking and hiring pipeline"
          icon="📢"
          available={hrFeatures.recruitment}
          tier={hrFeatures.tier!}
          requiresTier="enterprise"
          upgradeMessage={hrFeatures.getFeatureUpgradeMessage('recruitment')}
          href={`/business/${businessId}/admin/hr/recruitment`}
        />
        
        {/* Performance - Enterprise only */}
        <FeatureCard
          title="Performance"
          description="Reviews, goals, and performance management"
          icon="📈"
          available={hrFeatures.performance}
          tier={hrFeatures.tier!}
          requiresTier="enterprise"
          upgradeMessage={hrFeatures.getFeatureUpgradeMessage('performance')}
          href={`/business/${businessId}/admin/hr/performance`}
        />
        
        {/* Benefits - Enterprise only */}
        <FeatureCard
          title="Benefits"
          description="Benefits enrollment and administration"
          icon="🏥"
          available={hrFeatures.benefits}
          tier={hrFeatures.tier!}
          requiresTier="enterprise"
          upgradeMessage={hrFeatures.getFeatureUpgradeMessage('benefits')}
          href={`/business/${businessId}/admin/hr/benefits`}
        />
      </div>
      
      {/* HR Settings */}
      <div className="mt-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">HR Settings</h2>
        <p className="text-gray-600 mb-4">
          Configure HR policies, work week settings, and module preferences
        </p>
        <Link
          href={`/business/${businessId}/admin/hr/settings`}
          className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Manage Settings
        </Link>
      </div>
    </div>
  );
}

/**
 * Feature Card Component
 */
function FeatureCard({ 
  title, 
  description,
  icon,
  available, 
  tier, 
  requiresTier = null,
  limitInfo = null,
  upgradeMessage = null,
  href
}: {
  title: string;
  description: string;
  icon: string;
  available: boolean;
  tier: string;
  requiresTier?: string | null;
  limitInfo?: string | null;
  upgradeMessage?: string | null;
  href: string;
}) {
  if (available) {
    return (
      <Link href={href}>
        <div className="border p-6 rounded-lg bg-white hover:shadow-lg transition-shadow cursor-pointer">
          <div className="text-4xl mb-3">{icon}</div>
          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-gray-600 text-sm mb-3">{description}</p>
          <p className="text-green-600 text-sm font-medium">✓ Available</p>
          {limitInfo && (
            <p className="text-gray-500 text-xs mt-2">{limitInfo}</p>
          )}
        </div>
      </Link>
    );
  }
  
  return (
    <div className="border p-6 rounded-lg bg-gray-50 opacity-75">
      <div className="text-4xl mb-3 grayscale">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-500 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-3">{description}</p>
      <p className="text-gray-500 text-sm">
        {requiresTier === 'enterprise' 
          ? 'Enterprise tier required' 
          : 'Not available'}
      </p>
      {tier === 'business_advanced' && requiresTier === 'enterprise' && (
        <Link 
          href="/billing/upgrade" 
          className="text-blue-600 text-sm mt-2 inline-block hover:underline"
        >
          Upgrade to Enterprise →
        </Link>
      )}
    </div>
  );
}

