'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, Alert, Spinner, Input } from 'shared/components';
import {
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  Send,
  Server,
} from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';
import { AdminPortalPageShell } from '../../../components/admin-portal/AdminPortalPageShell';
import { AdminPortalBreadcrumbs } from '../../../components/admin-portal/AdminPortalBreadcrumbs';
import { showOperatorToast } from '../../../lib/adminPortalOperatorToast';

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface EmailOpsStatus {
  configured: boolean;
  transportReady: boolean;
  provider: string;
  smtp: { host: string; port: number; secure: boolean; user: string } | null;
  addresses: {
    from: string;
    fromEmail: string;
    replyTo: string;
    support: string;
    billing: string;
  };
  lastSuccessfulSend: string | null;
  recentFailureCount: number;
  templates: EmailTemplate[];
}

interface TemplatePreview {
  id: string;
  name: string;
  category: string;
  description: string;
  preview: { subject: string; html: string; text: string };
}

export default function EmailOperationsPage() {
  const [status, setStatus] = useState<EmailOpsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [preview, setPreview] = useState<TemplatePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApiService.getEmailOperationsStatus();
      if (res.error) {
        setError(res.error);
        return;
      }
      setStatus(res.data as EmailOpsStatus);
      setError(null);
    } catch {
      setError('Failed to load email operations');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreview = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setPreviewLoading(true);
    try {
      const res = await adminApiService.getEmailTemplatePreview(templateId);
      if (!res.error && res.data) {
        setPreview(res.data as TemplatePreview);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await adminApiService.testEmailService(testEmail || undefined);
      if (res.error) {
        showOperatorToast(res.error, 'error');
      } else {
        const msg = (res.data as { message?: string })?.message ?? 'Test email sent';
        showOperatorToast(msg, 'success');
      }
    } catch {
      showOperatorToast('Test email failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !status) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <AdminPortalPageShell
      title="Email Operations"
      description="SMTP delivery status, sender identities, template previews, and test sends — reusing Postmark/SMTP infrastructure."
      actions={
        <Button onClick={() => void load()} variant="secondary" size="sm">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <AdminPortalBreadcrumbs />

      {error && <Alert onClose={() => setError(null)}>{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Server className="w-5 h-5 text-v-text-muted" />
              <h2 className="text-lg font-semibold">SMTP Status</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-v-text-muted uppercase">Configured</p>
                <div className="flex items-center gap-1 mt-1">
                  {status?.configured ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">{status?.configured ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-v-text-muted uppercase">Transport</p>
                <p className="text-sm font-medium mt-1">
                  {status?.transportReady ? 'Ready' : 'Not ready'}
                </p>
              </div>
              <div>
                <p className="text-xs text-v-text-muted uppercase">Provider</p>
                <p className="text-sm font-medium mt-1">{status?.provider ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-v-text-muted uppercase">Recent failures</p>
                <p className="text-sm font-medium mt-1">{status?.recentFailureCount ?? 0}</p>
              </div>
            </div>
            {status?.smtp && (
              <p className="text-xs text-v-text-muted mt-4">
                {status.smtp.host}:{status.smtp.port} · secure={String(status.smtp.secure)}
              </p>
            )}
            {status?.lastSuccessfulSend && (
              <p className="text-sm text-v-text-secondary mt-2">
                Last successful send: {new Date(status.lastSuccessfulSend).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Sender Identities</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-v-text-muted">From</dt>
                <dd className="font-medium">{status?.addresses.from}</dd>
              </div>
              <div>
                <dt className="text-v-text-muted">From email</dt>
                <dd className="font-medium">{status?.addresses.fromEmail}</dd>
              </div>
              <div>
                <dt className="text-v-text-muted">Reply-to</dt>
                <dd className="font-medium">{status?.addresses.replyTo}</dd>
              </div>
              <div>
                <dt className="text-v-text-muted">Support</dt>
                <dd className="font-medium">{status?.addresses.support}</dd>
              </div>
              <div>
                <dt className="text-v-text-muted">Billing</dt>
                <dd className="font-medium">{status?.addresses.billing}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Test Email</h2>
            <p className="text-sm text-v-text-secondary mb-3">
              Sends a probe through the existing SMTP transport. Uses your admin email if left blank.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Optional recipient override"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => void sendTest()} disabled={testing || !status?.configured}>
                <Send className="w-4 h-4 mr-2" />
                {testing ? 'Sending…' : 'Send test'}
              </Button>
            </div>
          </Card>

          {preview && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Preview: {preview.name}</h2>
                <Badge>{preview.category}</Badge>
              </div>
              <p className="text-sm text-v-text-muted mb-2">Subject: {preview.preview.subject}</p>
              <div
                className="border border-v-border rounded-lg p-4 bg-white max-h-96 overflow-auto text-sm"
                dangerouslySetInnerHTML={{ __html: preview.preview.html }}
              />
            </Card>
          )}
        </div>

        <div>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-v-text-muted" />
              <h2 className="text-lg font-semibold">Templates</h2>
            </div>
            <ul className="space-y-2">
              {(status?.templates ?? []).map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => void loadPreview(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedTemplate === t.id
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-v-surface-muted text-v-text-primary'
                    }`}
                  >
                    <span className="font-medium">{t.name}</span>
                    <span className="block text-xs text-v-text-muted">{t.description}</span>
                  </button>
                </li>
              ))}
            </ul>
            {previewLoading && (
              <div className="flex justify-center py-4">
                <Spinner />
              </div>
            )}
          </Card>

          <Card className="p-4 mt-4">
            <p className="text-sm text-v-text-secondary">
              System health probes also surface email status on the{' '}
              <Link href="/admin-portal/system" className="text-blue-600 hover:underline">
                System Administration
              </Link>{' '}
              page.
            </p>
          </Card>
        </div>
      </div>
    </AdminPortalPageShell>
  );
}
