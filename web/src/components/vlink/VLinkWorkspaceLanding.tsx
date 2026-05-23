'use client';

import React from 'react';
import { Link2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VLinkWorkspaceLandingProps {
  businessId: string;
}

export function VLinkWorkspaceLanding({ businessId }: VLinkWorkspaceLandingProps) {
  const router = useRouter();
  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="text-indigo-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">V_Link</h1>
      </div>
      <p className="text-gray-700 mb-6">
        Connect related files, calendar events, and more across your business workspace.
      </p>
      <button
        type="button"
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        onClick={() => router.push(`/vlink?dashboard=${businessId}`)}
      >
        Open V_Link hub
      </button>
    </div>
  );
}
