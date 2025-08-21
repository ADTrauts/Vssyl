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
function createTestDataAllModules() {
    return __awaiter(this, void 0, void 0, function () {
        var user, newUser, dashboards, conversation, messages, conversation2, messages2, additionalFiles, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 10, 11, 13]);
                    console.log('🔧 Creating test data for all searchable modules...');
                    return [4 /*yield*/, prisma.user.findFirst()];
                case 1:
                    user = _a.sent();
                    if (!!user) return [3 /*break*/, 3];
                    console.log('No users found, creating a test user...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'test@example.com',
                                password: 'hashedpassword',
                                name: 'Test User',
                            },
                        })];
                case 2:
                    newUser = _a.sent();
                    user = newUser;
                    _a.label = 3;
                case 3:
                    console.log('Using user:', user.email);
                    // 1. Create test dashboards
                    console.log('\n📊 Creating test dashboards...');
                    return [4 /*yield*/, Promise.all([
                            prisma.dashboard.create({
                                data: {
                                    name: 'My Work Dashboard',
                                    userId: user.id,
                                    layout: {},
                                    preferences: {},
                                },
                            }),
                            prisma.dashboard.create({
                                data: {
                                    name: 'Personal Projects',
                                    userId: user.id,
                                    layout: {},
                                    preferences: {},
                                },
                            }),
                            prisma.dashboard.create({
                                data: {
                                    name: 'Analytics Overview',
                                    userId: user.id,
                                    layout: {},
                                    preferences: {},
                                },
                            }),
                        ])];
                case 4:
                    dashboards = _a.sent();
                    console.log('Created dashboards:', dashboards.map(function (d) { return d.name; }));
                    // 2. Create test conversations and messages
                    console.log('\n💬 Creating test conversations and messages...');
                    return [4 /*yield*/, prisma.conversation.create({
                            data: {
                                name: 'Project Discussion',
                                type: 'GROUP',
                                participants: {
                                    create: {
                                        userId: user.id,
                                        role: 'MEMBER',
                                        isActive: true,
                                    },
                                },
                            },
                        })];
                case 5:
                    conversation = _a.sent();
                    console.log('Created conversation:', conversation.name);
                    return [4 /*yield*/, Promise.all([
                            prisma.message.create({
                                data: {
                                    content: 'Hello everyone! How is the project going?',
                                    senderId: user.id,
                                    conversationId: conversation.id,
                                    type: 'TEXT',
                                },
                            }),
                            prisma.message.create({
                                data: {
                                    content: 'I think we should discuss the timeline for the next phase.',
                                    senderId: user.id,
                                    conversationId: conversation.id,
                                    type: 'TEXT',
                                },
                            }),
                            prisma.message.create({
                                data: {
                                    content: 'Can someone share the latest updates on the drive integration?',
                                    senderId: user.id,
                                    conversationId: conversation.id,
                                    type: 'TEXT',
                                },
                            }),
                            prisma.message.create({
                                data: {
                                    content: 'I found some interesting files in the shared drive folder.',
                                    senderId: user.id,
                                    conversationId: conversation.id,
                                    type: 'TEXT',
                                },
                            }),
                        ])];
                case 6:
                    messages = _a.sent();
                    console.log('Created messages:', messages.map(function (m) { return m.content.substring(0, 30) + '...'; }));
                    return [4 /*yield*/, prisma.conversation.create({
                            data: {
                                name: 'Team Chat',
                                type: 'GROUP',
                                participants: {
                                    create: {
                                        userId: user.id,
                                        role: 'MEMBER',
                                        isActive: true,
                                    },
                                },
                            },
                        })];
                case 7:
                    conversation2 = _a.sent();
                    console.log('Created conversation:', conversation2.name);
                    return [4 /*yield*/, Promise.all([
                            prisma.message.create({
                                data: {
                                    content: 'Good morning team!',
                                    senderId: user.id,
                                    conversationId: conversation2.id,
                                    type: 'TEXT',
                                },
                            }),
                            prisma.message.create({
                                data: {
                                    content: 'I need help with the search functionality in our app.',
                                    senderId: user.id,
                                    conversationId: conversation2.id,
                                    type: 'TEXT',
                                },
                            }),
                            prisma.message.create({
                                data: {
                                    content: 'The global search feature is working great now!',
                                    senderId: user.id,
                                    conversationId: conversation2.id,
                                    type: 'TEXT',
                                },
                            }),
                        ])];
                case 8:
                    messages2 = _a.sent();
                    console.log('Created messages in Team Chat:', messages2.map(function (m) { return m.content.substring(0, 30) + '...'; }));
                    // 3. Create more test files with searchable content
                    console.log('\n📁 Creating additional test files...');
                    return [4 /*yield*/, Promise.all([
                            prisma.file.create({
                                data: {
                                    name: 'search-test-document.txt',
                                    type: 'text/plain',
                                    size: 1024,
                                    url: '/uploads/search-test-document.txt',
                                    userId: user.id,
                                },
                            }),
                            prisma.file.create({
                                data: {
                                    name: 'chat-log-export.csv',
                                    type: 'text/csv',
                                    size: 2048,
                                    url: '/uploads/chat-log-export.csv',
                                    userId: user.id,
                                },
                            }),
                            prisma.file.create({
                                data: {
                                    name: 'dashboard-config.json',
                                    type: 'application/json',
                                    size: 512,
                                    url: '/uploads/dashboard-config.json',
                                    userId: user.id,
                                },
                            }),
                        ])];
                case 9:
                    additionalFiles = _a.sent();
                    console.log('Created additional files:', additionalFiles.map(function (f) { return f.name; }));
                    console.log('\n✅ Test data created successfully for all modules!');
                    console.log('📊 Dashboards:', dashboards.length);
                    console.log('💬 Conversations:', 2);
                    console.log('💬 Messages:', messages.length + messages2.length);
                    console.log('📁 Additional files:', additionalFiles.length);
                    return [3 /*break*/, 13];
                case 10:
                    error_1 = _a.sent();
                    console.error('❌ Error creating test data:', error_1);
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, prisma.$disconnect()];
                case 12:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    });
}
createTestDataAllModules();
