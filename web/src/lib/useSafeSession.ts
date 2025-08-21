"use client";

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function useSafeSession() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    session: mounted ? session : null,
    status: mounted ? status : 'loading',
    mounted,
  };
} 