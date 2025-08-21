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
exports.createCentralizedAITables = createCentralizedAITables;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function createCentralizedAITables() {
    return __awaiter(this, void 0, void 0, function () {
        var samplePatterns, _i, samplePatterns_1, pattern, sampleInsights, _a, sampleInsights_1, insight, sampleEvents, _b, sampleEvents_1, event_1, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🚀 Creating centralized AI learning tables...');
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 15, 16, 18]);
                    // Create system configuration for AI privacy settings
                    console.log('📝 Creating system configuration...');
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
                                description: 'AI Learning Privacy Settings',
                                updatedBy: 'system'
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
                                description: 'AI Learning Privacy Settings',
                                updatedBy: 'system'
                            }
                        })];
                case 2:
                    _c.sent();
                    console.log('✅ System configuration created successfully');
                    // Create sample global patterns for demonstration
                    console.log('📊 Creating sample global patterns...');
                    samplePatterns = [
                        {
                            id: 'sample_pattern_1',
                            patternType: 'behavioral',
                            description: 'Users prefer to organize files in hierarchical folder structures',
                            frequency: 15,
                            confidence: 0.85,
                            strength: 0.8,
                            modules: ['drive', 'business'],
                            userSegment: 'all',
                            impact: 'positive',
                            recommendations: [
                                'Optimize folder creation workflows',
                                'Implement smart folder suggestions',
                                'Add bulk organization tools'
                            ],
                            dataPoints: 150,
                            lastUpdated: new Date(),
                            trend: 'stable',
                            privacyLevel: 'anonymized'
                        },
                        {
                            id: 'sample_pattern_2',
                            patternType: 'temporal',
                            description: 'Peak productivity hours are between 9-11 AM and 2-4 PM',
                            frequency: 23,
                            confidence: 0.9,
                            strength: 0.85,
                            modules: ['all'],
                            userSegment: 'business',
                            impact: 'positive',
                            recommendations: [
                                'Schedule important tasks during peak hours',
                                'Optimize system performance for peak usage',
                                'Send notifications during optimal times'
                            ],
                            dataPoints: 230,
                            lastUpdated: new Date(),
                            trend: 'stable',
                            privacyLevel: 'anonymized'
                        },
                        {
                            id: 'sample_pattern_3',
                            patternType: 'communication',
                            description: 'Users respond faster to messages during work hours',
                            frequency: 18,
                            confidence: 0.8,
                            strength: 0.75,
                            modules: ['chat', 'business'],
                            userSegment: 'business',
                            impact: 'positive',
                            recommendations: [
                                'Prioritize work-hour communications',
                                'Set appropriate response time expectations',
                                'Optimize notification timing'
                            ],
                            dataPoints: 180,
                            lastUpdated: new Date(),
                            trend: 'stable',
                            privacyLevel: 'anonymized'
                        }
                    ];
                    _i = 0, samplePatterns_1 = samplePatterns;
                    _c.label = 3;
                case 3:
                    if (!(_i < samplePatterns_1.length)) return [3 /*break*/, 6];
                    pattern = samplePatterns_1[_i];
                    return [4 /*yield*/, prisma.globalPattern.upsert({
                            where: { id: pattern.id },
                            update: pattern,
                            create: pattern
                        })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('✅ Sample global patterns created successfully');
                    // Create sample collective insights
                    console.log('💡 Creating sample collective insights...');
                    sampleInsights = [
                        {
                            id: 'sample_insight_1',
                            type: 'optimization',
                            title: 'Optimize File Organization Workflows',
                            description: 'High-frequency pattern detected for hierarchical file organization',
                            confidence: 0.85,
                            impact: 'high',
                            affectedModules: ['drive', 'business'],
                            affectedUserSegments: ['all'],
                            actionable: true,
                            recommendations: [
                                'Implement smart folder suggestions',
                                'Add bulk organization tools',
                                'Create organization templates'
                            ],
                            implementationComplexity: 'moderate',
                            estimatedBenefit: 0.75,
                            dataPoints: 150,
                            createdAt: new Date(),
                            lastValidated: new Date()
                        },
                        {
                            id: 'sample_insight_2',
                            type: 'best_practice',
                            title: 'Leverage Peak Productivity Hours',
                            description: 'Users are most productive during specific time windows',
                            confidence: 0.9,
                            impact: 'medium',
                            affectedModules: ['all'],
                            affectedUserSegments: ['business'],
                            actionable: true,
                            recommendations: [
                                'Schedule system maintenance during off-peak hours',
                                'Optimize performance for peak usage times',
                                'Send important notifications during optimal hours'
                            ],
                            implementationComplexity: 'simple',
                            estimatedBenefit: 0.6,
                            dataPoints: 230,
                            createdAt: new Date(),
                            lastValidated: new Date()
                        }
                    ];
                    _a = 0, sampleInsights_1 = sampleInsights;
                    _c.label = 7;
                case 7:
                    if (!(_a < sampleInsights_1.length)) return [3 /*break*/, 10];
                    insight = sampleInsights_1[_a];
                    return [4 /*yield*/, prisma.collectiveInsight.upsert({
                            where: { id: insight.id },
                            update: insight,
                            create: insight
                        })];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9:
                    _a++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log('✅ Sample collective insights created successfully');
                    // Create sample global learning events
                    console.log('📚 Creating sample global learning events...');
                    sampleEvents = [
                        {
                            id: 'sample_event_1',
                            userId: 'user_hash_1',
                            eventType: 'pattern_recognition',
                            context: 'drive',
                            patternData: { actionType: 'folder_creation', frequency: 12 },
                            confidence: 0.8,
                            impact: 'medium',
                            frequency: 1,
                            applied: true,
                            validated: true
                        },
                        {
                            id: 'sample_event_2',
                            userId: 'user_hash_2',
                            eventType: 'preference_update',
                            context: 'chat',
                            patternData: { actionType: 'message_response', timing: 'work_hours' },
                            confidence: 0.75,
                            impact: 'low',
                            frequency: 1,
                            applied: true,
                            validated: true
                        }
                    ];
                    _b = 0, sampleEvents_1 = sampleEvents;
                    _c.label = 11;
                case 11:
                    if (!(_b < sampleEvents_1.length)) return [3 /*break*/, 14];
                    event_1 = sampleEvents_1[_b];
                    return [4 /*yield*/, prisma.globalLearningEvent.upsert({
                            where: { id: event_1.id },
                            update: event_1,
                            create: event_1
                        })];
                case 12:
                    _c.sent();
                    _c.label = 13;
                case 13:
                    _b++;
                    return [3 /*break*/, 11];
                case 14:
                    console.log('✅ Sample global learning events created successfully');
                    console.log('🎉 Centralized AI learning tables setup completed successfully!');
                    console.log('');
                    console.log('📋 Created tables:');
                    console.log('  - GlobalLearningEvent');
                    console.log('  - GlobalPattern');
                    console.log('  - CollectiveInsight');
                    console.log('  - SystemConfiguration');
                    console.log('');
                    console.log('🔗 Access the admin portal at: /admin-portal/ai-learning');
                    console.log('📊 Sample data has been created for demonstration');
                    return [3 /*break*/, 18];
                case 15:
                    error_1 = _c.sent();
                    console.error('❌ Error creating centralized AI tables:', error_1);
                    throw error_1;
                case 16: return [4 /*yield*/, prisma.$disconnect()];
                case 17:
                    _c.sent();
                    return [7 /*endfinally*/];
                case 18: return [2 /*return*/];
            }
        });
    });
}
// Run the script
if (require.main === module) {
    createCentralizedAITables()
        .then(function () {
        console.log('✅ Script completed successfully');
        process.exit(0);
    })
        .catch(function (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
}
