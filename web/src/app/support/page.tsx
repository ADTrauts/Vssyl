'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Alert, Spinner } from 'shared/components';
import { useSession } from 'next-auth/react';
import { 
  MessageSquare, 
  HelpCircle, 
  FileText, 
  Mail, 
  Phone, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SupportTicketForm {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  contactEmail: string;
  contactPhone?: string;
}

export default function SupportPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SupportTicketForm>({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    contactEmail: session?.user?.email || '',
    contactPhone: ''
  });

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'billing', label: 'Billing & Payments' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'account', label: 'Account Issues' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', description: 'General questions' },
    { value: 'medium', label: 'Medium', description: 'Minor issues' },
    { value: 'high', label: 'High', description: 'Important problems' },
    { value: 'urgent', label: 'Urgent', description: 'Critical issues' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/support/tickets/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          userId: session?.user?.id,
          userName: session?.user?.name
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit ticket');
      }

      setSuccess(true);
      setForm({
        title: '',
        description: '',
        category: 'general',
        priority: 'medium',
        contactEmail: session?.user?.email || '',
        contactPhone: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SupportTicketForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for contacting us. We've received your support ticket and will get back to you as soon as possible.
            </p>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• You'll receive a confirmation email with your ticket number</li>
                  <li>• Our support team will review your request within 24 hours</li>
                  <li>• We'll contact you via email or phone if we need more information</li>
                </ul>
              </div>
              <Button onClick={() => setSuccess(false)} className="w-full">
                Submit Another Ticket
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Need help? We're here to assist you. Submit a support ticket and our team will get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Email Support</p>
                    <p className="text-sm text-gray-600">support@blockonblock.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Phone Support</p>
                    <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Support Hours</p>
                    <p className="text-sm text-gray-600">Mon-Fri: 9AM-6PM EST</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Quick Links</h3>
                <div className="space-y-2">
                  <a href="/docs" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                    <FileText className="w-4 h-4 mr-2" />
                    Documentation
                  </a>
                  <a href="/faq" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    FAQ
                  </a>
                  <a href="/status" className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    System Status
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Support Ticket Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit Support Ticket</h2>
              
              {error && (
                <Alert type="error" title="Error" message={error} className="mb-6" />
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ticket Title *
                  </label>
                  <Input
                    type="text"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Brief description of your issue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label} - {priority.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Please provide detailed information about your issue..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <Input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    {loading ? (
                      <Spinner size="sm" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    <span>{loading ? 'Submitting...' : 'Submit Ticket'}</span>
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
