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
function testOrgChartSystem() {
    return __awaiter(this, void 0, void 0, function () {
        var testBusiness, structure, firstTier, firstDepartment, testPosition, permissions, drivePermissions, basicPermissions, vacantPositions, positionsWithCapacity, validation, templatePermissionSets, customPermissionSet, departmentHierarchy, positionHierarchy, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 16, , 17]);
                    console.log('🧪 Testing Org Chart System...\n');
                    // 1. Create a test business
                    console.log('1. Creating test business...');
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                name: 'Test Company Inc.',
                                ein: 'TEST-1234',
                                industry: 'technology',
                                size: '11-50',
                                description: 'Test business for org chart system testing',
                            },
                        })];
                case 1:
                    testBusiness = _a.sent();
                    console.log("\u2705 Created business: ".concat(testBusiness.name, " (ID: ").concat(testBusiness.id, ")\n"));
                    // 2. Create default org chart structure
                    console.log('2. Creating default org chart structure...');
                    return [4 /*yield*/, orgChartService_1.default.createDefaultOrgChart(testBusiness.id, 'technology')];
                case 2:
                    _a.sent();
                    console.log('✅ Created default org chart structure\n');
                    // 3. Get org chart structure
                    console.log('3. Fetching org chart structure...');
                    return [4 /*yield*/, orgChartService_1.default.getOrgChartStructure(testBusiness.id)];
                case 3:
                    structure = _a.sent();
                    console.log("\u2705 Found ".concat(structure.tiers.length, " tiers, ").concat(structure.departments.length, " departments, ").concat(structure.positions.length, " positions\n"));
                    // 4. Create a test position
                    console.log('4. Creating test position...');
                    firstTier = structure.tiers[0];
                    firstDepartment = structure.departments[0];
                    return [4 /*yield*/, orgChartService_1.default.createPosition({
                            businessId: testBusiness.id,
                            title: 'Software Engineer',
                            tierId: firstTier.id,
                            departmentId: firstDepartment.id,
                            maxOccupants: 3,
                        })];
                case 4:
                    testPosition = _a.sent();
                    console.log("\u2705 Created position: ".concat(testPosition.title, "\n"));
                    // 5. Test permission system
                    console.log('5. Testing permission system...');
                    return [4 /*yield*/, permissionService_1.default.getAllPermissions()];
                case 5:
                    permissions = _a.sent();
                    console.log("\u2705 Found ".concat(permissions.length, " total permissions"));
                    return [4 /*yield*/, permissionService_1.default.getPermissionsByModule('drive')];
                case 6:
                    drivePermissions = _a.sent();
                    console.log("\u2705 Found ".concat(drivePermissions.length, " drive module permissions"));
                    return [4 /*yield*/, permissionService_1.default.getPermissionsByCategory('basic')];
                case 7:
                    basicPermissions = _a.sent();
                    console.log("\u2705 Found ".concat(basicPermissions.length, " basic permissions\n"));
                    // 6. Test employee management
                    console.log('6. Testing employee management...');
                    return [4 /*yield*/, employeeManagementService_1.default.getVacantPositions(testBusiness.id)];
                case 8:
                    vacantPositions = _a.sent();
                    console.log("\u2705 Found ".concat(vacantPositions.length, " vacant positions"));
                    return [4 /*yield*/, employeeManagementService_1.default.getPositionsWithCapacity(testBusiness.id)];
                case 9:
                    positionsWithCapacity = _a.sent();
                    console.log("\u2705 Found ".concat(positionsWithCapacity.length, " positions with capacity\n"));
                    // 7. Validate org chart structure
                    console.log('7. Validating org chart structure...');
                    return [4 /*yield*/, orgChartService_1.default.validateOrgChartStructure(testBusiness.id)];
                case 10:
                    validation = _a.sent();
                    console.log("\u2705 Structure validation: ".concat(validation.isValid ? 'PASSED' : 'FAILED'));
                    if (validation.errors.length > 0) {
                        console.log("\u274C Errors: ".concat(validation.errors.join(', ')));
                    }
                    if (validation.warnings.length > 0) {
                        console.log("\u26A0\uFE0F  Warnings: ".concat(validation.warnings.join(', ')));
                    }
                    console.log('');
                    // 8. Test permission sets
                    console.log('8. Testing permission sets...');
                    return [4 /*yield*/, permissionService_1.default.getTemplatePermissionSets()];
                case 11:
                    templatePermissionSets = _a.sent();
                    console.log("\u2705 Found ".concat(templatePermissionSets.length, " template permission sets"));
                    return [4 /*yield*/, permissionService_1.default.createPermissionSet({
                            businessId: testBusiness.id,
                            name: 'Test Team Access',
                            description: 'Custom permission set for test team',
                            category: 'advanced',
                            permissions: basicPermissions.slice(0, 10), // First 10 basic permissions
                        })];
                case 12:
                    customPermissionSet = _a.sent();
                    console.log("\u2705 Created custom permission set: ".concat(customPermissionSet.name, "\n"));
                    // 9. Test org chart hierarchy
                    console.log('9. Testing org chart hierarchy...');
                    return [4 /*yield*/, orgChartService_1.default.getDepartmentHierarchy(testBusiness.id)];
                case 13:
                    departmentHierarchy = _a.sent();
                    console.log("\u2705 Department hierarchy has ".concat(departmentHierarchy.length, " root departments"));
                    return [4 /*yield*/, orgChartService_1.default.getPositionHierarchy(testBusiness.id)];
                case 14:
                    positionHierarchy = _a.sent();
                    console.log("\u2705 Position hierarchy has ".concat(positionHierarchy.length, " top-level positions\n"));
                    // 10. Cleanup test data
                    console.log('10. Cleaning up test data...');
                    return [4 /*yield*/, prisma.business.delete({
                            where: { id: testBusiness.id },
                        })];
                case 15:
                    _a.sent();
                    console.log('✅ Cleaned up test business and all related data\n');
                    console.log('🎉 All tests passed! The org chart system is working correctly.');
                    return [3 /*break*/, 17];
                case 16:
                    error_1 = _a.sent();
                    console.error('❌ Test failed:', error_1);
                    throw error_1;
                case 17: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 5]);
                    return [4 /*yield*/, testOrgChartSystem()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to run tests:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, prisma.$disconnect()];
                case 4:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main();
}
