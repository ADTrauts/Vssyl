export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock feature data for now - this would come from your database
    const features = [
      {
        name: 'advanced_analytics',
        requiredTier: 'standard' as const,
        usageLimit: 1000,
        usageMetric: 'analytics_queries',
        hasAccess: true,
        usageInfo: {
          metric: 'analytics_queries',
          limit: 1000,
          currentUsage: 150,
          remaining: 850,
        },
      },
      {
        name: 'unlimited_storage',
        requiredTier: 'enterprise' as const,
        usageLimit: -1, // unlimited
        usageMetric: 'storage_gb',
        hasAccess: false,
        usageInfo: {
          metric: 'storage_gb',
          limit: 10,
          currentUsage: 8,
          remaining: 2,
        },
      },
      {
        name: 'team_collaboration',
        requiredTier: 'standard' as const,
        usageLimit: 10,
        usageMetric: 'team_members',
        hasAccess: true,
        usageInfo: {
          metric: 'team_members',
          limit: 10,
          currentUsage: 3,
          remaining: 7,
        },
      },
    ];

    return NextResponse.json({ features });
  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 