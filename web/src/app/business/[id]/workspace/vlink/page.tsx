'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BusinessVLinkRedirect({ params }: { params: { id: string } }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/business/${params.id}/workspace?module=vlink`);
  }, [router, params.id]);
  return null;
}
