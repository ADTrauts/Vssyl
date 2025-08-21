import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect to login if no session
  if (!session) {
    redirect('/auth/login');
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Redirect to the new admin portal
  redirect('/admin-portal');
} 