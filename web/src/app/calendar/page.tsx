'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CalendarIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/calendar/month');
  }, [router]);
  return null;
}

