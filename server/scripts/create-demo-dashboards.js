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
var prisma_1 = require("../src/lib/prisma");
function createDemoDashboards() {
    return __awaiter(this, void 0, void 0, function () {
        var testUser, personalDashboard, workDashboard, projectsFolder, documentsFolder, subFolder, workFiles, _i, workFiles_1, fileData, familyDashboard, photosFolder, familyFiles, _a, familyFiles_1, fileData, emptyDashboard, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 21, 22, 24]);
                    console.log('🚀 Creating Demo Dashboards with File Content');
                    console.log('===============================================');
                    return [4 /*yield*/, prisma_1.prisma.user.findFirst({
                            where: { email: 'test@example.com' }
                        })];
                case 1:
                    testUser = _b.sent();
                    if (!testUser) {
                        console.log('❌ No test user found. Please run a seeding script first.');
                        return [2 /*return*/];
                    }
                    console.log("\u2705 Found test user: ".concat(testUser.email, " (").concat(testUser.id, ")"));
                    return [4 /*yield*/, prisma_1.prisma.dashboard.findFirst({
                            where: {
                                userId: testUser.id,
                                businessId: null,
                                institutionId: null,
                                householdId: null
                            }
                        })];
                case 2:
                    personalDashboard = _b.sent();
                    if (!!personalDashboard) return [3 /*break*/, 4];
                    return [4 /*yield*/, prisma_1.prisma.dashboard.create({
                            data: {
                                userId: testUser.id,
                                name: 'Personal Dashboard'
                            }
                        })];
                case 3:
                    personalDashboard = _b.sent();
                    console.log("\u2705 Created personal dashboard: ".concat(personalDashboard.name));
                    return [3 /*break*/, 5];
                case 4:
                    console.log("\u2705 Found existing personal dashboard: ".concat(personalDashboard.name));
                    _b.label = 5;
                case 5: return [4 /*yield*/, prisma_1.prisma.dashboard.create({
                        data: {
                            userId: testUser.id,
                            name: 'Work Project'
                        }
                    })];
                case 6:
                    workDashboard = _b.sent();
                    console.log("\u2705 Created work dashboard: ".concat(workDashboard.name, " (").concat(workDashboard.id, ")"));
                    return [4 /*yield*/, prisma_1.prisma.folder.create({
                            data: {
                                userId: testUser.id,
                                dashboardId: workDashboard.id,
                                name: 'Active Projects'
                            }
                        })];
                case 7:
                    projectsFolder = _b.sent();
                    return [4 /*yield*/, prisma_1.prisma.folder.create({
                            data: {
                                userId: testUser.id,
                                dashboardId: workDashboard.id,
                                name: 'Documents'
                            }
                        })];
                case 8:
                    documentsFolder = _b.sent();
                    return [4 /*yield*/, prisma_1.prisma.folder.create({
                            data: {
                                userId: testUser.id,
                                dashboardId: workDashboard.id,
                                parentId: projectsFolder.id,
                                name: 'Q4 Reports'
                            }
                        })];
                case 9:
                    subFolder = _b.sent();
                    workFiles = [
                        {
                            name: 'project-plan.pdf',
                            type: 'application/pdf',
                            size: 2048576, // 2MB
                            url: '/uploads/project-plan.pdf',
                            folderId: projectsFolder.id
                        },
                        {
                            name: 'budget-summary.xlsx',
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            size: 512000, // 500KB
                            url: '/uploads/budget-summary.xlsx',
                            folderId: projectsFolder.id
                        },
                        {
                            name: 'meeting-notes.docx',
                            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            size: 256000, // 250KB
                            url: '/uploads/meeting-notes.docx',
                            folderId: documentsFolder.id
                        },
                        {
                            name: 'quarterly-report.pdf',
                            type: 'application/pdf',
                            size: 1536000, // 1.5MB
                            url: '/uploads/quarterly-report.pdf',
                            folderId: subFolder.id
                        },
                        {
                            name: 'work-presentation.pptx',
                            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                            size: 3072000, // 3MB
                            url: '/uploads/work-presentation.pptx',
                            folderId: null // Root level
                        }
                    ];
                    _i = 0, workFiles_1 = workFiles;
                    _b.label = 10;
                case 10:
                    if (!(_i < workFiles_1.length)) return [3 /*break*/, 13];
                    fileData = workFiles_1[_i];
                    return [4 /*yield*/, prisma_1.prisma.file.create({
                            data: __assign({ userId: testUser.id, dashboardId: workDashboard.id }, fileData)
                        })];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 10];
                case 13:
                    console.log("\u2705 Created work content:");
                    console.log("   \uD83D\uDCC1 ".concat(projectsFolder.name, " (with 2 files)"));
                    console.log("   \uD83D\uDCC1 ".concat(documentsFolder.name, " (with 1 file)"));
                    console.log("   \uD83D\uDCC1 ".concat(subFolder.name, " (with 1 file)"));
                    console.log("   \uD83D\uDCC4 work-presentation.pptx (root level)");
                    return [4 /*yield*/, prisma_1.prisma.dashboard.create({
                            data: {
                                userId: testUser.id,
                                name: 'Family Planning'
                            }
                        })];
                case 14:
                    familyDashboard = _b.sent();
                    console.log("\u2705 Created family dashboard: ".concat(familyDashboard.name, " (").concat(familyDashboard.id, ")"));
                    return [4 /*yield*/, prisma_1.prisma.folder.create({
                            data: {
                                userId: testUser.id,
                                dashboardId: familyDashboard.id,
                                name: 'Family Photos'
                            }
                        })];
                case 15:
                    photosFolder = _b.sent();
                    familyFiles = [
                        {
                            name: 'vacation-2024.jpg',
                            type: 'image/jpeg',
                            size: 5242880, // 5MB
                            url: '/uploads/vacation-2024.jpg',
                            folderId: photosFolder.id
                        },
                        {
                            name: 'birthday-party.jpg',
                            type: 'image/jpeg',
                            size: 3145728, // 3MB
                            url: '/uploads/birthday-party.jpg',
                            folderId: photosFolder.id
                        },
                        {
                            name: 'meal-planning.pdf',
                            type: 'application/pdf',
                            size: 128000, // 125KB
                            url: '/uploads/meal-planning.pdf',
                            folderId: null // Root level
                        }
                    ];
                    _a = 0, familyFiles_1 = familyFiles;
                    _b.label = 16;
                case 16:
                    if (!(_a < familyFiles_1.length)) return [3 /*break*/, 19];
                    fileData = familyFiles_1[_a];
                    return [4 /*yield*/, prisma_1.prisma.file.create({
                            data: __assign({ userId: testUser.id, dashboardId: familyDashboard.id }, fileData)
                        })];
                case 17:
                    _b.sent();
                    _b.label = 18;
                case 18:
                    _a++;
                    return [3 /*break*/, 16];
                case 19:
                    console.log("\u2705 Created family content:");
                    console.log("   \uD83D\uDCC1 ".concat(photosFolder.name, " (with 2 photos)"));
                    console.log("   \uD83D\uDCC4 meal-planning.pdf (root level)");
                    return [4 /*yield*/, prisma_1.prisma.dashboard.create({
                            data: {
                                userId: testUser.id,
                                name: 'Empty Test Dashboard'
                            }
                        })];
                case 20:
                    emptyDashboard = _b.sent();
                    console.log("\u2705 Created empty dashboard: ".concat(emptyDashboard.name, " (").concat(emptyDashboard.id, ")"));
                    // Summary
                    console.log('\n📊 Demo Setup Complete:');
                    console.log("   ".concat(workDashboard.name, ": 3 folders, 5 files (~7.3MB)"));
                    console.log("   ".concat(familyDashboard.name, ": 1 folder, 3 files (~8.3MB)"));
                    console.log("   ".concat(emptyDashboard.name, ": No content (for empty deletion testing)"));
                    console.log('\n🎯 Ready for dashboard deletion demo at: http://localhost:3000/demo/dashboard-deletion');
                    return [3 /*break*/, 24];
                case 21:
                    error_1 = _b.sent();
                    console.error('❌ Demo setup failed:', error_1);
                    return [3 /*break*/, 24];
                case 22: return [4 /*yield*/, prisma_1.prisma.$disconnect()];
                case 23:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 24: return [2 /*return*/];
            }
        });
    });
}
// Run the demo setup
createDemoDashboards().catch(console.error);
