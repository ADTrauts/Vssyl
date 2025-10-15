'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Alert, Badge } from 'shared/components';
import { Package, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SeedResults {
  modulesCreated: number;
  modulesUpdated: number;
  businessesProcessed: number;
  installationsCreated: number;
  errors: string[];
}

export default function SeedModulesPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SeedResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSeedModules = async () => {
    if (!confirm('This will create Module records for Drive, Chat, and Calendar, and install them for all existing businesses. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await fetch('/api/admin/seed/seed-core-modules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to seed modules');
      }

      setResults(data.results);
      toast.success('Core modules seeded successfully!');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to seed modules';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Seed Core Modules
        </h1>
        <p className="text-gray-600 mb-6">
          One-time setup to create Module records and install them for existing businesses
        </p>

        <Card className="p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What This Does
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Creates Module records for Drive, Chat, and Calendar (if they don't exist)</li>
                <li>Installs these modules for ALL existing businesses</li>
                <li>Fixes the "No modules available" issue</li>
                <li>Makes the module marketplace functional</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Run Seed Process
          </h3>
          
          <Button
            variant="primary"
            onClick={handleSeedModules}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Seeding Modules...
              </>
            ) : (
              <>
                <Package className="w-4 h-4 mr-2" />
                Seed Core Modules
              </>
            )}
          </Button>

          <p className="text-sm text-gray-500 mt-2 text-center">
            This is a one-time operation. Safe to run multiple times.
          </p>
        </Card>

        {error && (
          <Alert type="error" title="Seed Failed">
            {error}
          </Alert>
        )}

        {results && (
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Seed Completed Successfully!
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Modules Created</p>
                <p className="text-2xl font-bold text-gray-900">{results.modulesCreated}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Modules Updated</p>
                <p className="text-2xl font-bold text-gray-900">{results.modulesUpdated}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Businesses Processed</p>
                <p className="text-2xl font-bold text-gray-900">{results.businessesProcessed}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Installations Created</p>
                <p className="text-2xl font-bold text-gray-900">{results.installationsCreated}</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                  {results.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Alert type="success" title="Next Steps">
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)</li>
                  <li>Go to any business Module Management page</li>
                  <li>You should now see Drive, Chat, and Calendar installed</li>
                  <li>Employees will see these modules in their workspace</li>
                </ul>
              </Alert>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

