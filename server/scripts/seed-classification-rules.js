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
var prisma = new client_1.PrismaClient();
function seedClassificationRules() {
    return __awaiter(this, void 0, void 0, function () {
        var adminUser, testAdmin, userId, _a, rules, _i, rules_1, rule, existingRule, templates, _b, templates_1, template, existingTemplate, error_1;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 18, 19, 21]);
                    console.log('Seeding classification rules and templates...');
                    return [4 /*yield*/, prisma.user.findFirst({
                            where: { role: 'ADMIN' }
                        })];
                case 1:
                    adminUser = _d.sent();
                    if (!!adminUser) return [3 /*break*/, 3];
                    console.log('No admin user found. Creating a test admin user...');
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                email: 'admin@test.com',
                                password: '$2b$10$test', // This is just for seeding
                                name: 'Test Admin',
                                role: 'ADMIN',
                                emailVerified: new Date()
                            }
                        })];
                case 2:
                    testAdmin = _d.sent();
                    console.log('Created test admin user:', testAdmin.id);
                    _d.label = 3;
                case 3:
                    _a = (adminUser === null || adminUser === void 0 ? void 0 : adminUser.id);
                    if (_a) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.user.findFirst({ where: { role: 'ADMIN' } })];
                case 4:
                    _a = ((_c = (_d.sent())) === null || _c === void 0 ? void 0 : _c.id);
                    _d.label = 5;
                case 5:
                    userId = _a;
                    if (!userId) {
                        throw new Error('No admin user available for seeding');
                    }
                    rules = [
                        {
                            name: 'Financial Data Detection',
                            description: 'Detects financial information like credit card numbers, bank accounts',
                            pattern: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b|\\b\\d{3}-\\d{2}-\\d{4}\\b',
                            resourceType: 'file',
                            sensitivity: 'CONFIDENTIAL',
                            priority: 10,
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Personal Information Detection',
                            description: 'Detects personal information like names, addresses, phone numbers',
                            pattern: '\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b|\\b\\d{3}[\\s-]?\\d{3}[\\s-]?\\d{4}\\b',
                            resourceType: 'message',
                            sensitivity: 'INTERNAL',
                            priority: 5,
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Password Detection',
                            description: 'Detects potential passwords and credentials',
                            pattern: 'password|passwd|pwd|secret|key|token|credential',
                            resourceType: 'file',
                            sensitivity: 'RESTRICTED',
                            priority: 15,
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Business Strategy Detection',
                            description: 'Detects business strategy and planning content',
                            pattern: 'strategy|planning|roadmap|quarterly|annual|budget|revenue|profit',
                            resourceType: 'conversation',
                            sensitivity: 'CONFIDENTIAL',
                            priority: 8,
                            isActive: true,
                            createdBy: userId
                        },
                        {
                            name: 'Public Information',
                            description: 'Marks general public information as public',
                            pattern: 'public|general|announcement|news|update',
                            resourceType: 'message',
                            sensitivity: 'PUBLIC',
                            priority: 1,
                            isActive: true,
                            createdBy: userId
                        }
                    ];
                    _i = 0, rules_1 = rules;
                    _d.label = 6;
                case 6:
                    if (!(_i < rules_1.length)) return [3 /*break*/, 11];
                    rule = rules_1[_i];
                    return [4 /*yield*/, prisma.classificationRule.findUnique({
                            where: { name: rule.name }
                        })];
                case 7:
                    existingRule = _d.sent();
                    if (!!existingRule) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.classificationRule.create({
                            data: rule
                        })];
                case 8:
                    _d.sent();
                    console.log("Created classification rule: ".concat(rule.name));
                    return [3 /*break*/, 10];
                case 9:
                    console.log("Classification rule already exists: ".concat(rule.name));
                    _d.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 6];
                case 11:
                    templates = [
                        {
                            name: 'Standard Internal',
                            description: 'Standard template for internal company information',
                            sensitivity: 'INTERNAL',
                            expiresIn: 365, // 1 year
                            notes: 'Standard internal classification template'
                        },
                        {
                            name: 'Confidential Financial',
                            description: 'Template for confidential financial information',
                            sensitivity: 'CONFIDENTIAL',
                            expiresIn: 730, // 2 years
                            notes: 'Use for financial documents and sensitive business information'
                        },
                        {
                            name: 'Restricted HR',
                            description: 'Template for restricted HR and personnel information',
                            sensitivity: 'RESTRICTED',
                            expiresIn: 1095, // 3 years
                            notes: 'Use for HR documents, personnel files, and highly sensitive information'
                        },
                        {
                            name: 'Public Announcement',
                            description: 'Template for public announcements and general information',
                            sensitivity: 'PUBLIC',
                            expiresIn: null, // No expiration
                            notes: 'Use for public announcements and general company information'
                        },
                        {
                            name: 'Temporary Internal',
                            description: 'Template for temporary internal information',
                            sensitivity: 'INTERNAL',
                            expiresIn: 30, // 30 days
                            notes: 'Use for temporary internal communications and short-term projects'
                        }
                    ];
                    _b = 0, templates_1 = templates;
                    _d.label = 12;
                case 12:
                    if (!(_b < templates_1.length)) return [3 /*break*/, 17];
                    template = templates_1[_b];
                    return [4 /*yield*/, prisma.classificationTemplate.findUnique({
                            where: { name: template.name }
                        })];
                case 13:
                    existingTemplate = _d.sent();
                    if (!!existingTemplate) return [3 /*break*/, 15];
                    return [4 /*yield*/, prisma.classificationTemplate.create({
                            data: __assign(__assign({}, template), { createdBy: userId })
                        })];
                case 14:
                    _d.sent();
                    console.log("Created classification template: ".concat(template.name));
                    return [3 /*break*/, 16];
                case 15:
                    console.log("Classification template already exists: ".concat(template.name));
                    _d.label = 16;
                case 16:
                    _b++;
                    return [3 /*break*/, 12];
                case 17:
                    console.log('Classification rules and templates seeding completed successfully!');
                    return [3 /*break*/, 21];
                case 18:
                    error_1 = _d.sent();
                    console.error('Error seeding classification rules:', error_1);
                    return [3 /*break*/, 21];
                case 19: return [4 /*yield*/, prisma.$disconnect()];
                case 20:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 21: return [2 /*return*/];
            }
        });
    });
}
seedClassificationRules();
