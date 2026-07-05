'use client';

import React from 'react';
import Link from 'next/link';
import { Badge, Button, Spinner } from 'shared/components';
import {
  User,
  Building2,
  CreditCard,
  Mail,
  Activity,
  Eye,
  ExternalLink,
  Bot,
  Clock,
  Copy,
  RefreshCw,
} from 'lucide-react';

export interface SupportTicketContext {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    lastActiveAt: string | null;
  };
  businesses: Array<{
    id: string;
    name: string;
    role: string;
    stripeCustomerId: string | null;
  }>;
  workspace: { businessId: string; businessName: string; dashboardId: string | null } | null;
  subscriptions: Array<{
    id: string;
    tier: string;
    status: string;
    stripeUrls?: { subscription?: string | null; customer?: string | null };
  }>;
  billingStatus: string | null;
  pendingInvitations: Array<{
    id: string;
    email: string;
    businessName: string;
    status: string;
  }>;
  recentEmails: Array<{ message: string; timestamp: string; success: boolean }>;
  recentActivity: Array<{ action: string; timestamp: string }>;
  recentAiActivity: Array<{ interactionType: string; timestamp: string; query: string }>;
  recentAuditEvents: Array<{ action: string; timestamp: string }>;
  links: {
    user: string;
    businesses: string;
    billing: string;
    impersonate: string;
    activity: string;
    emailOperations: string;
  };
}

interface SupportContextSidebarProps {
  context: SupportTicketContext | null;
  loading: boolean;
  onResendInvitation?: (invitationId: string) => void;
  resendingId?: string | null;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SupportContextSidebar({
  context,
  loading,
  onResendInvitation,
  resendingId,
}: SupportContextSidebarProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size={24} />
      </div>
    );
  }

  if (!context) {
    return <p className="text-sm text-v-text-muted">No operator context available.</p>;
  }

  const primarySub = context.subscriptions[0];

  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-xs font-semibold text-v-text-muted uppercase mb-2">Customer</p>
        <div className="space-y-1">
          <p className="font-medium text-v-text-primary">{context.user.name ?? 'Unknown'}</p>
          <p className="text-v-text-secondary truncate">{context.user.email}</p>
          {context.user.lastActiveAt && (
            <p className="text-xs text-v-text-muted">Last active {formatRelative(context.user.lastActiveAt)}</p>
          )}
        </div>
      </div>

      {context.workspace && (
        <div>
          <p className="text-xs font-semibold text-v-text-muted uppercase mb-2">Workspace</p>
          <p className="font-medium">{context.workspace.businessName}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-v-text-muted uppercase mb-2">Billing</p>
        {primarySub ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge color={primarySub.status === 'active' ? 'green' : 'yellow'}>{primarySub.status}</Badge>
              <span className="text-v-text-secondary">{primarySub.tier}</span>
            </div>
            <div className="flex gap-1">
              {primarySub.stripeUrls?.customer && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(primarySub.stripeUrls?.customer ?? '', '_blank')}
                  title="Stripe customer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              )}
              {primarySub.stripeUrls?.subscription && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(primarySub.stripeUrls?.subscription ?? '', '_blank')}
                  title="Stripe subscription"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-v-text-muted">No subscription</p>
        )}
      </div>

      {context.pendingInvitations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-v-text-muted uppercase mb-2">Pending invitations</p>
          <ul className="space-y-2 max-h-28 overflow-y-auto">
            {context.pendingInvitations.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-v-text-secondary">{inv.email}</span>
                {onResendInvitation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={resendingId === inv.id}
                    onClick={() => onResendInvitation(inv.id)}
                    title="Resend invitation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendingId === inv.id ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {context.recentEmails.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-v-text-muted uppercase mb-2">Recent emails</p>
          <ul className="space-y-1 max-h-24 overflow-y-auto">
            {context.recentEmails.slice(0, 4).map((e, i) => (
              <li key={i} className="text-xs text-v-text-secondary truncate">
                <span className={e.success ? 'text-green-700' : 'text-red-700'}>{e.success ? '✓' : '✗'}</span>{' '}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {context.recentActivity.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-v-text-muted uppercase mb-2">Recent activity</p>
          <ul className="space-y-1 max-h-24 overflow-y-auto">
            {context.recentActivity.slice(0, 4).map((a, i) => (
              <li key={i} className="text-xs text-v-text-secondary truncate">
                {a.action} · {formatRelative(a.timestamp)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {context.recentAiActivity.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-v-text-muted uppercase mb-2 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" /> AI activity
          </p>
          <ul className="space-y-1 max-h-24 overflow-y-auto">
            {context.recentAiActivity.slice(0, 3).map((a, i) => (
              <li key={i} className="text-xs text-v-text-secondary truncate">
                {a.interactionType}: {a.query}
              </li>
            ))}
          </ul>
        </div>
      )}

      {context.recentAuditEvents.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-v-text-muted uppercase mb-2">Audit</p>
          <ul className="space-y-1 max-h-20 overflow-y-auto">
            {context.recentAuditEvents.slice(0, 3).map((a, i) => (
              <li key={i} className="text-xs text-v-text-secondary truncate">
                <Clock className="w-3 h-3 inline mr-1" />
                {a.action}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-3 border-t border-v-border space-y-2">
        <p className="text-xs font-semibold text-v-text-muted uppercase">Quick links</p>
        <Link href={context.links.user} className="flex items-center gap-2 text-blue-600 hover:underline">
          <User className="w-4 h-4" /> Users
        </Link>
        <Link href={context.links.businesses} className="flex items-center gap-2 text-blue-600 hover:underline">
          <Building2 className="w-4 h-4" /> Business
        </Link>
        <Link href={context.links.billing} className="flex items-center gap-2 text-blue-600 hover:underline">
          <CreditCard className="w-4 h-4" /> Billing
        </Link>
        <Link href={context.links.impersonate} className="flex items-center gap-2 text-blue-600 hover:underline">
          <Eye className="w-4 h-4" /> Impersonation
        </Link>
        <Link href={context.links.activity} className="flex items-center gap-2 text-blue-600 hover:underline">
          <Activity className="w-4 h-4" /> Activity
        </Link>
        <Link href={context.links.emailOperations} className="flex items-center gap-2 text-blue-600 hover:underline">
          <Mail className="w-4 h-4" /> Email Operations
        </Link>
      </div>
    </div>
  );
}

export async function copyInvitationLink(inviteUrl: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(inviteUrl);
    return true;
  } catch {
    return false;
  }
}

export { Copy };
