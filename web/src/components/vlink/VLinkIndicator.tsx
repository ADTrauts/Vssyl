'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Link2 } from 'lucide-react';
import * as vlinksAPI from '@/api/vlinks';
import type { EntityVLinkRef, VLinkEntityType } from '@/api/vlinks';

interface VLinkIndicatorProps {
  entityType: VLinkEntityType;
  entityId: string;
  className?: string;
}

export function VLinkIndicator({ entityType, entityId, className = '' }: VLinkIndicatorProps) {
  const { data: session } = useSession();
  const [vlinks, setVlinks] = useState<EntityVLinkRef[]>([]);

  useEffect(() => {
    if (!session?.accessToken || !entityId) return;
    vlinksAPI
      .getVLinksForEntity(session.accessToken, entityType, entityId)
      .then(setVlinks)
      .catch(() => setVlinks([]));
  }, [session?.accessToken, entityType, entityId]);

  if (vlinks.length === 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded bg-indigo-50 text-indigo-700 px-1 py-0.5 text-[10px] font-medium ${className}`}
      title={vlinks.map((v) => `${v.title} (${v.publicCode})`).join(', ')}
    >
      <Link2 size={10} />
      {vlinks.length > 1 ? vlinks.length : ''}
    </span>
  );
}

export function VLinkCornerMarker({ entityType, entityId }: VLinkIndicatorProps) {
  const { data: session } = useSession();
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    vlinksAPI
      .getVLinksForEntity(session.accessToken, entityType, entityId)
      .then((rows) => setLinked(rows.length > 0))
      .catch(() => setLinked(false));
  }, [session?.accessToken, entityType, entityId]);

  if (!linked) return null;

  return (
    <div
      className="absolute top-0 right-0 w-0 h-0 border-t-[14px] border-l-[14px] border-t-indigo-500 border-l-transparent pointer-events-none"
      aria-label="Linked to V_Link"
    />
  );
}
