'use client';

import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PlaceListingEditor } from '@/components/place/PlaceListingEditor';

/**
 * Standalone Place listing page — also available as a section in the Business Admin dashboard.
 * Kept for deep linking (e.g. from emails, bookmarks). The primary editing surface is Business Admin.
 */
export default function BusinessPlaceListingPage() {
  const params = useParams();
  const businessId = params?.id as string;
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <PlaceListingEditor businessId={businessId} token={token} compact={false} />
    </div>
  );
}
