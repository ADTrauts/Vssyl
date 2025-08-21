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
function createSampleData() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 9, 10, 12]);
                    console.log('Creating sample data for centralized AI learning...');
                    // Create system configuration
                    return [4 /*yield*/, prisma.systemConfiguration.upsert({
                            where: { key: 'ai_privacy_settings' },
                            update: {
                                value: JSON.stringify({
                                    anonymizationLevel: 'standard',
                                    aggregationThreshold: 5,
                                    dataRetentionDays: 90,
                                    userConsentRequired: true,
                                    crossUserDataSharing: false,
                                    auditLogging: true
                                }),
                                description: 'Privacy settings for centralized AI learning'
                            },
                            create: {
                                key: 'ai_privacy_settings',
                                value: JSON.stringify({
                                    anonymizationLevel: 'standard',
                                    aggregationThreshold: 5,
                                    dataRetentionDays: 90,
                                    userConsentRequired: true,
                                    crossUserDataSharing: false,
                                    auditLogging: true
                                }),
                                description: 'Privacy settings for centralized AI learning'
                            }
                        })];
                case 1:
                    // Create system configuration
                    _a.sent();
                    // Create sample global patterns
                    return [4 /*yield*/, prisma.globalPattern.upsert({
                            where: { id: 'pattern_1' },
                            update: {},
                            create: {
                                id: 'pattern_1',
                                patternType: 'behavioral',
                                description: 'Users prefer to organize files in the Drive module during morning hours',
                                frequency: 15,
                                confidence: 0.85,
                                strength: 0.72,
                                modules: ['drive'],
                                userSegment: 'all',
                                impact: 'positive',
                                recommendations: ['Optimize Drive module performance for morning usage', 'Add morning-specific features'],
                                dataPoints: 45,
                                lastUpdated: new Date(),
                                trend: 'increasing',
                                privacyLevel: 'anonymized'
                            }
                        })];
                case 2:
                    // Create sample global patterns
                    _a.sent();
                    return [4 /*yield*/, prisma.globalPattern.upsert({
                            where: { id: 'pattern_2' },
                            update: {},
                            create: {
                                id: 'pattern_2',
                                patternType: 'temporal',
                                description: 'Peak chat activity occurs between 2-4 PM across all users',
                                frequency: 23,
                                confidence: 0.78,
                                strength: 0.65,
                                modules: ['chat'],
                                userSegment: 'all',
                                impact: 'positive',
                                recommendations: ['Schedule important notifications during peak hours', 'Optimize chat performance for afternoon'],
                                dataPoints: 67,
                                lastUpdated: new Date(),
                                trend: 'stable',
                                privacyLevel: 'anonymized'
                            }
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.globalPattern.upsert({
                            where: { id: 'pattern_3' },
                            update: {},
                            create: {
                                id: 'pattern_3',
                                patternType: 'communication',
                                description: 'Users prefer concise, actionable responses in business contexts',
                                frequency: 31,
                                confidence: 0.92,
                                strength: 0.88,
                                modules: ['business', 'chat'],
                                userSegment: 'business',
                                impact: 'positive',
                                recommendations: ['Optimize AI responses for business users', 'Focus on actionable insights'],
                                dataPoints: 89,
                                lastUpdated: new Date(),
                                trend: 'increasing',
                                privacyLevel: 'anonymized'
                            }
                        })];
                case 4:
                    _a.sent();
                    // Create sample collective insights
                    return [4 /*yield*/, prisma.collectiveInsight.upsert({
                            where: { id: 'insight_1' },
                            update: {},
                            create: {
                                id: 'insight_1',
                                type: 'optimization',
                                title: 'Optimize Morning Drive Usage',
                                description: 'High-frequency pattern shows users prefer Drive organization in mornings',
                                confidence: 0.85,
                                impact: 'high',
                                affectedModules: ['drive'],
                                affectedUserSegments: ['all'],
                                actionable: true,
                                recommendations: ['Add morning-specific features', 'Optimize performance for morning usage'],
                                implementationComplexity: 'moderate',
                                estimatedBenefit: 0.75,
                                dataPoints: 45,
                                createdAt: new Date(),
                                lastValidated: new Date()
                            }
                        })];
                case 5:
                    // Create sample collective insights
                    _a.sent();
                    return [4 /*yield*/, prisma.collectiveInsight.upsert({
                            where: { id: 'insight_2' },
                            update: {},
                            create: {
                                id: 'insight_2',
                                type: 'best_practice',
                                title: 'Business Communication Preferences',
                                description: 'Business users prefer concise, actionable AI responses',
                                confidence: 0.92,
                                impact: 'high',
                                affectedModules: ['business', 'chat'],
                                affectedUserSegments: ['business'],
                                actionable: true,
                                recommendations: ['Train AI for concise business responses', 'Focus on actionable insights'],
                                implementationComplexity: 'simple',
                                estimatedBenefit: 0.88,
                                dataPoints: 89,
                                createdAt: new Date(),
                                lastValidated: new Date()
                            }
                        })];
                case 6:
                    _a.sent();
                    // Create sample global learning events
                    return [4 /*yield*/, prisma.globalLearningEvent.upsert({
                            where: { id: 'event_1' },
                            update: {},
                            create: {
                                id: 'event_1',
                                userId: 'user_hash_1',
                                eventType: 'interaction',
                                context: 'drive',
                                patternData: { actionType: 'file_organization', timeOfDay: 'morning' },
                                confidence: 0.85,
                                impact: 'medium',
                                frequency: 1,
                                applied: true,
                                validated: true,
                                createdAt: new Date()
                            }
                        })];
                case 7:
                    // Create sample global learning events
                    _a.sent();
                    return [4 /*yield*/, prisma.globalLearningEvent.upsert({
                            where: { id: 'event_2' },
                            update: {},
                            create: {
                                id: 'event_2',
                                userId: 'user_hash_2',
                                eventType: 'interaction',
                                context: 'chat',
                                patternData: { actionType: 'conversation', timeOfDay: 'afternoon' },
                                confidence: 0.78,
                                impact: 'medium',
                                frequency: 1,
                                applied: true,
                                validated: true,
                                createdAt: new Date()
                            }
                        })];
                case 8:
                    _a.sent();
                    console.log('✅ Sample data created successfully!');
                    console.log('📊 Created:');
                    console.log('  - 1 System Configuration');
                    console.log('  - 3 Global Patterns');
                    console.log('  - 2 Collective Insights');
                    console.log('  - 2 Global Learning Events');
                    return [3 /*break*/, 12];
                case 9:
                    error_1 = _a.sent();
                    console.error('❌ Error creating sample data:', error_1);
                    return [3 /*break*/, 12];
                case 10: return [4 /*yield*/, prisma.$disconnect()];
                case 11:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 12: return [2 /*return*/];
            }
        });
    });
}
createSampleData();
