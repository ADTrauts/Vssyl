import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { featureName: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureName } = params;

    // Mock feature access check - this would query your database
    const featureAccess = {
      featureName,
      hasAccess: true, // Mock: all features accessible for now
      reason: 'Active subscription',
      usageInfo: {
        metric: 'analytics_queries',
        limit: 1000,
        currentUsage: 150,
        remaining: 850,
      },
    };

    return NextResponse.json(featureAccess);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 