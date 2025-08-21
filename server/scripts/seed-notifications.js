"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
function seedNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var user, notifications, now, i, notification, createdAt, stats, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, 8, 10]);
                    console.log('🌱 Seeding notifications...');
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: { email: 'alice@example.com' }
                        })];
                case 1:
                    user = _a.sent();
                    if (!user) {
                        console.log('❌ No test user found. Please run seed scripts first.');
                        return [2 /*return*/];
                    }
                    notifications = [
                        {
                            type: 'mentions',
                            title: 'John Doe mentioned you in "Project Discussion"',
                            body: 'Hey @alice, can you review the latest design files?',
                            read: false,
                            data: {
                                conversationId: 'conv1',
                                action: 'mention',
                                senderId: 'user1'
                            }
                        },
                        {
                            type: 'drive',
                            title: 'Sarah shared a file with you',
                            body: 'Project_Design_v2.fig has been shared with you',
                            read: false,
                            data: {
                                fileId: 'file1',
                                action: 'shared',
                                senderId: 'user2'
                            }
                        },
                        {
                            type: 'business',
                            title: 'You\'ve been invited to join "TechCorp"',
                            body: 'You have been invited to join TechCorp as a member',
                            read: true,
                            data: {
                                businessId: 'business1',
                                action: 'invitation',
                                senderId: 'user3'
                            }
                        },
                        {
                            type: 'chat',
                            title: 'New message in "Team Chat"',
                            body: 'Mike: Great work on the latest update!',
                            read: false,
                            data: {
                                conversationId: 'conv2',
                                action: 'message',
                                senderId: 'user4'
                            }
                        },
                        {
                            type: 'system',
                            title: 'System maintenance scheduled',
                            body: 'Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM EST',
                            read: true,
                            data: {
                                action: 'maintenance'
                            }
                        },
                        {
                            type: 'members',
                            title: 'New connection request',
                            body: 'David Wilson wants to connect with you',
                            read: false,
                            data: {
                                senderId: 'user5',
                                action: 'connection_request'
                            }
                        },
                        {
                            type: 'drive',
                            title: 'File permission updated',
                            body: 'You now have edit access to "Marketing_Plan.pdf"',
                            read: true,
                            data: {
                                fileId: 'file2',
                                action: 'permission_updated'
                            }
                        },
                        {
                            type: 'chat',
                            title: 'Reaction to your message',
                            body: 'Sarah reacted with 👍 to your message',
                            read: false,
                            data: {
                                conversationId: 'conv1',
                                action: 'reaction',
                                senderId: 'user2'
                            }
                        }
                    ];
                    now = new Date();
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < notifications.length)) return [3 /*break*/, 5];
                    notification = notifications[i];
                    createdAt = new Date(now.getTime() - (i * 2 * 60 * 60 * 1000));
                    return [4 /*yield*/, prisma.notification.create({
                            data: __assign(__assign({}, notification), { userId: user.id, createdAt: createdAt, deliveredAt: notification.read ? createdAt : null })
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("\u2705 Created ".concat(notifications.length, " sample notifications for ").concat(user.email));
                    return [4 /*yield*/, prisma.notification.groupBy({
                            by: ['type'],
                            where: { userId: user.id },
                            _count: { type: true }
                        })];
                case 6:
                    stats = _a.sent();
                    console.log('📊 Notification stats:');
                    stats.forEach(function (stat) {
                        console.log("  ".concat(stat.type, ": ").concat(stat._count.type));
                    });
                    return [3 /*break*/, 10];
                case 7:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding notifications:', error_1);
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, prisma.$disconnect()];
                case 9:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
seedNotifications();
