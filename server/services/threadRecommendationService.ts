import { prisma } from '../prismaClient';
import { ThreadActivity, Thread, User } from '@prisma/client';
import { logger } from '../utils/logger';
import { subDays, subMonths } from 'date-fns';
import NodeCache from 'node-cache';

export class ThreadRecommendationService {
  private cache: NodeCache;
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor() {
    this.cache = new NodeCache({ stdTTL: this.CACHE_TTL });
  }

  // Get personalized thread recommendations for a user
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<Array<{
    thread: Thread;
    relevanceScore: number;
    reason: string;
  }>> {
    try {
      // Get user's recent activities
      const recentActivities = await this.getRecentActivities(userId);
      
      // Get threads user hasn't participated in
      const userThreads = await this.getUserThreads(userId);
      const allThreads = await this.getActiveThreads();
      const candidateThreads = allThreads.filter(thread => 
        !userThreads.some(userThread => userThread.id === thread.id)
      );

      // Calculate relevance scores for each thread
      const recommendations = await Promise.all(
        candidateThreads.map(async thread => {
          const score = await this.calculateRelevanceScore(thread, recentActivities);
          const reason = this.getRecommendationReason(thread, score);
          return {
            thread,
            relevanceScore: score,
            reason
          };
        })
      );

      // Sort by relevance score and limit results
      return recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting personalized recommendations:', error);
      throw error;
    }
  }

  private async findSimilarThreads(
    userId: string,
    participatedThreads: Set<string>,
    limit: number
  ): Promise<Array<{
    threadId: string;
    title: string;
    relevanceScore: number;
    reason: string;
  }>> {
    try {
      // Get all threads except those the user has participated in
      const threads = await prisma.thread.findMany({
        where: {
          id: {
            notIn: Array.from(participatedThreads)
          }
        },
        include: {
          activities: {
            where: {
              timestamp: {
                gte: subDays(new Date(), 30)
              }
            }
          }
        }
      });

      // Calculate relevance scores for each thread
      const scoredThreads = await Promise.all(
        threads.map(async thread => {
          const relevanceScore = await this.calculateRelevanceScore(
            thread,
            await prisma.threadActivity.findMany({
              where: {
                threadId: thread.id,
                userId,
                timestamp: {
                  gte: subDays(new Date(), 30)
                }
              },
              include: {
                thread: true
              }
            })
          );
          return {
            threadId: thread.id,
            title: thread.title,
            relevanceScore,
            reason: await this.getRecommendationReason(
              thread,
              relevanceScore
            )
          };
        })
      );

      // Sort by relevance score and return top N
      return scoredThreads
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error finding similar threads:', error);
      throw error;
    }
  }

  private calculateRelevanceScore(
    thread: Thread & { activities: Array<ThreadActivity & { user: User }> },
    userActivities: Array<ThreadActivity & { thread: Thread }>
  ): number {
    const commonParticipants = this.getCommonParticipants(thread, userActivities);
    const recentActivityScore = this.getRecentActivityScore(thread);
    const userInterests = this.getUserInterests(userActivities);
    const interestMatch = this.calculateInterestMatch(thread, userInterests);

    return (
      commonParticipants * 0.3 +
      recentActivityScore * 0.3 +
      interestMatch * 0.4
    );
  }

  private getCommonParticipants(
    thread: Thread & { activities: Array<ThreadActivity & { user: User }> },
    userActivities: Array<ThreadActivity & { thread: Thread }>
  ): number {
    const userThreadParticipants = new Set(
      userActivities.map(a => a.threadId)
    );
    const threadParticipants = new Set(
      thread.activities.map(a => a.userId)
    );

    let commonCount = 0;
    threadParticipants.forEach(participant => {
      if (userThreadParticipants.has(participant)) {
        commonCount++;
      }
    });

    return commonCount / threadParticipants.size;
  }

  private getRecentActivityScore(
    thread: Thread & { activities: Array<ThreadActivity & { user: User }> }
  ): number {
    const recentActivities = thread.activities.filter(
      a => a.timestamp >= subDays(new Date(), 7)
    );
    return recentActivities.length / 10; // Normalize to 0-1 range
  }

  private getUserInterests(
    userActivities: Array<ThreadActivity & { thread: Thread }>
  ): Set<string> {
    const interests = new Set<string>();
    userActivities.forEach(activity => {
      interests.add(activity.type);
    });
    return interests;
  }

  private calculateInterestMatch(
    thread: Thread & { activities: Array<ThreadActivity & { user: User }> },
    userInterests: Set<string>
  ): number {
    const threadActivityTypes = new Set(
      thread.activities.map(a => a.type)
    );

    let matchCount = 0;
    userInterests.forEach(interest => {
      if (threadActivityTypes.has(interest)) {
        matchCount++;
      }
    });

    return matchCount / userInterests.size;
  }

  private calculateActivityScore(
    thread: Thread & { activities: Array<ThreadActivity> }
  ): number {
    const recentActivities = thread.activities.filter(
      a => a.timestamp >= subDays(new Date(), 7)
    );
    const uniqueParticipants = new Set(
      recentActivities.map(a => a.userId)
    ).size;

    return (
      recentActivities.length * 0.6 +
      uniqueParticipants * 0.4
    );
  }

  private getRecommendationReason(
    thread: Thread & { activities: Array<ThreadActivity & { user: User }> },
    relevanceScore: number
  ): string {
    const reasons = [];
    
    if (relevanceScore > 0.7) {
      reasons.push('Highly relevant based on your activity patterns');
    } else if (relevanceScore > 0.4) {
      reasons.push('Relevant based on your interests');
    } else {
      reasons.push('Based on general activity patterns');
    }

    if (thread.activities.length > 0) {
      const recentActivity = thread.activities[0];
      reasons.push(`Recent activity: ${recentActivity.type} by ${recentActivity.user.name}`);
    }

    return reasons.join('. ');
  }

  async getTrendingThreads(
    userId: string,
    limit: number = 5
  ): Promise<Array<{
    thread: Thread;
    activityScore: number;
    recentActivity: number;
  }>> {
    try {
      const recentThreads = await this.getRecentThreads();
      
      const trendingThreads = await Promise.all(
        recentThreads.map(async thread => {
          const activityScore = await this.calculateActivityScore(thread);
          const recentActivity = thread.activities.length;
          return {
            thread,
            activityScore,
            recentActivity
          };
        })
      );

      return trendingThreads
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting trending threads:', error);
      throw error;
    }
  }

  private async getRecentActivities(userId: string) {
    return prisma.activity.findMany({
      where: {
        userId,
        createdAt: {
          gte: subDays(new Date(), 30)
        }
      },
      include: {
        thread: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  private async getUserThreads(userId: string) {
    return prisma.thread.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      }
    });
  }

  private async getActiveThreads() {
    return prisma.thread.findMany({
      where: {
        isActive: true
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });
  }

  private async getRecentThreads() {
    return prisma.thread.findMany({
      where: {
        isActive: true,
        updatedAt: {
          gte: subDays(new Date(), 7)
        }
      },
      include: {
        participants: {
          include: {
            user: true
          }
        }
      }
    });
  }

  private getTrendingReason(activityScore: number): string {
    if (activityScore > 10) {
      return 'Highly active thread with significant recent engagement';
    } else if (activityScore > 5) {
      return 'Active thread with growing engagement';
    } else {
      return 'Thread with recent activity';
    }
  }
} 