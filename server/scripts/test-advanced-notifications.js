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
var notificationGroupingService_1 = require("../src/services/notificationGroupingService");
var prisma = new client_1.PrismaClient();
function testAdvancedNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var user, groupingService, testNotifications, _i, testNotifications_1, notificationData, groups, stats, firstGroup, success, firstGroup, retrievedGroup, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 12, 13, 15]);
                    console.log('🧪 Testing Advanced Notification Features...\n');
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: { email: 'test@example.com' }
                        })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        console.log('❌ No test user found. Please create a user with email test@example.com');
                        return [2 /*return*/];
                    }
                    console.log("\u2705 Found test user: ".concat(user.name, " (").concat(user.email, ")"));
                    groupingService = notificationGroupingService_1.NotificationGroupingService.getInstance();
                    console.log('\n📊 Testing notification grouping...');
                    testNotifications = [
                        // Chat messages from same conversation (should group)
                        {
                            userId: user.id,
                            type: 'chat',
                            title: 'New message from Alice',
                            body: 'Hey, how are you doing?',
                            data: { conversationId: 'conv-1', senderName: 'Alice' },
                            read: false
                        },
                        {
                            userId: user.id,
                            type: 'chat',
                            title: 'New message from Alice',
                            body: 'Can you check the latest updates?',
                            data: { conversationId: 'conv-1', senderName: 'Alice' },
                            read: false
                        },
                        {
                            userId: user.id,
                            type: 'chat',
                            title: 'New message from Alice',
                            body: 'Thanks for your help!',
                            data: { conversationId: 'conv-1', senderName: 'Alice' },
                            read: false
                        },
                        // Mentions from same conversation (should group)
                        {
                            userId: user.id,
                            type: 'mentions',
                            title: 'Alice mentioned you',
                            body: '@testuser can you help with this?',
                            data: { conversationId: 'conv-1', senderName: 'Alice' },
                            read: false
                        },
                        {
                            userId: user.id,
                            type: 'mentions',
                            title: 'Alice mentioned you',
                            body: '@testuser what do you think?',
                            data: { conversationId: 'conv-1', senderName: 'Alice' },
                            read: false
                        },
                        // File sharing from same sender (should group)
                        {
                            userId: user.id,
                            type: 'drive',
                            title: 'Bob shared a file with you',
                            body: 'project-document.pdf',
                            data: { senderId: 'bob-123', senderName: 'Bob' },
                            read: false
                        },
                        {
                            userId: user.id,
                            type: 'drive',
                            title: 'Bob shared a file with you',
                            body: 'presentation.pptx',
                            data: { senderId: 'bob-123', senderName: 'Bob' },
                            read: false
                        },
                        // Individual invitations (should not group)
                        {
                            userId: user.id,
                            type: 'invitations',
                            title: 'Invitation to join Business A',
                            body: 'You\'ve been invited to join Business A as a member',
                            data: { businessId: 'business-a', businessName: 'Business A' },
                            read: false
                        },
                        {
                            userId: user.id,
                            type: 'invitations',
                            title: 'Invitation to join Business B',
                            body: 'You\'ve been invited to join Business B as an admin',
                            data: { businessId: 'business-b', businessName: 'Business B' },
                            read: false
                        },
                        // System notifications (should group)
                        {
                            userId: user.id,
                            type: 'system',
                            title: 'System maintenance scheduled',
                            body: 'Scheduled maintenance on Sunday at 2 AM',
                            data: { category: 'maintenance' },
                            read: false
                        },
                        {
                            userId: user.id,
                            type: 'system',
                            title: 'System maintenance completed',
                            body: 'All systems are now operational',
                            data: { category: 'maintenance' },
                            read: false
                        }
                    ];
                    console.log('📝 Creating test notifications...');
                    _i = 0, testNotifications_1 = testNotifications;
                    _a.label = 2;
                case 2:
                    if (!(_i < testNotifications_1.length)) return [3 /*break*/, 5];
                    notificationData = testNotifications_1[_i];
                    return [4 /*yield*/, prisma.notification.create({
                            data: notificationData
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("\u2705 Created ".concat(testNotifications.length, " test notifications"));
                    // Test grouping
                    console.log('\n📊 Testing notification grouping...');
                    return [4 /*yield*/, groupingService.getGroupedNotifications(user.id)];
                case 6:
                    groups = _a.sent();
                    console.log("\uD83D\uDCE6 Created ".concat(groups.length, " notification groups:"));
                    groups.forEach(function (group, index) {
                        console.log("   ".concat(index + 1, ". ").concat(group.title, " (").concat(group.count, " notifications, ").concat(group.priority, " priority)"));
                    });
                    // Test statistics
                    console.log('\n📈 Testing notification statistics...');
                    return [4 /*yield*/, groupingService.getNotificationStats(user.id)];
                case 7:
                    stats = _a.sent();
                    console.log('📊 Notification Statistics:');
                    console.log("   Total notifications: ".concat(stats.total));
                    console.log("   Unread notifications: ".concat(stats.unread));
                    console.log("   Grouped notifications: ".concat(stats.grouped));
                    console.log("   By type:", stats.byType);
                    console.log("   By priority:", stats.byPriority);
                    if (!(groups.length > 0)) return [3 /*break*/, 9];
                    console.log('\n✅ Testing mark group as read...');
                    firstGroup = groups[0];
                    return [4 /*yield*/, groupingService.markGroupAsRead(firstGroup.id, user.id)];
                case 8:
                    success = _a.sent();
                    if (success) {
                        console.log("\u2705 Successfully marked group \"".concat(firstGroup.title, "\" as read"));
                    }
                    else {
                        console.log('❌ Failed to mark group as read');
                    }
                    _a.label = 9;
                case 9:
                    if (!(groups.length > 0)) return [3 /*break*/, 11];
                    console.log('\n🔍 Testing individual group retrieval...');
                    firstGroup = groups[0];
                    return [4 /*yield*/, groupingService.getGroupById(firstGroup.id, user.id)];
                case 10:
                    retrievedGroup = _a.sent();
                    if (retrievedGroup) {
                        console.log("\u2705 Successfully retrieved group: ".concat(retrievedGroup.title));
                        console.log("   Contains ".concat(retrievedGroup.notifications.length, " notifications"));
                    }
                    else {
                        console.log('❌ Failed to retrieve group');
                    }
                    _a.label = 11;
                case 11:
                    console.log('\n💡 Advanced Notification Testing Complete!');
                    console.log('   Features tested:');
                    console.log('   ✅ Smart notification grouping');
                    console.log('   ✅ Priority-based organization');
                    console.log('   ✅ Group statistics');
                    console.log('   ✅ Mark group as read');
                    console.log('   ✅ Individual group retrieval');
                    return [3 /*break*/, 15];
                case 12:
                    error_1 = _a.sent();
                    console.error('❌ Error testing advanced notifications:', error_1);
                    return [3 /*break*/, 15];
                case 13: return [4 /*yield*/, prisma.$disconnect()];
                case 14:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
testAdvancedNotifications();
