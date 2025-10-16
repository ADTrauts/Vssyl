'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Card, Spinner, Alert, Button } from 'shared/components';
import ModuleHost from '../../../../components/ModuleHost';
import { getModuleRuntime, type ModuleRuntimeConfig } from '../../../../api/modules';

export default function RunModulePage() {
  const params = useParams<{ moduleId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleId = params?.moduleId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ModuleRuntimeConfig | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!moduleId) return;
      setLoading(true);
      setError(null);
      try {
        const scopeParam = (searchParams?.get('scope') as 'personal' | 'business') || 'personal';
        const businessId = searchParams?.get('businessId') || undefined;
        const cfg = await getModuleRuntime(moduleId, { scope: scopeParam, businessId });
        setConfig(cfg);
      } catch (err: any) {
        setError(err?.message || 'Failed to load module');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [moduleId, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-600">
          <Spinner size={24} />
          <span>Loading module...</span>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Alert type="error" title="Error" className="mb-4">
            {error || 'Module not available'}
          </Alert>
          <Button variant="secondary" onClick={() => router.push('/modules?tab=installed')}>Back to Modules</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
            <div className="flex items-center gap-2">
              <p className="text-gray-600">v{config.version}</p>
              {config?.accessContext?.scope && (
                <span className={`text-xs px-2 py-0.5 rounded border ${config.accessContext.scope === 'business' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  {config.accessContext.scope === 'business' ? 'Business' : 'Personal'}
                </span>
              )}
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push('/modules?tab=installed')}>Back</Button>
        </div>

        <Card className="p-0">
          <ModuleHost 
            entryUrl={config.frontend.entryUrl}
            moduleName={config.name}
            settings={config.settings}
          />
        </Card>
      </div>
    </div>
  );
}

