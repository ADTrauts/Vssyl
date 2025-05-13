'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();

  const features = [
    {
      title: 'Drive',
      description: 'Store, organize, and share your files securely',
      icon: '📁',
      path: '/drive',
    },
    {
      title: 'Chat',
      description: 'Communicate with your team in real-time',
      icon: '💬',
      path: '/chat',
    },
    {
      title: 'Settings',
      description: 'Manage your account and preferences',
      icon: '⚙️',
      path: '/settings',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
          Welcome, {user?.name || 'User'}!
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Get started with your workspace
        </p>
      </div>

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                {feature.icon}
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium">
                <button
                  onClick={() => router.push(feature.path)}
                  className="focus:outline-none"
                >
                  <span className="absolute inset-0" aria-hidden="true" />
                  {feature.title}
                </button>
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 