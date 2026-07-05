'use client';

import React, { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, Button, Input, Badge, Alert, Spinner } from 'shared/components';
import {
  Building2,
  Users,
  Eye,
  DollarSign,
  Activity,
  Search,
  RefreshCw,
  ChevronRight,
  Mail,
  Package,
} from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';
import { AdminPortalPageShell } from '../../../components/admin-portal/AdminPortalPageShell';
import { AdminPortalBreadcrumbs } from '../../../components/admin-portal/AdminPortalBreadcrumbs';

interface OperatorBusiness {
  id: string;
  name: string;
  tier: string;
  industry: string | null;
  status: string;
  createdAt: string;
  memberCount: number;
  moduleCount: number;
  owners: Array<{ id: string; name: string | null; email: string }>;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  lastActivityAt: string | null;
  workspaceHealth: 'healthy' | 'warning' | 'unknown';
}

interface BusinessDetail {
  id: string;
  name: string;
  tier: string;
  industry: string | null;
  status?: string;
  stripeCustomerId: string | null;
  workspaceHealth: 'healthy' | 'warning' | 'unknown';
  email: string | null;
  website: string | null;
  billingEmail: string | null;
  isDeveloperBusiness: boolean;
  owners?: Array<{ id: string; name: string | null; email: string }>;
  _count: {
    members: number;
    businessModuleInstallations: number;
    invitations: number;
  };
  subscriptions: Array<{
    id: string;
    tier: string;
    status: string;
    stripeSubscriptionId: string | null;
    currentPeriodEnd: string;
  }>;
  members: Array<{
    id: string;
    role: string;
    title: string | null;
    joinedAt: string;
    user: { id: string; name: string | null; email: string };
  }>;
  dashboards: Array<{ id: string }>;
}

const HEALTH_BADGE: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  unknown: 'bg-gray-100 text-gray-800',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function BusinessesPageContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams?.get('highlight') ?? null;

  const [businesses, setBusinesses] = useState<OperatorBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(highlightId);
  const [detail, setDetail] = useState<BusinessDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApiService.listOperatorBusinesses({ page, limit: 20, search });
      if (res.error) {
        setError(res.error);
        return;
      }
      const data = res.data as {
        businesses: OperatorBusiness[];
        total: number;
      };
      setBusinesses(data.businesses ?? []);
      setTotal(data.total ?? 0);
      setError(null);
    } catch {
      setError('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await adminApiService.getOperatorBusinessDetail(id);
      if (!res.error && res.data) {
        setDetail(res.data as BusinessDetail);
      }
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (selectedId) {
      void loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  useEffect(() => {
    if (highlightId) {
      setSelectedId(highlightId);
    }
  }, [highlightId]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <AdminPortalPageShell
      title="Businesses"
      description="Operator hub for workspace discovery, health, and quick navigation to billing, users, and impersonation."
      actions={
        <Button onClick={() => void loadList()} variant="secondary" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <AdminPortalBreadcrumbs />

      {error && (
        <Alert onClose={() => setError(null)}>{error}</Alert>
      )}

      <div className="flex gap-6">
        <div className="flex-1 min-w-0 space-y-4">
          <Card className="p-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPage(1);
                setSearch(searchInput);
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-v-text-muted" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, industry, email, or EIN…"
                  className="pl-9"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-v-surface-muted text-v-text-secondary">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Business</th>
                      <th className="text-left px-4 py-3 font-medium">Owners</th>
                      <th className="text-left px-4 py-3 font-medium">Tier</th>
                      <th className="text-left px-4 py-3 font-medium">Members</th>
                      <th className="text-left px-4 py-3 font-medium">Health</th>
                      <th className="text-left px-4 py-3 font-medium">Last activity</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.map((b) => (
                      <tr
                        key={b.id}
                        className={`border-t border-v-border cursor-pointer hover:bg-v-surface-muted ${
                          selectedId === b.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                        }`}
                        onClick={() => setSelectedId(b.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-v-text-muted" />
                            <div>
                              <p className="font-medium text-v-text-primary">{b.name}</p>
                              <p className="text-xs text-v-text-muted">Created {formatDate(b.createdAt)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-v-text-secondary">
                          {b.owners.length > 0
                            ? b.owners.map((o) => o.email).join(', ')
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-v-text-primary">{b.subscriptionTier ?? b.tier}</span>
                          {b.subscriptionStatus ? (
                            <span className="text-xs text-v-text-muted block">{b.subscriptionStatus}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-v-text-secondary">{b.memberCount}</td>
                        <td className="px-4 py-3">
                          <Badge className={HEALTH_BADGE[b.workspaceHealth]}>{b.workspaceHealth}</Badge>
                        </td>
                        <td className="px-4 py-3 text-v-text-muted">{formatDate(b.lastActivityAt)}</td>
                        <td className="px-4 py-3">
                          <ChevronRight className="w-4 h-4 text-v-text-muted" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {businesses.length === 0 && (
                <p className="text-center py-8 text-v-text-muted">No businesses found.</p>
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-v-border">
                  <span className="text-sm text-v-text-muted">
                    {total} business{total !== 1 ? 'es' : ''}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-v-text-secondary self-center">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {selectedId && (
          <div className="w-96 shrink-0">
            <Card className="p-5 sticky top-4 space-y-4">
              {detailLoading || !detail ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-lg font-semibold text-v-text-primary">{detail.name}</h2>
                    <p className="text-sm text-v-text-muted">{detail.industry ?? 'No industry'}</p>
                    <Badge className={`mt-2 ${HEALTH_BADGE[detail.workspaceHealth]}`}>
                      Workspace {detail.workspaceHealth}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-v-text-muted">Members</p>
                      <p className="font-medium">{detail._count.members}</p>
                    </div>
                    <div>
                      <p className="text-v-text-muted">Modules</p>
                      <p className="font-medium">{detail._count.businessModuleInstallations}</p>
                    </div>
                    <div>
                      <p className="text-v-text-muted">Pending invites</p>
                      <p className="font-medium">{detail._count.invitations}</p>
                    </div>
                    <div>
                      <p className="text-v-text-muted">Subscription</p>
                      <p className="font-medium">{detail.subscriptions[0]?.status ?? '—'}</p>
                    </div>
                  </div>

                  {(() => {
                    const owners =
                      detail.owners ??
                      detail.members
                        .filter((m) => m.role === 'ADMIN')
                        .map((m) => m.user);
                    if (owners.length === 0) return null;
                    return (
                      <div>
                        <p className="text-xs font-medium text-v-text-muted uppercase mb-1">Owners</p>
                        {owners.map((o) => (
                          <p key={o.id} className="text-sm text-v-text-secondary truncate">
                            {o.name ?? o.email}
                          </p>
                        ))}
                      </div>
                    );
                  })()}

                  <div className="space-y-2 pt-2 border-t border-v-border">
                    <p className="text-xs font-medium text-v-text-muted uppercase">Quick actions</p>
                    <Link
                      href={`/admin-portal/impersonate?businessId=${detail.id}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Eye className="w-4 h-4" /> Impersonate in workspace
                    </Link>
                    <Link
                      href={`/admin-portal/billing${detail.stripeCustomerId ? `?customer=${detail.stripeCustomerId}` : ''}`}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <DollarSign className="w-4 h-4" /> Billing
                    </Link>
                    <Link
                      href="/admin-portal/users"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Users className="w-4 h-4" /> Users directory
                    </Link>
                    <Link
                      href="/admin-portal/analytics"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Activity className="w-4 h-4" /> Platform analytics
                    </Link>
                    {detail.billingEmail && (
                      <p className="flex items-center gap-2 text-sm text-v-text-muted">
                        <Mail className="w-4 h-4" /> {detail.billingEmail}
                      </p>
                    )}
                    {detail.isDeveloperBusiness && (
                      <p className="flex items-center gap-2 text-sm text-v-text-muted">
                        <Package className="w-4 h-4" /> Developer business
                      </p>
                    )}
                  </div>

                  {detail.members.length > 0 && (
                    <div className="pt-2 border-t border-v-border">
                      <p className="text-xs font-medium text-v-text-muted uppercase mb-2">
                        Recent members
                      </p>
                      <ul className="space-y-1 max-h-32 overflow-y-auto">
                        {detail.members.slice(0, 8).map((m) => (
                          <li key={m.id} className="text-xs text-v-text-secondary truncate">
                            {m.user.email} · {m.role}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </AdminPortalPageShell>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner /></div>}>
      <BusinessesPageContent />
    </Suspense>
  );
}
