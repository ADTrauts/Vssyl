'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Search, CheckCircle, XCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { validateAIContext, ContextValidation } from '../../api/aiContextDebug';

interface ContextValidationToolsProps {
  className?: string;
}

export default function ContextValidationTools({ className = '' }: ContextValidationToolsProps) {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [validationResult, setValidationResult] = useState<ContextValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidation = async () => {
    if (!searchQuery.trim() || !session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await validateAIContext(searchQuery, session.accessToken);
      if (response.success) {
        setValidationResult(response.data);
      } else {
        setError('Failed to validate context');
      }
    } catch (err) {
      setError('Error validating context');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARN':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'FAIL':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'WARN':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'INFO':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FAIL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'WARN':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Context Validation Tools</h3>
        
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Enter user ID to validate context..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleValidation()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={handleValidation}
            disabled={loading || !searchQuery.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Validate'
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="p-6 space-y-6">
          {/* Overall Status */}
          <div className={`rounded-lg border-2 p-4 ${getOverallStatusColor(validationResult.overallStatus)}`}>
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(validationResult.overallStatus)}
              <h4 className="font-semibold">Overall Validation Status</h4>
            </div>
            <p className="text-sm">
              User ID: <span className="font-mono">{validationResult.userId}</span>
            </p>
            <p className="text-sm">
              Validated: {formatDate(validationResult.timestamp)}
            </p>
          </div>

          {/* Validation Checks */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Validation Checks</h4>
            
            {validationResult.checks.map((check, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${getStatusColor(check.status)}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(check.status)}
                  <h5 className="font-medium">{check.name}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                    {check.status}
                  </span>
                </div>
                <p className="text-sm">{check.message}</p>
              </div>
            ))}
          </div>

          {/* Summary Statistics */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {validationResult.checks.filter(c => c.status === 'PASS').length}
                </div>
                <div className="text-gray-600">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {validationResult.checks.filter(c => c.status === 'FAIL').length}
                </div>
                <div className="text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {validationResult.checks.filter(c => c.status === 'WARN').length}
                </div>
                <div className="text-gray-600">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {validationResult.checks.filter(c => c.status === 'INFO').length}
                </div>
                <div className="text-gray-600">Info</div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Recommendations</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {validationResult.checks.filter(c => c.status === 'FAIL').length > 0 && (
                <p>• Address failed checks to ensure proper AI context</p>
              )}
              {validationResult.checks.filter(c => c.status === 'WARN').length > 0 && (
                <p>• Review warnings to optimize AI performance</p>
              )}
              {validationResult.checks.filter(c => c.status === 'PASS').length === validationResult.checks.length && (
                <p>• All checks passed! User context is properly configured</p>
              )}
              {validationResult.checks.filter(c => c.name === 'AI Personality Profile' && c.status === 'WARN').length > 0 && (
                <p>• Consider setting up AI personality profile for better personalization</p>
              )}
              {validationResult.checks.filter(c => c.name === 'AI Autonomy Settings' && c.status === 'WARN').length > 0 && (
                <p>• Configure AI autonomy settings for optimal user experience</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
