import { PrismaClient, User, Thread, ThreadMessage, ThreadActivity, ThreadParticipant, ThreadReaction, ThreadCollaborator, ThreadComment, ThreadInsight, ThreadAnalytics, Message, ThreadPresence, ThreadStar, ThreadVersion } from '@prisma/client';
import { logger } from '../utils/logger';
import { UserSegmentationService } from './userSegmentationService';
import { AnalyticsCacheService } from './analyticsCacheService';

interface AnalyticsMetrics {
  engagementScore: number;
  threadParticipation: number;
  averageResponseTime: number;
  contentCount: number;
  tagCount: number;
  collaborationScore: number;
  activityLevel: 'low' | 'medium' | 'high';
}

interface ThreadAnalyticsMetrics {
  threadId: string;
  messageCount: number;
  participantCount: number;
  averageResponseTime: number;
  engagementScore: number;
  sentimentScore: number;
  topicDistribution: Array<{ topic: string; count: number }>;
  userEngagement: Array<{ userId: string; score: number }>;
  timeDistribution: Array<{ hour: number; count: number }>;
  contentTypes: Array<{ type: string; count: number }>;
  collaborationMetrics: {
    edits: number;
    comments: number;
    shares: number;
    reactions: number;
  };
}

interface ThreadWithRelations extends Thread {
  messages: ThreadMessage[];
  participants: ThreadParticipant[];
  activities: ThreadActivity[];
  analytics: ThreadAnalytics | null;
  insights: ThreadInsight[];
  parentMessage: Message | null;
  threadActivities: ThreadActivity[];
  presence: ThreadPresence[];
  starredBy: ThreadStar[];
  collaborators: ThreadCollaborator[];
  versions: ThreadVersion[];
  comments: ThreadComment[];
  creatorId: string;
  isArchived: boolean;
  lastActivityAt: Date;
  categoryId: string | null;
}

interface UserWithRelations extends User {
  createdThreads: Thread[];
  threadMessages: ThreadMessage[];
  threadActivities: ThreadActivity[];
  threadParticipants: ThreadParticipant[];
  threadReactions: ThreadReaction[];
  threadCollaborators: ThreadCollaborator[];
  threadComments: ThreadComment[];
  threadInsights: ThreadInsight[];
}

interface UserAnalytics {
  userId: string;
  metrics: AnalyticsMetrics;
  threadStats: {
    created: number;
    participated: number;
    averageEngagement: number;
  };
  contentStats: {
    created: number;
    edited: number;
    shared: number;
  };
  collaborationStats: {
    edits: number;
    comments: number;
    reactions: number;
  };
  timeStats: {
    activeHours: number[];
    averageSessionDuration: number;
    lastActive: Date;
  };
  sentimentStats: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

interface TagAnalytics {
  name: string;
  threadCount: number;
  averageEngagement: number;
  trendingScore: number;
}

interface TimeRange {
  start: Date;
  end: Date;
}

export class AnalyticsService {
  private prisma: PrismaClient;
  private userSegmentation: UserSegmentationService;
  private cache: AnalyticsCacheService;
  private readonly BATCH_SIZE = 100;
  private readonly INCREMENTAL_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
    this.userSegmentation = new UserSegmentationService(prisma);
    this.cache = AnalyticsCacheService.getInstance({
      ttl: 1800, // 30 minutes for analytics data
      prefix: 'analytics:'
    });
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    const cacheKey = `user:${userId}`;
    return this.cache.getOrSet(cacheKey, async () => {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            createdThreads: true,
            threadMessages: true,
            threadActivities: true,
            threadParticipants: true,
            threadReactions: true,
            threadCollaborators: true,
            threadComments: true,
            threadInsights: true
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        const metrics = await this.calculateUserMetrics(user);
        const threadStats = await this.calculateThreadStats(user);
        const contentStats = await this.calculateContentStats(user);
        const collaborationStats = await this.calculateCollaborationStats(user);
        const timeStats = await this.calculateTimeStats(user);
        const sentimentStats = await this.calculateSentimentStats(user);

        return {
          userId,
          metrics,
          threadStats,
          contentStats,
          collaborationStats,
          timeStats,
          sentimentStats
        };
      } catch (error) {
        logger.error('Error getting user analytics:', error);
        throw error;
      }
    });
  }

  async getThreadAnalytics(threadId: string): Promise<ThreadAnalyticsMetrics> {
    const cacheKey = `thread:${threadId}`;
    return this.cache.getOrSet(cacheKey, async () => {
      try {
        const thread = await this.prisma.thread.findUnique({
          where: { id: threadId },
          include: {
            messages: true,
            participants: true,
            activities: true,
            analytics: true,
            collaborators: true,
            versions: true,
            comments: true,
            insights: true
          }
        });

        if (!thread) {
          throw new Error('Thread not found');
        }

        const messages = await this.prisma.threadMessage.findMany({
          where: { threadId },
          orderBy: { createdAt: 'asc' }
        });

        const threadWithRelations: ThreadWithRelations = {
          ...thread,
          messages,
          participants: thread.participants,
          activities: thread.activities,
          analytics: thread.analytics,
          insights: thread.insights,
          parentMessage: null,
          threadActivities: [],
          presence: [],
          starredBy: [],
          collaborators: [],
          versions: [],
          comments: [],
          lastActivityAt: new Date(),
          categoryId: null,
          creatorId: thread.creatorId,
          isArchived: false
        };

        return {
          threadId,
          messageCount: messages.length,
          participantCount: thread.participants.length,
          averageResponseTime: this.calculateAverageResponseTime(messages),
          engagementScore: this.calculateEngagementScore(threadWithRelations),
          sentimentScore: this.calculateSentimentScore(messages),
          topicDistribution: this.calculateTopicDistribution(thread.insights),
          userEngagement: this.calculateUserEngagement(messages),
          timeDistribution: this.calculateTimeDistribution(thread.activities),
          contentTypes: this.calculateContentTypes(),
          collaborationMetrics: this.calculateCollaborationMetrics(threadWithRelations)
        };
      } catch (error) {
        logger.error('Error getting thread analytics:', error);
        throw error;
      }
    });
  }

  async getTagAnalytics(timeRange?: TimeRange): Promise<TagAnalytics[]> {
    const cacheKey = `tags:${timeRange ? `${timeRange.start.toISOString()}-${timeRange.end.toISOString()}` : 'all'}`;
    return this.cache.getOrSet(cacheKey, async () => {
      try {

        const tagStats = new Map<string, { count: number; engagement: number }>();

        // TODO: Tag extraction from thread is not implemented due to missing 'metadata' field.
        // const tags = (thread.metadata as { tags?: string[] })?.tags || [];
        // tags.forEach(tag => {
        //   const stats = tagStats.get(tag) || { count: 0, engagement: 0 };
        //   tagStats.set(tag, {
        //     count: stats.count + 1,
        //     engagement: stats.engagement + engagement
        //   });
        // });

        return Array.from(tagStats.entries()).map(([name, stats]) => ({
          name,
          threadCount: stats.count,
          averageEngagement: stats.engagement / stats.count,
          trendingScore: this.calculateTrendingScore(stats.count, stats.engagement)
        }));
      } catch (error) {
        logger.error('Error getting tag analytics:', error);
        throw error;
      }
    });
  }

  async getTrendingThreads(limit: number = 10): Promise<ThreadAnalyticsMetrics[]> {
    const cacheKey = `trending:${limit}`;
    return this.cache.getOrSet(cacheKey, async () => {
      try {
        const threads = await this.prisma.thread.findMany({
          orderBy: {
            analytics: {
              lastActivity: 'desc'
            }
          },
          take: limit,
          include: {
            analytics: true,
            messages: true,
            participants: true,
            activities: true,
            insights: true
          }
        });

        return Promise.all(threads.map(async thread => {
          const messages = await this.prisma.threadMessage.findMany({
            where: { threadId: thread.id },
            orderBy: { createdAt: 'asc' }
          });

          const threadWithRelations: ThreadWithRelations = {
            ...thread,
            messages,
            participants: thread.participants,
            activities: thread.activities,
            analytics: thread.analytics,
            insights: thread.insights,
            parentMessage: null,
            threadActivities: [],
            presence: [],
            starredBy: [],
            collaborators: [],
            versions: [],
            comments: [],
            lastActivityAt: new Date(),
            categoryId: null,
            creatorId: thread.creatorId,
            isArchived: false
          };

          return {
            threadId: thread.id,
            messageCount: messages.length,
            participantCount: thread.participants.length,
            averageResponseTime: this.calculateAverageResponseTime(messages),
            engagementScore: this.calculateEngagementScore(threadWithRelations),
            sentimentScore: this.calculateSentimentScore(messages),
            topicDistribution: this.calculateTopicDistribution(thread.insights),
            userEngagement: this.calculateUserEngagement(messages),
            timeDistribution: this.calculateTimeDistribution(thread.activities),
            contentTypes: this.calculateContentTypes(),
            collaborationMetrics: this.calculateCollaborationMetrics(threadWithRelations)
          };
        }));
      } catch (error) {
        logger.error('Error getting trending threads:', error);
        throw error;
      }
    });
  }

  private async calculateUserMetrics(user: UserWithRelations): Promise<AnalyticsMetrics> {
    const threadWithRelations: ThreadWithRelations = {
      id: 'temp',
      title: 'User Analytics',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      parentMessageId: '',
      parentMessage: null,
      creatorId: user.id,
      isArchived: false,
      lastActivityAt: new Date(),
      categoryId: null,
      messages: user.threadMessages,
      participants: user.threadParticipants,
      activities: [],
      threadActivities: user.threadActivities,
      analytics: {
        id: 'temp',
        threadId: 'temp',
        engagementScore: 0, // Placeholder, can be calculated if needed
        messageCount: user.threadMessages.length,
        viewCount: user.threadMessages.length,
        reactionCount: user.threadReactions.length,
        participantCount: user.threadParticipants.length,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      insights: user.threadInsights,
      isPinned: false,
      presence: [],
      starredBy: [],
      collaborators: user.threadCollaborators,
      versions: [],
      comments: user.threadComments
    };

    const engagementScore = this.calculateEngagementScore(threadWithRelations);
    const threadParticipation = user.createdThreads.length + user.threadMessages.length;
    const averageResponseTime = this.calculateAverageResponseTime(user.threadMessages);
    const contentCount = user.threadMessages.length;
    const tagCount = user.threadParticipants.length;
    const collaborationScore = this.calculateCollaborationScore(user.threadCollaborators);

    return {
      engagementScore,
      threadParticipation,
      averageResponseTime,
      contentCount,
      tagCount,
      collaborationScore,
      activityLevel: this.determineActivityLevel(engagementScore)
    };
  }

  private async calculateThreadStats(user: UserWithRelations) {
    const threads = user.createdThreads.map(thread => ({
      ...thread,
      messages: [],
      participants: [],
      activities: [],
      threadActivities: [],
      analytics: null,
      insights: [],
      parentMessage: null,
      presence: [],
      starredBy: [],
      collaborators: [],
      versions: [],
      comments: []
    }));

    return {
      created: user.createdThreads.length,
      participated: user.threadMessages.length,
      averageEngagement: this.calculateAverageEngagement(threads)
    };
  }

  private async calculateContentStats(user: UserWithRelations) {
    return {
      created: user.threadMessages.length,
      edited: user.threadCollaborators.filter(c => c.role === 'EDITOR').length,
      shared: user.threadCollaborators.filter(c => c.role === 'VIEWER').length
    };
  }

  private async calculateCollaborationStats(user: UserWithRelations) {
    return {
      edits: user.threadCollaborators.filter(c => c.role === 'EDITOR').length,
      comments: user.threadComments.length,
      reactions: user.threadReactions.length
    };
  }

  private async calculateTimeStats(user: UserWithRelations) {
    const activeHours = new Array(24).fill(0);
    user.threadActivities.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours();
      activeHours[hour]++;
    });

    const sessions = this.calculateSessions(user.threadActivities);
    const averageSessionDuration = sessions.reduce((acc, session) => 
      acc + (session.end - session.start), 0) / sessions.length;

    return {
      activeHours,
      averageSessionDuration,
      lastActive: new Date(Math.max(...user.threadActivities.map(a => 
        new Date(a.createdAt).getTime())))
    };
  }

  private async calculateSentimentStats(user: UserWithRelations) {
    const sentiments = user.threadMessages.map(msg => msg.content);
    return {
      positive: sentiments.filter(s => s.includes('positive')).length,
      neutral: sentiments.filter(s => s.includes('neutral')).length,
      negative: sentiments.filter(s => s.includes('negative')).length
    };
  }

  private calculateEngagementScore(thread: ThreadWithRelations): number {
    const timeSpan = this.calculateTimeSpan(thread.activities);

    const viewWeight = 0.2;
    const reactionWeight = 0.2;
    const participantWeight = 0.2;
    const timeWeight = 0.1;

    const viewScore = thread.analytics?.viewCount || 0;
    const reactionScore = thread.analytics?.reactionCount || 0;
    const participantScore = thread.analytics?.participantCount || 0;

    return (
      viewScore * viewWeight +
      reactionScore * reactionWeight +
      participantScore * participantWeight +
      timeSpan * timeWeight
    ) / 100;
  }

  private calculateSentimentScore(messages: ThreadMessage[]): number {
    const sentiments = messages.map(msg => {
      const content = msg.content.toLowerCase();
      if (content.includes('positive')) return 1;
      if (content.includes('negative')) return -1;
      return 0;
    });
    const total = sentiments.reduce((acc: number, score: number) => acc + score, 0);
    return sentiments.length > 0 ? total / sentiments.length : 0;
  }

  private calculateAverageResponseTime(messages: ThreadMessage[]): number {
    if (messages.length < 2) return 0;
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      const timeDiff = messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime();
      responseTimes.push(timeDiff);
    }
    return responseTimes.reduce((acc: number, time: number) => acc + time, 0) / responseTimes.length;
  }

  private calculateTopicDistribution(insights: ThreadInsight[]): Array<{ topic: string; count: number }> {
    const topicCounts: Record<string, number> = {};
    insights.forEach(insight => {
      if (insight.type === 'SUMMARY') {
        const content = insight.content as { topics?: string[] };
        const topics = content.topics || [];
        topics.forEach((topic: string) => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });
    return Object.entries(topicCounts).map(([topic, count]) => ({ topic, count }));
  }

  private calculateUserEngagement(messages: ThreadMessage[]): Array<{ userId: string; score: number }> {
    const userScores: Record<string, number> = {};
    messages.forEach(msg => {
      const userId = msg.userId;
      userScores[userId] = (userScores[userId] || 0) + 1;
    });
    return Object.entries(userScores).map(([userId, score]) => ({ userId, score }));
  }

  private calculateTimeDistribution(activities: ThreadActivity[]): Array<{ hour: number; count: number }> {
    const hourCounts: Record<number, number> = {};
    activities.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return Object.entries(hourCounts).map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  private calculateContentTypes(): Array<{ type: string; count: number }> {
    const typeCounts: Record<string, number> = {};
    return Object.entries(typeCounts).map(([type, count]) => ({ type, count }));
  }

  private calculateCollaborationMetrics(thread: ThreadWithRelations): {
    edits: number;
    comments: number;
    shares: number;
    reactions: number;
  } {
    return {
      edits: thread.analytics?.reactionCount || 0,
      comments: thread.messages.length,
      shares: thread.participants.length,
      reactions: thread.analytics?.reactionCount || 0
    };
  }

  private calculateCollaborationScore(collaborations: ThreadCollaborator[]): number {
    const weights = {
      edit: 0.4,
      comment: 0.3,
      share: 0.2,
      reaction: 0.1
    };

    return collaborations.reduce((score, collab) => {
      const type = collab.role.toLowerCase() as keyof typeof weights;
      return score + (weights[type] || 0);
    }, 0);
  }

  private determineActivityLevel(engagementScore: number): 'low' | 'medium' | 'high' {
    if (engagementScore >= 0.7) return 'high';
    if (engagementScore >= 0.4) return 'medium';
    return 'low';
  }

  private calculateTimeSpan(activities: ThreadActivity[]): number {
    if (activities.length < 2) return 0;
    const timestamps = activities.map(a => new Date(a.createdAt).getTime());
    return Math.max(...timestamps) - Math.min(...timestamps);
  }

  private calculateSessions(activities: ThreadActivity[]): Array<{ start: number; end: number }> {
    const sessions: Array<{ start: number; end: number }> = [];
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    activities
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((activity, i) => {
        const timestamp = new Date(activity.createdAt).getTime();
        
        if (i === 0) {
          sessions.push({ start: timestamp, end: timestamp });
          return;
        }

        const lastSession = sessions[sessions.length - 1];
        if (timestamp - lastSession.end <= SESSION_TIMEOUT) {
          lastSession.end = timestamp;
        } else {
          sessions.push({ start: timestamp, end: timestamp });
        }
      });

    return sessions;
  }

  private calculateAverageEngagement(threads: ThreadWithRelations[]): number {
    if (threads.length === 0) return 0;
    const scores = threads.map(thread => this.calculateEngagementScore(thread));
    return scores.reduce((acc: number, score: number) => acc + score, 0) / scores.length;
  }

  private calculateTrendingScore(threadCount: number, totalEngagement: number): number {
    return (threadCount * 0.4) + (totalEngagement * 0.6);
  }

  public async processBatchAnalytics(userIds: string[]): Promise<void> {
    try {
      const batches = this.chunkArray(userIds, this.BATCH_SIZE);
      
      for (const batch of batches) {
        await Promise.all(
          batch.map(userId => this.updateUserAnalytics(userId))
        );
      }
    } catch (error) {
      logger.error('Error processing batch analytics:', error);
      throw error;
    }
  }

  private async updateUserAnalytics(userId: string): Promise<void> {
    const cacheKey = `user:${userId}`;
    const lastUpdate = await this.cache.get<Date>(`last_update:${userId}`);
    const now = new Date();

    if (lastUpdate && (now.getTime() - lastUpdate.getTime() < this.INCREMENTAL_UPDATE_INTERVAL)) {
      return; // Skip if recently updated
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          createdThreads: {
            where: {
              updatedAt: {
                gte: lastUpdate || new Date(0)
              }
            }
          },
          threadMessages: {
            where: {
              createdAt: {
                gte: lastUpdate || new Date(0)
              }
            }
          },
          threadActivities: {
            where: {
              createdAt: {
                gte: lastUpdate || new Date(0)
              }
            }
          },
          threadParticipants: true,
          threadReactions: true,
          threadCollaborators: true,
          threadComments: true,
          threadInsights: true
        }
      });

      if (!user) {
        throw new Error(`User not found: ${userId}`);
      }

      const analytics = await this.calculateUserMetrics(user);
      await this.cache.set(cacheKey, analytics);
      await this.cache.set(`last_update:${userId}`, now);
    } catch (error) {
      logger.error(`Error updating analytics for user ${userId}:`, error);
      throw error;
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  public async warmCache(userIds: string[]): Promise<void> {
    try {
      const batches = this.chunkArray(userIds, this.BATCH_SIZE);
      
      for (const batch of batches) {
        await Promise.all(
          batch.map(userId => this.getUserAnalytics(userId))
        );
      }
    } catch (error) {
      logger.error('Error warming cache:', error);
      throw error;
    }
  }

  // Add a method to clear cache for specific analytics
  public async clearCache(key: string): Promise<void> {
    await this.cache.delete(key);
  }

  // Add a method to clear all analytics cache
  public async clearAllCache(): Promise<void> {
    await this.cache.clear();
  }
} 