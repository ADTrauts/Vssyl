import { redirect } from 'next/navigation';

/**
 * Legacy module governance handoff (AP-F-010).
 * Canonical surface: /admin-portal/modules
 */
export default function ModulesAdminHandoffPage() {
  redirect('/admin-portal/modules');
}
