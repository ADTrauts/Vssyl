import { Request, Response } from 'express';
import crypto from 'crypto';
import { Prisma, ModuleCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { getUserFromRequest } from '../../middleware/auth';
import { ModuleSecurityService } from '../../services/moduleSecurityService';
import { initializeHrScheduleForBusiness } from '../../services/hrScheduleService';
import { storageService } from '../../services/storageService';
import { runBaselineZipScan } from '../../services/moduleArtifactBaselineScan';
import { runSmartModuleScan } from '../../services/moduleArtifactSmartScan';

export const getModuleCategories = async (req: Request, res: Response) => {
  try {
    const categories = Object.values(require('@prisma/client').ModuleCategory);
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error getting module categories:', error);
    res.status(500).json({ success: false, error: 'Failed to get module categories' });
  }
};

// Get module details
export const getModuleDetails = async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { moduleId } = req.params;

    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        installations: {
          where: {
            userId: user.id
          }
        },
        moduleReviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!module) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    if (
      module.status !== 'APPROVED' &&
      module.developerId !== user.id &&
      user.role !== 'ADMIN'
    ) {
      return res.status(404).json({ success: false, error: 'Module not found' });
    }

    const moduleData = {
      id: module.id,
      name: module.name,
      description: module.description,
      version: module.version,
      category: module.category,
      developer: module.developer.name || module.developer.email,
      rating: module.rating,
      reviewCount: module.reviewCount,
      downloads: module.downloads,
      status: module.status,
      icon: module.icon,
      screenshots: module.screenshots,
      tags: module.tags,
      manifest: module.manifest,
      dependencies: module.dependencies,
      permissions: module.permissions,
      isInstalled: module.installations.length > 0,
      installation: module.installations[0] || null,
      reviews: module.moduleReviews,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt
    };

    res.json({ success: true, data: moduleData });
  } catch (error) {
    console.error('Error getting module details:', error);
    res.status(500).json({ success: false, error: 'Failed to get module details' });
  }
}; 
