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
function installModules() {
    return __awaiter(this, void 0, void 0, function () {
        var user, modules, _i, modules_1, module_1, existingInstallation, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔧 Installing modules for current user...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, 11, 13]);
                    return [4 /*yield*/, prisma.user.findFirst()];
                case 2:
                    user = _a.sent();
                    if (!user) {
                        console.log('❌ No users found. Please create a user first.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, prisma.module.findMany({
                            take: 3
                        })];
                case 3:
                    modules = _a.sent();
                    if (modules.length === 0) {
                        console.log('❌ No modules found. Please seed modules first.');
                        return [2 /*return*/];
                    }
                    _i = 0, modules_1 = modules;
                    _a.label = 4;
                case 4:
                    if (!(_i < modules_1.length)) return [3 /*break*/, 9];
                    module_1 = modules_1[_i];
                    return [4 /*yield*/, prisma.moduleInstallation.findUnique({
                            where: {
                                moduleId_userId: {
                                    moduleId: module_1.id,
                                    userId: user.id
                                }
                            }
                        })];
                case 5:
                    existingInstallation = _a.sent();
                    if (!!existingInstallation) return [3 /*break*/, 7];
                    return [4 /*yield*/, prisma.moduleInstallation.create({
                            data: {
                                moduleId: module_1.id,
                                userId: user.id,
                                enabled: true,
                                configured: {
                                    // Default configuration
                                    enabled: true,
                                    settings: {}
                                }
                            }
                        })];
                case 6:
                    _a.sent();
                    console.log("\u2705 Installed module: ".concat(module_1.name));
                    return [3 /*break*/, 8];
                case 7:
                    console.log("\u23ED\uFE0F  Module already installed: ".concat(module_1.name));
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 4];
                case 9:
                    console.log('🎉 Module installation completed!');
                    return [3 /*break*/, 13];
                case 10:
                    error_1 = _a.sent();
                    console.error('❌ Error installing modules:', error_1);
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
installModules();
