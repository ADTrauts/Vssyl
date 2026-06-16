'use client';

import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface PendingAckBannerProps {
  businessId: string;
  count: number;
  onReview: () => void;
}

export default function PendingAckBanner({ count, onReview }: PendingAckBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (count <= 0 || dismissed) {
    return null;
  }

  return (
    <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-amber-900 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          You have <strong>{count}</strong> communication{count === 1 ? '' : 's'} requiring acknowledgement.
        </span>
        <button
          type="button"
          className="underline font-medium hover:text-amber-950"
          onClick={onReview}
        >
          Review now
        </button>
      </div>
      <button
        type="button"
        className="p-1 rounded hover:bg-amber-200 text-amber-900"
        aria-label="Dismiss for this session"
        onClick={() => setDismissed(true)}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
