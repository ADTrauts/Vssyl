import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// List folders with dashboard context support
export async function listFolders(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const parentId = req.query.parentId as string;
    const starred = req.query.starred as string;
    const dashboardId = req.query.dashboardId as string; // NEW: Dashboard context filtering
    
    const where: any = { userId };
    
    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null;
    }
    
    // Add starred filtering
    if (starred === 'true') {
      where.starred = true;
    } else if (starred === 'false') {
      where.starred = false;
    }
    
    // Use raw SQL to include order field in sorting
    let query = `SELECT * FROM "folders" WHERE "userId" = $1`;
    const params = [userId];
    let paramIndex = 2;
    
    // Dashboard context filtering
    if (dashboardId) {
      query += ` AND "dashboardId" = $${paramIndex}`;
      params.push(dashboardId);
      paramIndex++;
      console.log('Dashboard context requested for folders:', dashboardId);
    } else {
      query += ` AND "dashboardId" IS NULL`;
    }
    
    if (parentId) {
      query += ` AND "parentId" = $${paramIndex}`;
      params.push(parentId);
      paramIndex++;
    } else {
      query += ` AND "parentId" IS NULL`;
    }
    
    if (starred === 'true') {
      query += ` AND "starred" = true`;
    } else if (starred === 'false') {
      query += ` AND "starred" = false`;
    }
    
    // Exclude trashed folders
    query += ` AND "trashedAt" IS NULL`;
    
    query += ` ORDER BY "order" ASC, "createdAt" DESC`;
    
    const folders = await prisma.$queryRawUnsafe(query, ...params);
    res.json({ folders });
  } catch (err) {
    console.error('Error in listFolders:', err);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
}

export async function createFolder(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { name, parentId, dashboardId } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const folder = await prisma.folder.create({
      data: { userId, name, parentId: parentId || null, dashboardId: dashboardId || null },
    });

    // Create activity record for folder creation
    // Note: Since Activity model requires a fileId, we'll create a placeholder activity
    // or we could modify the schema to make fileId optional for folder activities
    // For now, we'll skip folder activities until the schema is updated

    res.status(201).json({ folder });
  } catch (err) {
    console.error('Error in createFolder:', err);
    console.error('req.user in createFolder:', req.user);
    res.status(500).json({ message: 'Failed to create folder' });
  }
}

export async function updateFolder(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const { name, parentId } = req.body;
    const folder = await prisma.folder.updateMany({
      where: { id, userId },
      data: { name, parentId },
    });
    if (folder.count === 0) return res.status(404).json({ message: 'Folder not found' });
    const updated = await prisma.folder.findUnique({ where: { id } });
    res.json({ folder: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update folder' });
  }
}

export async function deleteFolder(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const folder = await prisma.folder.updateMany({
      where: { id, userId, trashedAt: null },
      data: { trashedAt: new Date() },
    });
    if (folder.count === 0) return res.status(404).json({ message: 'Folder not found' });
    res.json({ trashed: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to move folder to trash' });
  }
}

// List trashed folders for the user
export async function listTrashedFolders(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const folders = await prisma.folder.findMany({
      where: { userId, trashedAt: { not: null } },
      orderBy: { trashedAt: 'desc' },
    });
    res.json({ folders });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list trashed folders' });
  }
}

// Restore a trashed folder
export async function restoreFolder(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const folder = await prisma.folder.updateMany({
      where: { id, userId, trashedAt: { not: null } },
      data: { trashedAt: null },
    });
    if (folder.count === 0) return res.status(404).json({ message: 'Folder not found or not trashed' });
    res.json({ restored: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to restore folder' });
  }
}

// Permanently delete a trashed folder
export async function hardDeleteFolder(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const folder = await prisma.folder.deleteMany({
      where: { id, userId, trashedAt: { not: null } },
    });
    if (folder.count === 0) return res.status(404).json({ message: 'Folder not found or not trashed' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to permanently delete folder' });
  }
} 

// Get recent activity for the user
export async function getRecentActivity(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        file: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get recent activity' });
  }
} 

// Toggle the starred status of a folder
export async function toggleFolderStarred(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { starred: !folder.starred },
    });
    res.json(updatedFolder);
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle star on folder' });
  }
}

// Reorder folders within a parent folder
export async function reorderFolders(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { parentId } = req.params;
    const { folderIds } = req.body; // Array of folder IDs in new order

    if (!Array.isArray(folderIds)) {
      return res.status(400).json({ message: 'folderIds must be an array' });
    }

    // Verify all folders belong to the user and are in the specified parent
    const folders = await prisma.folder.findMany({
      where: {
        id: { in: folderIds },
        userId: userId,
        parentId: parentId || null
      }
    });

    if (folders.length !== folderIds.length) {
      return res.status(400).json({ message: 'Some folders not found or access denied' });
    }

    // Update the order of each folder using raw SQL to avoid Prisma client issues
    for (let i = 0; i < folderIds.length; i++) {
      await prisma.$executeRawUnsafe(`UPDATE "Folder" SET "order" = $1 WHERE id = $2`, i, folderIds[i]);
    }

    res.json({ success: true, message: 'Folders reordered successfully' });
  } catch (err) {
    console.error('Error in reorderFolders:', err);
    res.status(500).json({ message: 'Failed to reorder folders' });
  }
}

// Move a folder to a different parent folder
export async function moveFolder(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id || (req.user as any).sub;
    const { id } = req.params;
    const { targetParentId } = req.body;

    // Verify the folder belongs to the user
    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ message: 'Folder not found or access denied' });
    }

    // Verify the target parent folder exists and belongs to the user (if specified)
    if (targetParentId) {
      const targetParent = await prisma.folder.findUnique({ where: { id: targetParentId } });
      if (!targetParent || targetParent.userId !== userId) {
        return res.status(400).json({ message: 'Target parent folder not found or access denied' });
      }
      
      // Prevent moving a folder into itself or its descendants
      if (targetParentId === id) {
        return res.status(400).json({ message: 'Cannot move folder into itself' });
      }
      
      // Check if target is a descendant of the folder being moved
      let currentParent: any = targetParent;
      while (currentParent && currentParent.parentId) {
        if (currentParent.parentId === id) {
          return res.status(400).json({ message: 'Cannot move folder into its descendant' });
        }
        currentParent = await prisma.folder.findUnique({ where: { id: currentParent.parentId } });
        if (!currentParent) break;
      }
    }

    // Get the original parent details for activity tracking
    const originalParentId = folder.parentId;

    // Move the folder
    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { parentId: targetParentId || null },
    });

    // Note: We could create activity records for folders if we extend the Activity model
    // For now, we'll skip folder activity tracking

    res.json({ folder: updatedFolder, message: 'Folder moved successfully' });
  } catch (err) {
    console.error('Error in moveFolder:', err);
    res.status(500).json({ message: 'Failed to move folder' });
  }
} 