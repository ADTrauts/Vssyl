import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAuditLogsForAlice() {
  try {
    console.log('🌱 Seeding audit logs for Alice...');

    // Get Alice's user account
    const user = await prisma.user.findUnique({
      where: { email: 'alice@example.com' }
    });
    
    if (!user) {
      console.log('❌ Alice user not found. Please create the user first.');
      return;
    }

    // Sample audit log actions
    const auditActions = [
      {
        action: 'FILE_UPLOADED',
        resourceType: 'FILE',
        resourceId: 'file-1',
        details: { fileName: 'document.pdf', fileSize: 1024000, fileType: 'pdf' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'FILE_DOWNLOADED',
        resourceType: 'FILE',
        resourceId: 'file-2',
        details: { fileName: 'presentation.pptx', fileSize: 2048000, fileType: 'pptx' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'MESSAGE_CREATED',
        resourceType: 'CONVERSATION',
        resourceId: 'conv-1',
        details: { message: 'Hello team!', conversationName: 'Project Discussion' },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'DASHBOARD_ACCESSED',
        resourceType: 'DASHBOARD',
        resourceId: 'dashboard-1',
        details: { dashboardName: 'Analytics Overview', widgetCount: 5 },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'MODULE_INSTALLED',
        resourceType: 'MODULE',
        resourceId: 'module-1',
        details: { moduleName: 'Calendar', moduleVersion: '1.0.0', category: 'Productivity' },
        ipAddress: '192.168.1.103',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'FILE_ACCESSED',
        resourceType: 'FILE',
        resourceId: 'file-3',
        details: { fileName: 'budget.xlsx', fileSize: 512000, fileType: 'xlsx' },
        ipAddress: '192.168.1.104',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'MESSAGE_DELETED',
        resourceType: 'CONVERSATION',
        resourceId: 'conv-2',
        details: { message: 'Old message', conversationName: 'Team Chat' },
        ipAddress: '192.168.1.105',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        action: 'DASHBOARD_CREATED',
        resourceType: 'DASHBOARD',
        resourceId: 'dashboard-2',
        details: { dashboardName: 'Project Tracker', widgetCount: 3 },
        ipAddress: '192.168.1.106',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    ];

    // Create audit logs with different timestamps (spread over the last 30 days)
    const auditLogs = [];
    for (let i = 0; i < auditActions.length; i++) {
      const action = auditActions[i];
      const daysAgo = Math.floor(Math.random() * 30); // Random day in last 30 days
      const hoursAgo = Math.floor(Math.random() * 24); // Random hour
      const minutesAgo = Math.floor(Math.random() * 60); // Random minute
      
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);

      auditLogs.push({
        action: action.action,
        userId: user.id,
        resourceType: action.resourceType,
        resourceId: action.resourceId,
        details: JSON.stringify(action.details),
        timestamp: timestamp,
        ipAddress: action.ipAddress,
        userAgent: action.userAgent
      });
    }

    // Insert audit logs
    await prisma.auditLog.createMany({
      data: auditLogs
    });

    console.log(`✅ Created ${auditLogs.length} audit logs for user: ${user.email}`);
    console.log('📊 Audit logs include:');
    console.log('   - File uploads/downloads/access');
    console.log('   - Message creation/deletion');
    console.log('   - Dashboard access/creation');
    console.log('   - Module installation');
    console.log('   - Various IP addresses and timestamps');

  } catch (error) {
    console.error('❌ Error seeding audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAuditLogsForAlice(); 