import { Suspense } from 'react';
import { ThreadActivityDashboard } from '@/components/thread-activity/ThreadActivityDashboard';
import { ThreadRecommendations } from '@/components/thread-activity/ThreadRecommendations';
import { ThreadActivityVisualization } from '@/components/thread-activity/ThreadActivityVisualization';
import { ThreadActivityExports } from '@/components/thread-activity/ThreadActivityExports';

export default function ThreadActivityPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Thread Activity Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <Suspense fallback={<div>Loading recommendations...</div>}>
            <ThreadRecommendations />
          </Suspense>
          
          <Suspense fallback={<div>Loading activity visualization...</div>}>
            <ThreadActivityVisualization />
          </Suspense>
        </div>
        
        {/* Right Column */}
        <div className="space-y-8">
          <Suspense fallback={<div>Loading activity dashboard...</div>}>
            <ThreadActivityDashboard />
          </Suspense>
          
          <Suspense fallback={<div>Loading exports...</div>}>
            <ThreadActivityExports />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 