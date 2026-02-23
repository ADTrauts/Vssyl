'use client';

import { PlaceProvider } from '../../contexts/PlaceContext';

export default function PlaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlaceProvider>
      {children}
    </PlaceProvider>
  );
}
