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
function createUserConsentData() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, privacySettings, consent, testUsers, _i, testUsers_1, testUser, user, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 11, 12, 14]);
                    console.log('🔐 Creating user consent data for collective AI learning...\n');
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: { role: 'ADMIN' }
                        })];
                case 1:
                    adminUser = _a.sent();
                    if (!adminUser) {
                        console.log('❌ No admin user found. Please create a user first.');
                        return [2 /*return*/];
                    }
                    console.log("\uD83D\uDC64 Found admin user: ".concat(adminUser.email));
                    return [4 /*yield*/, prisma.userPrivacySettings.upsert({
                            where: { userId: adminUser.id },
                            update: {
                                allowCollectiveLearning: true,
                                allowDataProcessing: true,
                                allowAnalytics: true,
                                allowAuditLogs: true
                            },
                            create: {
                                userId: adminUser.id,
                                allowCollectiveLearning: true,
                                allowDataProcessing: true,
                                allowAnalytics: true,
                                allowAuditLogs: true,
                                profileVisibility: 'PUBLIC',
                                activityVisibility: 'PUBLIC',
                                allowMarketingEmails: false,
                                dataRetentionPeriod: 2555
                            }
                        })];
                case 2:
                    privacySettings = _a.sent();
                    console.log('✅ Privacy settings updated for admin user');
                    return [4 /*yield*/, prisma.userConsent.upsert({
                            where: {
                                userId_consentType_version: {
                                    userId: adminUser.id,
                                    consentType: 'COLLECTIVE_AI_LEARNING',
                                    version: '1.0'
                                }
                            },
                            update: {
                                granted: true,
                                grantedAt: new Date(),
                                revokedAt: null
                            },
                            create: {
                                userId: adminUser.id,
                                consentType: 'COLLECTIVE_AI_LEARNING',
                                version: '1.0',
                                granted: true,
                                grantedAt: new Date(),
                                ipAddress: '127.0.0.1',
                                userAgent: 'Admin Setup Script'
                            }
                        })];
                case 3:
                    consent = _a.sent();
                    console.log('✅ Consent record created for collective AI learning');
                    testUsers = [
                        {
                            email: 'test.user1@example.com',
                            name: 'Test User 1',
                            allowCollectiveLearning: true
                        },
                        {
                            email: 'test.user2@example.com',
                            name: 'Test User 2',
                            allowCollectiveLearning: false
                        }
                    ];
                    _i = 0, testUsers_1 = testUsers;
                    _a.label = 4;
                case 4:
                    if (!(_i < testUsers_1.length)) return [3 /*break*/, 10];
                    testUser = testUsers_1[_i];
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: testUser.email },
                            update: {},
                            create: {
                                email: testUser.email,
                                name: testUser.name,
                                password: 'hashedpassword123', // In real app, this would be properly hashed
                                role: 'USER'
                            }
                        })];
                case 5:
                    user = _a.sent();
                    return [4 /*yield*/, prisma.userPrivacySettings.upsert({
                            where: { userId: user.id },
                            update: {
                                allowCollectiveLearning: testUser.allowCollectiveLearning
                            },
                            create: {
                                userId: user.id,
                                allowCollectiveLearning: testUser.allowCollectiveLearning,
                                allowDataProcessing: true,
                                allowAnalytics: true,
                                allowAuditLogs: true,
                                profileVisibility: 'PUBLIC',
                                activityVisibility: 'PUBLIC',
                                allowMarketingEmails: false,
                                dataRetentionPeriod: 2555
                            }
                        })];
                case 6:
                    _a.sent();
                    if (!testUser.allowCollectiveLearning) return [3 /*break*/, 8];
                    return [4 /*yield*/, prisma.userConsent.upsert({
                            where: {
                                userId_consentType_version: {
                                    userId: user.id,
                                    consentType: 'COLLECTIVE_AI_LEARNING',
                                    version: '1.0'
                                }
                            },
                            update: {},
                            create: {
                                userId: user.id,
                                consentType: 'COLLECTIVE_AI_LEARNING',
                                version: '1.0',
                                granted: true,
                                grantedAt: new Date(),
                                ipAddress: '127.0.0.1',
                                userAgent: 'Test Setup Script'
                            }
                        })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    console.log("\u2705 Created test user: ".concat(testUser.email, " (Consent: ").concat(testUser.allowCollectiveLearning, ")"));
                    _a.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 4];
                case 10:
                    console.log('\n🎉 User consent data creation completed!');
                    console.log('\n📊 Summary:');
                    console.log('- Admin user: Full consent for collective learning');
                    console.log('- Test User 1: Consents to collective learning');
                    console.log('- Test User 2: Does not consent to collective learning');
                    return [3 /*break*/, 14];
                case 11:
                    error_1 = _a.sent();
                    console.error('❌ Error creating user consent data:', error_1);
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
createUserConsentData();
