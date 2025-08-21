export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feature, quantity = 1, businessId } = body;

    if (!feature) {
      return NextResponse.json({ error: 'Feature parameter is required' }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/features/usage`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        feature,
        quantity,
        businessId
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Backend request failed:', response.status, errorData);
      return NextResponse.json({ error: 'Failed to record usage' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error recording feature usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}