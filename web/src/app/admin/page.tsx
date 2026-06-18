import { redirect } from 'next/navigation';

export default function LegacyAdminRootRedirect() {
  redirect('/admin-portal');
}
