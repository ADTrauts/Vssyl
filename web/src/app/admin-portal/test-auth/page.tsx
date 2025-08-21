'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button } from 'shared/components';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

export default function TestAuthPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAuth = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin-portal/test', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setTestResult(data);
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Authentication Test</h1>
        <p className="text-gray-600 mt-2">Test the admin portal authentication</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Admin Authentication Test</h2>
        </div>

        <Button 
          onClick={testAuth} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? 'Testing...' : 'Test Authentication'}
        </Button>

        {testResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Authentication Successful!</span>
            </div>
            <div className="text-sm text-green-700">
              <p><strong>Message:</strong> {testResult.message}</p>
              <p><strong>User ID:</strong> {testResult.user?.id}</p>
              <p><strong>Email:</strong> {testResult.user?.email}</p>
              <p><strong>Role:</strong> {testResult.user?.role}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Authentication Failed</span>
            </div>
            <div className="text-sm text-red-700">
              <p><strong>Error:</strong> {error}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Debug Information</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Test Endpoint:</strong> /api/admin-portal/test</p>
          <p><strong>Expected Response:</strong> Authentication success with user details</p>
          <p><strong>If Failed:</strong> Check browser console for detailed error logs</p>
        </div>
      </Card>
    </div>
  );
} 