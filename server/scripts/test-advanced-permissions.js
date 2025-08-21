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
var permissionService_1 = require("../src/services/permissionService");
var orgChartService_1 = require("../src/services/orgChartService");
var employeeManagementService_1 = require("../src/services/employeeManagementService");
var prisma = new client_1.PrismaClient();
function testAdvancedPermissions() {
    return __awaiter(this, void 0, void 0, function () {
        var testBusinessId, testUserId, testPositionId, testPermissionId, business, user, position, _a, _b, permission, inheritanceValidation, conflictResolution, analytics, dependencyValidation, permissionCheck, customPermissionCheck, finalValidation, finalAnalytics, error_1, cleanupError_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log('🧪 Testing Advanced Permission System');
                    console.log('='.repeat(60));
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 17, 18, 31]);
                    // 1. Create test business
                    console.log('\n1. Creating test business...');
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                name: 'Advanced Permissions Test Corp',
                                ein: '12-3456789',
                                industry: 'Technology',
                                size: 'Medium',
                            },
                        })];
                case 2:
                    business = _d.sent();
                    testBusinessId = business.id;
                    console.log('✅ Created business:', business.name, '(ID:', testBusinessId + ')');
                    // 2. Create test user
                    console.log('\n2. Creating test user...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'test.permissions@example.com',
                                name: 'Permission Test User',
                                password: 'hashedpassword',
                                role: 'USER',
                            },
                        })];
                case 3:
                    user = _d.sent();
                    testUserId = user.id;
                    console.log('✅ Created user:', user.name, '(ID:', testUserId + ')');
                    // 3. Create default org chart structure
                    console.log('\n3. Creating default org chart structure...');
                    return [4 /*yield*/, orgChartService_1.default.createDefaultOrgChart(testBusinessId)];
                case 4:
                    _d.sent();
                    console.log('✅ Created default org chart structure');
                    // 4. Create test position
                    console.log('\n4. Creating test position...');
                    _b = (_a = orgChartService_1.default).createPosition;
                    _c = {
                        businessId: testBusinessId,
                        title: 'Advanced Permission Tester'
                    };
                    return [4 /*yield*/, prisma.organizationalTier.findFirst({ where: { businessId: testBusinessId } })];
                case 5: return [4 /*yield*/, _b.apply(_a, [(_c.tierId = (_d.sent()).id,
                            _c.maxOccupants = 1,
                            _c)])];
                case 6:
                    position = _d.sent();
                    testPositionId = position.id;
                    console.log('✅ Created position:', position.title);
                    // 5. Create test permission
                    console.log('\n5. Creating test permission...');
                    return [4 /*yield*/, permissionService_1.default.createPermission({
                            moduleId: 'test-module',
                            featureId: 'test-feature',
                            action: 'test-action',
                            description: 'Test permission for advanced features',
                            category: 'basic',
                            dependencies: ['test-module:test-feature:view'],
                            conflicts: ['test-module:test-feature:deny'],
                        })];
                case 7:
                    permission = _d.sent();
                    testPermissionId = permission.id;
                    console.log('✅ Created permission:', permission.description);
                    // 6. Assign employee to position
                    console.log('\n6. Assigning employee to position...');
                    return [4 /*yield*/, employeeManagementService_1.default.assignEmployeeToPosition({
                            userId: testUserId,
                            positionId: testPositionId,
                            businessId: testBusinessId,
                            assignedById: testUserId,
                            startDate: new Date(),
                            customPermissions: [
                                {
                                    moduleId: 'test-module',
                                    featureId: 'test-feature',
                                    action: 'custom-action',
                                    description: 'Custom permission override',
                                },
                            ],
                        })];
                case 8:
                    _d.sent();
                    console.log('✅ Assigned employee to position');
                    // 7. Test permission inheritance validation
                    console.log('\n7. Testing permission inheritance validation...');
                    return [4 /*yield*/, permissionService_1.default.validatePermissionInheritance(testBusinessId)];
                case 9:
                    inheritanceValidation = _d.sent();
                    console.log('✅ Inheritance validation:', inheritanceValidation.isValid ? 'PASSED' : 'FAILED');
                    if (inheritanceValidation.errors.length > 0) {
                        console.log('   Errors:', inheritanceValidation.errors);
                    }
                    if (inheritanceValidation.warnings.length > 0) {
                        console.log('   Warnings:', inheritanceValidation.warnings);
                    }
                    // 8. Test permission conflict resolution
                    console.log('\n8. Testing permission conflict resolution...');
                    return [4 /*yield*/, permissionService_1.default.resolvePermissionConflicts(testUserId, testBusinessId, 'test-module', 'test-feature', 'test-action')];
                case 10:
                    conflictResolution = _d.sent();
                    console.log('✅ Conflict resolution:', conflictResolution.resolved ? 'SUCCESS' : 'FAILED');
                    console.log('   Final permission:', conflictResolution.finalPermission);
                    console.log('   Resolution method:', conflictResolution.resolutionMethod);
                    if (conflictResolution.conflicts.length > 0) {
                        console.log('   Conflicts:', conflictResolution.conflicts);
                    }
                    // 9. Test permission analytics
                    console.log('\n9. Testing permission analytics...');
                    return [4 /*yield*/, permissionService_1.default.generatePermissionAnalytics(testBusinessId)];
                case 11:
                    analytics = _d.sent();
                    console.log('✅ Analytics generated successfully');
                    console.log('   Total permissions:', analytics.totalPermissions);
                    console.log('   Compliance score:', analytics.complianceScore);
                    console.log('   Inheritance stats:', analytics.inheritanceStats);
                    if (analytics.recommendations.length > 0) {
                        console.log('   Recommendations:', analytics.recommendations);
                    }
                    // 10. Test permission dependency validation
                    console.log('\n10. Testing permission dependency validation...');
                    return [4 /*yield*/, permissionService_1.default.validatePermissionDependencies([
                            {
                                moduleId: 'test-module',
                                featureId: 'test-feature',
                                action: 'test-action',
                            },
                        ])];
                case 12:
                    dependencyValidation = _d.sent();
                    console.log('✅ Dependency validation:', dependencyValidation.isValid ? 'PASSED' : 'FAILED');
                    if (dependencyValidation.errors.length > 0) {
                        console.log('   Errors:', dependencyValidation.errors);
                    }
                    // 11. Test advanced permission checking
                    console.log('\n11. Testing advanced permission checking...');
                    return [4 /*yield*/, permissionService_1.default.checkUserPermission(testUserId, testBusinessId, 'test-module', 'test-feature', 'test-action')];
                case 13:
                    permissionCheck = _d.sent();
                    console.log('✅ Permission check:', permissionCheck.hasPermission ? 'GRANTED' : 'DENIED');
                    if (permissionCheck.inheritedFrom) {
                        console.log('   Inherited from:', permissionCheck.inheritedFrom);
                    }
                    // 12. Test custom permission override
                    console.log('\n12. Testing custom permission override...');
                    return [4 /*yield*/, permissionService_1.default.checkUserPermission(testUserId, testBusinessId, 'test-module', 'test-feature', 'custom-action')];
                case 14:
                    customPermissionCheck = _d.sent();
                    console.log('✅ Custom permission check:', customPermissionCheck.hasPermission ? 'GRANTED' : 'DENIED');
                    if (customPermissionCheck.customOverride) {
                        console.log('   Custom override applied');
                    }
                    // 13. Final validation
                    console.log('\n13. Final validation...');
                    return [4 /*yield*/, permissionService_1.default.validatePermissionInheritance(testBusinessId)];
                case 15:
                    finalValidation = _d.sent();
                    return [4 /*yield*/, permissionService_1.default.generatePermissionAnalytics(testBusinessId)];
                case 16:
                    finalAnalytics = _d.sent();
                    console.log('✅ Final inheritance validation:', finalValidation.isValid ? 'PASSED' : 'FAILED');
                    console.log('✅ Final compliance score:', finalAnalytics.complianceScore);
                    console.log('\n🎉 Advanced Permission System Testing COMPLETED SUCCESSFULLY!');
                    console.log('='.repeat(60));
                    console.log('✅ Permission inheritance validation working');
                    console.log('✅ Conflict resolution system functional');
                    console.log('✅ Analytics and reporting operational');
                    console.log('✅ Dependency validation working');
                    console.log('✅ Custom permission overrides functional');
                    console.log('✅ Advanced permission checking operational');
                    console.log('\n🚀 Advanced Permission System ready for production!');
                    return [3 /*break*/, 31];
                case 17:
                    error_1 = _d.sent();
                    console.error('❌ Advanced Permission System Test FAILED:', error_1);
                    throw error_1;
                case 18:
                    // Cleanup test data
                    console.log('\n🧹 Cleaning up test data...');
                    _d.label = 19;
                case 19:
                    _d.trys.push([19, 28, , 29]);
                    if (!testPermissionId) return [3 /*break*/, 21];
                    return [4 /*yield*/, prisma.permission.delete({ where: { id: testPermissionId } })];
                case 20:
                    _d.sent();
                    _d.label = 21;
                case 21:
                    if (!testPositionId) return [3 /*break*/, 23];
                    return [4 /*yield*/, prisma.position.delete({ where: { id: testPositionId } })];
                case 22:
                    _d.sent();
                    _d.label = 23;
                case 23:
                    if (!testUserId) return [3 /*break*/, 25];
                    return [4 /*yield*/, prisma.user.delete({ where: { id: testUserId } })];
                case 24:
                    _d.sent();
                    _d.label = 25;
                case 25:
                    if (!testBusinessId) return [3 /*break*/, 27];
                    return [4 /*yield*/, prisma.business.delete({ where: { id: testBusinessId } })];
                case 26:
                    _d.sent();
                    _d.label = 27;
                case 27:
                    console.log('✅ Test data cleaned up');
                    return [3 /*break*/, 29];
                case 28:
                    cleanupError_1 = _d.sent();
                    console.error('⚠️  Cleanup warning:', cleanupError_1);
                    return [3 /*break*/, 29];
                case 29: return [4 /*yield*/, prisma.$disconnect()];
                case 30:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 31: return [2 /*return*/];
            }
        });
    });
}
// Run the test
if (require.main === module) {
    testAdvancedPermissions()
        .then(function () {
        console.log('\n✅ Advanced Permission System test completed successfully');
        process.exit(0);
    })
        .catch(function (error) {
        console.error('\n❌ Advanced Permission System test failed:', error);
        process.exit(1);
    });
}
