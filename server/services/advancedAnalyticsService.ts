import { PrismaClient, Thread, ThreadMessage, User, ThreadReaction, ThreadActivity, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

interface UserEngagementMetrics {
  userId: string;
  username: string;
  engagementScore: number;
  activityScore: number;
  influenceScore: number;
  participationRate: number;
  responseTime: number;
  threadCreationRate: number;
  messageQualityScore: number;
  peakActivityHours: number[];
  preferredTags: string[];
}

interface ThreadPerformanceMetrics {
  threadId: string;
  title: string;
  performanceScore: number;
  engagementRate: number;
  growthRate: number;
  retentionRate: number;
  sentimentScore: number;
  topicRelevance: number;
  userDiversity: number;
  timeToFirstResponse: number;
  averageResponseTime: number;
  peakActivityHours: number[];
  trendingScore: number;
}

interface TagAnalytics {
  tagId: string;
  name: string;
  usageCount: number;
  engagementScore: number;
  growthRate: number;
  userDiversity: number;
  trendingScore: number;
  relatedTags: string[];
  peakActivityHours: number[];
}

type ActivityItem = Thread | ThreadMessage;

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  private prisma: PrismaClient;

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService(new PrismaClient());
    }
    return AdvancedAnalyticsService.instance;
  }

  public async calculateUserEngagementMetrics(userId: string): Promise<UserEngagementMetrics> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          threads: {
            include: {
              messages: true,
              activities: true
            }
          },
          threadMessages: true,
          threadReactions: true,
          threadActivities: true
        }
      });

      if (!user) {
        throw new Error(`User ${userId} not found`);
      }

      // Calculate basic metrics
      const threadCount = user.threads.length;
      const messageCount = user.threadMessages.length;
      const reactionCount = user.threadReactions.length;
      const activityCount = user.threadActivities.length;

      // Calculate engagement score (weighted combination of activities)
      const engagementScore = this.calculateWeightedScore({
        threadCount: 0.3,
        messageCount: 0.3,
        reactionCount: 0.2,
        activityCount: 0.2
      }, {
        threadCount,
        messageCount,
        reactionCount,
        activityCount
      });

      // Calculate activity score (recent activity weighted more heavily)
      const activityScore = this.calculateActivityScore(user.threadMessages, user.threads);

      // Calculate influence score (based on thread engagement and message responses)
      const influenceScore = await this.calculateInfluenceScore(userId);

      // Calculate participation rate (active days vs total days)
      const participationRate = this.calculateParticipationRate(user.threadMessages, user.threads);

      // Calculate average response time
      const responseTime = this.calculateAverageResponseTime(user.threadMessages);

      // Calculate thread creation rate
      const threadCreationRate = this.calculateThreadCreationRate(user.threads);

      // Calculate message quality score
      const messageQualityScore = await this.calculateMessageQualityScore(user.threadMessages);

      // Calculate peak activity hours
      const peakActivityHours = this.calculatePeakActivityHours(user.threadMessages, user.threads);

      // Calculate preferred tags
      const preferredTags = await this.calculatePreferredTags(userId);

      return {
        userId: user.id,
        username: user.name,
        engagementScore,
        activityScore,
        influenceScore,
        participationRate,
        responseTime,
        threadCreationRate,
        messageQualityScore,
        peakActivityHours,
        preferredTags
      };
    } catch (error) {
      logger.error(`Error calculating user engagement metrics for user ${userId}:`, error);
      throw error;
    }
  }

  public async calculateThreadPerformanceMetrics(threadId: string): Promise<ThreadPerformanceMetrics> {
    try {
      const thread = await this.prisma.thread.findUnique({
        where: { id: threadId },
        include: {
          messages: true,
          reactions: true,
          views: true,
          tags: true
        }
      });

      if (!thread) {
        throw new Error(`Thread ${threadId} not found`);
      }

      // Calculate basic metrics
      const messageCount = thread.messages.length;
      const reactionCount = thread.reactions.length;
      const viewCount = thread.views.length;
      const participantCount = new Set(thread.messages.map(m => m.userId)).size;

      // Calculate performance score
      const performanceScore = this.calculateWeightedScore({
        messageCount: 0.3,
        reactionCount: 0.2,
        viewCount: 0.2,
        participantCount: 0.3
      }, {
        messageCount,
        reactionCount,
        viewCount,
        participantCount
      });

      // Calculate engagement rate
      const engagementRate = this.calculateEngagementRate(thread.messages, thread.views);

      // Calculate growth rate
      const growthRate = this.calculateGrowthRate(thread.messages);

      // Calculate retention rate
      const retentionRate = this.calculateRetentionRate(thread.messages);

      // Calculate sentiment score
      const sentimentScore = await this.calculateSentimentScore(thread.messages);

      // Calculate topic relevance
      const topicRelevance = await this.calculateTopicRelevance(thread);

      // Calculate user diversity
      const userDiversity = this.calculateUserDiversity(thread.messages);

      // Calculate time metrics
      const timeToFirstResponse = this.calculateTimeToFirstResponse(thread.messages);
      const averageResponseTime = this.calculateAverageResponseTime(thread.messages);

      // Calculate peak activity hours
      const peakActivityHours = this.calculatePeakActivityHours(thread.messages);

      // Calculate trending score
      const trendingScore = this.calculateTrendingScore(thread);

      return {
        threadId: thread.id,
        title: thread.title,
        performanceScore,
        engagementRate,
        growthRate,
        retentionRate,
        sentimentScore,
        topicRelevance,
        userDiversity,
        timeToFirstResponse,
        averageResponseTime,
        peakActivityHours,
        trendingScore
      };
    } catch (error) {
      logger.error(`Error calculating thread performance metrics for thread ${threadId}:`, error);
      throw error;
    }
  }

  public async calculateTagAnalytics(tagId: string): Promise<TagAnalytics> {
    try {
      const tag = await this.prisma.tag.findUnique({
        where: { id: tagId },
        include: {
          threads: {
            include: {
              messages: true,
              reactions: true,
              views: true
            }
          }
        }
      });

      if (!tag) {
        throw new Error(`Tag ${tagId} not found`);
      }

      // Calculate basic metrics
      const usageCount = tag.threads.length;
      const totalMessages = tag.threads.reduce((sum, thread) => sum + thread.messages.length, 0);
      const totalReactions = tag.threads.reduce((sum, thread) => sum + thread.reactions.length, 0);
      const totalViews = tag.threads.reduce((sum, thread) => sum + thread.views.length, 0);

      // Calculate engagement score
      const engagementScore = this.calculateWeightedScore({
        messageCount: 0.4,
        reactionCount: 0.3,
        viewCount: 0.3
      }, {
        messageCount: totalMessages,
        reactionCount: totalReactions,
        viewCount: totalViews
      });

      // Calculate growth rate
      const growthRate = this.calculateGrowthRate(tag.threads);

      // Calculate user diversity
      const userDiversity = this.calculateUserDiversity(tag.threads.flatMap(t => t.messages));

      // Calculate trending score
      const trendingScore = this.calculateTrendingScore(tag.threads);

      // Calculate peak activity hours
      const peakActivityHours = this.calculatePeakActivityHours(tag.threads.flatMap(t => t.messages));

      // Calculate related tags
      const relatedTags = await this.calculateRelatedTags(tagId);

      return {
        tagId: tag.id,
        name: tag.name,
        usageCount,
        engagementScore,
        growthRate,
        userDiversity,
        trendingScore,
        relatedTags,
        peakActivityHours
      };
    } catch (error) {
      logger.error(`Error calculating tag analytics for tag ${tagId}:`, error);
      throw error;
    }
  }

  private calculateWeightedScore(weights: Record<string, number>, values: Record<string, number>): number {
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const weightedSum = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + (values[key] || 0) * weight;
    }, 0);
    return weightedSum / totalWeight;
  }

  private calculateActivityScore(messages: ThreadMessage[], threads: Thread[]): number {
    const now = Date.now();
    const recentActivity = [...messages, ...threads].filter(item => {
      const timeDiff = now - new Date(item.createdAt).getTime();
      return timeDiff < 7 * 24 * 60 * 60 * 1000; // Last 7 days
    }).length;
    return recentActivity / (messages.length + threads.length) * 100;
  }

  private async calculateInfluenceScore(userId: string): Promise<number> {
    const userMessages = await this.prisma.threadMessage.findMany({
      where: { userId },
      include: { thread: true }
    });

    const threadIds = new Set(userMessages.map(m => m.threadId));
    const threadEngagements = await Promise.all(
      Array.from(threadIds).map(async (threadId) => {
        const thread = await this.prisma.thread.findUnique({
          where: { id: threadId },
          include: {
            messages: true,
            activities: true,
            analytics: true
          }
        });
        return {
          messageCount: thread?.messages.length || 0,
          activityCount: thread?.activities.length || 0,
          reactionCount: thread?.analytics?.reactionCount || 0,
          viewCount: thread?.analytics?.viewCount || 0
        };
      })
    );

    const totalEngagement = threadEngagements.reduce((sum, engagement) => {
      return sum + engagement.messageCount + engagement.activityCount + 
             engagement.reactionCount + engagement.viewCount;
    }, 0);

    return totalEngagement / threadIds.size;
  }

  private calculateParticipationRate(messages: ThreadMessage[], threads: Thread[]): number {
    const allActivities = [...messages, ...threads];
    const activityDates = new Set(
      allActivities.map(activity => new Date(activity.createdAt).toDateString())
    );
    const totalDays = Math.ceil(
      (Date.now() - Math.min(...allActivities.map(a => new Date(a.createdAt).getTime()))) /
      (24 * 60 * 60 * 1000)
    );
    return (activityDates.size / totalDays) * 100;
  }

  private calculateAverageResponseTime(messages: ThreadMessage[]): number {
    if (messages.length < 2) return 0;
    
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    let totalTime = 0;
    for (let i = 1; i < sortedMessages.length; i++) {
      totalTime += new Date(sortedMessages[i].createdAt).getTime() -
                  new Date(sortedMessages[i-1].createdAt).getTime();
    }
    
    return totalTime / (messages.length - 1);
  }

  private calculateThreadCreationRate(threads: Thread[]): number {
    if (threads.length === 0) return 0;
    
    const firstThread = new Date(threads[0].createdAt);
    const lastThread = new Date(threads[threads.length - 1].createdAt);
    const days = (lastThread.getTime() - firstThread.getTime()) / (24 * 60 * 60 * 1000);
    
    return threads.length / days;
  }

  private async calculateMessageQualityScore(messages: ThreadMessage[]): Promise<number> {
    // This is a placeholder for a more sophisticated message quality analysis
    // In a real implementation, you might use NLP to analyze message content
    return messages.length > 0 ? 0.7 : 0;
  }

  private calculatePeakActivityHours(messages: ThreadMessage[], threads: Thread[] = []): number[] {
    const allActivities = [...messages, ...threads];
    const hourCounts = new Array(24).fill(0);
    
    allActivities.forEach(activity => {
      const hour = new Date(activity.createdAt).getHours();
      hourCounts[hour]++;
    });
    
    const maxCount = Math.max(...hourCounts);
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count >= maxCount * 0.8)
      .map(({ hour }) => hour);
  }

  private async calculatePreferredTags(userId: string): Promise<string[]> {
    const userThreads = await this.prisma.thread.findMany({
      where: { userId }
    });
    
    const tagCounts = new Map<string, number>();
    userThreads.forEach(thread => {
      const metadata = thread.metadata as { tags?: string[] } | null;
      if (metadata?.tags) {
        metadata.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });
    
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }

  private calculateEngagementRate(messages: ThreadMessage[], views: ThreadView[]): number {
    if (views.length === 0) return 0;
    return (messages.length / views.length) * 100;
  }

  private calculateGrowthRate(items: ActivityItem[]): number {
    if (items.length < 2) return 0;
    
    const sortedItems = items.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const firstHalf = sortedItems.slice(0, Math.ceil(sortedItems.length / 2));
    const secondHalf = sortedItems.slice(Math.ceil(sortedItems.length / 2));
    
    const firstHalfRate = firstHalf.length / (firstHalf.length > 0 ? 
      (new Date(firstHalf[firstHalf.length - 1].createdAt).getTime() - 
       new Date(firstHalf[0].createdAt).getTime()) / (24 * 60 * 60 * 1000) : 1);
    
    const secondHalfRate = secondHalf.length / (secondHalf.length > 0 ? 
      (new Date(secondHalf[secondHalf.length - 1].createdAt).getTime() - 
       new Date(secondHalf[0].createdAt).getTime()) / (24 * 60 * 60 * 1000) : 1);
    
    return ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100;
  }

  private calculateRetentionRate(messages: ThreadMessage[]): number {
    if (messages.length < 2) return 0;
    
    const uniqueUsers = new Set(messages.map(m => m.userId));
    const returningUsers = new Set();
    
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].userId !== messages[i-1].userId) {
        returningUsers.add(messages[i].userId);
      }
    }
    
    return (returningUsers.size / uniqueUsers.size) * 100;
  }

  private async calculateSentimentScore(messages: ThreadMessage[]): Promise<number> {
    // This is a placeholder for a more sophisticated sentiment analysis
    // In a real implementation, you might use NLP to analyze message content
    return messages.length > 0 ? 0.5 : 0;
  }

  private async calculateTopicRelevance(thread: Thread): Promise<number> {
    // This is a placeholder for a more sophisticated topic analysis
    // In a real implementation, you might use NLP to analyze thread content
    return 0.7;
  }

  private calculateUserDiversity(messages: ThreadMessage[]): number {
    if (messages.length === 0) return 0;
    
    const uniqueUsers = new Set(messages.map(m => m.userId));
    return (uniqueUsers.size / messages.length) * 100;
  }

  private calculateTimeToFirstResponse(messages: ThreadMessage[]): number {
    if (messages.length < 2) return 0;
    
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    return new Date(sortedMessages[1].createdAt).getTime() - 
           new Date(sortedMessages[0].createdAt).getTime();
  }

  private calculateTrendingScore(items: ActivityItem[]): number {
    if (items.length === 0) return 0;
    
    const now = Date.now();
    const recentItems = items.filter(item => 
      now - new Date(item.createdAt).getTime() < 24 * 60 * 60 * 1000
    );
    
    return (recentItems.length / items.length) * 100;
  }

  private async calculateRelatedTags(tagId: string): Promise<string[]> {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      include: {
        threads: {
          include: {
            tags: true
          }
        }
      }
    });
    
    if (!tag) return [];
    
    const relatedTagCounts = new Map<string, number>();
    tag.threads.forEach(thread => {
      thread.tags.forEach(relatedTag => {
        if (relatedTag.id !== tagId) {
          relatedTagCounts.set(relatedTag.name, 
            (relatedTagCounts.get(relatedTag.name) || 0) + 1);
        }
      });
    });
    
    return Array.from(relatedTagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }
} 