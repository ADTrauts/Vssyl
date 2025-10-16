'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BusinessAIControlCenter } from '@/components/business/ai/BusinessAIControlCenter';
import { Breadcrumbs, Button } from 'shared/components';
import { ChevronRight } from 'lucide-react';

export default function BusinessAIAdminPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params?.id as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        <div className="mb-4">
          <Breadcrumbs
            items={[
              { label: 'Admin', onClick: () => router.push(`/business/${businessId}`) },
              { label: 'AI Control Center', active: true },
            ]}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">AI Control Center</h1>
          <Button
            variant="secondary"
            onClick={() => router.push(`/business/${businessId}`)}
            className="flex items-center space-x-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span>Back to Admin</span>
          </Button>
        </div>

        <BusinessAIControlCenter businessId={businessId} />
      </div>
    </div>
  );
}


