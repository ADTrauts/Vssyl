import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { HouseholdRole, HouseholdType } from '@prisma/client';

/** Owner, Admin, and Adult (parent) can add/remove most household members; role edits are further restricted for Adults below. */
const HOUSEHOLD_ROSTER_MANAGER_ROLES: HouseholdRole[] = [
  HouseholdRole.OWNER,
  HouseholdRole.ADMIN,
  HouseholdRole.ADULT,
];

function isRosterManager(role: HouseholdRole | undefined): boolean {
  return role !== undefined && HOUSEHOLD_ROSTER_MANAGER_ROLES.includes(role);
}

function hasUserId(user: unknown): user is { id: string } {
  return typeof user === 'object' && user !== null && 'id' in user && typeof (user as Record<string, unknown>).id === 'string';
}

async function addHouseholdToPlace(userId: string, householdId: string, householdName: string): Promise<void> {
  try {
    const place = await prisma.place.findUnique({ where: { userId } });
    if (!place) return;

    await prisma.placeNode.upsert({
      where: {
        placeId_nodeType_entityId: {
          placeId: place.id,
          nodeType: 'HOUSEHOLD',
          entityId: householdId,
        },
      },
      update: { label: householdName },
      create: {
        placeId: place.id,
        nodeType: 'HOUSEHOLD',
        entityId: householdId,
        label: householdName,
      },
    });
  } catch (e) {
    console.error('Failed to add household to Place:', e);
  }
}

interface CreateHouseholdRequest {
  name: string;
  description?: string;
  type: HouseholdType;
  isPrimary?: boolean;
}

interface UpdateHouseholdRequest {
  name?: string;
  description?: string;
}

interface InviteMemberRequest {
  email: string;
  role: HouseholdRole;
  expiresAt?: string;
}

interface UpdateMemberRoleRequest {
  role: HouseholdRole;
  expiresAt?: string;
}

// Get all households for the current user
export async function getHouseholds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    
    const households = await prisma.household.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            isActive: true
          }
        }
      },
      include: {
        members: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            members: {
              where: {
                isActive: true
              }
            },
            dashboards: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    res.json({ households });
    return;
  } catch (err) {
    next(err);
  }
}

// Create a new household
export async function createHousehold(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const data: CreateHouseholdRequest = req.body;

    // Validate that user doesn't already have a primary household if creating one
    if (data.isPrimary) {
      const existingPrimary = await prisma.household.findFirst({
        where: {
          isPrimary: true,
          members: {
            some: {
              userId: userId,
              isActive: true
            }
          }
        }
      });

      if (existingPrimary) {
        res.status(400).json({ error: 'User already has a primary household' });
        return;
      }
    }

    const household = await prisma.household.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        isPrimary: data.isPrimary || false,
        members: {
          create: {
            userId: userId,
            role: HouseholdRole.OWNER,
            joinedAt: new Date()
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Auto-provision a shared Household calendar named after the tab (household name)
    try {
      const existingCal = await prisma.calendar.findFirst({
        where: { contextType: 'HOUSEHOLD' as any, contextId: household.id, isPrimary: true }
      });
      if (!existingCal) {
        await prisma.calendar.create({
          data: {
            name: data.name,
            contextType: 'HOUSEHOLD' as any,
            contextId: household.id,
            isPrimary: true,
            isSystem: false,
            isDeletable: true,
            defaultReminderMinutes: 10,
            members: {
              create: {
                userId,
                role: 'OWNER'
              }
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to auto-provision household calendar:', e);
    }

    await addHouseholdToPlace(userId, household.id, data.name);

    res.status(201).json({ household });
    return;
  } catch (err) {
    next(err);
  }
}

// Get a specific household
export async function getHouseholdById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const householdId = req.params.id;

    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
        members: {
          some: {
            userId: userId,
            isActive: true
          }
        }
      },
      include: {
        members: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: [
            { role: 'asc' },
            { joinedAt: 'asc' }
          ]
        },
        dashboards: {
          select: {
            id: true,
            name: true,
            createdAt: true
          }
        }
      }
    });

    if (!household) {
      res.sendStatus(404);
      return;
    }

    res.json({ household });
    return;
  } catch (err) {
    next(err);
  }
}

// Update a household
export async function updateHousehold(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const householdId = req.params.id;
    const data: UpdateHouseholdRequest = req.body;

    // Check if user has permission to update (OWNER or ADMIN)
    const userMembership = await prisma.householdMember.findFirst({
      where: {
        householdId: householdId,
        userId: userId,
        isActive: true,
        role: {
          in: [HouseholdRole.OWNER, HouseholdRole.ADMIN]
        }
      }
    });

    if (!userMembership) {
      res.status(403).json({ error: 'Insufficient permissions to update household' });
      return;
    }

    const household = await prisma.household.update({
      where: { id: householdId },
      data: {
        name: data.name,
        description: data.description,
        updatedAt: new Date()
      },
      include: {
        members: {
          where: {
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json({ household });
    return;
  } catch (err) {
    next(err);
  }
}

// Delete a household (only OWNER can delete)
export async function deleteHousehold(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const householdId = req.params.id;

    // Check if user is the household owner
    const ownerMembership = await prisma.householdMember.findFirst({
      where: {
        householdId: householdId,
        userId: userId,
        isActive: true,
        role: HouseholdRole.OWNER
      }
    });

    if (!ownerMembership) {
      res.status(403).json({ error: 'Only household owner can delete household' });
      return;
    }

    // Delete the household (cascade will handle members and dashboards)
    await prisma.household.delete({
      where: { id: householdId }
    });

    res.json({ deleted: true });
    return;
  } catch (err) {
    next(err);
  }
}

// Invite a member to the household
export async function inviteMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const householdId = req.params.id;
    const data: InviteMemberRequest = req.body;

    // Owner, Admin, or Adult (parent) may invite
    const userMembership = await prisma.householdMember.findFirst({
      where: {
        householdId: householdId,
        userId: userId,
        isActive: true,
        role: { in: HOUSEHOLD_ROSTER_MANAGER_ROLES },
      },
    });

    if (!userMembership || !isRosterManager(userMembership.role)) {
      res.status(403).json({ error: 'Insufficient permissions to invite members' });
      return;
    }

    if (userMembership.role === HouseholdRole.ADULT) {
      if (data.role === HouseholdRole.ADMIN || data.role === HouseholdRole.OWNER) {
        res.status(403).json({ error: 'Adults cannot assign admin or owner roles' });
        return;
      }
    }

    // Find the user to invite
    const inviteeUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (!inviteeUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if user is already a member
    const existingMembership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId: inviteeUser.id,
          householdId: householdId
        }
      }
    });

    if (existingMembership) {
      if (existingMembership.isActive) {
        res.status(400).json({ error: 'User is already a member of this household' });
        return;
      } else {
        // Reactivate the membership
        const member = await prisma.householdMember.update({
          where: { id: existingMembership.id },
          data: {
            isActive: true,
            role: data.role,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
            joinedAt: new Date()
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

        const household = await prisma.household.findUnique({ where: { id: householdId }, select: { name: true } });
        await addHouseholdToPlace(inviteeUser.id, householdId, household?.name || 'Home');

        res.status(201).json({ member });
        return;
      }
    }

    // Create new membership
    const member = await prisma.householdMember.create({
      data: {
        userId: inviteeUser.id,
        householdId: householdId,
        role: data.role,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const household = await prisma.household.findUnique({ where: { id: householdId }, select: { name: true } });
    await addHouseholdToPlace(inviteeUser.id, householdId, household?.name || 'Home');

    res.status(201).json({ member });
    return;
  } catch (err) {
    next(err);
  }
}

// Update a member's role
export async function updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const householdId = req.params.id;
    const targetUserId = req.params.userId;
    const data: UpdateMemberRoleRequest = req.body;

    const userMembership = await prisma.householdMember.findFirst({
      where: {
        householdId: householdId,
        userId: userId,
        isActive: true,
        role: { in: HOUSEHOLD_ROSTER_MANAGER_ROLES },
      },
    });

    if (!userMembership || !isRosterManager(userMembership.role)) {
      res.status(403).json({ error: 'Insufficient permissions to update member roles' });
      return;
    }

    const targetMembership = await prisma.householdMember.findFirst({
      where: {
        householdId: householdId,
        userId: targetUserId,
        isActive: true,
      },
    });

    if (!targetMembership) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    // Adults (non-owner/admin) may only change roles for teens, children, and guests — not owner/admin/other adults
    if (userMembership.role === HouseholdRole.ADULT) {
      const adultManagedRoles: HouseholdRole[] = [
        HouseholdRole.TEEN,
        HouseholdRole.CHILD,
        HouseholdRole.TEMPORARY_GUEST,
      ];
      if (!adultManagedRoles.includes(targetMembership.role)) {
        res.status(403).json({ error: 'Adults can only update roles for teens, children, and guests' });
        return;
      }
      if (data.role === HouseholdRole.OWNER || data.role === HouseholdRole.ADMIN) {
        res.status(403).json({ error: 'Insufficient permissions for this role assignment' });
        return;
      }
    }

    // Prevent non-owners from changing owner role or making someone else owner
    if (userMembership.role !== HouseholdRole.OWNER) {
      if (targetMembership.role === HouseholdRole.OWNER || data.role === HouseholdRole.OWNER) {
        res.status(403).json({ error: 'Only household owner can change owner role' });
        return;
      }
    }

    const member = await prisma.householdMember.update({
      where: {
        userId_householdId: {
          userId: targetUserId,
          householdId: householdId
        }
      },
      data: {
        role: data.role,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({ member });
    return;
  } catch (err) {
    next(err);
  }
}

// Remove a member from the household
export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!hasUserId(req.user)) {
      res.sendStatus(401);
      return;
    }
    const userId = req.user.id;
    const householdId = req.params.id;
    const targetUserId = req.params.userId;

    const userMembership = await prisma.householdMember.findFirst({
      where: {
        householdId: householdId,
        userId: userId,
        isActive: true,
        role: { in: HOUSEHOLD_ROSTER_MANAGER_ROLES },
      },
    });

    if (!userMembership || !isRosterManager(userMembership.role)) {
      res.status(403).json({ error: 'Insufficient permissions to remove members' });
      return;
    }

    if (targetUserId !== userId) {
      const targetMembership = await prisma.householdMember.findFirst({
        where: {
          householdId: householdId,
          userId: targetUserId,
          isActive: true,
        },
      });

      if (targetMembership?.role === HouseholdRole.OWNER) {
        res.status(403).json({ error: 'Cannot remove household owner' });
        return;
      }

      // Adult members cannot remove admins or other adults (only teens, children, guests)
      if (userMembership.role === HouseholdRole.ADULT) {
        const removableByAdult: HouseholdRole[] = [
          HouseholdRole.TEEN,
          HouseholdRole.CHILD,
          HouseholdRole.TEMPORARY_GUEST,
        ];
        if (!targetMembership || !removableByAdult.includes(targetMembership.role)) {
          res.status(403).json({ error: 'Adults can only remove teens, children, and guests from the household' });
          return;
        }
      }
    }

    // Deactivate the membership
    await prisma.householdMember.update({
      where: {
        userId_householdId: {
          userId: targetUserId,
          householdId: householdId
        }
      },
      data: {
        isActive: false
      }
    });

    res.json({ removed: true });
    return;
  } catch (err) {
    next(err);
  }
} 