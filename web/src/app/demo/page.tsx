'use client';

import Link from 'next/link';
import { Button } from 'shared/components';
import { 
  TrashIcon, 
  FolderIcon, 
  ChatBubbleLeftIcon, 
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

export default function DemoIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Block on Block - Feature Demos
          </h1>
          <p className="text-xl text-gray-600">
            Explore the latest features and functionality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dashboard Deletion Demo */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <div className="flex items-center space-x-3">
                <TrashIcon className="w-8 h-8 text-red-600" />
                <div>
                  <h2 className="text-xl font-semibold text-red-900">
                    Interactive Dashboard Deletion
                  </h2>
                  <p className="text-sm text-red-700">
                    NEW: Smart file handling during dashboard deletion
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>File summary with size and shared status</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Move to main drive with labeled folders</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Move to trash with extended retention</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Export & download functionality</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>"Remember my choice" preferences</span>
                </li>
              </ul>
              <Link href="/demo/dashboard-deletion">
                <Button variant="primary" className="w-full">
                  Try Dashboard Deletion Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Context-Aware Drive */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center space-x-3">
                <FolderIcon className="w-8 h-8 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-blue-900">
                    Context-Aware Drive System
                  </h2>
                  <p className="text-sm text-blue-700">
                    Files organized by dashboard context
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Separate drives for each dashboard</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Dynamic sidebar navigation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Context-specific file filtering</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Dashboard-aware widgets</span>
                </li>
              </ul>
              <Link href="/drive">
                <Button variant="primary" className="w-full">
                  Open Drive Module
                </Button>
              </Link>
            </div>
          </div>

          {/* Chat System */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <div className="flex items-center space-x-3">
                <ChatBubbleLeftIcon className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-green-900">
                    Context-Aware Chat
                  </h2>
                  <p className="text-sm text-green-700">
                    Chat conversations by dashboard
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Separate chats for work, home, personal</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>File sharing within context</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Real-time messaging</span>
                </li>
              </ul>
              <Link href="/chat">
                <Button variant="primary" className="w-full">
                  Open Chat Module
                </Button>
              </Link>
            </div>
          </div>

          {/* Settings & Admin */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center space-x-3">
                <Cog6ToothIcon className="w-8 h-8 text-purple-600" />
                <div>
                  <h2 className="text-xl font-semibold text-purple-900">
                    Administrative Features
                  </h2>
                  <p className="text-sm text-purple-700">
                    Business policies and user management
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ul className="space-y-3 mb-6 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Business dashboard deletion policies</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>User preference management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Audit logging and compliance</span>
                </li>
              </ul>
              <Link href="/admin">
                <Button variant="secondary" className="w-full">
                  Admin Panel (Coming Soon)
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Phase 2 Implementation Complete
              </h3>
              <p className="text-green-700 mt-1">
                ✅ Database schema updated with dashboardId columns<br/>
                ✅ File migration services fully implemented<br/>
                ✅ Interactive deletion modal with real backend integration<br/>
                ✅ Comprehensive testing passed
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 