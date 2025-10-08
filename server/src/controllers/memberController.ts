import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendBusinessInvitationEmail } from '../services/emailService';
import { NotificationService } from '../services/notificationService';
import { prisma } from '../lib/prisma';

// Helper function to get organization info from memberships
const getOrganizationInfo = (user: any) => {
  // Check for business membership first
  if (user.businesses && user.businesses.length > 0) {
    const businessMembership = user.businesses[0];
    return {
      id: businessMembership.business.id,
      name: businessMembership.business.name,
      type: 'business' as const,
      role: businessMembership.role,
    };
  }
  
  // Check for institution membership
  if (user.institutionMembers && user.institutionMembers.length > 0) {
    const institutionMembership = user.institutionMembers[0];
    return {
      id: institutionMembership.institution.id,
      name: institutionMembership.institution.name,
      type: 'institution' as const,
      role: institutionMembership.role,
    };
  }
  
  return null;
};

// Validation schemas
const searchUsersSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

const sendConnectionRequestSchema = z.object({
  receiverId: z.string().uuid(),
  message: z.string().max(500).optional(),
});

const updateConnectionRequestSchema = z.object({
  relationshipId: z.string().uuid(),
  action: z.enum(['accept', 'decline', 'block']),
});

const inviteEmployeeSchema = z.object({
  email: z.string().email(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional().default('EMPLOYEE'),
  title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

const updateEmployeeRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
  title: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  canInvite: z.boolean().optional(),
  canManage: z.boolean().optional(),
  canBilling: z.boolean().optional(),
});

const bulkRemoveConnectionsSchema = z.object({
  relationshipIds: z.array(z.string().uuid()).min(1).max(100),
});

const bulkUpdateConnectionRequestsSchema = z.object({
  requestIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['accept', 'decline', 'block']),
});

// Business Member Bulk Operation Schemas
const bulkInviteEmployeesSchema = z.object({
  invitations: z.array(z.object({
    email: z.string().email(),
    role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']).optional().default('EMPLOYEE'),
    title: z.string().max(100).optional(),
    department: z.string().max(100).optional(),
    message: z.string().max(500).optional(),
  })).min(1).max(50), // Limit to 50 invitations at once
});

const bulkUpdateEmployeeRolesSchema = z.object({
  updates: z.array(z.object({
    memberId: z.string().uuid(),
    role: z.enum(['EMPLOYEE', 'MANAGER', 'ADMIN']),
    title: z.string().max(100).optional(),
    department: z.string().max(100).optional(),
    canInvite: z.boolean().optional(),
    canManage: z.boolean().optional(),
    canBilling: z.boolean().optional(),
  })).min(1).max(100), // Limit to 100 updates at once
});

const bulkRemoveEmployeesSchema = z.object({
  memberIds: z.array(z.string().uuid()).min(1).max(100), // Limit to 100 removals at once
});

// Personal Connection APIs

export const searchUsers = async (req: Request, res: Response) => {
  try {
    console.log('searchUsers called with query:', req.query);
    const { query, limit, offset } = searchUsersSchema.parse(req.query);
    const currentUserId = req.user?.id;

    console.log('Current user ID:', currentUserId);

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Remove the test response so the real search logic executes
    // console.log('Authentication successful, returning test response');
    // return res.json({ 
    //   users: [
    //     {
    //       id: 'test-user-1',
    //       name: 'Test User 1',
    //       email: 'test1@example.com',
    //       createdAt: new Date().toISOString(),
    //       connectionStatus: 'none',
    //       relationshipId: null,
    //       organization: null,
    //     }
    //   ] 
    // });

    console.log('Searching for users with query:', query);
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
        NOT: { id: currentUserId }, // Exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        businesses: {
          select: {
            business: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
          },
        },
        institutionMembers: {
          select: {
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
          },
        },
      },
      take: limit,
      skip: offset,
    });

    console.log('Found users:', users.length);

    // Get relationships separately to avoid TypeScript issues
    console.log('Fetching relationships for user:', currentUserId);
    
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
    });

    console.log('Found relationships:', relationships.length);



    // Process users to include connection status and organization info
    const processedUsers = users.map(user => {
      const sentRelationship = relationships.find(r => r.senderId === user.id && r.receiverId === currentUserId);
      const receivedRelationship = relationships.find(r => r.receiverId === user.id && r.senderId === currentUserId);
      
      let connectionStatus = 'none';
      let relationshipId = null;
      
      if (sentRelationship) {
        connectionStatus = sentRelationship.status.toLowerCase();
        relationshipId = sentRelationship.id;
      } else if (receivedRelationship) {
        connectionStatus = receivedRelationship.status.toLowerCase();
        relationshipId = receivedRelationship.id;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        connectionStatus,
        relationshipId,
        organization: getOrganizationInfo(user),
      };
    });

    res.json({ users: processedUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: 'Internal server error', message: error.message, stack: error.stack });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const sendConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { receiverId, message } = sendConnectionRequestSchema.parse(req.body);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (currentUserId === receiverId) {
      return res.status(400).json({ error: 'Cannot send connection request to yourself' });
    }

    // Check if relationship already exists
    const existingRelationship = await prisma.relationship.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId },
          { senderId: receiverId, receiverId: currentUserId },
        ],
      },
    });

    if (existingRelationship) {
      return res.status(400).json({ error: 'Connection request already exists' });
    }

    // Check if users are in the same organization (for colleague connections)
    const currentUserOrgs = await prisma.businessMember.findMany({
      where: { userId: currentUserId },
      select: { businessId: true },
    });

    const receiverOrgs = await prisma.businessMember.findMany({
      where: { userId: receiverId },
      select: { businessId: true },
    });

    const sharedOrg = currentUserOrgs.find(org => 
      receiverOrgs.some(receiverOrg => receiverOrg.businessId === org.businessId)
    );

    const relationship = await prisma.relationship.create({
      data: {
        senderId: currentUserId,
        receiverId,
        message,
        type: sharedOrg ? 'COLLEAGUE' : 'REGULAR',
        organizationId: sharedOrg?.businessId || null,
      },
      include: {
        sender: { select: { name: true, email: true, userNumber: true } },
        receiver: { select: { name: true, email: true } },
      },
    });

    // Create notification for the receiver with Block ID
    try {
      await NotificationService.handleNotification({
        type: 'member_request',
        title: 'New Connection Request',
        body: `${relationship.sender.name} wants to connect with you`,
        data: {
          relationshipId: relationship.id,
          senderId: currentUserId,
          senderName: relationship.sender.name,
          senderBlockId: relationship.sender.userNumber,
          message: message || null,
          type: relationship.type,
          organizationId: sharedOrg?.businessId || null
        },
        recipients: [receiverId],
        senderId: currentUserId
      });
    } catch (notificationError) {
      console.error('Error creating connection request notification:', notificationError);
      // Don't fail the connection request if notification fails
    }

    res.json({ relationship });
  } catch (error) {
    console.error('Error sending connection request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { relationshipId, action } = updateConnectionRequestSchema.parse(req.body);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
      },
    });

    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    // Ensure current user is the receiver of the request
    if (relationship.receiverId !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }

    let status: 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
    switch (action) {
      case 'accept':
        status = 'ACCEPTED';
        break;
      case 'decline':
        status = 'DECLINED';
        break;
      case 'block':
        status = 'BLOCKED';
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const updatedRelationship = await prisma.relationship.update({
      where: { id: relationshipId },
      data: { status },
      include: {
        sender: { select: { name: true, email: true } },
        receiver: { select: { name: true, email: true } },
      },
    });

    res.json({ relationship: updatedRelationship });
  } catch (error) {
    console.error('Error updating connection request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConnections = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const { type, limit, offset } = req.query;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const whereClause: any = {
      OR: [
        { senderId: currentUserId },
        { receiverId: currentUserId },
      ],
      status: 'ACCEPTED',
    };

    if (type === 'colleague') {
      whereClause.type = 'COLLEAGUE';
    } else if (type === 'regular') {
      whereClause.type = 'REGULAR';
    }

    const relationships = await prisma.relationship.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            businesses: {
              select: {
                business: { select: { id: true, name: true } },
                role: true,
              },
            },
            institutionMembers: {
              select: {
                institution: { select: { id: true, name: true } },
                role: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            businesses: {
              select: {
                business: { select: { id: true, name: true } },
                role: true,
              },
            },
            institutionMembers: {
              select: {
                institution: { select: { id: true, name: true } },
                role: true,
              },
            },
          },
        },
      },
      take: Number(limit) || 20,
      skip: Number(offset) || 0,
      orderBy: { updatedAt: 'desc' },
    });

    const connections = relationships.map(rel => {
      const otherUser = rel.senderId === currentUserId ? rel.receiver : rel.sender;

      return {
        id: rel.id,
        user: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          organization: getOrganizationInfo(otherUser),
        },
        type: rel.type,
        organizationId: rel.organizationId,
        createdAt: rel.createdAt,
      };
    });

    res.json({ connections });
  } catch (error) {
    console.error('Error getting connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingRequests = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const pendingRequests = await prisma.relationship.findMany({
      where: {
        receiverId: currentUserId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            businesses: {
              select: {
                business: { select: { id: true, name: true } },
                role: true,
              },
            },
            institutionMembers: {
              select: {
                institution: { select: { id: true, name: true } },
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const requests = pendingRequests.map(rel => {
      return {
        id: rel.id,
        sender: {
          id: rel.sender.id,
          name: rel.sender.name,
          email: rel.sender.email,
          organization: getOrganizationInfo(rel.sender),
        },
        type: rel.type,
        message: rel.message,
        organizationId: rel.organizationId,
        createdAt: rel.createdAt,
      };
    });

    res.json({ requests });
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSentRequests = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sentRequests = await prisma.relationship.findMany({
      where: {
        senderId: currentUserId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            businesses: {
              select: {
                business: { select: { id: true, name: true } },
                role: true,
              },
            },
            institutionMembers: {
              select: {
                institution: { select: { id: true, name: true } },
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const requests = sentRequests.map(rel => {
      return {
        id: rel.id,
        receiver: {
          id: rel.receiver.id,
          name: rel.receiver.name,
          email: rel.receiver.email,
          organization: getOrganizationInfo(rel.receiver),
        },
        type: rel.type,
        message: rel.message,
        organizationId: rel.organizationId,
        createdAt: rel.createdAt,
      };
    });

    res.json({ requests });
  } catch (error) {
    console.error('Error getting sent requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Business Employee Management APIs

export const inviteEmployee = async (req: Request, res: Response) => {
  try {
    const { email, role, title, department, message } = inviteEmployeeSchema.parse(req.body);
    const businessId = req.params.businessId;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has permission to invite employees
    const currentUserMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: currentUserId } },
    });

    if (!currentUserMember || !currentUserMember.canInvite) {
      return res.status(403).json({ error: 'Not authorized to invite employees' });
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: existingUser.id } },
      });

      if (existingMember) {
        return res.status(400).json({ error: 'User is already a member of this business' });
      }
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.businessInvitation.findFirst({
      where: { businessId, email },
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Invitation already sent to this email' });
    }

    // Create invitation
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.businessInvitation.create({
      data: {
        businessId,
        email,
        role,
        title,
        department,
        invitedById: currentUserId,
        token,
        expiresAt,
      },
      include: {
        business: { select: { name: true } },
        invitedBy: { select: { name: true } },
      },
    });

    // Send email invitation
    try {
      await sendBusinessInvitationEmail(
        invitation.email,
        invitation.business.name,
        invitation.invitedBy.name || 'A team member',
        invitation.role,
        invitation.title,
        invitation.department,
        invitation.token,
        message
      );
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({ invitation });
  } catch (error) {
    console.error('Error inviting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBusinessMembers = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is a member of the business
    const currentUserMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: currentUserId } },
    });

    if (!currentUserMember) {
      return res.status(403).json({ error: 'Not a member of this business' });
    }

    const members = await prisma.businessMember.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Get connection status for each member
    const membersWithConnections = await Promise.all(
      members.map(async (member) => {
        const relationship = await prisma.relationship.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: member.userId },
              { senderId: member.userId, receiverId: currentUserId },
            ],
          },
        });

        return {
          ...member,
          connectionStatus: relationship ? relationship.status.toLowerCase() : 'none',
          relationshipId: relationship?.id || null,
        };
      })
    );

    res.json({ members: membersWithConnections });
  } catch (error) {
    console.error('Error getting business members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEmployeeRole = async (req: Request, res: Response) => {
  try {
    const { memberId, role, title, department, canInvite, canManage, canBilling } = updateEmployeeRoleSchema.parse(req.body);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the member to update
    const member = await prisma.businessMember.findUnique({
      where: { id: memberId },
      include: { business: true },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Check if current user has permission to manage this member
    const currentUserMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: member.businessId, userId: currentUserId } },
    });

    if (!currentUserMember || !currentUserMember.canManage) {
      return res.status(403).json({ error: 'Not authorized to manage members' });
    }

    // Build update data object
    const updateData: any = { role, title, department };
    if (typeof canInvite === 'boolean') updateData.canInvite = canInvite;
    if (typeof canManage === 'boolean') updateData.canManage = canManage;
    if (typeof canBilling === 'boolean') updateData.canBilling = canBilling;

    // Update member role and permissions
    const updatedMember = await prisma.businessMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
        job: { select: { title: true, department: { select: { name: true } } } },
      },
    });

    res.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating employee role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeEmployee = async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the member to remove
    const member = await prisma.businessMember.findUnique({
      where: { id: memberId },
      include: { business: true, user: { select: { name: true } } },
    });

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Check if current user has permission to remove members
    const currentUserMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: member.businessId, userId: currentUserId } },
    });

    if (!currentUserMember || !currentUserMember.canManage) {
      return res.status(403).json({ error: 'Not authorized to remove members' });
    }

    // Prevent removing yourself
    if (member.userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot remove yourself from the business' });
    }

    // Soft delete by setting leftAt
    const updatedMember = await prisma.businessMember.update({
      where: { id: memberId },
      data: { leftAt: new Date(), isActive: false },
      include: { user: { select: { name: true } } },
    });

    res.json({ message: 'Employee removed successfully', member: updatedMember });
  } catch (error) {
    console.error('Error removing employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBusinessInvitations = async (req: Request, res: Response) => {
  try {
    const businessId = req.params.businessId;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has permission to view invitations
    const currentUserMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: currentUserId } },
    });

    if (!currentUserMember || !currentUserMember.canInvite) {
      return res.status(403).json({ error: 'Not authorized to view invitations' });
    }

    const invitations = await prisma.businessInvitation.findMany({
      where: { businessId },
      include: {
        invitedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ invitations });
  } catch (error) {
    console.error('Error getting business invitations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invitation = await prisma.businessInvitation.findUnique({
      where: { id: invitationId },
      include: { 
        business: true,
        invitedBy: { select: { name: true } }
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check if user has permission to resend invitations
    const currentUserMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: invitation.businessId, userId: currentUserId } },
    });

    if (!currentUserMember || !currentUserMember.canInvite) {
      return res.status(403).json({ error: 'Not authorized to resend invitations' });
    }

    // Check if invitation is still valid
    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Resend email invitation
    try {
      await sendBusinessInvitationEmail(
        invitation.email,
        invitation.business.name,
        invitation.invitedBy.name || 'A team member',
        invitation.role,
        invitation.title,
        invitation.department,
        invitation.token
      );
    } catch (emailError) {
      console.error('Error resending invitation email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    res.json({ message: 'Invitation resent successfully', invitation });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const cancelInvitation = async (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invitation = await prisma.businessInvitation.findUnique({
      where: { id: invitationId },
      include: { business: true },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Check if user has permission to cancel invitations
    const currentUserMember = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: invitation.businessId, userId: currentUserId } },
    });

    if (!currentUserMember || !currentUserMember.canInvite) {
      return res.status(403).json({ error: 'Not authorized to cancel invitations' });
    }

    await prisma.businessInvitation.delete({
      where: { id: invitationId },
    });

    res.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeConnection = async (req: Request, res: Response) => {
  try {
    const { relationshipId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the relationship and ensure the user is a participant
    const relationship = await prisma.relationship.findUnique({
      where: { id: relationshipId },
    });

    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }

    if (relationship.senderId !== currentUserId && relationship.receiverId !== currentUserId) {
      return res.status(403).json({ error: 'Not authorized to remove this connection' });
    }

    await prisma.relationship.delete({ where: { id: relationshipId } });
    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk Operations APIs

export const bulkRemoveConnections = async (req: Request, res: Response) => {
  try {
    const { relationshipIds } = bulkRemoveConnectionsSchema.parse(req.body);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = [];

    for (const relationshipId of relationshipIds) {
      try {
        // Find the relationship and verify ownership
        const relationship = await prisma.relationship.findFirst({
          where: {
            id: relationshipId,
            OR: [
              { senderId: currentUserId },
              { receiverId: currentUserId },
            ],
            status: 'ACCEPTED',
          },
        });

        if (!relationship) {
          results.push({ id: relationshipId, success: false, error: 'Connection not found' });
          continue;
        }

        // Delete the relationship
        await prisma.relationship.delete({
          where: { id: relationshipId },
        });

        results.push({ id: relationshipId, success: true });
      } catch (error) {
        console.error(`Error removing connection ${relationshipId}:`, error);
        results.push({ id: relationshipId, success: false, error: 'Internal error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      message: `Successfully removed ${successCount} connection${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk remove connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkUpdateConnectionRequests = async (req: Request, res: Response) => {
  try {
    const { requestIds, action } = bulkUpdateConnectionRequestsSchema.parse(req.body);
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = [];

    for (const requestId of requestIds) {
      try {
        // Find the relationship and verify ownership
        const relationship = await prisma.relationship.findFirst({
          where: {
            id: requestId,
            receiverId: currentUserId,
            status: 'PENDING',
          },
        });

        if (!relationship) {
          results.push({ id: requestId, success: false, error: 'Request not found' });
          continue;
        }

        // Update the relationship status
        await prisma.relationship.update({
          where: { id: requestId },
          data: {
            status: action === 'accept' ? 'ACCEPTED' : action === 'decline' ? 'DECLINED' : 'BLOCKED',
          },
        });

        results.push({ id: requestId, success: true });
      } catch (error) {
        console.error(`Error updating request ${requestId}:`, error);
        results.push({ id: requestId, success: false, error: 'Internal error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const actionText = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'blocked';

    res.json({
      message: `Successfully ${actionText} ${successCount} request${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk update connection requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 

// Business Member Bulk Operations

export const bulkInviteEmployees = async (req: Request, res: Response) => {
  try {
    const { invitations } = bulkInviteEmployeesSchema.parse(req.body);
    const currentUserId = req.user?.id;
    const { businessId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has permission to invite to this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: currentUserId,
        isActive: true,
        canInvite: true
      }
    });

    if (!userMembership) {
      return res.status(403).json({ error: 'Insufficient permissions to invite members' });
    }

    const results = [];

    for (const invitation of invitations) {
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: invitation.email }
        });

        // Check if user is already a member
        if (existingUser) {
          const existingMembership = await prisma.businessMember.findFirst({
            where: {
              businessId,
              userId: existingUser.id,
              isActive: true
            }
          });

          if (existingMembership) {
            results.push({ 
              email: invitation.email, 
              success: false, 
              error: 'User is already a member of this business' 
            });
            continue;
          }
        }

        // Check if invitation already exists
        const existingInvitation = await prisma.businessInvitation.findFirst({
          where: {
            businessId,
            email: invitation.email,
            acceptedAt: null
          }
        });

        if (existingInvitation) {
          results.push({ 
            email: invitation.email, 
            success: false, 
            error: 'Invitation already exists for this email' 
          });
          continue;
        }

        // Generate invitation token
        const token = require('crypto').randomBytes(32).toString('hex');
        
        // Get business name for email
        const business = await prisma.business.findUnique({
          where: { id: businessId },
          select: { name: true }
        });
        
        // Get inviter name
        const inviter = await prisma.user.findUnique({
          where: { id: currentUserId },
          select: { name: true }
        });

        // Create invitation
        const newInvitation = await prisma.businessInvitation.create({
          data: {
            businessId,
            email: invitation.email,
            role: invitation.role,
            title: invitation.title || null,
            department: invitation.department || null,
            invitedById: currentUserId,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          }
        });

        // Send invitation email
        try {
          await sendBusinessInvitationEmail(
            invitation.email,
            business?.name || 'Business',
            inviter?.name || 'Team Member',
            invitation.role,
            invitation.title || null,
            invitation.department || null,
            token,
            invitation.message
          );
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError);
          // Don't fail the entire operation if email fails
        }

        results.push({ 
          email: invitation.email, 
          success: true, 
          invitation: newInvitation 
        });
      } catch (error) {
        console.error(`Error inviting ${invitation.email}:`, error);
        results.push({ 
          email: invitation.email, 
          success: false, 
          error: 'Internal error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      message: `Successfully sent ${successCount} invitation${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk invite employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkUpdateEmployeeRoles = async (req: Request, res: Response) => {
  try {
    const { updates } = bulkUpdateEmployeeRolesSchema.parse(req.body);
    const currentUserId = req.user?.id;
    const { businessId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has permission to manage this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: currentUserId,
        isActive: true,
        canManage: true
      }
    });

    if (!userMembership) {
      return res.status(403).json({ error: 'Insufficient permissions to manage members' });
    }

    const results = [];

    for (const update of updates) {
      try {
        // Find the member and verify they belong to this business
        const member = await prisma.businessMember.findFirst({
          where: {
            id: update.memberId,
            businessId,
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
        });

        if (!member) {
          results.push({ 
            memberId: update.memberId, 
            success: false, 
            error: 'Member not found' 
          });
          continue;
        }

        // Prevent updating the last admin
        if (update.role !== 'ADMIN' && member.role === 'ADMIN') {
          const adminCount = await prisma.businessMember.count({
            where: {
              businessId,
              role: 'ADMIN',
              isActive: true
            }
          });

          if (adminCount <= 1) {
            results.push({ 
              memberId: update.memberId, 
              success: false, 
              error: 'Cannot remove the last admin' 
            });
            continue;
          }
        }

        // Update member
        const updatedMember = await prisma.businessMember.update({
          where: { id: update.memberId },
          data: {
            role: update.role,
            title: update.title || null,
            department: update.department || null,
            canInvite: update.canInvite,
            canManage: update.canManage,
            canBilling: update.canBilling,
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

        results.push({ 
          memberId: update.memberId, 
          success: true, 
          member: updatedMember 
        });
      } catch (error) {
        console.error(`Error updating member ${update.memberId}:`, error);
        results.push({ 
          memberId: update.memberId, 
          success: false, 
          error: 'Internal error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      message: `Successfully updated ${successCount} member${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk update employee roles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const bulkRemoveEmployees = async (req: Request, res: Response) => {
  try {
    const { memberIds } = bulkRemoveEmployeesSchema.parse(req.body);
    const currentUserId = req.user?.id;
    const { businessId } = req.params;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has permission to manage this business
    const userMembership = await prisma.businessMember.findFirst({
      where: {
        businessId,
        userId: currentUserId,
        isActive: true,
        canManage: true
      }
    });

    if (!userMembership) {
      return res.status(403).json({ error: 'Insufficient permissions to remove members' });
    }

    const results = [];

    for (const memberId of memberIds) {
      try {
        // Find the member and verify they belong to this business
        const member = await prisma.businessMember.findFirst({
          where: {
            id: memberId,
            businessId,
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
        });

        if (!member) {
          results.push({ 
            memberId, 
            success: false, 
            error: 'Member not found' 
          });
          continue;
        }

        // Prevent removing yourself
        if (member.user.id === currentUserId) {
          results.push({ 
            memberId, 
            success: false, 
            error: 'Cannot remove yourself' 
          });
          continue;
        }

        // Prevent removing the last admin
        if (member.role === 'ADMIN') {
          const adminCount = await prisma.businessMember.count({
            where: {
              businessId,
              role: 'ADMIN',
              isActive: true
            }
          });

          if (adminCount <= 1) {
            results.push({ 
              memberId, 
              success: false, 
              error: 'Cannot remove the last admin' 
            });
            continue;
          }
        }

        // Remove member (soft delete)
        await prisma.businessMember.update({
          where: { id: memberId },
          data: {
            isActive: false,
            leftAt: new Date()
          }
        });

        results.push({ 
          memberId, 
          success: true 
        });
      } catch (error) {
        console.error(`Error removing member ${memberId}:`, error);
        results.push({ 
          memberId, 
          success: false, 
          error: 'Internal error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.json({
      message: `Successfully removed ${successCount} member${successCount !== 1 ? 's' : ''}${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk remove employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 