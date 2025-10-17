import { prisma } from '../lib/prisma';

export interface AuditLogEntry {
  userId: string;
  action: string;
  details: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export class AuditService {
  /**
   * Log Block ID usage and important user actions
   */
  static async logBlockIdAction(
    userId: string,
    action: string,
    details: string,
    metadata?: Record<string, unknown>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details: metadata ? JSON.stringify(metadata) : details,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // Don't fail the main operation if audit logging fails
    }
  }

  /**
   * Log business connections with Block ID
   */
  static async logBusinessConnection(
    userId: string,
    businessId: string,
    action: 'invited' | 'accepted' | 'declined',
    targetUserBlockId?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userNumber: true, name: true }
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true }
    });

    await this.logBlockIdAction(
      userId,
      `BUSINESS_${action.toUpperCase()}`,
      `User ${user?.userNumber} ${action} connection to business ${business?.name}`,
      {
        businessId,
        businessName: business?.name,
        userBlockId: user?.userNumber,
        targetUserBlockId,
        action
      }
    );
  }

  /**
   * Log location changes (admin only)
   */
  static async logLocationChange(
    userId: string,
    oldLocation: string,
    newLocation: string,
    changedBy: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userNumber: true, name: true }
    });

    await this.logBlockIdAction(
      userId,
      'LOCATION_CHANGE',
      `Location changed for user ${user?.userNumber} from ${oldLocation} to ${newLocation}`,
      {
        oldLocation,
        newLocation,
        changedBy,
        userBlockId: user?.userNumber
      }
    );
  }

  /**
   * Log Block ID generation
   */
  static async logBlockIdGeneration(
    userId: string,
    blockId: string,
    location: string
  ) {
    await this.logBlockIdAction(
      userId,
      'BLOCK_ID_GENERATED',
      `Block ID ${blockId} generated for user`,
      {
        blockId,
        location,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get audit logs for Block ID actions
   */
  static async getBlockIdAuditLogs(
    blockId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    return prisma.auditLog.findMany({
      where: {
        details: {
          contains: blockId
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip: offset,
    });
  }
} 