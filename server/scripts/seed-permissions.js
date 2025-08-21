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
var prisma = new client_1.PrismaClient();
// Default permissions for common modules and features
var defaultPermissions = [
    // Drive Module
    {
        moduleId: 'drive',
        featureId: 'files',
        action: 'view',
        description: 'View files and folders',
        category: 'basic',
    },
    {
        moduleId: 'drive',
        featureId: 'files',
        action: 'create',
        description: 'Create new files and folders',
        category: 'basic',
    },
    {
        moduleId: 'drive',
        featureId: 'files',
        action: 'edit',
        description: 'Edit file and folder properties',
        category: 'basic',
    },
    {
        moduleId: 'drive',
        featureId: 'files',
        action: 'delete',
        description: 'Delete files and folders',
        category: 'advanced',
    },
    {
        moduleId: 'drive',
        featureId: 'files',
        action: 'manage',
        description: 'Manage file permissions and sharing',
        category: 'admin',
    },
    {
        moduleId: 'drive',
        featureId: 'permissions',
        action: 'view',
        description: 'View file permissions',
        category: 'basic',
    },
    {
        moduleId: 'drive',
        featureId: 'permissions',
        action: 'manage',
        description: 'Manage file permissions',
        category: 'admin',
    },
    // Chat Module
    {
        moduleId: 'chat',
        featureId: 'conversations',
        action: 'view',
        description: 'View conversations',
        category: 'basic',
    },
    {
        moduleId: 'chat',
        featureId: 'conversations',
        action: 'create',
        description: 'Create new conversations',
        category: 'basic',
    },
    {
        moduleId: 'chat',
        featureId: 'conversations',
        action: 'edit',
        description: 'Edit conversation properties',
        category: 'advanced',
    },
    {
        moduleId: 'chat',
        featureId: 'conversations',
        action: 'delete',
        description: 'Delete conversations',
        category: 'admin',
    },
    {
        moduleId: 'chat',
        featureId: 'messages',
        action: 'view',
        description: 'View messages',
        category: 'basic',
    },
    {
        moduleId: 'chat',
        featureId: 'messages',
        action: 'create',
        description: 'Send messages',
        category: 'basic',
    },
    {
        moduleId: 'chat',
        featureId: 'messages',
        action: 'edit',
        description: 'Edit messages',
        category: 'advanced',
    },
    {
        moduleId: 'chat',
        featureId: 'messages',
        action: 'delete',
        description: 'Delete messages',
        category: 'admin',
    },
    // Calendar Module
    {
        moduleId: 'calendar',
        featureId: 'events',
        action: 'view',
        description: 'View calendar events',
        category: 'basic',
    },
    {
        moduleId: 'calendar',
        featureId: 'events',
        action: 'create',
        description: 'Create calendar events',
        category: 'basic',
    },
    {
        moduleId: 'calendar',
        featureId: 'events',
        action: 'edit',
        description: 'Edit calendar events',
        category: 'basic',
    },
    {
        moduleId: 'calendar',
        featureId: 'events',
        action: 'delete',
        description: 'Delete calendar events',
        category: 'advanced',
    },
    {
        moduleId: 'calendar',
        featureId: 'events',
        action: 'manage',
        description: 'Manage all calendar events',
        category: 'admin',
    },
    {
        moduleId: 'calendar',
        featureId: 'calendars',
        action: 'view',
        description: 'View calendars',
        category: 'basic',
    },
    {
        moduleId: 'calendar',
        featureId: 'calendars',
        action: 'create',
        description: 'Create calendars',
        category: 'advanced',
    },
    {
        moduleId: 'calendar',
        featureId: 'calendars',
        action: 'manage',
        description: 'Manage calendars',
        category: 'admin',
    },
    // Business Module
    {
        moduleId: 'business',
        featureId: 'members',
        action: 'view',
        description: 'View business members',
        category: 'basic',
    },
    {
        moduleId: 'business',
        featureId: 'members',
        action: 'invite',
        description: 'Invite new members',
        category: 'advanced',
    },
    {
        moduleId: 'business',
        featureId: 'members',
        action: 'manage',
        description: 'Manage business members',
        category: 'admin',
    },
    {
        moduleId: 'business',
        featureId: 'settings',
        action: 'view',
        description: 'View business settings',
        category: 'basic',
    },
    {
        moduleId: 'business',
        featureId: 'settings',
        action: 'edit',
        description: 'Edit business settings',
        category: 'admin',
    },
    // Org Chart Module
    {
        moduleId: 'org-chart',
        featureId: 'structure',
        action: 'view',
        description: 'View organizational structure',
        category: 'basic',
    },
    {
        moduleId: 'org-chart',
        featureId: 'structure',
        action: 'edit',
        description: 'Edit organizational structure',
        category: 'admin',
    },
    {
        moduleId: 'org-chart',
        featureId: 'positions',
        action: 'view',
        description: 'View positions',
        category: 'basic',
    },
    {
        moduleId: 'org-chart',
        featureId: 'positions',
        action: 'create',
        description: 'Create positions',
        category: 'admin',
    },
    {
        moduleId: 'org-chart',
        featureId: 'positions',
        action: 'edit',
        description: 'Edit positions',
        category: 'admin',
    },
    {
        moduleId: 'org-chart',
        featureId: 'positions',
        action: 'delete',
        description: 'Delete positions',
        category: 'admin',
    },
    {
        moduleId: 'org-chart',
        featureId: 'employees',
        action: 'view',
        description: 'View employee assignments',
        category: 'basic',
    },
    {
        moduleId: 'org-chart',
        featureId: 'employees',
        action: 'assign',
        description: 'Assign employees to positions',
        category: 'admin',
    },
    {
        moduleId: 'org-chart',
        featureId: 'employees',
        action: 'manage',
        description: 'Manage employee assignments',
        category: 'admin',
    },
    {
        moduleId: 'org-chart',
        featureId: 'permissions',
        action: 'view',
        description: 'View permissions',
        category: 'basic',
    },
    {
        moduleId: 'org-chart',
        featureId: 'permissions',
        action: 'manage',
        description: 'Manage permissions',
        category: 'admin',
    },
    // Analytics Module
    {
        moduleId: 'analytics',
        featureId: 'reports',
        action: 'view',
        description: 'View analytics reports',
        category: 'basic',
    },
    {
        moduleId: 'analytics',
        featureId: 'reports',
        action: 'create',
        description: 'Create analytics reports',
        category: 'advanced',
    },
    {
        moduleId: 'analytics',
        featureId: 'reports',
        action: 'manage',
        description: 'Manage analytics reports',
        category: 'admin',
    },
    {
        moduleId: 'analytics',
        featureId: 'dashboards',
        action: 'view',
        description: 'View analytics dashboards',
        category: 'basic',
    },
    {
        moduleId: 'analytics',
        featureId: 'dashboards',
        action: 'create',
        description: 'Create analytics dashboards',
        category: 'advanced',
    },
    {
        moduleId: 'analytics',
        featureId: 'dashboards',
        action: 'manage',
        description: 'Manage analytics dashboards',
        category: 'admin',
    },
    // Admin Module
    {
        moduleId: 'admin',
        featureId: 'users',
        action: 'view',
        description: 'View user management',
        category: 'admin',
    },
    {
        moduleId: 'admin',
        featureId: 'users',
        action: 'manage',
        description: 'Manage users',
        category: 'admin',
    },
    {
        moduleId: 'admin',
        featureId: 'system',
        action: 'view',
        description: 'View system settings',
        category: 'admin',
    },
    {
        moduleId: 'admin',
        featureId: 'system',
        action: 'manage',
        description: 'Manage system settings',
        category: 'admin',
    },
];
// Default permission sets for different roles
var defaultPermissionSets = [
    {
        name: 'Full Access',
        description: 'Complete access to all features and modules',
        category: 'admin',
        template: true,
        permissions: defaultPermissions,
    },
    {
        name: 'Executive Access',
        description: 'High-level access for executives and senior management',
        category: 'admin',
        template: true,
        permissions: defaultPermissions.filter(function (p) {
            return p.category !== 'admin' ||
                ['business', 'org-chart', 'analytics'].includes(p.moduleId);
        }),
    },
    {
        name: 'Manager Access',
        description: 'Management-level access for team leaders',
        category: 'advanced',
        template: true,
        permissions: defaultPermissions.filter(function (p) {
            return p.category === 'basic' || p.category === 'advanced';
        }),
    },
    {
        name: 'Employee Access',
        description: 'Standard access for regular employees',
        category: 'basic',
        template: true,
        permissions: defaultPermissions.filter(function (p) {
            return p.category === 'basic';
        }),
    },
    {
        name: 'Restricted Access',
        description: 'Limited access for contractors or temporary staff',
        category: 'basic',
        template: true,
        permissions: defaultPermissions.filter(function (p) {
            return p.category === 'basic' &&
                ['drive', 'chat'].includes(p.moduleId) &&
                p.action === 'view';
        }),
    },
];
function seedPermissions() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, defaultPermissions_1, permissionData, systemBusiness, _a, defaultPermissionSets_1, permissionSetData, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 12, , 13]);
                    console.log('Starting permission seeding...');
                    // Create permissions
                    console.log('Creating permissions...');
                    _i = 0, defaultPermissions_1 = defaultPermissions;
                    _b.label = 1;
                case 1:
                    if (!(_i < defaultPermissions_1.length)) return [3 /*break*/, 4];
                    permissionData = defaultPermissions_1[_i];
                    return [4 /*yield*/, prisma.permission.upsert({
                            where: {
                                moduleId_featureId_action: {
                                    moduleId: permissionData.moduleId,
                                    featureId: permissionData.featureId,
                                    action: permissionData.action,
                                },
                            },
                            update: permissionData,
                            create: permissionData,
                        })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    console.log("Created ".concat(defaultPermissions.length, " permissions"));
                    return [4 /*yield*/, prisma.business.findFirst({
                            where: { name: 'System Templates' },
                        })];
                case 5:
                    systemBusiness = _b.sent();
                    if (!!systemBusiness) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma.business.create({
                            data: {
                                name: 'System Templates',
                                ein: 'SYSTEM-0000',
                                industry: 'system',
                                size: '1-10',
                                description: 'System-level business for storing permission templates',
                            },
                        })];
                case 6:
                    systemBusiness = _b.sent();
                    console.log('Created system business for templates');
                    _b.label = 7;
                case 7:
                    // Create permission sets (templates)
                    console.log('Creating permission set templates...');
                    _a = 0, defaultPermissionSets_1 = defaultPermissionSets;
                    _b.label = 8;
                case 8:
                    if (!(_a < defaultPermissionSets_1.length)) return [3 /*break*/, 11];
                    permissionSetData = defaultPermissionSets_1[_a];
                    return [4 /*yield*/, prisma.permissionSet.upsert({
                            where: {
                                businessId_name: {
                                    businessId: systemBusiness.id,
                                    name: permissionSetData.name,
                                },
                            },
                            update: {
                                description: permissionSetData.description,
                                category: permissionSetData.category,
                                template: permissionSetData.template,
                                permissions: permissionSetData.permissions,
                            },
                            create: {
                                name: permissionSetData.name,
                                description: permissionSetData.description,
                                category: permissionSetData.category,
                                template: permissionSetData.template,
                                permissions: permissionSetData.permissions,
                                businessId: systemBusiness.id,
                            },
                        })];
                case 9:
                    _b.sent();
                    _b.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11:
                    console.log("Created ".concat(defaultPermissionSets.length, " permission set templates"));
                    console.log('Permission seeding completed successfully!');
                    return [3 /*break*/, 13];
                case 12:
                    error_1 = _b.sent();
                    console.error('Error seeding permissions:', error_1);
                    throw error_1;
                case 13: return [2 /*return*/];
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
                    return [4 /*yield*/, seedPermissions()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    error_2 = _a.sent();
                    console.error('Failed to seed permissions:', error_2);
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
