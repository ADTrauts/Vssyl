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
var emailNotificationService_1 = require("../src/services/emailNotificationService");
var prisma = new client_1.PrismaClient();
function testEmailNotifications() {
    return __awaiter(this, void 0, void 0, function () {
        var user, emailService, isAvailable, testNotification, template, success, notification, unreadCount, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, 6, 8]);
                    console.log('🧪 Testing Email Notification System...\n');
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
                    emailService = emailNotificationService_1.EmailNotificationService.getInstance();
                    console.log('\n📧 Testing email service availability...');
                    isAvailable = emailService.isAvailable();
                    console.log("Email service available: ".concat(isAvailable ? '✅ Yes' : '❌ No'));
                    if (!isAvailable) {
                        console.log('\n⚠️  Email service not configured.');
                        console.log('   To test email notifications:');
                        console.log('   1. Add SMTP configuration to your environment variables');
                        console.log('   2. Restart the server');
                        console.log('   3. Run this script again');
                        return [2 /*return*/];
                    }
                    // Test email template creation
                    console.log('\n📧 Testing email template creation...');
                    testNotification = {
                        id: 'test-email-notification',
                        type: 'system',
                        title: 'Test Email Notification',
                        body: 'This is a test email notification from the Block on Block system.',
                        data: { test: true },
                        createdAt: new Date()
                    };
                    template = emailService.createTemplateFromNotification(testNotification, user);
                    console.log('✅ Email template created successfully');
                    console.log("   Subject: ".concat(template.subject));
                    console.log("   HTML length: ".concat(template.html.length, " characters"));
                    console.log("   Text length: ".concat(template.text.length, " characters"));
                    // Test email sending
                    console.log('\n📧 Testing email delivery...');
                    return [4 /*yield*/, emailService.sendToUser(user.id, template)];
                case 2:
                    success = _a.sent();
                    if (success) {
                        console.log('✅ Test email sent successfully!');
                        console.log("   Check ".concat(user.email, " for the test email"));
                    }
                    else {
                        console.log('❌ Failed to send test email');
                        console.log('   This could be due to:');
                        console.log('   - Invalid SMTP configuration');
                        console.log('   - Network issues');
                        console.log('   - Email provider restrictions');
                    }
                    // Test notification creation with email
                    console.log('\n📧 Testing notification creation with email...');
                    return [4 /*yield*/, prisma.notification.create({
                            data: {
                                userId: user.id,
                                type: 'system',
                                title: 'System Test Notification',
                                body: 'This notification should trigger both WebSocket and email delivery',
                                data: { test: true, emailTest: true },
                                read: false
                            }
                        })];
                case 3:
                    notification = _a.sent();
                    console.log("\u2705 Created test notification: ".concat(notification.id));
                    console.log('   This should trigger both real-time WebSocket and email notification');
                    return [4 /*yield*/, prisma.notification.count({
                            where: { userId: user.id, read: false, deleted: false }
                        })];
                case 4:
                    unreadCount = _a.sent();
                    console.log("\n\uD83D\uDCCA Current unread notifications: ".concat(unreadCount));
                    console.log('\n💡 Email Notification Testing Complete!');
                    console.log('   If you received emails, the system is working correctly.');
                    console.log('   If not, check:');
                    console.log('   1. SMTP configuration in environment variables');
                    console.log('   2. Email provider settings');
                    console.log('   3. Network connectivity');
                    console.log('   4. Spam/junk folder');
                    return [3 /*break*/, 8];
                case 5:
                    error_1 = _a.sent();
                    console.error('❌ Error testing email notifications:', error_1);
                    return [3 /*break*/, 8];
                case 6: return [4 /*yield*/, prisma.$disconnect()];
                case 7:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    });
}
testEmailNotifications();
