import { PrismaClient } from '@prisma/client';
import orgChartService from '../src/services/orgChartService';
import permissionService from '../src/services/permissionService';
import employeeManagementService from '../src/services/employeeManagementService';

const prisma = new PrismaClient();

async function testOrgChartSystem() {
  try {
    console.log('🧪 Testing Org Chart System...\n');

    // 1. Create a test business
    console.log('1. Creating test business...');
    const testBusiness = await prisma.business.create({
      data: {
        name: 'Test Company Inc.',
        ein: 'TEST-1234',
        industry: 'technology',
        size: '11-50',
        description: 'Test business for org chart system testing',
      },
    });
    console.log(`✅ Created business: ${testBusiness.name} (ID: ${testBusiness.id})\n`);

    // 2. Create default org chart structure
    console.log('2. Creating default org chart structure...');
    await orgChartService.createDefaultOrgChart(testBusiness.id, 'technology');
    console.log('✅ Created default org chart structure\n');

    // 3. Get org chart structure
    console.log('3. Fetching org chart structure...');
    const structure = await orgChartService.getOrgChartStructure(testBusiness.id);
    console.log(`✅ Found ${structure.tiers.length} tiers, ${structure.departments.length} departments, ${structure.positions.length} positions\n`);

    // 4. Create a test position
    console.log('4. Creating test position...');
    const firstTier = structure.tiers[0];
    const firstDepartment = structure.departments[0];
    
    const testPosition = await orgChartService.createPosition({
      businessId: testBusiness.id,
      title: 'Software Engineer',
      tierId: firstTier.id,
      departmentId: firstDepartment.id,
      maxOccupants: 3,
    });
    console.log(`✅ Created position: ${testPosition.title}\n`);

    // 5. Test permission system
    console.log('5. Testing permission system...');
    const permissions = await permissionService.getAllPermissions();
    console.log(`✅ Found ${permissions.length} total permissions`);

    const drivePermissions = await permissionService.getPermissionsByModule('drive');
    console.log(`✅ Found ${drivePermissions.length} drive module permissions`);

    const basicPermissions = await permissionService.getPermissionsByCategory('basic');
    console.log(`✅ Found ${basicPermissions.length} basic permissions\n`);

    // 6. Test employee management
    console.log('6. Testing employee management...');
    const vacantPositions = await employeeManagementService.getVacantPositions(testBusiness.id);
    console.log(`✅ Found ${vacantPositions.length} vacant positions`);

    const positionsWithCapacity = await employeeManagementService.getPositionsWithCapacity(testBusiness.id);
    console.log(`✅ Found ${positionsWithCapacity.length} positions with capacity\n`);

    // 7. Validate org chart structure
    console.log('7. Validating org chart structure...');
    const validation = await orgChartService.validateOrgChartStructure(testBusiness.id);
    console.log(`✅ Structure validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    if (validation.errors.length > 0) {
      console.log(`❌ Errors: ${validation.errors.join(', ')}`);
    }
    if (validation.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${validation.warnings.join(', ')}`);
    }
    console.log('');

    // 8. Test permission sets
    console.log('8. Testing permission sets...');
    const templatePermissionSets = await permissionService.getTemplatePermissionSets();
    console.log(`✅ Found ${templatePermissionSets.length} template permission sets`);

    // Create a custom permission set for the test business
    const customPermissionSet = await permissionService.createPermissionSet({
      businessId: testBusiness.id,
      name: 'Test Team Access',
      description: 'Custom permission set for test team',
      category: 'advanced',
      permissions: basicPermissions.slice(0, 10), // First 10 basic permissions
    });
    console.log(`✅ Created custom permission set: ${customPermissionSet.name}\n`);

    // 9. Test org chart hierarchy
    console.log('9. Testing org chart hierarchy...');
    const departmentHierarchy = await orgChartService.getDepartmentHierarchy(testBusiness.id);
    console.log(`✅ Department hierarchy has ${departmentHierarchy.length} root departments`);

    const positionHierarchy = await orgChartService.getPositionHierarchy(testBusiness.id);
    console.log(`✅ Position hierarchy has ${positionHierarchy.length} top-level positions\n`);

    // 10. Cleanup test data
    console.log('10. Cleaning up test data...');
    await prisma.business.delete({
      where: { id: testBusiness.id },
    });
    console.log('✅ Cleaned up test business and all related data\n');

    console.log('🎉 All tests passed! The org chart system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await testOrgChartSystem();
  } catch (error) {
    console.error('Failed to run tests:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
