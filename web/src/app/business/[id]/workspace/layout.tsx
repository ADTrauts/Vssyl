import React from 'react';
import { notFound, redirect } from 'next/navigation';
import BusinessWorkspaceWrapper from '../../../../components/BusinessWorkspaceWrapper';
import { serverBusinessApiCall } from '../../../../lib/serverApiUtils';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

export default async function Layout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  // Redirect to login if no session
  if (!session) {
    redirect('/auth/login');
  }
  
  const token = session.accessToken;
  if (!token) {
    redirect('/auth/login');
  }
  
  let business = null;
  try {
    const response = await serverBusinessApiCall<{ success: boolean; data: any }>(`/${params.id}`, { method: 'GET' }, token);
    if (response.success) {
      business = response.data;
    }
  } catch (error: any) {
    console.error('Error fetching business:', error);
    
    // Handle server-side auth errors by redirecting to login
    if (error.message?.includes('Session expired') || 
        error.message?.includes('No authentication token') ||
        error.status === 401 || 
        error.status === 403) {
      redirect('/auth/login');
    }
    
    // Handle business not found specifically
    if (error.message?.includes('Business not found') || error.status === 404) {
      console.error(`Business with ID ${params.id} not found`);
      return notFound();
    }
    
    // For other errors, throw them to be handled by Next.js error boundary
    throw error;
  }
  
  if (!business) {
    console.error(`Business data is null for ID ${params.id}`);
    return notFound();
  }

  return (
    <BusinessWorkspaceWrapper business={business}>
      {children}
    </BusinessWorkspaceWrapper>
  );
} 