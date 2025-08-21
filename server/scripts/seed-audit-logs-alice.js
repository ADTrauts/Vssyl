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
function seedAuditLogsForAlice() {
    return __awaiter(this, void 0, void 0, function () {
        var user, auditActions, auditLogs, i, action, daysAgo, hoursAgo, minutesAgo, timestamp, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 6]);
                    console.log('🌱 Seeding audit logs for Alice...');
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: 'alice@example.com' }
                        })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        console.log('❌ Alice user not found. Please create the user first.');
                        return [2 /*return*/];
                    }
                    auditActions = [
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
                    auditLogs = [];
                    for (i = 0; i < auditActions.length; i++) {
                        action = auditActions[i];
                        daysAgo = Math.floor(Math.random() * 30);
                        hoursAgo = Math.floor(Math.random() * 24);
                        minutesAgo = Math.floor(Math.random() * 60);
                        timestamp = new Date();
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
                    return [4 /*yield*/, prisma.auditLog.createMany({
                            data: auditLogs
                        })];
                case 2:
                    // Insert audit logs
                    _a.sent();
                    console.log("\u2705 Created ".concat(auditLogs.length, " audit logs for user: ").concat(user.email));
                    console.log('📊 Audit logs include:');
                    console.log('   - File uploads/downloads/access');
                    console.log('   - Message creation/deletion');
                    console.log('   - Dashboard access/creation');
                    console.log('   - Module installation');
                    console.log('   - Various IP addresses and timestamps');
                    return [3 /*break*/, 6];
                case 3:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding audit logs:', error_1);
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, prisma.$disconnect()];
                case 5:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
seedAuditLogsForAlice();
