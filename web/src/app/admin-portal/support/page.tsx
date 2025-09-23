'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import {
  MessageSquare,
  HelpCircle,
  FileText,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Filter,
  Search,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Plus,
  Trash2,
  Send,
  Phone,
  Mail,
  MessageCircle,
  BarChart3,
  Calendar,
  User,
  Tag
} from 'lucide-react';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  customer: {
    id: string;
    name: string;
    email: string;
    plan: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  lastResponseAt?: string;
  responseTime?: number; // in hours
  satisfaction?: number; // 1-5 rating
  tags: string[];
  attachments: string[];
}

interface SupportStats {
  totalTickets: number;
  openTickets: number;
  resolvedToday: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  activeAgents: number;
  averageResolutionTime: number;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
  };
  status: 'draft' | 'published' | 'archived';
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}

interface LiveChat {
  id: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  agent?: {
    id: string;
    name: string;
  };
  status: 'waiting' | 'active' | 'ended';
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  duration: number; // in minutes
  satisfaction?: number;
}

interface FilterOptions {
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
  dateRange: string;
}

export default function SupportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseArticle[]>([]);
  const [liveChats, setLiveChats] = useState<LiveChat[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [ticketToAssign, setTicketToAssign] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [showTicketDetailsModal, setShowTicketDetailsModal] = useState(false);
  const [selectedTicketForDetails, setSelectedTicketForDetails] = useState<SupportTicket | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedTo: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState<'tickets' | 'knowledge' | 'chats' | 'analytics'>('tickets');

  // Load data
  useEffect(() => {
    loadData();
  }, [filters]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [ticketsRes, statsRes, knowledgeRes, chatsRes, usersRes] = await Promise.all([
        adminApiService.getSupportTickets(filters as any),
        adminApiService.getSupportStats(),
        adminApiService.getKnowledgeBase(),
        adminApiService.getLiveChats(),
        adminApiService.getUsers({ role: 'ADMIN', limit: 100 })
      ]);

      setTickets((ticketsRes.data as any)?.data || []);
      setStats((statsRes.data as any)?.data || null);
      setKnowledgeBase((knowledgeRes.data as any)?.data || []);
      setLiveChats((chatsRes.data as any)?.data || []);
      setAdminUsers((usersRes.data as any)?.users || []);
    } catch (err) {
      console.error('Error loading support data:', err);
      setError('Failed to load support data. Please try again.');
      
      // Fallback to mock data
      setTickets([
        {
          id: '1',
          title: 'Cannot access premium features',
          description: 'I upgraded to premium but still cannot access advanced features. Please help.',
          status: 'open',
          priority: 'high',
          category: 'Billing',
          customer: {
            id: '1',
            name: 'John Smith',
            email: 'john@example.com',
            plan: 'premium'
          },
          assignedTo: {
            id: '1',
            name: 'Sarah Support',
            email: 'sarah@company.com'
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
          responseTime: 2.5,
          satisfaction: 4,
          tags: ['billing', 'premium', 'urgent'],
          attachments: []
        },
        {
          id: '2',
          title: 'Module installation failed',
          description: 'Trying to install the calendar module but getting an error message.',
          status: 'in_progress',
          priority: 'medium',
          category: 'Technical',
          customer: {
            id: '2',
            name: 'Jane Doe',
            email: 'jane@example.com',
            plan: 'free'
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
          responseTime: 1.2,
          tags: ['modules', 'installation'],
          attachments: ['error-screenshot.png']
        }
      ]);

      setStats(null);

      setKnowledgeBase([
        {
          id: '1',
          title: 'How to upgrade to premium',
          content: 'Step-by-step guide to upgrade your account to premium...',
          category: 'Account',
          tags: ['upgrade', 'premium', 'billing'],
          author: {
            id: '1',
            name: 'Support Team'
          },
          status: 'published',
          views: 1250,
          helpful: 89,
          notHelpful: 12,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);

      setLiveChats([
        {
          id: '1',
          customer: {
            id: '3',
            name: 'Mike Johnson',
            email: 'mike@example.com'
          },
          agent: {
            id: '2',
            name: 'Alex Support'
          },
          status: 'active',
          startedAt: new Date(Date.now() - 1800000).toISOString(),
          lastMessageAt: new Date(Date.now() - 300000).toISOString(),
          messageCount: 12,
          duration: 30
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketAction = async (ticketId: string, action: string, data?: any) => {
    const actionKey = `${ticketId}-${action}`;
    
    try {
      setError(null);
      setSuccess(null);
      setActionLoading(actionKey);
      
      await adminApiService.updateSupportTicket(ticketId, action, data);
      
      // Show success message
      const actionMessages = {
        'assign': 'Ticket assigned successfully',
        'start_progress': 'Ticket moved to in progress',
        'resolve': 'Ticket resolved successfully',
        'close': 'Ticket closed successfully'
      };
      
      setSuccess(actionMessages[action as keyof typeof actionMessages] || 'Ticket updated successfully');
      
      // Reload data
      await loadData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignClick = (ticketId: string) => {
    setTicketToAssign(ticketId);
    setShowAssignModal(true);
  };

  const handleAssignToUser = async (userId: string) => {
    if (!ticketToAssign) return;
    
    try {
      await handleTicketAction(ticketToAssign, 'assign', { assignedToId: userId });
      setShowAssignModal(false);
      setTicketToAssign(null);
    } catch (err) {
      console.error('Error assigning ticket:', err);
    }
  };

  const handleStartProgress = (ticket: SupportTicket) => {
    setSelectedTicketForDetails(ticket);
    setShowTicketDetailsModal(true);
  };

  const handleArticleAction = async (articleId: string, action: string, data?: any) => {
    try {
      await adminApiService.updateKnowledgeArticle(articleId, action, data);
      loadData(); // Reload data
    } catch (err) {
      console.error('Error updating article:', err);
      setError('Failed to update article. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge color="red" size="sm">Open</Badge>;
      case 'in_progress':
        return <Badge color="yellow" size="sm">In Progress</Badge>;
      case 'resolved':
        return <Badge color="green" size="sm">Resolved</Badge>;
      case 'closed':
        return <Badge color="gray" size="sm">Closed</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge color="red" size="sm">Urgent</Badge>;
      case 'high':
        return <Badge color="yellow" size="sm">High</Badge>;
      case 'medium':
        return <Badge color="yellow" size="sm">Medium</Badge>;
      case 'low':
        return <Badge color="green" size="sm">Low</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const filteredTickets = (tickets || []).filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || ticket.status === filters.status;
    const matchesPriority = filters.priority === 'all' || ticket.priority === filters.priority;
    const matchesCategory = filters.category === 'all' || ticket.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Support</h1>
          <p className="text-gray-600">Manage tickets, knowledge base, and live chat support</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="secondary"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-blue-50 text-blue-600' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedToday}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction}/5</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tickets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'knowledge'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Knowledge Base ({knowledgeBase.length})
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'chats'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <MessageCircle className="w-4 h-4 inline mr-2" />
            Live Chat ({liveChats.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Content based on active tab */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size={48} />
        </div>
      ) : (
        <>
          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value="Technical">Technical</option>
                      <option value="Billing">Billing</option>
                      <option value="Account">Account</option>
                      <option value="Features">Features</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Tickets List */}
              <Card className="p-6">
                <div className="space-y-4">
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                      <p className="text-gray-600">No support tickets match your current filters.</p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {ticket.title}
                              </h3>
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                              <Badge color="gray" size="sm">
                                {ticket.category}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 mb-3">{ticket.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Customer:</span>
                                <p className="text-gray-600">{ticket.customer.name}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Plan:</span>
                                <p className="text-gray-600 capitalize">{ticket.customer.plan}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Created:</span>
                                <p className="text-gray-600">{formatDate(ticket.createdAt)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Response Time:</span>
                                <p className="text-gray-600">
                                  {ticket.responseTime ? `${ticket.responseTime}h` : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {ticket.assignedTo && (
                              <div className="mt-3 text-sm">
                                <span className="font-medium text-gray-700">Assigned to:</span>
                                <span className="text-gray-600 ml-2">{ticket.assignedTo.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3 pt-4 border-t border-gray-200 mt-4">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowTicketModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          
                          {ticket.status === 'open' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleAssignClick(ticket.id)}
                              disabled={actionLoading === `${ticket.id}-assign`}
                            >
                              {actionLoading === `${ticket.id}-assign` ? (
                                <Spinner size={16} />
                              ) : (
                                <User className="w-4 h-4 mr-2" />
                              )}
                              Assign
                            </Button>
                          )}
                          
                          {ticket.status === 'open' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStartProgress(ticket)}
                              disabled={actionLoading === `${ticket.id}-start_progress`}
                            >
                              {actionLoading === `${ticket.id}-start_progress` ? (
                                <Spinner size={16} />
                              ) : (
                                <Clock className="w-4 h-4 mr-2" />
                              )}
                              Start Progress
                            </Button>
                          )}
                          
                          {ticket.status === 'in_progress' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleTicketAction(ticket.id, 'resolve')}
                              disabled={actionLoading === `${ticket.id}-resolve`}
                            >
                              {actionLoading === `${ticket.id}-resolve` ? (
                                <Spinner size={16} />
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                              )}
                              Resolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Knowledge Base Tab */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Knowledge Base</h2>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Article
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {knowledgeBase.map((article) => (
                  <Card key={article.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-medium text-gray-900">{article.title}</h3>
                      <Badge color={article.status === 'published' ? 'green' : 'yellow'} size="sm">
                        {article.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {article.content.substring(0, 150)}...
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{article.views} views</span>
                      <span>{article.helpful} helpful</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedArticle(article);
                          setShowArticleModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button variant="secondary" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Live Chat Tab */}
          {activeTab === 'chats' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Live Chat</h2>
                <Badge color="green" size="sm">
                  {(liveChats || []).filter(chat => chat.status === 'active').length} Active
                </Badge>
              </div>

              <div className="space-y-4">
                {liveChats.map((chat) => (
                  <Card key={chat.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{chat.customer.name}</h3>
                          <p className="text-sm text-gray-600">{chat.customer.email}</p>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(chat.duration)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>{chat.messageCount} messages</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge color={chat.status === 'active' ? 'green' : 'yellow'} size="sm">
                          {chat.status}
                        </Badge>
                        
                        {chat.status === 'waiting' && (
                          <Button size="sm">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Join
                          </Button>
                        )}
                        
                        {chat.status === 'active' && (
                          <Button variant="secondary" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Support Analytics</h2>
              
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Response Time</h3>
                    <p className="text-3xl font-bold text-blue-600">{stats.averageResponseTime}h</p>
                    <p className="text-sm text-gray-600">Average response time</p>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Resolution Time</h3>
                    <p className="text-3xl font-bold text-green-600">{stats.averageResolutionTime}h</p>
                    <p className="text-sm text-gray-600">Average resolution time</p>
                  </Card>
                  
                  <Card className="p-6">
                    <h3 className="font-medium text-gray-900 mb-4">Active Agents</h3>
                    <p className="text-3xl font-bold text-purple-600">{stats.activeAgents}</p>
                    <p className="text-sm text-gray-600">Currently online</p>
                  </Card>
                </div>
              )}
              
              {stats && (
                <Card className="p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Top Categories</h3>
                  <div className="space-y-3">
                    {stats.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-700">{category.category}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{category.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* Ticket Details Modal */}
      <Modal open={showTicketModal} onClose={() => setShowTicketModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h2>
          
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedTicket.title}</h3>
                <p className="text-gray-600 mt-2">{selectedTicket.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Customer:</span>
                  <p className="text-gray-600">{selectedTicket.customer.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-600">{selectedTicket.customer.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-600">{getStatusBadge(selectedTicket.status)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Priority:</span>
                  <p className="text-gray-600">{getPriorityBadge(selectedTicket.priority)}</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowTicketModal(false)}
                >
                  Close
                </Button>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Reply
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Article Details Modal */}
      <Modal open={showArticleModal} onClose={() => setShowArticleModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Article Details</h2>
          
          {selectedArticle && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">{selectedArticle.title}</h3>
                <p className="text-gray-600 mt-2">{selectedArticle.content}</p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">Views: {selectedArticle.views}</span>
                <span className="text-gray-600">Helpful: {selectedArticle.helpful}</span>
                <span className="text-gray-600">Not Helpful: {selectedArticle.notHelpful}</span>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowArticleModal(false)}
                >
                  Close
                </Button>
                <Button>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Ticket Details Modal */}
      <Modal open={showTicketDetailsModal} onClose={() => setShowTicketDetailsModal(false)}>
        <div className="p-6 max-w-4xl">
          <h2 className="text-xl font-semibold mb-4">Ticket Details - {selectedTicketForDetails?.title}</h2>
          
          {selectedTicketForDetails && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedTicketForDetails.customer.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedTicketForDetails.customer.email}</p>
                    <p><span className="font-medium">Plan:</span> {selectedTicketForDetails.customer.plan}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Ticket Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedTicketForDetails.status === 'open' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTicketForDetails.status}
                      </span>
                    </p>
                    <p><span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        selectedTicketForDetails.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedTicketForDetails.priority}
                      </span>
                    </p>
                    <p><span className="font-medium">Category:</span> {selectedTicketForDetails.category}</p>
                    <p><span className="font-medium">Created:</span> {formatDate(selectedTicketForDetails.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedTicketForDetails.description}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedTicketForDetails.tags && selectedTicketForDetails.tags.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicketForDetails.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="secondary"
                  onClick={() => setShowTicketDetailsModal(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    await handleTicketAction(selectedTicketForDetails.id, 'start_progress');
                    setShowTicketDetailsModal(false);
                  }}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Start Working on This
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Assign Ticket</h2>
          <p className="text-gray-600 mb-6">Select an admin user to assign this ticket to:</p>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {adminUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleAssignToUser(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.name?.charAt(0) || user.email.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <User className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
            <Button
              variant="secondary"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 