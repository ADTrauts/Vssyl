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

    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const businessId = searchParams.get('businessId');

    if (!module) {
      return NextResponse.json({ error: 'Module parameter is required' }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://vssyl-server-235369681725.us-central1.run.app'}/api/features/module`);
    backendUrl.searchParams.set('module', module);
    if (businessId) {
      backendUrl.searchParams.set('businessId', businessId);
    }
    
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend request failed:', response.status, errorData);
      return NextResponse.json({ error: 'Failed to get module feature access' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting module feature access:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
