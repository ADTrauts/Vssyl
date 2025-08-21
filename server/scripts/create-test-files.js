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
function createTestFiles() {
    return __awaiter(this, void 0, void 0, function () {
        var users, user, _i, users_1, user, testFolder, testFiles, rootFile, anotherFolder, workFile, driveFolder, driveFile, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 14, 15, 17]);
                    console.log('🔧 Creating test files and folders...');
                    return [4 /*yield*/, prisma.user.findMany()];
                case 1:
                    users = _a.sent();
                    console.log('Found users:', users.map(function (u) { return ({ id: u.id, email: u.email, name: u.name }); }));
                    if (!(users.length === 0)) return [3 /*break*/, 3];
                    console.log('No users found, creating a test user...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'test@example.com',
                                password: 'hashedpassword',
                                name: 'Test User',
                            },
                        })];
                case 2:
                    user = _a.sent();
                    users.push(user);
                    _a.label = 3;
                case 3:
                    _i = 0, users_1 = users;
                    _a.label = 4;
                case 4:
                    if (!(_i < users_1.length)) return [3 /*break*/, 13];
                    user = users_1[_i];
                    console.log("Creating test data for user: ".concat(user.email));
                    return [4 /*yield*/, prisma.folder.create({
                            data: {
                                name: 'Test Documents',
                                userId: user.id,
                            },
                        })];
                case 5:
                    testFolder = _a.sent();
                    console.log('Created folder:', testFolder.name);
                    return [4 /*yield*/, Promise.all([
                            prisma.file.create({
                                data: {
                                    name: 'document.txt',
                                    type: 'text/plain',
                                    size: 1024,
                                    url: '/uploads/test-document.txt',
                                    userId: user.id,
                                    folderId: testFolder.id,
                                },
                            }),
                            prisma.file.create({
                                data: {
                                    name: 'presentation.pptx',
                                    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                                    size: 2048,
                                    url: '/uploads/test-presentation.pptx',
                                    userId: user.id,
                                    folderId: testFolder.id,
                                },
                            }),
                            prisma.file.create({
                                data: {
                                    name: 'spreadsheet.xlsx',
                                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                    size: 3072,
                                    url: '/uploads/test-spreadsheet.xlsx',
                                    userId: user.id,
                                    folderId: testFolder.id,
                                },
                            }),
                            prisma.file.create({
                                data: {
                                    name: 'image.jpg',
                                    type: 'image/jpeg',
                                    size: 4096,
                                    url: '/uploads/test-image.jpg',
                                    userId: user.id,
                                    folderId: testFolder.id,
                                },
                            }),
                            // Add files that would match "drive" search
                            prisma.file.create({
                                data: {
                                    name: 'drive-settings.json',
                                    type: 'application/json',
                                    size: 512,
                                    url: '/uploads/drive-settings.json',
                                    userId: user.id,
                                    folderId: testFolder.id,
                                },
                            }),
                            prisma.file.create({
                                data: {
                                    name: 'my-drive-folder',
                                    type: 'folder',
                                    size: 0,
                                    url: '/uploads/my-drive-folder',
                                    userId: user.id,
                                    folderId: testFolder.id,
                                },
                            }),
                        ])];
                case 6:
                    testFiles = _a.sent();
                    console.log('Created files:', testFiles.map(function (f) { return f.name; }));
                    return [4 /*yield*/, prisma.file.create({
                            data: {
                                name: 'README.md',
                                type: 'text/markdown',
                                size: 512,
                                url: '/uploads/README.md',
                                userId: user.id,
                                // No folderId = root level
                            },
                        })];
                case 7:
                    rootFile = _a.sent();
                    console.log('Created root file:', rootFile.name);
                    return [4 /*yield*/, prisma.folder.create({
                            data: {
                                name: 'Work Projects',
                                userId: user.id,
                            },
                        })];
                case 8:
                    anotherFolder = _a.sent();
                    console.log('Created another folder:', anotherFolder.name);
                    return [4 /*yield*/, prisma.file.create({
                            data: {
                                name: 'project-plan.docx',
                                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                size: 1536,
                                url: '/uploads/project-plan.docx',
                                userId: user.id,
                                folderId: anotherFolder.id,
                            },
                        })];
                case 9:
                    workFile = _a.sent();
                    console.log('Created work file:', workFile.name);
                    return [4 /*yield*/, prisma.folder.create({
                            data: {
                                name: 'Google Drive Backup',
                                userId: user.id,
                            },
                        })];
                case 10:
                    driveFolder = _a.sent();
                    console.log('Created drive folder:', driveFolder.name);
                    return [4 /*yield*/, prisma.file.create({
                            data: {
                                name: 'drive-export.csv',
                                type: 'text/csv',
                                size: 256,
                                url: '/uploads/drive-export.csv',
                                userId: user.id,
                                folderId: driveFolder.id,
                            },
                        })];
                case 11:
                    driveFile = _a.sent();
                    console.log('Created drive file:', driveFile.name);
                    _a.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 4];
                case 13:
                    console.log('✅ Test data created successfully for all users!');
                    return [3 /*break*/, 17];
                case 14:
                    error_1 = _a.sent();
                    console.error('❌ Error creating test data:', error_1);
                    return [3 /*break*/, 17];
                case 15: return [4 /*yield*/, prisma.$disconnect()];
                case 16:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 17: return [2 /*return*/];
            }
        });
    });
}
createTestFiles();
