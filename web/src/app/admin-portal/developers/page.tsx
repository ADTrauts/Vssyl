'use client';

import React from 'react';
import { Card, Button, Badge } from 'shared/components';
import {
  Code,
  Users,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Rocket,
  Box,
  Wrench,
  ArrowRight,
  Settings,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDevelopersTestPage() {
  // Mock data for developer management overview
  const stats = {
    totalDevelopers: 12,
    pendingSubmissions: 3,
    totalModules: 28,
    mrr: 15200,
    payoutsPending: 3450,
  };

  const mockSubmissionQueue = [
    {
      id: 'sub_101',
      moduleName: 'Calendar Pro',
      developer: 'John Developer',
      submittedAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      category: 'PRODUCTIVITY',
    },
    {
      id: 'sub_102',
      moduleName: 'Design System',
      developer: 'Sarah Designer',
      submittedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      category: 'DEVELOPMENT',
    },
    {
      id: 'sub_103',
      moduleName: 'Team Chat+',
      developer: 'Alex Builder',
      submittedAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
      category: 'COMMUNICATION',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Code className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Developer Management (Test)</h1>
            <p className="text-gray-600">Mock tools to validate developer workflows and navigation</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Developers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDevelopers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Modules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalModules}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">MRR</p>
              <p className="text-2xl font-bold text-gray-900">${stats.mrr.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/admin-portal/modules" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <Settings className="w-4 h-4 mr-2" /> Admin Modules Review
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
          <Link href="/modules/submit" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <Rocket className="w-4 h-4 mr-2" /> Submit Module (as user)
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
          <Link href="/developer-portal" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <BarChart3 className="w-4 h-4 mr-2" /> Developer Portal (global)
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
          <Link href="/business/create" className="flex items-center p-3 border rounded hover:bg-gray-50">
            <Box className="w-4 h-4 mr-2" /> Create Business
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        </div>
      </Card>

      {/* Mock Submission Queue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Submission Queue (Mock)</h2>
          <Badge color="yellow" size="sm">{stats.pendingSubmissions} pending</Badge>
        </div>
        <div className="space-y-3">
          {mockSubmissionQueue.map(item => (
            <div key={item.id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{item.moduleName}</h3>
                  <p className="text-sm text-gray-600">By {item.developer} • {item.category} • {new Date(item.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm">
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="secondary">
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

