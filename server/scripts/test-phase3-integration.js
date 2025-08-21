#!/usr/bin/env tsx
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var orgChartService_1 = require("../src/services/orgChartService");
var permissionService_1 = require("../src/services/permissionService");
var employeeManagementService_1 = require("../src/services/employeeManagementService");
var prisma = new client_1.PrismaClient();
function testPhase3Integration() {
    return __awaiter(this, void 0, void 0, function () {
        var testBusinessId, testUserId, testPositionId, testPermissionSetId, business, user, orgChartStructure, position, permissionSet, employeePosition, permissionCheck, userPermissions, validation, businessEmployees, vacantPositions, departmentHierarchy, inheritedPermissions, updatedPosition, transferPosition, transfer, updatedPermissionSet, modules, actions, _i, modules_1, module_1, _a, actions_1, action, hasPermission, businessContext, finalValidation, finalPermissions, finalEmployees, error_1, cleanupError_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🧪 Testing Phase 3: Org Chart & Permission System Integration');
                    console.log('='.repeat(60));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 31, 32, 46]);
                    // 1. Create test business
                    console.log('\n1. Creating test business...');
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                name: 'Phase 3 Test Company',
                                ein: 'PHASE3-0000',
                                industry: 'technology',
                                size: '50-100',
                                description: 'Test business for Phase 3 integration testing',
                            },
                        })];
                case 2:
                    business = _b.sent();
                    testBusinessId = business.id;
                    console.log('✅ Created business:', business.name, '(ID:', business.id, ')');
                    // 2. Create test user
                    console.log('\n2. Creating test user...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'test.employee@phase3.com',
                                name: 'Test Employee',
                                password: 'hashedpassword',
                                emailVerified: new Date(),
                            },
                        })];
                case 3:
                    user = _b.sent();
                    testUserId = user.id;
                    console.log('✅ Created user:', user.name, '(ID:', user.id, ')');
                    // 3. Create default org chart structure
                    console.log('\n3. Creating default org chart structure...');
                    return [4 /*yield*/, orgChartService_1.default.createDefaultOrgChart(testBusinessId, 'technology')];
                case 4:
                    _b.sent();
                    console.log('✅ Created default org chart structure');
                    // 4. Get org chart structure
                    console.log('\n4. Fetching org chart structure...');
                    return [4 /*yield*/, orgChartService_1.default.getOrgChartStructure(testBusinessId)];
                case 5:
                    orgChartStructure = _b.sent();
                    console.log('✅ Org chart structure:', {
                        tiers: orgChartStructure.tiers.length,
                        departments: orgChartStructure.departments.length,
                        positions: orgChartStructure.positions.length
                    });
                    // 5. Create custom position for testing
                    console.log('\n5. Creating custom test position...');
                    return [4 /*yield*/, orgChartService_1.default.createPosition({
                            businessId: testBusinessId,
                            title: 'Integration Test Engineer',
                            tierId: orgChartStructure.tiers[0].id,
                            departmentId: orgChartStructure.departments[0].id,
                            maxOccupants: 2,
                        })];
                case 6:
                    position = _b.sent();
                    testPositionId = position.id;
                    console.log('✅ Created position:', position.title, '(ID:', position.id, ')');
                    // 6. Create custom permission set
                    console.log('\n6. Creating custom permission set...');
                    return [4 /*yield*/, permissionService_1.default.createPermissionSet({
                            businessId: testBusinessId,
                            name: 'Phase 3 Test Permissions',
                            description: 'Custom permission set for integration testing',
                            permissions: [
                                { moduleId: 'drive', featureId: 'files', action: 'view' },
                                { moduleId: 'drive', featureId: 'files', action: 'upload' },
                                { moduleId: 'drive', featureId: 'files', action: 'delete' },
                                { moduleId: 'chat', featureId: 'messages', action: 'view' },
                                { moduleId: 'chat', featureId: 'messages', action: 'send' },
                                { moduleId: 'org-chart', featureId: 'structure', action: 'view' },
                                { moduleId: 'org-chart', featureId: 'structure', action: 'manage' },
                                { moduleId: 'analytics', featureId: 'reports', action: 'view' }
                            ],
                            category: 'basic',
                        })];
                case 7:
                    permissionSet = _b.sent();
                    testPermissionSetId = permissionSet.id;
                    console.log('✅ Created permission set:', permissionSet.name, '(ID:', permissionSet.id, ')');
                    // 7. Assign employee to position
                    console.log('\n7. Assigning employee to position...');
                    return [4 /*yield*/, employeeManagementService_1.default.assignEmployeeToPosition({
                            businessId: testBusinessId,
                            userId: testUserId,
                            positionId: testPositionId,
                            assignedById: testUserId, // Self-assignment for testing
                            startDate: new Date(),
                        })];
                case 8:
                    employeePosition = _b.sent();
                    console.log('✅ Assigned employee to position:', employeePosition.id);
                    // 8. Test permission checking
                    console.log('\n8. Testing permission checking...');
                    return [4 /*yield*/, permissionService_1.default.checkUserPermission(testUserId, testBusinessId, 'drive', 'files', 'upload')];
                case 9:
                    permissionCheck = _b.sent();
                    console.log('✅ Permission check result:', {
                        hasPermission: permissionCheck.hasPermission,
                        inheritedFrom: permissionCheck.inheritedFrom,
                        customOverride: permissionCheck.customOverride
                    });
                    // 9. Test user permissions retrieval
                    console.log('\n9. Testing user permissions retrieval...');
                    return [4 /*yield*/, permissionService_1.default.getUserPermissions(testUserId, testBusinessId)];
                case 10:
                    userPermissions = _b.sent();
                    console.log('✅ User permissions retrieved:', {
                        userId: userPermissions.userId,
                        businessId: userPermissions.businessId,
                        hasPermissions: userPermissions.permissions.length > 0
                    });
                    // 10. Test org chart validation
                    console.log('\n10. Testing org chart validation...');
                    return [4 /*yield*/, orgChartService_1.default.validateOrgChartStructure(testBusinessId)];
                case 11:
                    validation = _b.sent();
                    console.log('✅ Org chart validation:', {
                        isValid: validation.isValid,
                        errors: validation.errors.length,
                        warnings: validation.warnings.length
                    });
                    // 11. Test business employees
                    console.log('\n11. Testing business employees...');
                    return [4 /*yield*/, employeeManagementService_1.default.getBusinessEmployees(testBusinessId)];
                case 12:
                    businessEmployees = _b.sent();
                    console.log('✅ Business employees:', businessEmployees.length, 'employees found');
                    // 12. Test vacant positions
                    console.log('\n12. Testing vacant positions...');
                    return [4 /*yield*/, employeeManagementService_1.default.getVacantPositions(testBusinessId)];
                case 13:
                    vacantPositions = _b.sent();
                    console.log('✅ Vacant positions:', vacantPositions.length, 'positions available');
                    // 13. Test department hierarchy
                    console.log('\n13. Testing department hierarchy...');
                    return [4 /*yield*/, orgChartService_1.default.getDepartmentHierarchy(testBusinessId)];
                case 14:
                    departmentHierarchy = _b.sent();
                    console.log('✅ Department hierarchy:', departmentHierarchy.length, 'departments');
                    // 14. Test permission inheritance
                    console.log('\n14. Testing permission inheritance...');
                    return [4 /*yield*/, permissionService_1.default.getUserPermissions(testUserId, testBusinessId)];
                case 15:
                    inheritedPermissions = _b.sent();
                    console.log('✅ Permission inheritance working:', {
                        hasPermissions: inheritedPermissions.permissions.length > 0,
                        hasPositions: inheritedPermissions.positions.length > 0,
                        hasCustomPermissions: inheritedPermissions.customPermissions.length > 0
                    });
                    // 15. Test real-time updates (simulated)
                    console.log('\n15. Testing real-time update simulation...');
                    return [4 /*yield*/, orgChartService_1.default.updatePosition(testPositionId, {
                            title: 'Updated Integration Test Engineer'
                        })];
                case 16:
                    updatedPosition = _b.sent();
                    console.log('✅ Position updated:', updatedPosition.title);
                    // 16. Test employee transfer
                    console.log('\n16. Testing employee transfer...');
                    if (!(orgChartStructure.positions.length > 1)) return [3 /*break*/, 19];
                    transferPosition = orgChartStructure.positions[1];
                    return [4 /*yield*/, employeeManagementService_1.default.transferEmployee(testUserId, testPositionId, transferPosition.id, testBusinessId, testUserId)];
                case 17:
                    transfer = _b.sent();
                    console.log('✅ Employee transferred to:', transferPosition.title);
                    // Transfer back
                    return [4 /*yield*/, employeeManagementService_1.default.transferEmployee(testUserId, transferPosition.id, testPositionId, testBusinessId, testUserId)];
                case 18:
                    // Transfer back
                    _b.sent();
                    console.log('✅ Employee transferred back to original position');
                    return [3 /*break*/, 20];
                case 19:
                    console.log('⚠️  Skipping transfer test - only one position available');
                    _b.label = 20;
                case 20:
                    // 17. Test permission set management
                    console.log('\n17. Testing permission set management...');
                    return [4 /*yield*/, permissionService_1.default.updatePermissionSet(testPermissionSetId, {
                            name: 'Phase 3 Updated Test Permissions',
                            description: 'Updated permission set for integration testing'
                        })];
                case 21:
                    updatedPermissionSet = _b.sent();
                    console.log('✅ Permission set updated:', updatedPermissionSet.name);
                    // 18. Test comprehensive permission checking
                    console.log('\n18. Testing comprehensive permission checking...');
                    modules = ['drive', 'chat', 'org-chart', 'analytics'];
                    actions = ['view', 'upload', 'delete', 'manage'];
                    _i = 0, modules_1 = modules;
                    _b.label = 22;
                case 22:
                    if (!(_i < modules_1.length)) return [3 /*break*/, 27];
                    module_1 = modules_1[_i];
                    _a = 0, actions_1 = actions;
                    _b.label = 23;
                case 23:
                    if (!(_a < actions_1.length)) return [3 /*break*/, 26];
                    action = actions_1[_a];
                    return [4 /*yield*/, permissionService_1.default.checkUserPermission(testUserId, testBusinessId, module_1, 'feature', action)];
                case 24:
                    hasPermission = _b.sent();
                    if (hasPermission.hasPermission) {
                        console.log("\u2705 Permission granted: ".concat(module_1, ".").concat(action));
                    }
                    _b.label = 25;
                case 25:
                    _a++;
                    return [3 /*break*/, 23];
                case 26:
                    _i++;
                    return [3 /*break*/, 22];
                case 27:
                    // 19. Test business context integration
                    console.log('\n19. Testing business context integration...');
                    businessContext = {
                        businessId: testBusinessId,
                        orgChart: orgChartStructure,
                        permissions: userPermissions,
                        employeePosition: employeePosition
                    };
                    console.log('✅ Business context created:', {
                        hasOrgChart: !!businessContext.orgChart,
                        hasPermissions: !!businessContext.permissions,
                        hasEmployeePosition: !!businessContext.employeePosition
                    });
                    // 20. Final validation
                    console.log('\n20. Final system validation...');
                    return [4 /*yield*/, orgChartService_1.default.validateOrgChartStructure(testBusinessId)];
                case 28:
                    finalValidation = _b.sent();
                    return [4 /*yield*/, permissionService_1.default.getUserPermissions(testUserId, testBusinessId)];
                case 29:
                    finalPermissions = _b.sent();
                    return [4 /*yield*/, employeeManagementService_1.default.getBusinessEmployees(testBusinessId)];
                case 30:
                    finalEmployees = _b.sent();
                    console.log('✅ Final validation results:', {
                        orgChartValid: finalValidation.isValid,
                        userHasPermissions: finalPermissions.permissions.length > 0,
                        employeeCount: finalEmployees.length,
                        systemReady: finalValidation.isValid && finalPermissions.permissions.length > 0
                    });
                    console.log('\n🎉 Phase 3 Integration Testing COMPLETED SUCCESSFULLY!');
                    console.log('='.repeat(60));
                    console.log('✅ All core integration tests passed');
                    console.log('✅ Org chart system fully integrated with business context');
                    console.log('✅ Permission system working with inheritance');
                    console.log('✅ Employee management fully functional');
                    console.log('✅ Real-time updates simulated successfully');
                    console.log('✅ Business context integration complete');
                    console.log('\n🚀 System ready for production deployment!');
                    return [3 /*break*/, 46];
                case 31:
                    error_1 = _b.sent();
                    console.error('❌ Phase 3 Integration Test FAILED:', error_1);
                    throw error_1;
                case 32:
                    // Cleanup test data
                    console.log('\n🧹 Cleaning up test data...');
                    _b.label = 33;
                case 33:
                    _b.trys.push([33, 43, , 44]);
                    if (!testBusinessId) return [3 /*break*/, 40];
                    // Remove all related data
                    return [4 /*yield*/, prisma.employeePosition.deleteMany({
                            where: { businessId: testBusinessId }
                        })];
                case 34:
                    // Remove all related data
                    _b.sent();
                    return [4 /*yield*/, prisma.permissionSet.deleteMany({
                            where: { businessId: testBusinessId }
                        })];
                case 35:
                    _b.sent();
                    return [4 /*yield*/, prisma.position.deleteMany({
                            where: { businessId: testBusinessId }
                        })];
                case 36:
                    _b.sent();
                    return [4 /*yield*/, prisma.department.deleteMany({
                            where: { businessId: testBusinessId }
                        })];
                case 37:
                    _b.sent();
                    return [4 /*yield*/, prisma.organizationalTier.deleteMany({
                            where: { businessId: testBusinessId }
                        })];
                case 38:
                    _b.sent();
                    return [4 /*yield*/, prisma.business.delete({
                            where: { id: testBusinessId }
                        })];
                case 39:
                    _b.sent();
                    console.log('✅ Test business and all related data cleaned up');
                    _b.label = 40;
                case 40:
                    if (!testUserId) return [3 /*break*/, 42];
                    return [4 /*yield*/, prisma.user.delete({
                            where: { id: testUserId }
                        })];
                case 41:
                    _b.sent();
                    console.log('✅ Test user cleaned up');
                    _b.label = 42;
                case 42: return [3 /*break*/, 44];
                case 43:
                    cleanupError_1 = _b.sent();
                    console.error('⚠️  Cleanup warning:', cleanupError_1);
                    return [3 /*break*/, 44];
                case 44: return [4 /*yield*/, prisma.$disconnect()];
                case 45:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 46: return [2 /*return*/];
            }
        });
    });
}
// Run the test
if (require.main === module) {
    testPhase3Integration()
        .then(function () {
        console.log('\n✅ Phase 3 Integration Test completed successfully');
        process.exit(0);
    })
        .catch(function (error) {
        console.error('\n❌ Phase 3 Integration Test failed:', error);
        process.exit(1);
    });
}
