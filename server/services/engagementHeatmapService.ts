import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

interface HeatmapData {
  hour: number;
  day: number;
  value: number;
}

interface ThreadEngagement {
  threadId: string;
  title: string;
  heatmap: HeatmapData[];
  totalEngagement: number;
  peakHour: number;
  peakDay: number;
}

interface UserEngagement {
  userId: string;
  name: string;
  heatmap: HeatmapData[];
  totalEngagement: number;
  peakHour: number;
  peakDay: number;
}

export class EngagementHeatmapService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getThreadEngagementHeatmap(threadId: string): Promise<ThreadEngagement> {
    try {
      const thread = await this.prisma.thread.findUnique({
        where: { id: threadId },
        include: {
          engagement: {
            include: {
              user: true
            }
          }
        }
      });

      if (!thread) {
        throw new Error('Thread not found');
      }

      const heatmap = this.generateHeatmap(thread.engagement);
      const { peakHour, peakDay } = this.findPeakEngagement(heatmap);

      return {
        threadId: thread.id,
        title: thread.title,
        heatmap,
        totalEngagement: thread.engagement.length,
        peakHour,
        peakDay
      };
    } catch (error) {
      logger.error('Error getting thread engagement heatmap:', error);
      throw error;
    }
  }

  async getUserEngagementHeatmap(userId: string): Promise<UserEngagement> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          engagement: {
            include: {
              thread: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const heatmap = this.generateHeatmap(user.engagement);
      const { peakHour, peakDay } = this.findPeakEngagement(heatmap);

      return {
        userId: user.id,
        name: user.name,
        heatmap,
        totalEngagement: user.engagement.length,
        peakHour,
        peakDay
      };
    } catch (error) {
      logger.error('Error getting user engagement heatmap:', error);
      throw error;
    }
  }

  async getTopEngagedThreads(limit: number = 10): Promise<ThreadEngagement[]> {
    try {
      const threads = await this.prisma.thread.findMany({
        include: {
          engagement: true
        },
        orderBy: {
          engagement: {
            _count: 'desc'
          }
        },
        take: limit
      });

      return Promise.all(threads.map(thread => this.getThreadEngagementHeatmap(thread.id)));
    } catch (error) {
      logger.error('Error getting top engaged threads:', error);
      throw error;
    }
  }

  private generateHeatmap(engagement: any[]): HeatmapData[] {
    const heatmap = new Array(24 * 7).fill(0).map((_, index) => ({
      hour: index % 24,
      day: Math.floor(index / 24),
      value: 0
    }));

    engagement.forEach(e => {
      const date = new Date(e.createdAt);
      const hour = date.getHours();
      const day = date.getDay();
      const index = day * 24 + hour;
      heatmap[index].value += e.score;
    });

    return heatmap;
  }

  private findPeakEngagement(heatmap: HeatmapData[]): { peakHour: number; peakDay: number } {
    let maxValue = 0;
    let peakHour = 0;
    let peakDay = 0;

    heatmap.forEach(data => {
      if (data.value > maxValue) {
        maxValue = data.value;
        peakHour = data.hour;
        peakDay = data.day;
      }
    });

    return { peakHour, peakDay };
  }

  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  private getHourLabel(hour: number): string {
    return hour < 12 ? `${hour} AM` : `${hour === 12 ? 12 : hour - 12} PM`;
  }
} 