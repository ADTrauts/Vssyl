'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { BusinessAIControlCenter } from '@/components/business/ai/BusinessAIControlCenter';

export default function BusinessAIPage() {
  const params = useParams();
  const businessId = params.id as string;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-6">
        <BusinessAIControlCenter businessId={businessId} />
      </div>
    </div>
  );
}
