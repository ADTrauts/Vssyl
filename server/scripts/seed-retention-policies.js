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
function seedRetentionPolicies() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, testAdmin, userId, _a, policies, _i, policies_1, policy, existingPolicy, classifications, _b, classifications_1, classification, existingClassification, backups, _c, backups_1, backup, existingBackup, error_1;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 24, 25, 27]);
                    console.log('Seeding retention policies...');
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: { role: 'ADMIN' }
                        })];
                case 1:
                    adminUser = _e.sent();
                    if (!!adminUser) return [3 /*break*/, 3];
                    console.log('No admin user found. Creating a test admin user...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'admin@test.com',
                                password: '$2b$10$test', // This is just for seeding
                                name: 'Test Admin',
                                role: 'ADMIN',
                                emailVerified: new Date()
                            }
                        })];
                case 2:
                    testAdmin = _e.sent();
                    console.log('Created test admin user:', testAdmin.id);
                    _e.label = 3;
                case 3:
                    _a = (adminUser === null || adminUser === void 0 ? void 0 : adminUser.id);
                    if (_a) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.user.findFirst({ where: { role: 'ADMIN' } })];
                case 4:
                    _a = ((_d = (_e.sent())) === null || _d === void 0 ? void 0 : _d.id);
                    _e.label = 5;
                case 5:
                    userId = _a;
                    if (!userId) {
                        throw new Error('No admin user available for seeding');
                    }
                    policies = [
                        {
                            name: 'File Retention Policy',
                            description: 'Standard file retention policy for uploaded files',
                            resourceType: 'file',
                            retentionPeriod: 730, // 2 years
                            archiveAfter: 365, // Archive after 1 year
                            deleteAfter: 1095, // Delete after 3 years
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Message Retention Policy',
                            description: 'Chat message retention policy',
                            resourceType: 'message',
                            retentionPeriod: 365, // 1 year
                            archiveAfter: 180, // Archive after 6 months
                            deleteAfter: 730, // Delete after 2 years
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Audit Log Retention Policy',
                            description: 'Audit log retention for compliance',
                            resourceType: 'auditLog',
                            retentionPeriod: 2555, // 7 years for compliance
                            archiveAfter: 1095, // Archive after 3 years
                            deleteAfter: 3650, // Delete after 10 years
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Conversation Retention Policy',
                            description: 'Chat conversation retention policy',
                            resourceType: 'conversation',
                            retentionPeriod: 730, // 2 years
                            archiveAfter: 365, // Archive after 1 year
                            deleteAfter: 1095, // Delete after 3 years
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Dashboard Retention Policy',
                            description: 'Dashboard and widget retention policy',
                            resourceType: 'dashboard',
                            retentionPeriod: 1095, // 3 years
                            archiveAfter: 730, // Archive after 2 years
                            deleteAfter: 1825, // Delete after 5 years
                            isActive: true,
                            createdBy: userId
                        }
                    ];
                    _i = 0, policies_1 = policies;
                    _e.label = 6;
                case 6:
                    if (!(_i < policies_1.length)) return [3 /*break*/, 11];
                    policy = policies_1[_i];
                    return [4 /*yield*/, prisma.systemRetentionPolicy.findUnique({
                            where: { name: policy.name }
                        })];
                case 7:
                    existingPolicy = _e.sent();
                    if (!!existingPolicy) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.systemRetentionPolicy.create({
                            data: policy
                        })];
                case 8:
                    _e.sent();
                    console.log("Created retention policy: ".concat(policy.name));
                    return [3 /*break*/, 10];
                case 9:
                    console.log("Retention policy already exists: ".concat(policy.name));
                    _e.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 6];
                case 11:
                    classifications = [
                        {
                            resourceType: 'file',
                            resourceId: 'sample-file-1',
                            sensitivity: 'CONFIDENTIAL',
                            classifiedBy: userId,
                            notes: 'Sample confidential file classification'
                        },
                        {
                            resourceType: 'message',
                            resourceId: 'sample-message-1',
                            sensitivity: 'INTERNAL',
                            classifiedBy: userId,
                            notes: 'Sample internal message classification'
                        },
                        {
                            resourceType: 'conversation',
                            resourceId: 'sample-conversation-1',
                            sensitivity: 'PUBLIC',
                            classifiedBy: userId,
                            notes: 'Sample public conversation classification'
                        }
                    ];
                    _b = 0, classifications_1 = classifications;
                    _e.label = 12;
                case 12:
                    if (!(_b < classifications_1.length)) return [3 /*break*/, 17];
                    classification = classifications_1[_b];
                    return [4 /*yield*/, prisma.dataClassification.findUnique({
                            where: {
                                resourceType_resourceId: {
                                    resourceType: classification.resourceType,
                                    resourceId: classification.resourceId
                                }
                            }
                        })];
                case 13:
                    existingClassification = _e.sent();
                    if (!!existingClassification) return [3 /*break*/, 15];
                    return [4 /*yield*/, prisma.dataClassification.create({
                            data: classification
                        })];
                case 14:
                    _e.sent();
                    console.log("Created data classification: ".concat(classification.resourceType, "/").concat(classification.resourceId));
                    return [3 /*break*/, 16];
                case 15:
                    console.log("Data classification already exists: ".concat(classification.resourceType, "/").concat(classification.resourceId));
                    _e.label = 16;
                case 16:
                    _b++;
                    return [3 /*break*/, 12];
                case 17:
                    backups = [
                        {
                            backupType: 'database',
                            backupPath: '/backups/db_full_20241227_120000.backup',
                            backupSize: 52428800, // 50MB
                            checksum: 'sha256:abc123def456',
                            status: 'completed',
                            notes: 'Daily database backup',
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                            createdBy: userId
                        },
                        {
                            backupType: 'files',
                            backupPath: '/backups/files_full_20241227_120000.backup',
                            backupSize: 104857600, // 100MB
                            checksum: 'sha256:def456ghi789',
                            status: 'completed',
                            notes: 'Daily file backup',
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                            createdBy: userId
                        }
                    ];
                    _c = 0, backups_1 = backups;
                    _e.label = 18;
                case 18:
                    if (!(_c < backups_1.length)) return [3 /*break*/, 23];
                    backup = backups_1[_c];
                    return [4 /*yield*/, prisma.backupRecord.findFirst({
                            where: {
                                backupPath: backup.backupPath
                            }
                        })];
                case 19:
                    existingBackup = _e.sent();
                    if (!!existingBackup) return [3 /*break*/, 21];
                    return [4 /*yield*/, prisma.backupRecord.create({
                            data: backup
                        })];
                case 20:
                    _e.sent();
                    console.log("Created backup record: ".concat(backup.backupType));
                    return [3 /*break*/, 22];
                case 21:
                    console.log("Backup record already exists: ".concat(backup.backupType));
                    _e.label = 22;
                case 22:
                    _c++;
                    return [3 /*break*/, 18];
                case 23:
                    console.log('Retention policies seeding completed successfully!');
                    return [3 /*break*/, 27];
                case 24:
                    error_1 = _e.sent();
                    console.error('Error seeding retention policies:', error_1);
                    return [3 /*break*/, 27];
                case 25: return [4 /*yield*/, prisma.$disconnect()];
                case 26:
                    _e.sent();
                    return [7 /*endfinally*/];
                case 27: return [2 /*return*/];
            }
        });
    });
}
seedRetentionPolicies();
