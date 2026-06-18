'use client';

import React from 'react';
import { Card } from 'shared/components';
import { AlertTriangle } from 'lucide-react';

export default function AdminPortalDebugUnavailable() {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
        <h1 className="text-xl font-semibold text-v-text-primary mb-2">
          Debug Tools Unavailable
        </h1>
        <p className="text-v-text-muted">
          Admin portal debug and testing surfaces are disabled in this environment.
        </p>
      </Card>
    </div>
  );
}
