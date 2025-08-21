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
var bcrypt_1 = require("bcrypt");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var testUsers, users, _i, testUsers_1, userData, existingUser, hashedPassword, user, conversations, createdConversations, _a, conversations_1, conversationData, existingConversation, conversation, messages, _b, messages_1, messageData, message, threads, _c, threads_1, threadData, thread, _d, _e, messageData;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    console.log('🌱 Seeding chat data...');
                    testUsers = [
                        {
                            email: 'alice@example.com',
                            name: 'Alice Johnson'
                        },
                        {
                            email: 'bob@example.com',
                            name: 'Bob Smith'
                        },
                        {
                            email: 'carol@example.com',
                            name: 'Carol Davis'
                        },
                        {
                            email: 'dave@example.com',
                            name: 'Dave Wilson'
                        }
                    ];
                    users = [];
                    _i = 0, testUsers_1 = testUsers;
                    _f.label = 1;
                case 1:
                    if (!(_i < testUsers_1.length)) return [3 /*break*/, 7];
                    userData = testUsers_1[_i];
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: userData.email }
                        })];
                case 2:
                    existingUser = _f.sent();
                    if (!!existingUser) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, bcrypt_1.hash)('password123', 12)];
                case 3:
                    hashedPassword = _f.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: userData.email,
                                name: userData.name,
                                password: hashedPassword,
                                emailVerified: new Date()
                            }
                        })];
                case 4:
                    user = _f.sent();
                    users.push(user);
                    console.log("\u2705 Created user: ".concat(user.name));
                    return [3 /*break*/, 6];
                case 5:
                    users.push(existingUser);
                    console.log("\u2139\uFE0F  User already exists: ".concat(existingUser.name));
                    _f.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7:
                    conversations = [
                        {
                            name: 'Project Alpha Team',
                            type: 'GROUP',
                            participants: [users[0].id, users[1].id, users[2].id]
                        },
                        {
                            name: null,
                            type: 'DIRECT',
                            participants: [users[0].id, users[1].id]
                        },
                        {
                            name: 'Design Discussion',
                            type: 'GROUP',
                            participants: [users[1].id, users[2].id, users[3].id]
                        },
                        {
                            name: null,
                            type: 'DIRECT',
                            participants: [users[0].id, users[3].id]
                        }
                    ];
                    createdConversations = [];
                    _a = 0, conversations_1 = conversations;
                    _f.label = 8;
                case 8:
                    if (!(_a < conversations_1.length)) return [3 /*break*/, 13];
                    conversationData = conversations_1[_a];
                    return [4 /*yield*/, prisma.conversation.findFirst({
                            where: {
                                type: conversationData.type,
                                participants: {
                                    every: {
                                        userId: { in: conversationData.participants }
                                    }
                                }
                            }
                        })];
                case 9:
                    existingConversation = _f.sent();
                    if (!!existingConversation) return [3 /*break*/, 11];
                    return [4 /*yield*/, prisma.conversation.create({
                            data: {
                                name: conversationData.name,
                                type: conversationData.type,
                                participants: {
                                    create: conversationData.participants.map(function (userId) { return ({
                                        userId: userId,
                                        role: 'MEMBER'
                                    }); })
                                }
                            }
                        })];
                case 10:
                    conversation = _f.sent();
                    createdConversations.push(conversation);
                    console.log("\u2705 Created ".concat(conversationData.type, " conversation: ").concat(conversationData.name || 'Direct Message'));
                    return [3 /*break*/, 12];
                case 11:
                    createdConversations.push(existingConversation);
                    console.log("\u2139\uFE0F  Conversation already exists: ".concat(conversationData.name || 'Direct Message'));
                    _f.label = 12;
                case 12:
                    _a++;
                    return [3 /*break*/, 8];
                case 13:
                    messages = [
                        // Project Alpha Team messages
                        {
                            conversationId: createdConversations[0].id,
                            senderId: users[0].id,
                            content: "Hey team! I've been working on the new feature for Project Alpha. Anyone want to review the initial mockups?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
                        },
                        {
                            conversationId: createdConversations[0].id,
                            senderId: users[1].id,
                            content: "I'd love to see them! Can you share the Figma link?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5) // 1.5 hours ago
                        },
                        {
                            conversationId: createdConversations[0].id,
                            senderId: users[2].id,
                            content: "Just finished reviewing the backend API. Everything looks good to proceed!",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
                        },
                        {
                            conversationId: createdConversations[0].id,
                            senderId: users[0].id,
                            content: "Perfect! Let's schedule a team meeting tomorrow to discuss the next steps.",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
                        },
                        // Direct message between Alice and Bob
                        {
                            conversationId: createdConversations[1].id,
                            senderId: users[0].id,
                            content: "Hi Bob! How's the new project going?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3) // 3 hours ago
                        },
                        {
                            conversationId: createdConversations[1].id,
                            senderId: users[1].id,
                            content: "Going great! Just finished the first sprint. Want to grab coffee later?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5) // 2.5 hours ago
                        },
                        {
                            conversationId: createdConversations[1].id,
                            senderId: users[0].id,
                            content: "Absolutely! How about 3 PM at the usual spot?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
                        },
                        // Design Discussion messages
                        {
                            conversationId: createdConversations[2].id,
                            senderId: users[1].id,
                            content: "What do you think about the new color scheme for the dashboard?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 45) // 45 minutes ago
                        },
                        {
                            conversationId: createdConversations[2].id,
                            senderId: users[2].id,
                            content: "I love the new palette! Much more modern and accessible.",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
                        },
                        {
                            conversationId: createdConversations[2].id,
                            senderId: users[3].id,
                            content: "Agreed! The contrast ratios are much better now.",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 20) // 20 minutes ago
                        },
                        // Direct message between Alice and Dave
                        {
                            conversationId: createdConversations[3].id,
                            senderId: users[0].id,
                            content: "Dave, can you help me with the database migration?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1) // 1 hour ago
                        },
                        {
                            conversationId: createdConversations[3].id,
                            senderId: users[3].id,
                            content: "Of course! What's the issue you're running into?",
                            type: 'TEXT',
                            createdAt: new Date(Date.now() - 1000 * 60 * 50) // 50 minutes ago
                        }
                    ];
                    _b = 0, messages_1 = messages;
                    _f.label = 14;
                case 14:
                    if (!(_b < messages_1.length)) return [3 /*break*/, 17];
                    messageData = messages_1[_b];
                    return [4 /*yield*/, prisma.message.create({
                            data: messageData
                        })];
                case 15:
                    message = _f.sent();
                    console.log("\u2705 Created message: \"".concat(messageData.content.substring(0, 50), "...\""));
                    _f.label = 16;
                case 16:
                    _b++;
                    return [3 /*break*/, 14];
                case 17:
                    threads = [
                        {
                            conversationId: createdConversations[0].id,
                            name: "Feature Review Discussion",
                            type: 'TOPIC',
                            messages: [
                                {
                                    senderId: users[1].id,
                                    content: "I have some concerns about the user flow in the new feature.",
                                    type: 'TEXT',
                                    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1)
                                },
                                {
                                    senderId: users[0].id,
                                    content: "What specific issues are you seeing?",
                                    type: 'TEXT',
                                    createdAt: new Date(Date.now() - 1000 * 60 * 55)
                                },
                                {
                                    senderId: users[1].id,
                                    content: "The onboarding steps feel too long. We might lose users.",
                                    type: 'TEXT',
                                    createdAt: new Date(Date.now() - 1000 * 60 * 50)
                                }
                            ]
                        }
                    ];
                    _c = 0, threads_1 = threads;
                    _f.label = 18;
                case 18:
                    if (!(_c < threads_1.length)) return [3 /*break*/, 25];
                    threadData = threads_1[_c];
                    return [4 /*yield*/, prisma.thread.create({
                            data: {
                                conversationId: threadData.conversationId,
                                name: threadData.name,
                                type: threadData.type
                            }
                        })];
                case 19:
                    thread = _f.sent();
                    _d = 0, _e = threadData.messages;
                    _f.label = 20;
                case 20:
                    if (!(_d < _e.length)) return [3 /*break*/, 23];
                    messageData = _e[_d];
                    return [4 /*yield*/, prisma.message.create({
                            data: __assign(__assign({}, messageData), { conversationId: threadData.conversationId, threadId: thread.id })
                        })];
                case 21:
                    _f.sent();
                    _f.label = 22;
                case 22:
                    _d++;
                    return [3 /*break*/, 20];
                case 23:
                    console.log("\u2705 Created thread: \"".concat(threadData.name, "\""));
                    _f.label = 24;
                case 24:
                    _c++;
                    return [3 /*break*/, 18];
                case 25:
                    console.log('🎉 Chat seeding completed successfully!');
                    console.log("\uD83D\uDCCA Created ".concat(users.length, " users, ").concat(createdConversations.length, " conversations, and ").concat(messages.length, " messages"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Error seeding chat data:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
