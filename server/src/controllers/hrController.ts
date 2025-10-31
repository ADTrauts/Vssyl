/**
 * HR MODULE CONTROLLERS
 * 
 * FRAMEWORK IMPLEMENTATION - Returns stub data
 * Actual feature logic will be implemented later
 */

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

// ============================================================================
// ADMIN CONTROLLERS (Business Admin Dashboard)
// ============================================================================

/**
 * Get all employees (Admin view)
 * Framework: Returns basic employee list
 */
export const getAdminEmployees = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }
    
    const status = (req.query.status as string) || 'ACTIVE';
    const q = (req.query.q as string) || '';
    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));
    const skip = (page - 1) * pageSize;
    
    if (status === 'TERMINATED') {
      // Build where clause
      const where: Record<string, unknown> = {
        businessId,
        employmentStatus: 'TERMINATED'
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [hrProfiles, totalCount] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).employeeHRProfile.findMany({
          where,
          include: {
            employeePosition: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                },
                position: { include: { department: true, tier: true } }
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take: pageSize
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).employeeHRProfile.count({ where })
      ]);

      return res.json({ 
        employees: hrProfiles,
        count: totalCount,
        page,
        pageSize,
        tier: req.hrTier,
        features: req.hrFeatures
      });
    }

    // ACTIVE employees
    const where: Record<string, unknown> = {
      businessId,
      active: true
    };
    
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { position: { title: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [employees, totalCount] = await Promise.all([
      prisma.employeePosition.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          position: { include: { department: true, tier: true } },
          hrProfile: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.employeePosition.count({ where })
    ]);

    return res.json({ 
      employees,
      count: totalCount,
      page,
      pageSize,
      tier: req.hrTier,
      features: req.hrFeatures
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch employees';
    res.status(500).json({ error: errorMessage });
  }
};

/**
 * Get single employee details
 * Framework: Returns employee with HR profile
 */
export const getAdminEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const businessId = req.query.businessId as string;
    
    const employee = await prisma.employeePosition.findFirst({
      where: {
        id,
        businessId,
        active: true
      },
      include: {
        user: true,
        position: {
          include: {
            department: true,
            tier: true
          }
        }
      ,hrProfile: true
      }
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({ employee });
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

/**
 * Create new employee
 * Framework: Stub - returns success message
 */
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const { employeePositionId, hireDate, employeeType, workLocation, emergencyContact, personalInfo } = req.body as {
      employeePositionId: string;
      hireDate?: string;
      employeeType?: string;
      workLocation?: string;
      emergencyContact?: unknown;
      personalInfo?: unknown;
    };

    const position = await prisma.employeePosition.findFirst({
      where: { id: employeePositionId, businessId }
    });
    if (!position) {
      return res.status(400).json({ error: 'Invalid employeePositionId for this business' });
    }

    // Create HR profile if not exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hrProfile = await (prisma as any).employeeHRProfile.upsert({
      where: { employeePositionId },
      create: {
        employeePositionId,
        businessId,
        hireDate: hireDate ? new Date(hireDate) : undefined,
        employmentStatus: 'ACTIVE',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeType: employeeType as any,
        workLocation,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emergencyContact: emergencyContact as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        personalInfo: personalInfo as any
      },
      update: {
        hireDate: hireDate ? new Date(hireDate) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeType: employeeType as any,
        workLocation,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emergencyContact: emergencyContact as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        personalInfo: personalInfo as any,
        employmentStatus: 'ACTIVE'
      }
    });

    // Ensure position is active
    await prisma.employeePosition.update({
      where: { id: employeePositionId },
      data: {
        active: true,
        startDate: hireDate ? new Date(hireDate) : new Date(),
        endDate: null
      }
    });

    return res.json({ message: 'Employee profile created', hrProfile });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
};

/**
 * Update employee
 * Framework: Stub - returns success message
 */
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const { id } = req.params; // employeePositionId
    const { hireDate, employeeType, workLocation, emergencyContact, personalInfo } = req.body as {
      hireDate?: string;
      employeeType?: string;
      workLocation?: string;
      emergencyContact?: unknown;
      personalInfo?: unknown;
    };

    const position = await prisma.employeePosition.findFirst({ where: { id, businessId } });
    if (!position) {
      return res.status(404).json({ error: 'Employee position not found' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma as any).employeeHRProfile.update({
      where: { employeePositionId: id },
      data: {
        hireDate: hireDate ? new Date(hireDate) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        employeeType: employeeType as any,
        workLocation,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        emergencyContact: emergencyContact as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        personalInfo: personalInfo as any
      }
    });

    return res.json({ message: 'Employee profile updated', hrProfile: updated });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

/**
 * Delete employee (soft delete)
 * Framework: Stub - returns success message
 */
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const { id } = req.params; // employeePositionId
    const position = await prisma.employeePosition.findFirst({ where: { id, businessId } });
    if (!position) {
      return res.status(404).json({ error: 'Employee position not found' });
    }

    // Soft delete HR profile (retain data for audit)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).employeeHRProfile.update({
      where: { employeePositionId: id },
      data: {
        deletedAt: new Date(),
        deletedBy: req.user?.id || null,
        deletedReason: 'admin_deleted'
      }
    });

    return res.json({ message: 'Employee HR profile soft-deleted' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

/**
 * Terminate employee (archive record and vacate position)
 */
export const terminateEmployee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // employeePositionId
    const businessId = req.query.businessId as string;
    const { date, reason, notes } = req.body as { date?: string; reason?: string; notes?: unknown };
    const terminationDate = date ? new Date(date) : new Date();

    const employeePosition = await prisma.employeePosition.findFirst({
      where: { id, businessId, active: true },
      include: { hrProfile: true }
    });

    if (!employeePosition) {
      return res.status(404).json({ error: 'Active employee position not found' });
    }

    // Ensure HR profile exists
    const hrProfile = employeePosition.hrProfile
      ? employeePosition.hrProfile
      : await prisma.employeeHRProfile.create({
          data: {
            employeePositionId: employeePosition.id,
            businessId,
            hireDate: undefined
          }
        });

    // Update HR profile status to TERMINATED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).employeeHRProfile.update({
      where: { id: hrProfile.id },
      data: {
        employmentStatus: 'TERMINATED',
        terminationDate,
        terminationReason: reason || null,
        terminatedBy: req.user?.id || null,
        terminationNotes: notes ? (notes as unknown as any) : undefined
      }
    });

    // Vacate position: deactivate assignment and set end date
    await prisma.employeePosition.update({
      where: { id: employeePosition.id },
      data: {
        active: false,
        endDate: terminationDate
      }
    });

    return res.json({
      message: 'Employee terminated; position vacated',
      employeePositionId: employeePosition.id,
      terminationDate,
      positionVacant: true
    });
  } catch (error) {
    console.error('Error terminating employee:', error);
    return res.status(500).json({ error: 'Failed to terminate employee' });
  }
};

/**
 * Get HR settings for business
 * Framework: Returns default settings or stored settings
 */
export const getHRSettings = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    
    // TODO: Enable after migration
    // const settings = await prisma.hRModuleSettings.findUnique({
    //   where: { businessId }
    // });
    const settings = null;
    
    res.json({ 
      settings: settings || {
        message: 'No custom settings configured',
        defaults: {
          timeOffSettings: { defaultPTODays: 15 },
          workWeekSettings: { daysPerWeek: 5, hoursPerDay: 8 }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching HR settings:', error);
    res.status(500).json({ error: 'Failed to fetch HR settings' });
  }
};

/**
 * Update HR settings
 * Framework: Stub - returns success message
 */
export const updateHRSettings = async (req: Request, res: Response) => {
  try {
    // TODO: Implement HR settings update
    res.json({ 
      message: 'HR settings update - framework stub',
      note: 'Feature implementation pending'
    });
  } catch (error) {
    console.error('Error updating HR settings:', error);
    res.status(500).json({ error: 'Failed to update HR settings' });
  }
};

// ============================================================================
// MANAGER CONTROLLERS (Team Management)
// ============================================================================

/**
 * Get team employees (Manager view)
 * Framework: Returns employees that report to this manager
 */
export const getTeamEmployees = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const businessId = req.query.businessId as string;
    
    // Get manager's position
    const managerPosition = await prisma.employeePosition.findFirst({
      where: {
        userId: user!.id,
        businessId,
        active: true
      },
      include: {
        position: {
          include: {
            directReports: true
          }
        }
      }
    });
    
    if (!managerPosition) {
      return res.json({ employees: [], count: 0 });
    }

    // Direct reports = positions where reportsToId equals manager's positionId
    const directReportPositions = await prisma.position.findMany({
      where: { businessId, reportsToId: managerPosition.positionId }
    });
    const reportPositionIds = directReportPositions.map((p) => p.id);

    const teamEmployees = await prisma.employeePosition.findMany({
      where: {
        businessId,
        active: true,
        positionId: { in: reportPositionIds }
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        position: { include: { department: true, tier: true } },
        hrProfile: true
      }
    });
    
    res.json({ 
      employees: teamEmployees,
      count: teamEmployees.length
    });
  } catch (error) {
    console.error('Error fetching team employees:', error);
    res.status(500).json({ error: 'Failed to fetch team employees' });
  }
};

// ============================================================================
// EMPLOYEE CONTROLLERS (Self-Service)
// ============================================================================

/**
 * Get own HR data
 * Framework: Returns employee's own HR profile
 */
export const getOwnHRData = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const businessId = req.query.businessId as string;
    
    const employeePosition = await prisma.employeePosition.findFirst({
      where: {
        userId: user!.id,
        businessId,
        active: true
      },
      include: {
        position: {
          include: {
            department: true,
            tier: true
          }
        }
        // hrProfile will be included after migration
      }
    });
    
    if (!employeePosition) {
      return res.status(404).json({ error: 'Employee data not found' });
    }
    
    res.json({ employee: employeePosition });
  } catch (error) {
    console.error('Error fetching own HR data:', error);
    res.status(500).json({ error: 'Failed to fetch your HR data' });
  }
};

/**
 * Update own HR data (limited fields)
 * Framework: Stub - returns success message
 */
export const updateOwnHRData = async (req: Request, res: Response) => {
  try {
    // TODO: Implement employee self-update (emergency contact, etc.)
    res.json({ 
      message: 'Self-service update - framework stub',
      note: 'Feature implementation pending'
    });
  } catch (error) {
    console.error('Error updating own HR data:', error);
    res.status(500).json({ error: 'Failed to update your HR data' });
  }
};

// ============================================================================
// AI CONTEXT PROVIDERS (Required for AI integration)
// ============================================================================

/**
 * Get HR overview context for AI
 * Framework: Returns basic HR statistics
 */
export const getHROverviewContext = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    
    const employeeCount = await prisma.employeePosition.count({
      where: { businessId, active: true }
    });
    
    // TODO: Enable after migration
    // const hrProfileCount = await prisma.employeeHRProfile.count({
    //   where: { businessId, deletedAt: null }
    // });
    const hrProfileCount = 0;
    
    res.json({
      businessId,
      totalEmployees: employeeCount,
      hrProfilesCreated: hrProfileCount,
      modules: {
        employees: true,
        attendance: req.hrFeatures?.attendance || false,
        payroll: req.hrFeatures?.payroll || false
      },
      tier: req.hrTier
    });
  } catch (error) {
    console.error('Error fetching HR overview:', error);
    res.status(500).json({ error: 'Failed to fetch HR overview' });
  }
};

/**
 * Get headcount context for AI
 * Framework: Returns employee counts
 */
export const getHeadcountContext = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    
    // TODO: Add department and position breakdowns
    const totalCount = await prisma.employeePosition.count({
      where: { businessId, active: true }
    });
    
    res.json({
      total: totalCount,
      note: 'Detailed breakdown coming in feature implementation'
    });
  } catch (error) {
    console.error('Error fetching headcount:', error);
    res.status(500).json({ error: 'Failed to fetch headcount' });
  }
};

/**
 * Get time-off context for AI
 * Framework: Stub - will return time-off data when feature is implemented
 */
export const getTimeOffContext = async (req: Request, res: Response) => {
  try {
    // TODO: Implement when time-off feature is added
    res.json({
      message: 'Time-off feature not yet implemented',
      outToday: [],
      outThisWeek: []
    });
  } catch (error) {
    console.error('Error fetching time-off context:', error);
    res.status(500).json({ error: 'Failed to fetch time-off data' });
  }
};

// ============================================================================
// TIME-OFF IMPLEMENTATION (Phase 3)
// ==========================================================================

export const requestTimeOff = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessId = req.query.businessId as string;
    const { type, startDate, endDate, reason } = req.body as { type: string; startDate: string; endDate: string; reason?: string };

    // Find the employee's active position in this business
    const employeePosition = await prisma.employeePosition.findFirst({
      where: { userId: user.id, businessId, active: true }
    });
    if (!employeePosition) {
      return res.status(400).json({ error: 'No active employee position found for user' });
    }

    // Create the time-off request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const request = await (prisma as any).timeOffRequest.create({
      data: {
        businessId,
        employeePositionId: employeePosition.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: type as any,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason: reason || null,
        status: 'PENDING',
        requestedById: user.id
      }
    });

    return res.json({ message: 'Time-off request submitted', request });
  } catch (error) {
    console.error('Error creating time-off request:', error);
    return res.status(500).json({ error: 'Failed to submit time-off request' });
  }
};

export const getPendingTeamTimeOff = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessId = req.query.businessId as string;

    // Determine manager's position
    const managerPosition = await prisma.employeePosition.findFirst({ where: { userId: user.id, businessId, active: true } });
    if (!managerPosition) return res.json({ requests: [] });

    // Direct reports positions
    const directReportPositions = await prisma.position.findMany({ where: { businessId, reportsToId: managerPosition.positionId } });
    const reportPositionIds = directReportPositions.map((p) => p.id);

    // Pending requests for those positions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requests = await (prisma as any).timeOffRequest.findMany({
      where: { businessId, status: 'PENDING', employeePosition: { positionId: { in: reportPositionIds } } },
      include: {
        employeePosition: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            position: { include: { department: true, tier: true } }
          }
        }
      },
      orderBy: { requestedAt: 'desc' }
    });

    return res.json({ requests });
  } catch (error) {
    console.error('Error fetching pending time-off:', error);
    return res.status(500).json({ error: 'Failed to fetch pending time-off' });
  }
};

export const approveTeamTimeOff = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessId = req.query.businessId as string;
    const { id } = req.params; // timeOffRequestId
    const { decision, note } = req.body as { decision: 'APPROVE' | 'DENY'; note?: string };

    // Load request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tor = await (prisma as any).timeOffRequest.findFirst({ where: { id, businessId } });
    if (!tor) return res.status(404).json({ error: 'Request not found' });

    // Confirm manager has authority (direct reports of this manager)
    const managerPosition = await prisma.employeePosition.findFirst({ where: { userId: user.id, businessId, active: true } });
    if (!managerPosition) return res.status(403).json({ error: 'Not a manager in this business' });
    const directReportPositions = await prisma.position.findMany({ where: { businessId, reportsToId: managerPosition.positionId } });
    const reportPositionIds = directReportPositions.map((p) => p.id);
    const targetEP = await prisma.employeePosition.findFirst({ where: { id: tor.employeePositionId, businessId }, select: { positionId: true } });
    if (!targetEP || !reportPositionIds.includes(targetEP.positionId)) {
      return res.status(403).json({ error: 'Not authorized to approve this request' });
    }

    // Update status
    const status = decision === 'APPROVE' ? 'APPROVED' : 'DENIED';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).timeOffRequest.update({
      where: { id },
      data: { status, approvedById: user.id, approvedAt: new Date(), managerNote: note || null }
    });

    return res.json({ message: `Request ${status.toLowerCase()}` });
  } catch (error) {
    console.error('Error approving time-off:', error);
    return res.status(500).json({ error: 'Failed to process approval' });
  }
};

export const getTimeOffBalance = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessId = req.query.businessId as string;

    // Very basic stub: compute approved days (PTO) this year and show a static allotment
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ep = await prisma.employeePosition.findFirst({ where: { userId: user.id, businessId, active: true } });
    if (!ep) return res.json({ balance: { pto: 0, sick: 0, personal: 0 } });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approved = await (prisma as any).timeOffRequest.findMany({
      where: { businessId, employeePositionId: ep.id, status: 'APPROVED', startDate: { gte: startOfYear } }
    });
    const usedDays = approved.reduce((acc: number, r: any) => {
      const one = 24 * 60 * 60 * 1000;
      const days = Math.max(1, Math.round((new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / one) + 1);
      return acc + days;
    }, 0);
    const allotment = 15; // default PTO days
    const remaining = Math.max(0, allotment - usedDays);

    return res.json({ balance: { pto: remaining, sick: 10, personal: 5 }, used: { pto: usedDays } });
  } catch (error) {
    console.error('Error fetching time-off balance:', error);
    return res.status(500).json({ error: 'Failed to fetch time-off balance' });
  }
};

export const getMyTimeOffRequests = async (req: Request, res: Response) => {
  try {
    const user = req.user!;
    const businessId = req.query.businessId as string;
    const page = Number(req.query.page || 1);
    const pageSize = Math.min(100, Number(req.query.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const employeePosition = await prisma.employeePosition.findFirst({ where: { userId: user.id, businessId } });
    if (!employeePosition) return res.json({ requests: [], count: 0, page, pageSize });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requests = await (prisma as any).timeOffRequest.findMany({
      where: { businessId, employeePositionId: employeePosition.id },
      orderBy: { requestedAt: 'desc' },
      skip,
      take: pageSize
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total = await (prisma as any).timeOffRequest.count({ where: { businessId, employeePositionId: employeePosition.id } });

    return res.json({ requests, count: total, page, pageSize });
  } catch (error) {
    console.error('Error fetching my time-off requests:', error);
    return res.status(500).json({ error: 'Failed to fetch your time-off requests' });
  }
};

// ============================================================================
// CSV IMPORT/EXPORT CONTROLLERS
// ============================================================================

/**
 * Import employees from CSV
 * Expects CSV file with columns: name, email, title, department, managerEmail, employeeType, hireDate, workLocation
 */
export const importEmployeesCSV = async (req: Request & { file?: Express.Multer.File }, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    const userId = req.user?.id;
    
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }
    
    // Parse CSV content
    const csvContent = req.file.buffer?.toString('utf-8') || 
                      (typeof req.file === 'string' ? require('fs').readFileSync(req.file, 'utf-8') : '');
    
    const lines = csvContent.split('\n').filter((line: string) => line.trim());
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV must have at least a header row and one data row' });
    }
    
    // Parse header
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    const requiredFields = ['name', 'email'];
    const missingFields = requiredFields.filter((field: string) => !headers.includes(field));
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `Missing required columns: ${missingFields.join(', ')}` 
      });
    }
    
    // Get default tier for positions
    const defaultTier = await prisma.organizationalTier.findFirst({
      where: { businessId },
      orderBy: { level: 'asc' }
    });
    
    if (!defaultTier) {
      return res.status(400).json({ error: 'Business must have at least one organizational tier' });
    }
    
    // Parse data rows
    const results: Array<{
      row: number;
      success: boolean;
      email: string;
      name: string;
      error?: string;
      action?: 'created' | 'updated' | 'skipped';
    }> = [];
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    // Generate random password for imported users
    const bcrypt = require('bcrypt');
    const generateRandomPassword = () => {
      return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    };
    
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const values = row.split(',').map((v: string) => v.trim());
      
      if (values.length !== headers.length) {
        results.push({
          row: i + 1,
          success: false,
          email: values[headers.indexOf('email')] || 'unknown',
          name: values[headers.indexOf('name')] || 'unknown',
          error: 'Column count mismatch'
        });
        skipped++;
        continue;
      }
      
      const rowData: Record<string, string> = {};
      headers.forEach((header: string, index: number) => {
        rowData[header] = values[index] || '';
      });
      
      const email = rowData.email;
      const name = rowData.name;
      
      if (!email || !name) {
        results.push({
          row: i + 1,
          success: false,
          email: email || 'unknown',
          name: name || 'unknown',
          error: 'Missing required fields (name or email)'
        });
        skipped++;
        continue;
      }
      
      try {
        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Generate temporary password for imported users
          const tempPassword = generateRandomPassword();
          const hashedPassword = await bcrypt.hash(tempPassword, 10);
          
          user = await prisma.user.create({
            data: {
              email,
              name,
              password: hashedPassword,
              emailVerified: null
            }
          });
        } else if (user.name !== name) {
          // Update name if different
          user = await prisma.user.update({
            where: { id: user.id },
            data: { name }
          });
        }
        
        // Find or create position
        // For import, we'll need department and position title
        const title = rowData.title || 'Employee';
        const departmentName = rowData.department || 'General';
        
        // Find or create department
        let department = await prisma.department.findFirst({
          where: {
            businessId,
            name: { equals: departmentName, mode: 'insensitive' }
          }
        });
        
        if (!department) {
          department = await prisma.department.create({
            data: {
              businessId,
              name: departmentName
            }
          });
        }
        
        // Find or create position (requires tierId)
        let position = await prisma.position.findFirst({
          where: {
            businessId,
            departmentId: department.id,
            title: { equals: title, mode: 'insensitive' }
          }
        });
        
        if (!position) {
          position = await prisma.position.create({
            data: {
              businessId,
              departmentId: department.id,
              tierId: defaultTier.id,
              title
            }
          });
        }
        
        // Find or create employee position
        const hireDate = rowData.hiredate ? new Date(rowData.hiredate) : new Date();
        const existingPosition = await prisma.employeePosition.findFirst({
          where: {
            businessId,
            userId: user.id,
            positionId: position.id,
            active: true
          }
        });
        
        let action: 'created' | 'updated' = 'created';
        const assignedById = userId || user.id; // Use importing user or employee user as fallback
        
        if (existingPosition) {
          // Update existing
          await prisma.employeePosition.update({
            where: { id: existingPosition.id },
            data: {
              startDate: hireDate,
              active: true,
              endDate: null
            }
          });
          action = 'updated';
          updated++;
        } else {
          // Create new (requires assignedById)
          await prisma.employeePosition.create({
            data: {
              businessId,
              userId: user.id,
              positionId: position.id,
              assignedById,
              startDate: hireDate,
              active: true
            }
          });
          created++;
        }
        
        // Create or update HR profile
        const employeePosition = await prisma.employeePosition.findFirst({
          where: {
            businessId,
            userId: user.id,
            positionId: position.id
          }
        });
        
        if (employeePosition) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma as any).employeeHRProfile.upsert({
            where: { employeePositionId: employeePosition.id },
            create: {
              employeePositionId: employeePosition.id,
              businessId,
              hireDate,
              employeeType: rowData.employeetype?.toUpperCase() || 'FULL_TIME',
              workLocation: rowData.worklocation || null,
              employmentStatus: 'ACTIVE'
            },
            update: {
              hireDate,
              employeeType: rowData.employeetype?.toUpperCase() || undefined,
              workLocation: rowData.worklocation || undefined,
              employmentStatus: 'ACTIVE'
            }
          });
        }
        
        results.push({
          row: i + 1,
          success: true,
          email,
          name,
          action
        });
      } catch (error) {
        results.push({
          row: i + 1,
          success: false,
          email,
          name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        skipped++;
      }
    }
    
    return res.json({
      success: true,
      summary: {
        total: lines.length - 1,
        created,
        updated,
        skipped,
        errors: skipped
      },
      results
    });
  } catch (error) {
    console.error('Error importing employees:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to import employees' 
    });
  }
};

/**
 * Export employees to CSV
 * Supports filtering via query params (same as getAdminEmployees)
 */
export const exportEmployeesCSV = async (req: Request, res: Response) => {
  try {
    const businessId = req.query.businessId as string;
    if (!businessId) {
      return res.status(400).json({ error: 'businessId is required' });
    }
    
    const status = (req.query.status as string) || 'ACTIVE';
    const q = (req.query.q as string) || '';
    
    // Build where clause (same logic as getAdminEmployees)
    let employees: Array<{
      name: string;
      email: string;
      title: string;
      department: string;
      tier: string;
      hireDate: string | null;
      employeeType: string | null;
      workLocation: string | null;
    }> = [];
    
    if (status === 'TERMINATED') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hrProfiles = await (prisma as any).employeeHRProfile.findMany({
        where: {
          businessId,
          employmentStatus: 'TERMINATED'
        },
        include: {
          employeePosition: {
            include: {
              user: true,
              position: {
                include: {
                  department: true,
                  tier: true
                }
              }
            }
          }
        }
      });
      
      employees = hrProfiles.map((profile: any) => ({
        name: profile.employeePosition?.user?.name || '',
        email: profile.employeePosition?.user?.email || '',
        title: profile.employeePosition?.position?.title || '',
        department: profile.employeePosition?.position?.department?.name || '',
        tier: profile.employeePosition?.position?.tier?.name || '',
        hireDate: profile.hireDate ? new Date(profile.hireDate).toISOString().split('T')[0] : null,
        employeeType: profile.employeeType || null,
        workLocation: profile.workLocation || null
      }));
    } else {
      const where: Record<string, unknown> = {
        businessId,
        active: true
      };
      
      if (q) {
        where.OR = [
          { user: { name: { contains: q, mode: 'insensitive' } } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { position: { title: { contains: q, mode: 'insensitive' } } }
        ];
      }
      
      const employeePositions = await prisma.employeePosition.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          position: { include: { department: true, tier: true } },
          hrProfile: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      employees = employeePositions.map(ep => ({
        name: ep.user?.name || '',
        email: ep.user?.email || '',
        title: ep.position?.title || '',
        department: ep.position?.department?.name || '',
        tier: ep.position?.tier?.name || '',
        hireDate: (ep.hrProfile as any)?.hireDate 
          ? new Date((ep.hrProfile as any).hireDate).toISOString().split('T')[0] 
          : null,
        employeeType: (ep.hrProfile as any)?.employeeType || null,
        workLocation: (ep.hrProfile as any)?.workLocation || null
      }));
    }
    
    // Generate CSV
    const headers = ['Name', 'Email', 'Title', 'Department', 'Tier', 'Hire Date', 'Employee Type', 'Work Location'];
    const csvRows = [
      headers.join(','),
      ...employees.map(emp => [
        `"${emp.name}"`,
        `"${emp.email}"`,
        `"${emp.title}"`,
        `"${emp.department}"`,
        `"${emp.tier}"`,
        emp.hireDate || '',
        emp.employeeType || '',
        emp.workLocation || ''
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="employees-${status.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting employees:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to export employees' 
    });
  }
};

