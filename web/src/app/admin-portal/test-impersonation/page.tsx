import { redirect } from 'next/navigation';

/** Legacy debug impersonation route — canonical surface is Impersonation Lab (Phase 1B). */
export default function TestImpersonationRedirect() {
  redirect('/admin-portal/impersonate');
}
