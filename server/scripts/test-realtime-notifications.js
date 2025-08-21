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
var notificationService_1 = require("../src/services/notificationService");
var prisma = new client_1.PrismaClient();
function testRealtimeNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var user, testNotification, notifications, _i, notifications_1, notificationData, stats, unreadCount, updatedUnreadCount, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 11, 12, 14]);
                    console.log('🧪 Testing real-time notification system...');
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: { email: 'alice@example.com' }
                        })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        console.log('❌ No test user found. Please run seed scripts first.');
                        return [2 /*return*/];
                    }
                    console.log("\u2705 Found test user: ".concat(user.name, " (").concat(user.email, ")"));
                    // Test 1: Create a real-time notification
                    console.log('\n📨 Creating test notification...');
                    return [4 /*yield*/, notificationService_1.NotificationService.createNotification({
                            type: 'system',
                            title: 'Real-time Test Notification',
                            body: 'This notification should appear instantly via WebSocket',
                            data: {
                                test: true,
                                timestamp: new Date().toISOString()
                            },
                            userId: user.id
                        })];
                case 2:
                    testNotification = _a.sent();
                    console.log("\u2705 Created notification: ".concat(testNotification.id));
                    // Test 2: Create multiple notifications
                    console.log('\n📨 Creating multiple test notifications...');
                    notifications = [
                        {
                            type: 'chat',
                            title: 'Real-time Chat Message',
                            body: 'New message from John Doe',
                            data: { conversationId: 'test-conv-1' },
                            userId: user.id
                        },
                        {
                            type: 'drive',
                            title: 'Real-time File Share',
                            body: 'Document.pdf has been shared with you',
                            data: { fileId: 'test-file-1' },
                            userId: user.id
                        },
                        {
                            type: 'business',
                            title: 'Real-time Business Invitation',
                            body: 'You have been invited to join TestCorp',
                            data: { businessId: 'test-business-1' },
                            userId: user.id
                        }
                    ];
                    _i = 0, notifications_1 = notifications;
                    _a.label = 3;
                case 3:
                    if (!(_i < notifications_1.length)) return [3 /*break*/, 6];
                    notificationData = notifications_1[_i];
                    return [4 /*yield*/, notificationService_1.NotificationService.createNotification(notificationData)];
                case 4:
                    _a.sent();
                    console.log("\u2705 Created ".concat(notificationData.type, " notification"));
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, prisma.notification.groupBy({
                        by: ['type'],
                        where: { userId: user.id },
                        _count: { type: true }
                    })];
                case 7:
                    stats = _a.sent();
                    console.log('\n📊 Updated notification stats:');
                    stats.forEach(function (stat) {
                        console.log("  ".concat(stat.type, ": ").concat(stat._count.type));
                    });
                    return [4 /*yield*/, prisma.notification.count({
                            where: {
                                userId: user.id,
                                read: false,
                                deleted: false
                            }
                        })];
                case 8:
                    unreadCount = _a.sent();
                    console.log("\n\uD83D\uDCEC Unread notifications: ".concat(unreadCount));
                    // Test 5: Mark notifications as read
                    console.log('\n✅ Marking notifications as read...');
                    return [4 /*yield*/, notificationService_1.NotificationService.markAsRead(user.id)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.notification.count({
                            where: {
                                userId: user.id,
                                read: false,
                                deleted: false
                            }
                        })];
                case 10:
                    updatedUnreadCount = _a.sent();
                    console.log("\uD83D\uDCEC Updated unread count: ".concat(updatedUnreadCount));
                    console.log('\n✅ Real-time notification system test completed successfully!');
                    console.log('\n💡 To test real-time functionality:');
                    console.log('   1. Open the notification center in your browser');
                    console.log('   2. Run this script again to create new notifications');
                    console.log('   3. Watch for instant updates in the UI');
                    return [3 /*break*/, 14];
                case 11:
                    error_1 = _a.sent();
                    console.error('❌ Error testing real-time notifications:', error_1);
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, prisma.$disconnect()];
                case 13:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    });
}
testRealtimeNotifications();
