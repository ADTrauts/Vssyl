'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProfileForm from '@/components/settings/ProfileForm';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your account settings and preferences
        </p>
        <div className="mt-8">
          <ProfileForm user={user} />
        </div>
      </div>
    </div>
  );
} 