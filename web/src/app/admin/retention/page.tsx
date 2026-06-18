import { redirect } from 'next/navigation';

export default function LegacyRetentionRedirect() {
  redirect('/admin-portal/retention');
}
