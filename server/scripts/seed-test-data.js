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
var bcrypt = require("bcrypt");
var prisma = new client_1.PrismaClient();
function seedTestData() {
    return __awaiter(this, void 0, void 0, function () {
        var testUserPassword, testUser, businessUserPassword, businessUser, testBusiness, businessMember, adminUser, adminBusinessMember, businessDashboard, chatWidget, driveWidget, personalDashboard, personalChatWidget, testConversation, conversationParticipant, welcomeMessage, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 18, 19, 21]);
                    console.log('🌱 Starting test data seeding...');
                    // 1. Create test users
                    console.log('\n👥 Creating test users...');
                    return [4 /*yield*/, bcrypt.hash('test123', 10)];
                case 1:
                    testUserPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'test@example.com' },
                            update: {},
                            create: {
                                email: 'test@example.com',
                                password: testUserPassword,
                                name: 'Test User',
                                role: 'USER',
                                emailVerified: new Date(),
                            },
                        })];
                case 2:
                    testUser = _a.sent();
                    return [4 /*yield*/, bcrypt.hash('business123', 10)];
                case 3:
                    businessUserPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: 'business@example.com' },
                            update: {},
                            create: {
                                email: 'business@example.com',
                                password: businessUserPassword,
                                name: 'Business User',
                                role: 'USER',
                                emailVerified: new Date(),
                            },
                        })];
                case 4:
                    businessUser = _a.sent();
                    console.log('✅ Test users created/updated');
                    // 2. Create test business
                    console.log('\n🏢 Creating test business...');
                    return [4 /*yield*/, prisma.business.upsert({
                            where: { id: '8360c889-4839-4e90-ab34-f0a986177965' },
                            update: {},
                            create: {
                                id: '8360c889-4839-4e90-ab34-f0a986177965',
                                name: 'Test Business',
                                ein: '12-3456789',
                                description: 'A test business for development',
                                industry: 'Technology',
                                size: '1-10',
                                website: 'https://testbusiness.com',
                                phone: '+1-555-0123',
                                address: {
                                    street: '123 Test St',
                                    city: 'Test City',
                                    state: 'TC',
                                    zip: '12345',
                                    country: 'US'
                                },
                                email: 'contact@testbusiness.com',
                                tier: 'free',
                            },
                        })];
                case 5:
                    testBusiness = _a.sent();
                    console.log('✅ Test business created/updated');
                    // 3. Create business member relationship
                    console.log('\n🔗 Creating business membership...');
                    return [4 /*yield*/, prisma.businessMember.upsert({
                            where: {
                                businessId_userId: {
                                    businessId: testBusiness.id,
                                    userId: businessUser.id,
                                },
                            },
                            update: {},
                            create: {
                                userId: businessUser.id,
                                businessId: testBusiness.id,
                                role: 'ADMIN',
                                title: 'Business Owner',
                                department: 'Management',
                                isActive: true,
                                canInvite: true,
                                canManage: true,
                                canBilling: true,
                            },
                        })];
                case 6:
                    businessMember = _a.sent();
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: 'admin@blockonblock.com' },
                            select: { id: true }
                        })];
                case 7:
                    adminUser = _a.sent();
                    if (!adminUser) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.businessMember.upsert({
                            where: {
                                businessId_userId: {
                                    businessId: testBusiness.id,
                                    userId: adminUser.id,
                                },
                            },
                            update: {},
                            create: {
                                userId: adminUser.id,
                                businessId: testBusiness.id,
                                role: 'ADMIN',
                                title: 'System Administrator',
                                department: 'IT',
                                isActive: true,
                                canInvite: true,
                                canManage: true,
                                canBilling: true,
                            },
                        })];
                case 8:
                    adminBusinessMember = _a.sent();
                    console.log('✅ Admin user added to business');
                    _a.label = 9;
                case 9:
                    console.log('✅ Business membership created/updated');
                    // 4. Create dashboard for the business user
                    console.log('\n📊 Creating business dashboard...');
                    return [4 /*yield*/, prisma.dashboard.upsert({
                            where: {
                                id: 'business-dashboard-001',
                            },
                            update: {},
                            create: {
                                id: 'business-dashboard-001',
                                userId: businessUser.id,
                                name: 'Business Dashboard',
                                layout: {
                                    widgets: [
                                        { id: 'chat-widget', x: 0, y: 0, w: 6, h: 4 },
                                        { id: 'drive-widget', x: 6, y: 0, w: 6, h: 4 },
                                    ],
                                },
                                preferences: {
                                    theme: 'light',
                                    compactMode: false,
                                },
                                businessId: testBusiness.id,
                            },
                        })];
                case 10:
                    businessDashboard = _a.sent();
                    console.log('✅ Business dashboard created/updated');
                    // 5. Create widgets for the dashboard
                    console.log('\n🧩 Creating dashboard widgets...');
                    return [4 /*yield*/, prisma.widget.upsert({
                            where: {
                                id: 'chat-widget-001',
                            },
                            update: {},
                            create: {
                                id: 'chat-widget-001',
                                dashboardId: businessDashboard.id,
                                type: 'chat',
                                config: {
                                    showTimestamps: true,
                                    maxMessages: 100,
                                },
                            },
                        })];
                case 11:
                    chatWidget = _a.sent();
                    return [4 /*yield*/, prisma.widget.upsert({
                            where: {
                                id: 'drive-widget-001',
                            },
                            update: {},
                            create: {
                                id: 'drive-widget-001',
                                dashboardId: businessDashboard.id,
                                type: 'drive',
                                config: {
                                    viewMode: 'grid',
                                    sortBy: 'name',
                                },
                            },
                        })];
                case 12:
                    driveWidget = _a.sent();
                    console.log('✅ Dashboard widgets created/updated');
                    // 6. Create personal dashboard for test user
                    console.log('\n🏠 Creating personal dashboard...');
                    return [4 /*yield*/, prisma.dashboard.upsert({
                            where: {
                                id: 'personal-dashboard-001',
                            },
                            update: {},
                            create: {
                                id: 'personal-dashboard-001',
                                userId: testUser.id,
                                name: 'Personal Dashboard',
                                layout: {
                                    widgets: [
                                        { id: 'personal-chat', x: 0, y: 0, w: 12, h: 6 },
                                    ],
                                },
                                preferences: {
                                    theme: 'dark',
                                    compactMode: true,
                                },
                            },
                        })];
                case 13:
                    personalDashboard = _a.sent();
                    console.log('✅ Personal dashboard created/updated');
                    return [4 /*yield*/, prisma.widget.upsert({
                            where: {
                                id: 'personal-chat-widget-001',
                            },
                            update: {},
                            create: {
                                id: 'personal-chat-widget-001',
                                dashboardId: personalDashboard.id,
                                type: 'chat',
                                config: {
                                    showTimestamps: false,
                                    maxMessages: 50,
                                },
                            },
                        })];
                case 14:
                    personalChatWidget = _a.sent();
                    console.log('✅ Personal dashboard widgets created/updated');
                    // 8. Create a test conversation
                    console.log('\n💬 Creating test conversation...');
                    return [4 /*yield*/, prisma.conversation.upsert({
                            where: {
                                id: 'test-conversation-001',
                            },
                            update: {},
                            create: {
                                id: 'test-conversation-001',
                                dashboardId: businessDashboard.id,
                                name: 'Welcome to Test Business',
                                type: 'GROUP',
                                lastMessageAt: new Date(),
                            },
                        })];
                case 15:
                    testConversation = _a.sent();
                    console.log('✅ Test conversation created/updated');
                    return [4 /*yield*/, prisma.conversationParticipant.upsert({
                            where: {
                                id: 'participant-001',
                            },
                            update: {},
                            create: {
                                id: 'participant-001',
                                userId: businessUser.id,
                                conversationId: testConversation.id,
                                role: 'OWNER',
                                isActive: true,
                                joinedAt: new Date(),
                            },
                        })];
                case 16:
                    conversationParticipant = _a.sent();
                    console.log('✅ Conversation participant created/updated');
                    return [4 /*yield*/, prisma.message.upsert({
                            where: {
                                id: 'welcome-message-001',
                            },
                            update: {},
                            create: {
                                id: 'welcome-message-001',
                                conversationId: testConversation.id,
                                senderId: businessUser.id,
                                content: 'Welcome to your new business workspace! This is where you can collaborate with your team.',
                                type: 'TEXT',
                            },
                        })];
                case 17:
                    welcomeMessage = _a.sent();
                    console.log('✅ Welcome message created/updated');
                    console.log('\n🎉 Test data seeding completed successfully!');
                    console.log('\n📋 Summary of created data:');
                    console.log("  - Users: ".concat(testUser.email, ", ").concat(businessUser.email));
                    console.log("  - Business: ".concat(testBusiness.name, " (").concat(testBusiness.id, ")"));
                    console.log("  - Dashboards: Business Dashboard, Personal Dashboard");
                    console.log("  - Widgets: Chat, Drive, Personal Chat");
                    console.log("  - Conversation: Welcome to Test Business");
                    console.log('\n🔐 Test credentials:');
                    console.log("  Business User: ".concat(businessUser.email, " / business123"));
                    console.log("  Test User: ".concat(testUser.email, " / test123"));
                    console.log("  Admin: admin@blockonblock.com / admin123");
                    return [3 /*break*/, 21];
                case 18:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding test data:', error_1);
                    throw error_1;
                case 19: return [4 /*yield*/, prisma.$disconnect()];
                case 20:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 21: return [2 /*return*/];
            }
        });
    });
}
seedTestData();
