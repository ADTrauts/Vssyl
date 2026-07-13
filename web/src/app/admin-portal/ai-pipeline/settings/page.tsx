'use client';

import { Card } from 'shared/components';
import Link from 'next/link';
import PipelineSubpageShell from '../../../../components/admin-portal/ai-pipeline/PipelineSubpageShell';

/**
 * Canonical Settings — Phase 4B consolidates ops RBAC docs with pipeline policy links.
 * Runtime mutation only via existing pipeline policy/enforcement services.
 */
export default function AiPipelineSettingsPage() {
  return (
    <PipelineSubpageShell
      title="Settings"
      description="Operator access and pipeline configuration entry points. Intelligence workflows remain observe/review."
    >
      <div className="grid md:grid-cols-2 gap-v-4 max-w-4xl">
        <Card className="p-v-4">
          <h3 className="font-semibold">Access (platform admin)</h3>
          <p className="text-sm text-v-text-secondary mt-v-2">
            AI Pipeline operator APIs require platform <code>ADMIN</code> JWT. Business-scoped
            operator UI is deferred — unverified business headers do not grant access.
          </p>
          <ul className="text-sm mt-v-3 list-disc pl-v-4 space-y-v-1">
            <li>Platform Admin — full operator access</li>
            <li>Business AI surfaces remain on business routes (not absorbed)</li>
            <li>Personal AI Identity remains on /ai</li>
          </ul>
        </Card>
        <Card className="p-v-4">
          <h3 className="font-semibold">Pipeline configuration</h3>
          <ul className="text-sm mt-v-3 list-disc pl-v-4 space-y-v-1">
            <li>
              <Link href="/admin-portal/ai-pipeline/quality" className="text-indigo-600 hover:underline">
                Quality & Enforcement
              </Link>
            </li>
            <li>
              <Link href="/admin-portal/ai-pipeline/intents" className="text-indigo-600 hover:underline">
                Intent Catalog
              </Link>
            </li>
            <li>
              <Link href="/admin-portal/ai-pipeline/tools" className="text-indigo-600 hover:underline">
                Tool Policies
              </Link>
            </li>
            <li>
              <Link
                href="/admin-portal/ai-pipeline#provider-governance"
                className="text-indigo-600 hover:underline"
              >
                Provider Governance
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </PipelineSubpageShell>
  );
}
