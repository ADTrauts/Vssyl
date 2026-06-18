import { redirect } from 'next/navigation';

export default function TestImpersonationRedirect() {
  redirect('/admin-portal/impersonation-test');
}
