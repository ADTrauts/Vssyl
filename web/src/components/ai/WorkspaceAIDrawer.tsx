'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, Button, Badge, Spinner } from 'shared/components';
import { X, Building2, Shield, ChevronRight } from 'lucide-react';
import {
  fetchWorkspaceAIPolicyDigest,
  type WorkspaceAIPolicyDigest,
} from '../../api/workspaceAI';

interface WorkspaceAIDrawerProps {
  open: boolean;
  businessId: string | null | undefined;
  onClose: () => void;
}

export default function WorkspaceAIDrawer({
  open,
  businessId,
  onClose,
}: WorkspaceAIDrawerProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [digest, setDigest] = useState<WorkspaceAIPolicyDigest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !businessId || !session?.accessToken) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void fetchWorkspaceAIPolicyDigest(session.accessToken, businessId)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setDigest(null);
          setError('Workspace AI policies are not available for this workspace.');
          return;
        }
        setDigest(data);
      })
      .catch(() => {
        if (!cancelled) {
          setDigest(null);
          setError('Could not load workspace policies.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, businessId, session?.accessToken]);

  if (!open) return null;

  const title =
    digest?.workspaceAIName ||
    (digest?.businessName ? `${digest.businessName} Workspace AI` : 'Workspace AI');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workspace-ai-drawer-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <Card className="relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-xl p-6 shadow-xl z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex gap-2">
            <Building2 className="w-5 h-5 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5" />
            <div>
              <h2
                id="workspace-ai-drawer-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                What your organization set for this workspace — read-only for you.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size={28} />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-gray-700 dark:text-gray-300">{error}</p>
        )}

        {!loading && digest && (
          <>
            {digest.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">{digest.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge size="sm" color="gray">
                Security: {digest.securityLevel}
              </Badge>
              {digest.complianceMode && (
                <Badge size="sm" color="yellow">
                  <Shield className="w-3 h-3 mr-1 inline" />
                  Compliance mode
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 p-3 rounded-lg bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900">
              {digest.personalIdentityNote}
            </p>

            {digest.policyLines.length > 0 && (
              <section className="mb-4">
                <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Workspace policies
                </h3>
                <ul className="space-y-2">
                  {digest.policyLines.map((line) => (
                    <li
                      key={line}
                      className="text-sm text-gray-800 dark:text-gray-200 pl-3 border-l-2 border-amber-400 dark:border-amber-600"
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {digest.voiceHints.length > 0 && (
              <section className="mb-4">
                <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                  Business voice (when relevant)
                </h3>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {digest.voiceHints.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            )}

            {digest.policyLines.length === 0 && digest.voiceHints.length === 0 && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                No detailed policies are configured yet. Your organization may still apply
                standard workspace boundaries during chat.
              </p>
            )}

            <Link
              href="/ai?tab=identity"
              className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
              onClick={onClose}
            >
              Open your AI Identity
              <ChevronRight className="w-4 h-4" />
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}
