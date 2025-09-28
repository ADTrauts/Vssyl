'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { signOut } from 'next-auth/react';
import { Alert, Button } from 'shared/components';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is an authentication error
    const isAuthError = error.message.includes('Session expired') || 
                       error.message.includes('No authentication token') ||
                       error.message.includes('401') ||
                       error.message.includes('403');
    
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SessionErrorBoundary caught an error:', error, errorInfo);
    
    // If it's an auth error, automatically sign out
    if (error.message.includes('Session expired') || 
        error.message.includes('No authentication token') ||
        error.message.includes('401') ||
        error.message.includes('403')) {
      setTimeout(() => {
        signOut({ callbackUrl: '/auth/login' });
      }, 1000);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleSignOut = async () => {
    try {
      // Clear any local storage that might interfere
      localStorage.removeItem('lastActiveDashboardId');
      
      // Sign out with redirect to home page (which will show landing page)
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force redirect to home
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message.includes('Session expired') || 
                         this.state.error?.message.includes('No authentication token') ||
                         this.state.error?.message.includes('401') ||
                         this.state.error?.message.includes('403');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full">
            <Alert
              type={isAuthError ? "warning" : "error"}
              title={isAuthError ? "Session Expired" : "Something went wrong"}
            >
              <div>
                {isAuthError 
                  ? "Your session has expired. You will be redirected to the login page."
                  : this.state.error?.message || "An unexpected error occurred."
                }
              </div>
              <div className="mt-4 flex gap-2">
                {!isAuthError && (
                  <Button onClick={this.handleRetry} variant="primary">
                    Try Again
                  </Button>
                )}
                <Button onClick={this.handleSignOut} variant="secondary">
                  Sign Out
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 