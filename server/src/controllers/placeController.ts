import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

function getUserId(req: Request): string | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  return user?.id || user?.sub || null;
}

/**
 * GET /api/place
 * Get or create the current user's Place (Main Street)
 */
export async function getPlace(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let place = await prisma.place.findUnique({
      where: { userId },
      include: {
        nodes: true,
        settings: true,
        interests: true,
      },
    });

    if (!place) {
      place = await prisma.place.create({
        data: {
          userId,
          settings: {
            create: {},
          },
        },
        include: {
          nodes: true,
          settings: true,
          interests: true,
        },
      });
    }

    res.json({ success: true, data: place });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching place:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch place' });
  }
}

/**
 * PUT /api/place/settings
 * Update Place settings (privacy, layout, discovery preferences)
 */
export async function updatePlaceSettings(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await prisma.place.findUnique({ where: { userId } });
    if (!place) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    const {
      neighborhoodVisibility,
      defaultFollowVisibility,
      layoutMode,
      showLabels,
      highContrastMode,
      showLocalSuggestions,
      suggestionRadius,
    } = req.body;

    const settings = await prisma.placeSettings.upsert({
      where: { placeId: place.id },
      update: {
        ...(neighborhoodVisibility !== undefined && { neighborhoodVisibility }),
        ...(defaultFollowVisibility !== undefined && { defaultFollowVisibility }),
        ...(layoutMode !== undefined && { layoutMode }),
        ...(showLabels !== undefined && { showLabels }),
        ...(highContrastMode !== undefined && { highContrastMode }),
        ...(showLocalSuggestions !== undefined && { showLocalSuggestions }),
        ...(suggestionRadius !== undefined && { suggestionRadius }),
      },
      create: {
        placeId: place.id,
        neighborhoodVisibility: neighborhoodVisibility || 'PRIVATE',
        defaultFollowVisibility: defaultFollowVisibility ?? false,
        layoutMode: layoutMode || 'FORCE',
        showLabels: showLabels ?? true,
        highContrastMode: highContrastMode ?? false,
        showLocalSuggestions: showLocalSuggestions ?? true,
        suggestionRadius: suggestionRadius ?? 50,
      },
    });

    res.json({ success: true, data: settings });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating place settings:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
}

/**
 * POST /api/place/nodes
 * Add a node to the user's Place (follow a business or user)
 */
export async function addNode(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await prisma.place.findUnique({ where: { userId } });
    if (!place) {
      res.status(404).json({ success: false, error: 'Place not found. Create your place first.' });
      return;
    }

    const { nodeType, entityId, positionX, positionY, label, color } = req.body;

    if (!nodeType || !entityId) {
      res.status(400).json({ success: false, error: 'nodeType and entityId are required' });
      return;
    }

    const node = await prisma.placeNode.create({
      data: {
        placeId: place.id,
        nodeType,
        entityId,
        positionX: positionX ?? null,
        positionY: positionY ?? null,
        label: label ?? null,
        color: color ?? null,
      },
    });

    res.status(201).json({ success: true, data: node });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('Unique constraint')) {
      res.status(409).json({ success: false, error: 'This node already exists in your place' });
      return;
    }
    console.error('Error adding node:', err.message);
    res.status(500).json({ success: false, error: 'Failed to add node' });
  }
}

/**
 * PUT /api/place/nodes/:nodeId
 * Update a node's position or display settings
 */
export async function updateNode(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { nodeId } = req.params;
    const { positionX, positionY, label, color, pinned } = req.body;

    const node = await prisma.placeNode.findUnique({
      where: { id: nodeId },
      include: { place: true },
    });

    if (!node || node.place.userId !== userId) {
      res.status(404).json({ success: false, error: 'Node not found' });
      return;
    }

    const updated = await prisma.placeNode.update({
      where: { id: nodeId },
      data: {
        ...(positionX !== undefined && { positionX }),
        ...(positionY !== undefined && { positionY }),
        ...(label !== undefined && { label }),
        ...(color !== undefined && { color }),
        ...(pinned !== undefined && { pinned }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating node:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update node' });
  }
}

/**
 * DELETE /api/place/nodes/:nodeId
 * Remove a node from the user's Place
 */
export async function removeNode(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { nodeId } = req.params;

    const node = await prisma.placeNode.findUnique({
      where: { id: nodeId },
      include: { place: true },
    });

    if (!node || node.place.userId !== userId) {
      res.status(404).json({ success: false, error: 'Node not found' });
      return;
    }

    await prisma.placeNode.delete({ where: { id: nodeId } });

    res.json({ success: true, message: 'Node removed' });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error removing node:', err.message);
    res.status(500).json({ success: false, error: 'Failed to remove node' });
  }
}

/**
 * POST /api/place/interests
 * Set user's interests for discovery seeding
 */
export async function setInterests(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await prisma.place.findUnique({ where: { userId } });
    if (!place) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      res.status(400).json({ success: false, error: 'categories must be an array of strings' });
      return;
    }

    // Delete existing and recreate
    await prisma.placeInterest.deleteMany({ where: { placeId: place.id } });

    const interests = await Promise.all(
      categories.map((category: string) =>
        prisma.placeInterest.create({
          data: { placeId: place.id, category },
        })
      )
    );

    res.json({ success: true, data: interests });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error setting interests:', err.message);
    res.status(500).json({ success: false, error: 'Failed to set interests' });
  }
}

/**
 * POST /api/place/complete-setup
 * Mark the user's Place setup as complete (onboarding finished)
 */
export async function completeSetup(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await prisma.place.update({
      where: { userId },
      data: { isSetupComplete: true },
      include: {
        nodes: true,
        settings: true,
        interests: true,
      },
    });

    res.json({ success: true, data: place });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error completing setup:', err.message);
    res.status(500).json({ success: false, error: 'Failed to complete setup' });
  }
}

/**
 * PUT /api/place/follow-visibility/:businessId
 * Toggle whether a specific business follow is visible to others
 */
export async function updateFollowVisibility(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { businessId } = req.params;
    const { isVisible } = req.body;

    if (typeof isVisible !== 'boolean') {
      res.status(400).json({ success: false, error: 'isVisible must be a boolean' });
      return;
    }

    const visibility = await prisma.placeFollowVisibility.upsert({
      where: { userId_businessId: { userId, businessId } },
      update: { isVisible },
      create: { userId, businessId, isVisible },
    });

    res.json({ success: true, data: visibility });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error updating follow visibility:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update follow visibility' });
  }
}

/**
 * GET /api/place/ai/context/overview
 * AI Context Provider: Place overview for AI queries
 */
export async function getPlaceContextOverview(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const place = await prisma.place.findUnique({
      where: { userId },
      include: {
        nodes: true,
        interests: true,
        settings: true,
      },
    });

    if (!place) {
      res.json({
        success: true,
        context: {
          summary: { totalNodes: 0, isSetup: false, status: 'not-created' },
          details: {},
        },
        metadata: {
          provider: 'place',
          endpoint: 'overview',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const businessNodes = place.nodes.filter(n => n.nodeType === 'BUSINESS');
    const userNodes = place.nodes.filter(n => n.nodeType === 'USER');

    res.json({
      success: true,
      context: {
        summary: {
          totalNodes: place.nodes.length,
          businessCount: businessNodes.length,
          userConnectionCount: userNodes.length,
          isSetup: place.isSetupComplete,
          interests: place.interests.map(i => i.category),
          status: place.isSetupComplete ? 'active' : 'setup-pending',
        },
        details: {
          layoutMode: place.settings?.layoutMode || 'FORCE',
          localSuggestions: place.settings?.showLocalSuggestions ?? true,
        },
      },
      metadata: {
        provider: 'place',
        endpoint: 'overview',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error fetching place context:', err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch place context' });
  }
}
