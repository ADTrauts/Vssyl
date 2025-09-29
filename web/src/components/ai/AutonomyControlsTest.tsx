'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from 'shared/components';
import { Settings, AlertTriangle } from 'lucide-react';

export default function AutonomyControlsTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    console.log('AutonomyControlsTest mounted');
    
    // Simulate loading some data
    setTimeout(() => {
      console.log('AutonomyControlsTest data loaded');
      setTestData({ message: 'Test data loaded successfully' });
    }, 1000);

    return () => {
      console.log('AutonomyControlsTest unmounted');
    };
  }, []);

  const handleTestClick = () => {
    console.log('Test button clicked');
    setTestData({ message: 'Button clicked at ' + new Date().toISOString() });
  };

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Error in AutonomyControlsTest</span>
        </div>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <Button 
          onClick={() => setError(null)} 
          className="mt-3"
          size="sm"
        >
          Clear Error
        </Button>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5" />
        <h2 className="text-xl font-semibold">AI Autonomy Settings (Test)</h2>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-600">
          This is a simplified test version of the autonomy controls to isolate the crash issue.
        </p>
        
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading...</p>
          </div>
        )}
        
        {testData && (
          <Alert>
            <span>{testData.message}</span>
          </Alert>
        )}
        
        <Button onClick={handleTestClick}>
          Test Button
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>Component mounted: {new Date().toISOString()}</p>
          <p>Loading state: {loading ? 'true' : 'false'}</p>
          <p>Error state: {error || 'none'}</p>
        </div>
      </div>
    </Card>
  );
}
