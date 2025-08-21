'use client';

import React, { useState, useEffect } from 'react';
import { Mail, MailX, CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';
import { Button } from 'shared/components';
import { Switch } from 'shared/components';
import { Alert } from 'shared/components';
import { EmailNotificationService, EmailPreferences, EmailServiceStatus } from '../lib/emailNotificationService';

interface EmailNotificationSettingsProps {
  className?: string;
}

export default function EmailNotificationSettings({ className = '' }: EmailNotificationSettingsProps) {
  const [status, setStatus] = useState<EmailServiceStatus>({
    available: false,
    configured: false
  });
  const [preferences, setPreferences] = useState<EmailPreferences>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const emailService = EmailNotificationService.getInstance();

  useEffect(() => {
    loadStatusAndPreferences();
  }, []);

  const loadStatusAndPreferences = async () => {
    try {
      const [serviceStatus, userPreferences] = await Promise.all([
        emailService.getServiceStatus(),
        emailService.getEmailPreferences()
      ]);

      setStatus(serviceStatus);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error loading email notification settings:', error);
    }
  };

  const handleTogglePreference = async (key: keyof EmailPreferences) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedPreferences = {
        ...preferences,
        [key]: !preferences[key]
      };

      const success = await emailService.updateEmailPreferences(updatedPreferences);
      
      if (success) {
        setPreferences(updatedPreferences);
        setSuccess('Email preferences updated successfully!');
      } else {
        setError('Failed to update email preferences. Please try again.');
      }
    } catch (error) {
      console.error('Error updating email preferences:', error);
      setError('Failed to update email preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await emailService.testEmailService();
      
      if (success) {
        setSuccess('Test email sent successfully! Check your inbox.');
      } else {
        setError('Failed to send test email. Please check your email configuration.');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      setError('Failed to send test email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!status.configured) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    
    if (status.available) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    return <MailX className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!status.configured) {
      return 'Email service not configured';
    }
    
    if (status.available) {
      return 'Email notifications are available';
    }
    
    return 'Email service is configured but not available';
  };

  const getStatusColor = () => {
    if (!status.configured) {
      return 'red';
    }
    
    if (status.available) {
      return 'green';
    }
    
    return 'yellow';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold">Email Notifications</h3>
            <p className="text-sm text-gray-600">{getStatusText()}</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {success && (
        <Alert type="success" title="Success">
          {success}
        </Alert>
      )}

      <div className="space-y-4">
        {status.configured && status.available && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">Test Email Service</h4>
              <p className="text-sm text-gray-600">
                Send a test email to verify the service is working
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleTestEmail}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Send Test</span>
            </Button>
          </div>
        )}

        {!status.configured && (
          <Alert type="warning" title="Email Service Not Configured">
            Email notifications are not configured. To enable email notifications, add SMTP configuration to your environment variables:
            <pre className="mt-2 p-2 bg-gray-100 rounded text-sm overflow-x-auto">
{`SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=notifications@yourdomain.com`}
            </pre>
          </Alert>
        )}

        {status.configured && !status.available && (
          <Alert type="error" title="Email Service Unavailable">
            Email service is configured but not available. Please check your SMTP settings and try again.
          </Alert>
        )}
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Email Preferences</h4>
        <p className="text-sm text-gray-600 mb-4">
          Choose which types of notifications you want to receive via email
        </p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Chat Messages</span>
              <p className="text-sm text-gray-600">New messages in conversations</p>
            </div>
            <Switch 
              checked={preferences.chat || false} 
              onChange={() => handleTogglePreference('chat')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Mentions</span>
              <p className="text-sm text-gray-600">When someone mentions you</p>
            </div>
            <Switch 
              checked={preferences.mentions || false} 
              onChange={() => handleTogglePreference('mentions')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">File Sharing</span>
              <p className="text-sm text-gray-600">When files are shared with you</p>
            </div>
            <Switch 
              checked={preferences.drive || false} 
              onChange={() => handleTogglePreference('drive')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Business Invitations</span>
              <p className="text-sm text-gray-600">When you're invited to join a business</p>
            </div>
            <Switch 
              checked={preferences.invitations || false} 
              onChange={() => handleTogglePreference('invitations')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">System Updates</span>
              <p className="text-sm text-gray-600">Important system announcements</p>
            </div>
            <Switch 
              checked={preferences.system || false} 
              onChange={() => handleTogglePreference('system')}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 