'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { PageHeader, PageToolbar } from '@/components/layouts';
import {
  MapPin,
  Store,
  ExternalLink,
  Pencil,
  Eye,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { getListing } from '@/api/placeListing';
import type { PlaceListing } from '@/api/placeListing';
import { PlaceListingEditor } from './PlaceListingEditor';

interface PlaceWorkspaceLandingProps {
  businessId: string;
}

export default function PlaceWorkspaceLanding({ businessId }: PlaceWorkspaceLandingProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams?.get('view') ?? 'hub';
  const token = session?.accessToken as string | undefined;

  const [listing, setListing] = useState<PlaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListing = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getListing(businessId, token);
      setListing(data);
    } catch (err) {
      setListing(null);
      setError(err instanceof Error ? err.message : 'Failed to load Place listing');
    } finally {
      setLoading(false);
    }
  }, [businessId, token]);

  useEffect(() => {
    void loadListing();
  }, [loadListing]);

  useEffect(() => {
    const onListingRestore = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleId?: string; type?: string; metadata?: { businessId?: string } }>).detail;
      if (detail?.moduleId === 'place' && detail.type === 'listing' && detail.metadata?.businessId === businessId) {
        void loadListing();
      }
    };
    window.addEventListener('itemRestored', onListingRestore);
    window.addEventListener('placeItemTrashed', onListingRestore);
    return () => {
      window.removeEventListener('itemRestored', onListingRestore);
      window.removeEventListener('placeItemTrashed', onListingRestore);
    };
  }, [businessId, loadListing]);

  const openEditor = () => {
    router.push(`/business/${businessId}/workspace?module=place&view=listing`);
  };

  const backToHub = () => {
    router.push(`/business/${businessId}/workspace?module=place`);
  };

  if (view === 'listing') {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <PageHeader
          title="Manage Place Listing"
          description="Update how your business appears on the personal Place graph."
          icon={<MapPin className="h-6 w-6 text-emerald-600" />}
          actions={
            <Button variant="ghost" size="sm" onClick={backToHub}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Place hub
            </Button>
          }
        />
        <PageToolbar
          leading={
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Listing editor — cover, links, and publish settings
            </span>
          }
        />
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <PlaceListingEditor businessId={businessId} token={token} compact />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isPublished = listing?.isPublished === true;
  const isEnabled = listing?.isEnabled !== false;
  const displayName = listing?.displayName || 'Your business listing';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader
        title="Vssyl Place"
        description="Publish and manage your business storefront on the personal Place graph."
        icon={<MapPin className="h-6 w-6 text-emerald-600" />}
        actions={
          <Badge color={isPublished ? 'green' : 'yellow'}>
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
        }
      />
      <PageToolbar
        trailing={
          <Button variant="primary" size="sm" onClick={openEditor}>
            <Pencil className="mr-2 h-4 w-4" />
            Manage listing
          </Button>
        }
      />

      <div className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl space-y-6">
          {error && (
            <Alert type="error" title="Could not load listing">
              {error}
            </Alert>
          )}

          <Card className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-gray-500" />
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {displayName}
                  </h2>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {listing?.shortDescription ||
                    'Configure your listing, cover image, interaction links, and publish settings.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Listing {isEnabled ? 'enabled' : 'disabled'}</span>
                  <span>{isPublished ? 'Visible on Place' : 'Not published yet'}</span>
                </div>
              </div>
              <Button onClick={openEditor}>
                <Pencil className="mr-2 h-4 w-4" />
                Manage listing
              </Button>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Listing editor</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Update display name, category, cover, avatar, and commerce links.
              </p>
              <Button className="mt-4" variant="secondary" onClick={openEditor}>
                Open editor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            <Card className="p-5">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">Explore Place</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Preview how members discover businesses on the personal Place graph.
              </p>
              <Link href="/place?tab=explore" className="mt-4 inline-flex">
                <Button variant="secondary">
                  <Eye className="mr-2 h-4 w-4" />
                  Open Explore
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
