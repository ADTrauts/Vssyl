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
function seedModules() {
    return __awaiter(this, void 0, void 0, function () {
        var user, modules, _i, modules_1, moduleData, existingModule, newModule, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Seeding modules...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, 10, 12]);
                    return [4 /*yield*/, prisma.user.findFirst()];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        console.log('❌ No users found. Please create a user first.');
                        return [2 /*return*/];
                    }
                    modules = [
                        {
                            name: 'Calendar',
                            description: 'Schedule management and event planning with calendar integration',
                            version: '1.0.0',
                            category: 'PRODUCTIVITY',
                            tags: ['calendar', 'schedule', 'events', 'productivity'],
                            icon: null,
                            screenshots: [],
                            developerId: user.id,
                            status: 'APPROVED',
                            downloads: 42,
                            rating: 4.5,
                            reviewCount: 8,
                            manifest: {
                                name: 'Calendar',
                                version: '1.0.0',
                                description: 'Schedule management and event planning',
                                permissions: ['calendar:read', 'calendar:write'],
                                dependencies: [],
                                entryPoint: '/calendar',
                                settings: {
                                    defaultView: 'month',
                                    workingHours: { start: '09:00', end: '17:00' }
                                }
                            },
                            dependencies: [],
                            permissions: ['calendar:read', 'calendar:write']
                        },
                        {
                            name: 'Analytics Dashboard',
                            description: 'Advanced analytics and reporting with customizable charts and metrics',
                            version: '1.2.0',
                            category: 'ANALYTICS',
                            tags: ['analytics', 'charts', 'metrics', 'reporting'],
                            icon: null,
                            screenshots: [],
                            developerId: user.id,
                            status: 'APPROVED',
                            downloads: 156,
                            rating: 4.8,
                            reviewCount: 23,
                            manifest: {
                                name: 'Analytics Dashboard',
                                version: '1.2.0',
                                description: 'Advanced analytics and reporting',
                                permissions: ['analytics:read', 'data:export'],
                                dependencies: [],
                                entryPoint: '/analytics',
                                settings: {
                                    defaultMetrics: ['users', 'revenue', 'engagement'],
                                    chartTypes: ['line', 'bar', 'pie', 'heatmap']
                                }
                            },
                            dependencies: [],
                            permissions: ['analytics:read', 'data:export']
                        },
                        {
                            name: 'Task Manager',
                            description: 'Project and task management with team collaboration features',
                            version: '1.1.0',
                            category: 'PRODUCTIVITY',
                            tags: ['tasks', 'projects', 'collaboration', 'productivity'],
                            icon: null,
                            screenshots: [],
                            developerId: user.id,
                            status: 'APPROVED',
                            downloads: 89,
                            rating: 4.3,
                            reviewCount: 15,
                            manifest: {
                                name: 'Task Manager',
                                version: '1.1.0',
                                description: 'Project and task management',
                                permissions: ['tasks:read', 'tasks:write', 'projects:read'],
                                dependencies: [],
                                entryPoint: '/tasks',
                                settings: {
                                    defaultView: 'kanban',
                                    autoAssign: true,
                                    notifications: true
                                }
                            },
                            dependencies: [],
                            permissions: ['tasks:read', 'tasks:write', 'projects:read']
                        },
                        {
                            name: 'Code Editor',
                            description: 'Advanced code editor with syntax highlighting and Git integration',
                            version: '1.0.0',
                            category: 'DEVELOPMENT',
                            tags: ['code', 'editor', 'development', 'git'],
                            icon: null,
                            screenshots: [],
                            developerId: user.id,
                            status: 'APPROVED',
                            downloads: 234,
                            rating: 4.7,
                            reviewCount: 31,
                            manifest: {
                                name: 'Code Editor',
                                version: '1.0.0',
                                description: 'Advanced code editor with Git integration',
                                permissions: ['files:read', 'files:write', 'git:read'],
                                dependencies: [],
                                entryPoint: '/editor',
                                settings: {
                                    theme: 'dark',
                                    fontSize: 14,
                                    autoSave: true,
                                    gitIntegration: true
                                }
                            },
                            dependencies: [],
                            permissions: ['files:read', 'files:write', 'git:read']
                        },
                        {
                            name: 'Team Chat',
                            description: 'Enhanced team communication with channels, threads, and integrations',
                            version: '1.3.0',
                            category: 'COMMUNICATION',
                            tags: ['chat', 'team', 'communication', 'channels'],
                            icon: null,
                            screenshots: [],
                            developerId: user.id,
                            status: 'APPROVED',
                            downloads: 312,
                            rating: 4.6,
                            reviewCount: 45,
                            manifest: {
                                name: 'Team Chat',
                                version: '1.3.0',
                                description: 'Enhanced team communication',
                                permissions: ['chat:read', 'chat:write', 'channels:read'],
                                dependencies: [],
                                entryPoint: '/team-chat',
                                settings: {
                                    defaultChannels: ['general', 'random'],
                                    notifications: true,
                                    integrations: ['slack', 'discord']
                                }
                            },
                            dependencies: [],
                            permissions: ['chat:read', 'chat:write', 'channels:read']
                        }
                    ];
                    _i = 0, modules_1 = modules;
                    _a.label = 3;
                case 3:
                    if (!(_i < modules_1.length)) return [3 /*break*/, 8];
                    moduleData = modules_1[_i];
                    return [4 /*yield*/, prisma.module.findFirst({
                            where: { name: moduleData.name }
                        })];
                case 4:
                    existingModule = _a.sent();
                    if (!!existingModule) return [3 /*break*/, 6];
                    return [4 /*yield*/, prisma.module.create({
                            data: moduleData
                        })];
                case 5:
                    newModule = _a.sent();
                    console.log("\u2705 Created module: ".concat(newModule.name));
                    return [3 /*break*/, 7];
                case 6:
                    console.log("\u23ED\uFE0F  Module already exists: ".concat(moduleData.name));
                    _a.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8:
                    console.log('🎉 Module seeding completed!');
                    return [3 /*break*/, 12];
                case 9:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding modules:', error_1);
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
seedModules();
