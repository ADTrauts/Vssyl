import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThreadRecommendation } from '@/types/thread';

export function ThreadRecommendations() {
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<ThreadRecommendation[]>([]);
  const [trendingThreads, setTrendingThreads] = useState<ThreadRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const [personalizedRes, trendingRes] = await Promise.all([
          fetch('/api/thread-recommendations/personalized'),
          fetch('/api/thread-recommendations/trending')
        ]);

        const personalizedData = await personalizedRes.json();
        const trendingData = await trendingRes.json();

        setPersonalizedRecommendations(personalizedData.recommendations);
        setTrendingThreads(trendingData.threads);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return <div>Loading recommendations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thread Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Personalized for You</h3>
            <div className="space-y-3">
              {personalizedRecommendations.map((rec) => (
                <div key={rec.threadId} className="p-3 border rounded-lg hover:bg-gray-50">
                  <h4 className="font-medium">{rec.title}</h4>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {rec.participants} participants • {rec.activityCount} recent activities
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Trending Now</h3>
            <div className="space-y-3">
              {trendingThreads.map((thread) => (
                <div key={thread.threadId} className="p-3 border rounded-lg hover:bg-gray-50">
                  <h4 className="font-medium">{thread.title}</h4>
                  <div className="mt-2 text-xs text-gray-500">
                    {thread.participants} participants • {thread.activityCount} recent activities
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 