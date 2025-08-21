'use client';

import React, { useState } from 'react';
import { Card, Button } from 'shared/components';
import { getSession } from 'next-auth/react';

export default function TestApiPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testApiCall = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const session = await getSession();
      console.log('Session in test:', session);

      const response = await fetch('http://localhost:3001/api/admin-portal/test', {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
        },
      });

      const data = await response.json();
      console.log('API Response:', data);
      
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.message || 'API call failed');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(`Network error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">API Test</h1>
        <p className="text-gray-600 mt-2">Test the admin API directly</p>
      </div>

      <Card className="p-6">
        <Button 
          onClick={testApiCall} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Test API Call'}
        </Button>

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">Success!</h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
} 