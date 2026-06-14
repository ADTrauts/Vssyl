'use client';

import { PlaceProvider } from '../../contexts/PlaceContext';
import PlaceConsumerExperience from './PlaceConsumerExperience';

/**
 * Dashboard embed entry — PlaceProvider + canonical consumer experience.
 */
export default function PlaceContent() {
  return (
    <PlaceProvider>
      <PlaceConsumerExperience embedded />
    </PlaceProvider>
  );
}
