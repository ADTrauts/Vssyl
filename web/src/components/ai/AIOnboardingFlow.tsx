'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Brain, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Zap,
  Shield,
  Clock,
  Users,
  Star,
  Lightbulb
} from 'lucide-react';
import { Card, Button, Badge } from 'shared/components';
import { authenticatedApiCall } from '../../lib/apiUtils';
import PersonalityQuestionnaire from './PersonalityQuestionnaire';

interface AIOnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 'welcome' | 'personality' | 'complete';

interface AIPersonalityData {
  confidence: number;
  traits?: string[];
  preferences?: Record<string, unknown>;
}

interface PersonalityData {
  traits: Record<string, number>;
  preferences: Record<string, unknown>;
  communicationStyle?: string;
  workStyle?: string;
  learningStyle?: string;
  autonomySettings?: Record<string, unknown>;
}

export default function AIOnboardingFlow({ onComplete }: AIOnboardingFlowProps) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    checkExistingProfile();
  }, [session]);

  const checkExistingProfile = async () => {
    if (!session?.accessToken) return;

    try {
      const response = await authenticatedApiCall<{ data: AIPersonalityData }>(
        '/api/ai/personality',
        {},
        session.accessToken
      );
      
      // If user has a personality profile with reasonable confidence, skip onboarding
      if (response.data && response.data.confidence > 0.5) {
        setHasExistingProfile(true);
        onComplete(); // Skip onboarding entirely
        return;
      }
    } catch (error) {
      // Profile doesn't exist, proceed with onboarding
      console.log('No existing profile found, proceeding with onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalityComplete = (personalityData: PersonalityData) => {
    setCurrentStep('complete');
  };

  const handleSkipPersonality = () => {
    setCurrentStep('complete');
  };

  const handleFinishOnboarding = () => {
    onComplete();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Checking your AI profile...</p>
        </Card>
      </div>
    );
  }

  if (hasExistingProfile) {
    return null; // Don't show onboarding
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {currentStep === 'welcome' && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="max-w-4xl w-full">
            {/* Welcome Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <Brain className="h-20 w-20 text-blue-600" />
                  <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Your Digital Life Twin
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                You're about to create the world's first AI that understands and operates as your digital representation across your entire life.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Zap className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Autonomous Actions</h3>
                <p className="text-gray-600 text-sm">
                  Your AI can schedule meetings, organize files, and manage tasks across all modules
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Brain className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cross-Module Intelligence</h3>
                <p className="text-gray-600 text-sm">
                  Understands your Drive, Chat, Household, and Business data as one unified system
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Shield className="h-10 w-10 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Privacy First</h3>
                <p className="text-gray-600 text-sm">
                  Sensitive data stays local while general data benefits from cloud AI intelligence
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Clock className="h-10 w-10 text-orange-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">24/7 Availability</h3>
                <p className="text-gray-600 text-sm">
                  Your Digital Life Twin works around the clock to optimize your digital life
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Users className="h-10 w-10 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interpersonal Awareness</h3>
                <p className="text-gray-600 text-sm">
                  Understands how actions affect others and requests approval when needed
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Lightbulb className="h-10 w-10 text-yellow-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Continuous Learning</h3>
                <p className="text-gray-600 text-sm">
                  Gets better over time by learning your preferences and patterns
                </p>
              </Card>
            </div>

            {/* What's Next */}
            <Card className="p-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-2xl font-bold mb-4">Ready to Create Your Digital Twin?</h2>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                We'll ask you some questions to understand your personality, work style, and preferences. 
                This helps your AI make decisions that truly represent you.
              </p>
              
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  variant="secondary"
                  onClick={() => setCurrentStep('personality')}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                >
                  Let's Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              <p className="text-xs text-blue-200 mt-4">
                Takes about 5-10 minutes • You can always change these settings later
              </p>
            </Card>

            {/* Trust Indicators */}
            <div className="mt-12 text-center">
              <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-green-600" />
                  <span>Enterprise-grade security</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-blue-600" />
                  <span>GDPR compliant</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-600" />
                  <span>First-of-its-kind technology</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'personality' && (
        <PersonalityQuestionnaire 
          onComplete={handlePersonalityComplete}
          onSkip={handleSkipPersonality}
        />
      )}

      {currentStep === 'complete' && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="p-12 max-w-2xl w-full text-center">
            <div className="mb-8">
              <div className="relative inline-block">
                <Brain className="h-16 w-16 text-blue-600 mx-auto" />
                <CheckCircle2 className="h-8 w-8 text-green-600 absolute -bottom-1 -right-1 bg-white rounded-full" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Digital Life Twin is Ready!
            </h1>
            
            <p className="text-gray-600 mb-8 text-lg">
              Congratulations! Your AI is now configured to understand and represent you across your digital life. 
              It will continue learning and improving as you interact with it.
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">🔍 Smart Search</h3>
                <p className="text-blue-700 text-sm">
                  Your search bar now intelligently detects when you're asking questions vs searching for files
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">🤖 AI Assistant</h3>
                <p className="text-green-700 text-sm">
                  Visit the AI Assistant page to manage your digital twin and view conversation history
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold text-purple-900 mb-2">⚡ Autonomous Actions</h3>
                <p className="text-purple-700 text-sm">
                  Your AI can now take actions on your behalf based on your configured autonomy levels
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-2">📈 Continuous Learning</h3>
                <p className="text-orange-700 text-sm">
                  Your AI will get better over time by learning from your feedback and patterns
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                variant="primary" 
                onClick={handleFinishOnboarding}
                className="w-full"
              >
                Start Using Your Digital Life Twin
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
              
              <p className="text-sm text-gray-500">
                Your AI settings can be adjusted anytime in the AI Assistant section
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}