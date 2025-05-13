import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: {
    engagementScore: number;
    activityLevel: 'low' | 'medium' | 'high';
    threadParticipation: number;
    responseTime: number;
    contentCreation: number;
    tagUsage: number;
    collaborationScore: number;
  };
  dynamic?: boolean;
  rules?: {
    conditions: Array<{
      field: string;
      operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
      value: number | string;
    }>;
    logic: 'AND' | 'OR';
  };
}

interface UserSegmentStats {
  segmentId: string;
  userCount: number;
  averageEngagement: number;
  averageActivity: number;
  averageResponseTime: number;
  averageContentCreation: number;
  averageTagUsage: number;
  averageCollaboration: number;
  topTags: string[];
  activeHours: number[];
  contentTypes: Array<{ type: string; count: number }>;
  collaborationPatterns: Array<{ pattern: string; count: number }>;
}

export class UserSegmentationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
  }

  async getSegments(): Promise<UserSegment[]> {
    try {
      const baseSegments = [
        {
          id: 'power-users',
          name: 'Power Users',
          description: 'Highly engaged users with frequent participation and content creation',
          criteria: {
            engagementScore: 0.8,
            activityLevel: 'high',
            threadParticipation: 20,
            responseTime: 15,
            contentCreation: 10,
            tagUsage: 15,
            collaborationScore: 0.7
          }
        },
        {
          id: 'active-users',
          name: 'Active Users',
          description: 'Regular participants with good engagement and content contribution',
          criteria: {
            engagementScore: 0.6,
            activityLevel: 'medium',
            threadParticipation: 10,
            responseTime: 30,
            contentCreation: 5,
            tagUsage: 8,
            collaborationScore: 0.5
          }
        },
        {
          id: 'casual-users',
          name: 'Casual Users',
          description: 'Occasional participants with moderate engagement',
          criteria: {
            engagementScore: 0.4,
            activityLevel: 'low',
            threadParticipation: 5,
            responseTime: 60,
            contentCreation: 2,
            tagUsage: 3,
            collaborationScore: 0.3
          }
        }
      ];

      // Get dynamic segments from database
      const dynamicSegments = await this.prisma.dynamicSegment.findMany({
        where: { isActive: true }
      });

      return [
        ...baseSegments,
        ...dynamicSegments.map(segment => ({
          id: segment.id,
          name: segment.name,
          description: segment.description,
          criteria: segment.criteria,
          dynamic: true,
          rules: segment.rules
        }))
      ];
    } catch (error) {
      logger.error('Error getting user segments:', error);
      throw error;
    }
  }

  async getSegmentStats(segmentId: string): Promise<UserSegmentStats> {
    try {
      const segment = (await this.getSegments()).find(s => s.id === segmentId);
      if (!segment) {
        throw new Error('Segment not found');
      }

      const users = await this.prisma.user.findMany({
        where: this.buildSegmentQuery(segment),
        include: {
          threads: true,
          replies: true,
          tags: true,
          collaborations: true,
          content: {
            include: {
              type: true
            }
          }
        }
      });

      const stats: UserSegmentStats = {
        segmentId,
        userCount: users.length,
        averageEngagement: this.calculateAverage(users, 'engagementScore'),
        averageActivity: this.calculateAverage(users, 'threadParticipation'),
        averageResponseTime: this.calculateAverage(users, 'averageResponseTime'),
        averageContentCreation: this.calculateAverage(users, 'contentCount'),
        averageTagUsage: this.calculateAverage(users, 'tagCount'),
        averageCollaboration: this.calculateAverage(users, 'collaborationScore'),
        topTags: this.getTopTags(users),
        activeHours: this.getActiveHours(users),
        contentTypes: this.getContentTypes(users),
        collaborationPatterns: this.getCollaborationPatterns(users)
      };

      return stats;
    } catch (error) {
      logger.error('Error getting segment stats:', error);
      throw error;
    }
  }

  private buildSegmentQuery(segment: UserSegment) {
    if (segment.dynamic && segment.rules) {
      return this.buildDynamicQuery(segment.rules);
    }

    return {
      engagementScore: { gte: segment.criteria.engagementScore },
      threadParticipation: { gte: segment.criteria.threadParticipation },
      averageResponseTime: { lte: segment.criteria.responseTime * 60 * 1000 },
      contentCount: { gte: segment.criteria.contentCreation },
      tagCount: { gte: segment.criteria.tagUsage },
      collaborationScore: { gte: segment.criteria.collaborationScore }
    };
  }

  private buildDynamicQuery(rules: UserSegment['rules']) {
    const conditions = rules.conditions.map(condition => {
      const value = typeof condition.value === 'string' 
        ? condition.value 
        : Number(condition.value);

      return {
        [condition.field]: {
          [condition.operator]: value
        }
      };
    });

    return rules.logic === 'AND' 
      ? { AND: conditions }
      : { OR: conditions };
  }

  private calculateAverage(users: any[], field: string): number {
    return users.reduce((acc, user) => acc + (user[field] || 0), 0) / users.length;
  }

  private getTopTags(users: any[]): string[] {
    const tagCounts = new Map<string, number>();
    users.forEach(user => {
      user.tags.forEach(tag => {
        tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 10);
  }

  private getActiveHours(users: any[]): number[] {
    const hourCounts = new Array(24).fill(0);
    users.forEach(user => {
      user.activities.forEach(activity => {
        const hour = new Date(activity.timestamp).getHours();
        hourCounts[hour]++;
      });
    });
    return hourCounts;
  }

  private getContentTypes(users: any[]): Array<{ type: string; count: number }> {
    const typeCounts = new Map<string, number>();
    users.forEach(user => {
      user.content.forEach(content => {
        const type = content.type.name;
        typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
      });
    });
    return Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getCollaborationPatterns(users: any[]): Array<{ pattern: string; count: number }> {
    const patternCounts = new Map<string, number>();
    users.forEach(user => {
      user.collaborations.forEach(collab => {
        const pattern = collab.type;
        patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
      });
    });
    return Array.from(patternCounts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getSegmentUsers(segmentId: string) {
    try {
      const segment = (await this.getSegments()).find(s => s.id === segmentId);
      if (!segment) {
        throw new Error('Segment not found');
      }

      return await this.prisma.user.findMany({
        where: {
          engagementScore: {
            gte: segment.criteria.engagementScore
          },
          threadParticipation: {
            gte: segment.criteria.threadParticipation
          },
          averageResponseTime: {
            lte: segment.criteria.responseTime * 60 * 1000
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          engagementScore: true,
          threadParticipation: true,
          averageResponseTime: true,
          lastActive: true
        }
      });
    } catch (error) {
      logger.error('Error getting segment users:', error);
      throw error;
    }
  }
} 