'use client';

import React, { useState } from 'react';
import { Card, Button } from 'shared/components';
import { Brain, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../lib/apiUtils';

interface ProviderStatus {
  name: string;
  status: 'untested' | 'testing' | 'connected' | 'failed';
  response?: string;
  error?: string;
  responseTime?: number;
}

export default function AIProviderTest() {
  const { data: session } = useSession();
  const [providers, setProviders] = useState<ProviderStatus[]>([
    { name: 'OpenAI GPT-4o', status: 'untested' },
    { name: 'Anthropic Claude', status: 'untested' },
    { name: 'Local Provider', status: 'untested' }
  ]);

  const testProvider = async (providerName: string) => {
    if (!session?.accessToken) {
      console.error('No session or access token available');
      return;
    }

    try {
      console.log('Starting AI provider test for:', providerName);
      setProviders(prev => prev.map(p => 
        p.name === providerName ? { ...p, status: 'testing' } : p
      ));

      const startTime = Date.now();

      console.log('Making API call to /api/ai/twin...');
      const response = await authenticatedApiCall('/api/ai/twin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `Test message: Please respond with "AI connection successful for ${providerName}" and include today's date. This is a connection test.`,
          context: {
            currentModule: 'ai-test',
            dashboardType: 'personal',
            urgency: 'low'
          }
        })
      }, session.accessToken);

      const responseTime = Date.now() - startTime;
      console.log('API call completed. Response:', response);

      // Handle the response safely
      const responseData = response as any;
      
      setProviders(prev => prev.map(p => 
        p.name === providerName ? {
          ...p,
          status: 'connected',
          response: responseData?.response || 'Connection successful',
          responseTime
        } : p
      ));
    } catch (error) {
      console.error('Error testing AI provider:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setProviders(prev => prev.map(p => 
        p.name === providerName ? {
          ...p,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Component error occurred'
        } : p
      ));
    }
  };

  const testAllProviders = async () => {
    for (const provider of providers) {
      await testProvider(provider.name);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  const getStatusIcon = (status: ProviderStatus['status']) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (provider: ProviderStatus) => {
    switch (provider.status) {
      case 'testing':
        return 'Testing connection...';
      case 'connected':
        return `Connected (${provider.responseTime}ms)`;
      case 'failed':
        return `Failed: ${provider.error}`;
      default:
        return 'Not tested';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">AI Provider Connection Test</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test connections to AI providers and verify they're working correctly
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {providers.map((provider) => (
          <div key={provider.name} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(provider.status)}
              <div>
                <h4 className="font-medium">{provider.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getStatusText(provider)}
                </p>
                {provider.response && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    "{provider.response}"
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => testProvider(provider.name)}
              disabled={provider.status === 'testing'}
            >
              Test
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={testAllProviders}
          disabled={providers.some(p => p.status === 'testing')}
          className="flex-1"
        >
          Test All Providers
        </Button>
        <Button
          variant="ghost"
          onClick={() => setProviders(prev => prev.map(p => ({ ...p, status: 'untested', response: undefined, error: undefined, responseTime: undefined })))}
        >
          Reset
        </Button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> If providers fail to connect, check that API keys are properly configured in Google Cloud Secret Manager and that the services are deployed correctly.
        </p>
      </div>
    </Card>
  );
}
