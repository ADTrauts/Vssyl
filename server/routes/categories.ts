import { Router } from 'express';
import { PrismaClient, ThreadStyle } from '@prisma/client';
import { authenticateToken as authenticate } from '../middleware/auth';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const prisma = new PrismaClient();
const router = Router();

// Category creation schema
const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// Category update schema
const updateCategorySchema = z.object({
  name: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const createMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});

const updateMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

// GET /categories
router.get('/categories', authenticate, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { ownerId: req.user.id },
          {
            members: {
              some: {
                userId: req.user.id,
              },
            },
          },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        workspaces: {
          include: {
            conversations: {
              select: {
                id: true,
                name: true,
                lastMessage: {
                  select: {
                    content: true,
                    createdAt: true,
                  },
                },
                _count: {
                  select: {
                    messages: {
                      where: {
                        NOT: {
                          readBy: {
                            some: {
                              id: req.user.id,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        settings: true,
      },
    });

    // Transform the data to include unread counts
    const transformedCategories = categories.map(category => ({
      ...category,
      workspaces: category.workspaces.map(workspace => ({
        ...workspace,
        conversations: workspace.conversations.map(conversation => ({
          ...conversation,
          unreadCount: conversation._count.messages,
        })),
      })),
    }));

    res.json({ data: transformedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch categories'
    });
  }
});

// GET /categories/:categoryId
router.get('/categories/:categoryId', authenticate, async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: {
        id: req.params.categoryId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        workspaces: {
          include: {
            conversations: {
              select: {
                id: true,
                name: true,
                lastMessage: {
                  select: {
                    content: true,
                    createdAt: true,
                  },
                },
                _count: {
                  select: {
                    messages: {
                      where: {
                        NOT: {
                          readBy: {
                            some: {
                              id: req.user.id,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        settings: true,
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if user has access to this category
    const isMember = category.members.some(
      member => member.user.id === req.user.id
    );
    if (!isMember) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Transform the data
    const transformedCategory = {
      ...category,
      workspaces: category.workspaces.map(workspace => ({
        ...workspace,
        conversations: workspace.conversations.map(conversation => ({
          ...conversation,
          unreadCount: conversation._count.messages,
        })),
      })),
    };

    res.json({ data: transformedCategory });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch category'
    });
  }
});

// POST /categories
router.post(
  '/categories',
  authenticate,
  validate({ body: createCategorySchema }),
  async (req, res) => {
    try {
      const { name, type, icon, color } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
          type,
          icon,
          color,
          ownerId: req.user.id,
          settings: {
            create: {
              notificationPreference: 'ALL',
              isPrivate: false,
              allowInvites: true,
              allowThreads: true,
              threadStyle: (type === 'ENTERPRISE' ? 'SIDE_PANEL' : 'INLINE') as ThreadStyle,
            },
          },
          members: {
            create: {
              userId: req.user.id,
              role: 'OWNER',
            },
          },
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          workspaces: true,
          settings: true,
        },
      });

      res.json({ data: category });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create category'
      });
    }
  }
);

// PATCH /categories/:categoryId
router.patch(
  '/categories/:categoryId',
  authenticate,
  validate({ body: updateCategorySchema }),
  async (req, res) => {
    try {
      const { name, icon, color } = req.body;

      // Check if user is owner or admin
      const category = await prisma.category.findUnique({
        where: { id: req.params.categoryId },
        include: {
          members: {
            where: { userId: req.user.id },
          },
        },
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      const userRole = category.members[0]?.role;
      if (!userRole || !['OWNER', 'ADMIN'].includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const updatedCategory = await prisma.category.update({
        where: { id: req.params.categoryId },
        data: {
          name,
          icon,
          color,
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
          workspaces: true,
          settings: true,
        },
      });

      res.json({ data: updatedCategory });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update category'
      });
    }
  }
);

// DELETE /categories/:categoryId
router.delete('/categories/:categoryId', authenticate, async (req, res) => {
  try {
    // Check if user is owner
    const category = await prisma.category.findUnique({
      where: { id: req.params.categoryId },
      include: {
        members: {
          where: { userId: req.user.id },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const userRole = category.members[0]?.role;
    if (userRole !== 'OWNER') {
      return res.status(403).json({ error: 'Only the owner can delete a category' });
    }

    await prisma.category.delete({
      where: { id: req.params.categoryId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete category'
    });
  }
});

// GET /categories/:categoryId/members
router.get('/categories/:categoryId/members', authenticate, async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.categoryId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if user has access to this category
    const isMember = category.members.some(
      member => member.user.id === req.user.id
    );
    if (!isMember) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({ data: category.members });
  } catch (error) {
    console.error('Error fetching category members:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch category members'
    });
  }
});

// POST /categories/:categoryId/members
router.post(
  '/categories/:categoryId/members',
  authenticate,
  validate({ body: createMemberSchema }),
  async (req, res) => {
    try {
      const { email, role } = req.body;

      // Check if the current user has permission to invite members
      const currentMember = await prisma.categoryMember.findFirst({
        where: {
          categoryId: req.params.categoryId,
          userId: req.user.id,
        },
      });

      if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to invite members' });
      }

      // Check if the category exists and allows invites
      const category = await prisma.category.findUnique({
        where: { id: req.params.categoryId },
        include: { settings: true },
      });

      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }

      if (category.settings?.isPrivate && !category.settings?.allowInvites) {
        return res.status(403).json({ error: 'This category does not allow invites' });
      }

      // Find or create the user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user is already a member
      const existingMember = await prisma.categoryMember.findUnique({
        where: {
          categoryId_userId: {
            categoryId: req.params.categoryId,
            userId: user.id,
          },
        },
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member' });
      }

      // Create the member
      const member = await prisma.categoryMember.create({
        data: {
          categoryId: req.params.categoryId,
          userId: user.id,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      res.json({ data: member });
    } catch (error) {
      console.error('Error inviting member:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to invite member'
      });
    }
  }
);

// DELETE /categories/:categoryId/members/:userId
router.delete('/categories/:categoryId/members/:userId', authenticate, async (req, res) => {
  try {
    const { categoryId, userId } = req.params;

    // Check if the current user has permission to remove members
    const currentMember = await prisma.categoryMember.findFirst({
      where: {
        categoryId,
        userId: req.user.id,
      },
    });

    if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to remove members' });
    }

    // Cannot remove the owner
    const targetMember = await prisma.categoryMember.findUnique({
      where: {
        categoryId_userId: {
          categoryId,
          userId,
        },
      },
    });

    if (!targetMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    if (targetMember.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot remove the category owner' });
    }

    // Remove the member
    await prisma.categoryMember.delete({
      where: {
        categoryId_userId: {
          categoryId,
          userId,
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to remove member'
    });
  }
});

// PATCH /categories/:categoryId/members/:userId
router.patch(
  '/categories/:categoryId/members/:userId',
  authenticate,
  validate({ body: updateMemberSchema }),
  async (req, res) => {
    try {
      const { categoryId, userId } = req.params;
      const { role } = req.body;

      // Check if the current user has permission to update member roles
      const currentMember = await prisma.categoryMember.findFirst({
        where: {
          categoryId,
          userId: req.user.id,
        },
      });

      if (!currentMember || !['OWNER', 'ADMIN'].includes(currentMember.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to update member roles' });
      }

      // Check if the target member exists
      const targetMember = await prisma.categoryMember.findUnique({
        where: {
          categoryId_userId: {
            categoryId,
            userId,
          },
        },
      });

      if (!targetMember) {
        return res.status(404).json({ error: 'Member not found' });
      }

      // Prevent owners from being demoted by non-owners
      if (targetMember.role === 'OWNER' && currentMember.role !== 'OWNER') {
        return res.status(403).json({ error: 'Only owners can modify owner roles' });
      }

      // Update the member's role
      const updatedMember = await prisma.categoryMember.update({
        where: {
          categoryId_userId: {
            categoryId,
            userId,
          },
        },
        data: {
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      });

      res.json({ data: updatedMember });
    } catch (error) {
      console.error('Error updating member role:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to update member role'
      });
    }
  }
);

export default router; 