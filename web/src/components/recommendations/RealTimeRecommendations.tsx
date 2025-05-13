import { useState, useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../hooks/useAuth';
import { logger } from '../../utils/logger';

interface Recommendation {
  id: string;
  threadId: string;
  title: string;
  description: string;
  relevanceScore: number;
  lastActivity: Date;
}

export const RealTimeRecommendations = () => {
  const { user } = useAuth();
  const { subscribeToUser } = useWebSocket();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's recommendations
    subscribeToUser(user.id);

    // Fetch initial recommendations
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/recommendations/personalized');
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        logger.error('Error fetching recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [user, subscribeToUser]);

  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'recommendations:update') {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      logger.error('Error processing recommendation update:', error);
    }
  };

  if (isLoading) {
    return <div>Loading recommendations...</div>;
  }

  return (
    <div className="recommendations">
      <h2>Recommended Threads</h2>
      <div className="recommendations-list">
        {recommendations.length > 0 ? (
          recommendations.map(recommendation => (
            <div key={recommendation.id} className="recommendation-item">
              <div className="recommendation-header">
                <h3>{recommendation.title}</h3>
                <span className="relevance-score">
                  {Math.round(recommendation.relevanceScore * 100)}% match
                </span>
              </div>
              <p>{recommendation.description}</p>
              <div className="recommendation-footer">
                <span>
                  Last activity: {new Date(recommendation.lastActivity).toLocaleString()}
                </span>
                <button
                  onClick={() => window.location.href = `/threads/${recommendation.threadId}`}
                >
                  View Thread
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No recommendations available</p>
        )}
      </div>
    </div>
  );
}; 