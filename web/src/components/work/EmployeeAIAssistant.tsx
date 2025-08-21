'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import { 
  Brain, 
  Send, 
  ThumbsUp, 
  ThumbsDown, 
  Bot, 
  User, 
  Sparkles, 
  FileText, 
  Mail, 
  Calendar,
  BarChart,
  Settings,
  Shield
} from 'lucide-react';

interface AIChat {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  confidence?: number;
  reasoning?: string;
  suggestedActions?: string[];
  feedback?: 'helpful' | 'not_helpful';
}

interface BusinessAI {
  id: string;
  name: string;
  description: string;
  securityLevel: string;
  allowEmployeeInteraction: boolean;
  status: string;
}

interface AICapability {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
}

interface EmployeeAIAssistantProps {
  businessId: string;
}

export const EmployeeAIAssistant: React.FC<EmployeeAIAssistantProps> = ({ businessId }) => {
  const { data: session } = useSession();
  const [businessAI, setBusinessAI] = useState<BusinessAI | null>(null);
  const [chatHistory, setChatHistory] = useState<AIChat[]>([]);
  const [capabilities, setCapabilities] = useState<AICapability[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (businessId) {
      loadEmployeeAIAccess();
    }
  }, [businessId]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const loadEmployeeAIAccess = async () => {
    try {
      const response = await fetch(`/api/business-ai/${businessId}/employee-access`);
      if (response.ok) {
        const data = await response.json();
        setBusinessAI(data.data.businessAI);
        setCapabilities(transformCapabilities(data.data.allowedCapabilities));
        setError(null);
      } else if (response.status === 404) {
        setError('Business AI not configured');
      } else if (response.status === 403) {
        setError('Access denied to business AI');
      }
    } catch (error) {
      console.error('Failed to load business AI access:', error);
      setError('Failed to connect to business AI');
    }
  };

  const handleAIQuery = async (query: string, quickAction?: string) => {
    if (!query.trim() || isLoading) return;

    const finalQuery = quickAction ? `${quickAction}: ${query}` : query;
    
    setIsLoading(true);
    setIsTyping(true);
    setCurrentQuery('');

    // Add user message to chat
    const userMessage: AIChat = {
      id: Date.now().toString(),
      type: 'user',
      content: finalQuery,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`/api/business-ai/${businessId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: finalQuery,
          context: {
            currentModule: getCurrentModule(),
            recentActivity: [],
            userRole: getUserRole(),
            activeProjects: [],
            permissions: []
          }
        })
      });

      if (response.ok) {
        const aiResponse = await response.json();
        
        // Simulate typing delay
        setTimeout(() => {
          setIsTyping(false);
          
          const aiMessage: AIChat = {
            id: (Date.now() + 1).toString(),
            type: 'ai',
            content: aiResponse.data.message,
            timestamp: new Date(),
            confidence: aiResponse.data.confidence,
            reasoning: aiResponse.data.reasoning,
            suggestedActions: aiResponse.data.suggestedActions
          };
          
          setChatHistory(prev => [...prev, aiMessage]);
        }, 1000 + Math.random() * 1000); // 1-2 second delay
        
      } else {
        const error = await response.json();
        setIsTyping(false);
        setError(error.message || 'AI interaction failed');
      }
    } catch (error) {
      console.error('AI interaction failed:', error);
      setIsTyping(false);
      setError('Failed to communicate with AI assistant');
    } finally {
      setIsLoading(false);
    }
  };

  const provideFeedback = async (messageId: string, helpful: boolean) => {
    // Update the message with feedback
    setChatHistory(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedback: helpful ? 'helpful' : 'not_helpful' }
          : msg
      )
    );

    // Could send feedback to backend here for learning
  };

  const handleQuickAction = (action: string, placeholder: string) => {
    const query = prompt(`${action}\n\nPlease provide details:`) || '';
    if (query.trim()) {
      handleAIQuery(query, action);
    }
  };

  const transformCapabilities = (allowedCapabilities: any): AICapability[] => {
    const capabilityIcons: Record<string, any> = {
      documentAnalysis: FileText,
      emailDrafting: Mail,
      meetingSummarization: Calendar,
      workflowOptimization: Settings,
      dataAnalysis: BarChart,
      projectManagement: Settings,
      employeeAssistance: User,
      complianceMonitoring: Shield
    };

    return Object.entries(allowedCapabilities)
      .filter(([_, enabled]) => enabled)
      .map(([capability, _]) => ({
        id: capability,
        name: capability.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        description: getCapabilityDescription(capability),
        icon: capabilityIcons[capability] || Sparkles,
        enabled: true
      }));
  };

  if (error) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Bot className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <CardTitle className="text-gray-600">AI Assistant Unavailable</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!businessAI) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <CardTitle>Loading AI Assistant...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-4">
      {/* AI Assistant Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600">
                <AvatarFallback className="text-white">
                  <Brain className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{businessAI.name}</CardTitle>
                <CardDescription>{businessAI.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={businessAI.status === 'active' ? 'default' : 'secondary'}>
                {businessAI.status}
              </Badge>
              <Badge variant="outline">{businessAI.securityLevel}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {capabilities.map((capability) => {
              const IconComponent = capability.icon;
              return (
                <Button
                  key={capability.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(capability.name, capability.description)}
                  className="h-auto flex-col gap-1 p-3"
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs">{capability.name}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="flex flex-col h-96">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">AI Chat</CardTitle>
        </CardHeader>
        
        {/* Chat Messages */}
        <CardContent className="flex-1 p-0">
          <ScrollArea ref={chatScrollRef} className="h-64 px-4">
            <div className="space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Start a conversation with your AI assistant</p>
                  <p className="text-sm">Try asking about documents, emails, or project help</p>
                </div>
              )}
              
              {chatHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600">
                      <AvatarFallback className="text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'order-1' : ''}`}>
                    <div
                      className={`rounded-lg px-3 py-2 text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.content}
                    </div>
                    
                    {message.type === 'ai' && (
                      <div className="mt-2 space-y-2">
                        {message.confidence && (
                          <div className="text-xs text-gray-500">
                            Confidence: {(message.confidence * 100).toFixed(0)}%
                          </div>
                        )}
                        
                        {message.suggestedActions && message.suggestedActions.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-500">Suggested actions:</p>
                            {message.suggestedActions.map((action, index) => (
                              <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                {action}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Feedback buttons */}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => provideFeedback(message.id, true)}
                            className={`h-6 w-6 p-0 ${
                              message.feedback === 'helpful' ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => provideFeedback(message.id, false)}
                            className={`h-6 w-6 p-0 ${
                              message.feedback === 'not_helpful' ? 'text-red-600' : 'text-gray-400'
                            }`}
                          >
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {message.type === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600">
                    <AvatarFallback className="text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        
        {/* Chat Input */}
        <CardContent className="pt-3">
          <div className="flex gap-2">
            <Input
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              placeholder="Ask your AI assistant anything..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAIQuery(currentQuery);
                }
              }}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleAIQuery(currentQuery)}
              disabled={!currentQuery.trim() || isLoading}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper functions
function getCurrentModule(): string {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    const segments = path.split('/');
    return segments[segments.length - 1] || 'dashboard';
  }
  return 'dashboard';
}

function getUserRole(): string {
  // This would typically come from session or context
  return 'employee';
}

function getCapabilityDescription(capability: string): string {
  const descriptions: Record<string, string> = {
    documentAnalysis: 'Analyze and summarize documents',
    emailDrafting: 'Help draft professional emails',
    meetingSummarization: 'Create meeting summaries and action items',
    workflowOptimization: 'Suggest process improvements',
    dataAnalysis: 'Analyze business data and trends',
    projectManagement: 'Assist with project planning and tracking',
    employeeAssistance: 'General employee support and guidance',
    complianceMonitoring: 'Monitor for compliance issues'
  };
  
  return descriptions[capability] || 'AI assistance feature';
}
