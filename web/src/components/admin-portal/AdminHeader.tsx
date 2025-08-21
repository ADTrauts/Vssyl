import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Shield, 
  LogOut, 
  User, 
  Activity, 
  Settings,
  Globe
} from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
}

export const AdminHeader = ({ 
  title = 'Admin Portal', 
  subtitle = 'Platform Administration' 
}: AdminHeaderProps) => {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-900 text-white border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Portal Title */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="text-sm text-gray-400">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Admin User Info and Actions */}
        <div className="flex items-center space-x-4">
          {/* System Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-300">System Online</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Link 
              href="/admin-portal/system" 
              className="text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Activity className="w-4 h-4" />
              <span>System</span>
            </Link>
            <Link 
              href="/admin-portal/security" 
              className="text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </Link>
          </div>

          {/* Admin User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-300" />
              <span className="text-sm text-gray-300">{session?.user?.email}</span>
            </div>
            <Link 
              href="/dashboard" 
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              Back to App
            </Link>
            <Link 
              href="/api/auth/signout" 
              className="text-sm text-gray-300 hover:text-white transition-colors flex items-center space-x-1"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}; 