'use client';

import React, { useState } from 'react';
import { Card, Button } from 'shared/components';
import Link from 'next/link';
import { User, Eye, X, AlertTriangle, Code, Rocket, Box, Wrench, ArrowRight } from 'lucide-react';
import { useImpersonation } from '../../../contexts/ImpersonationContext';

export default function TestImpersonation() {
  const { isImpersonating, currentSession, startImpersonation, endImpersonation, refreshSession } = useImpersonation();
  const [testUserId] = useState('test-user-id');
  const [testUserEmail] = useState('test@example.com');
  const [testUserName] = useState('Test User');

  const handleStartImpersonation = async () => {
    try {
      await startImpersonation(testUserId, 'Testing impersonation functionality');
      await refreshSession();
      alert('Impersonation started! Check the banner at the top.');
    } catch (error) {
      alert('Failed to start impersonation: ' + error);
    }
  };

  const handleEndImpersonation = async () => {
    try {
      await endImpersonation();
      alert('Impersonation ended!');
    } catch (error) {
      alert('Failed to end impersonation: ' + error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impersonation Test</h1>
        <p className="text-gray-600 mt-2">Test the user impersonation functionality</p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Status</h2>
        
        {isImpersonating ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Currently Impersonating</h3>
                <p className="text-sm text-yellow-700">
                  {currentSession?.targetUser?.name || currentSession?.targetUser?.email || 'Unknown User'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleEndImpersonation}
              className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              <X className="w-4 h-4 mr-2" />
              End Impersonation
            </Button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-green-800">Not Impersonating</h3>
                <p className="text-sm text-green-700">You are logged in as yourself</p>
              </div>
            </div>
            <Button
              onClick={handleStartImpersonation}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Eye className="w-4 h-4 mr-2" />
              Start Impersonation
            </Button>
          </div>
        )}
      </Card>

      {/* Mock Developer Features */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Mock Developer Features (Preview)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Quick links to verify the new business-scoped Developer Portal and module flows.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/modules/submit" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <Rocket className="w-4 h-4 mr-2" /> Submit a Module
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
          <Link href="/developer-portal" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <Code className="w-4 h-4 mr-2" /> Open Developer Portal (Global)
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
          <Link href="/business/create" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <Box className="w-4 h-4 mr-2" /> Create a Business
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
          <Link href="/business" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <Wrench className="w-4 h-4 mr-2" /> Manage Businesses (Select to open Workspace)
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Tip: After submitting a module, you’ll be prompted to create or link a business. The business workspace shows a Developer Portal quick action and a Modules section.
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Instructions</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>1. Start Impersonation:</strong> Click the "Start Impersonation" button above
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>2. Check Banner:</strong> A yellow banner should appear at the top of the admin portal
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>3. End Impersonation:</strong> Click "End Impersonation" in the banner or on this page
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <strong>4. Check Audit Logs:</strong> All impersonation actions are logged in the audit system
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Details</h2>
        <div className="space-y-2 text-sm">
          <div><strong>Test User ID:</strong> {testUserId}</div>
          <div><strong>Test User Email:</strong> {testUserEmail}</div>
          <div><strong>Test User Name:</strong> {testUserName}</div>
          <div><strong>Loading State:</strong> N/A</div>
          <div><strong>Impersonating:</strong> {isImpersonating ? 'Yes' : 'No'}</div>
        </div>
      </Card>
    </div>
  );
} 