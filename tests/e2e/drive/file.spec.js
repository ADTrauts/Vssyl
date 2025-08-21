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
var test_1 = require("@playwright/test");
var setup_1 = require("./setup");
var owner = { email: 'owner@example.com', password: 'Password123!' };
var shared = { email: 'shared@example.com', password: 'Password123!' };
var ownerToken;
var sharedToken;
var ownerApi;
var sharedApi;
var fileId;
test_1.test.describe('Drive API - File Endpoints', function () {
    test_1.test.beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        var api;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_1.request.newContext({ baseURL: setup_1.baseURL })];
                case 1:
                    api = _a.sent();
                    return [4 /*yield*/, (0, setup_1.registerUser)(api, owner.email, owner.password)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, setup_1.registerUser)(api, shared.email, shared.password)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, setup_1.loginUser)(api, owner.email, owner.password)];
                case 4:
                    ownerToken = _a.sent();
                    return [4 /*yield*/, (0, setup_1.loginUser)(api, shared.email, shared.password)];
                case 5:
                    sharedToken = _a.sent();
                    return [4 /*yield*/, (0, setup_1.getAuthContext)(setup_1.baseURL, ownerToken)];
                case 6:
                    ownerApi = _a.sent();
                    return [4 /*yield*/, (0, setup_1.getAuthContext)(setup_1.baseURL, sharedToken)];
                case 7:
                    sharedApi = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should create a file (metadata only)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.post('/files', { data: { name: 'Test.txt', type: 'text/plain', size: 10 } })];
                case 1:
                    res = _a.sent();
                    (0, test_1.expect)(res.ok()).toBeTruthy();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    (0, test_1.expect)(data.file.name).toBe('Test.txt');
                    fileId = data.file.id;
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should list files', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.get('/files')];
                case 1:
                    res = _a.sent();
                    (0, test_1.expect)(res.ok()).toBeTruthy();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    (0, test_1.expect)(Array.isArray(data.files)).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should update a file', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.put("/files/".concat(fileId), { data: { name: 'Updated.txt' } })];
                case 1:
                    res = _a.sent();
                    (0, test_1.expect)(res.ok()).toBeTruthy();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    (0, test_1.expect)(data.file.name).toBe('Updated.txt');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should delete a file', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.delete("/files/".concat(fileId))];
                case 1:
                    res = _a.sent();
                    (0, test_1.expect)(res.ok()).toBeTruthy();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    (0, test_1.expect)(data.deleted).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should move a file to a different folder', function () { return __awaiter(void 0, void 0, void 0, function () {
        var folderRes, folderData, folderId, fileRes, fileData, fileToMoveId, moveRes, moveData, listRes, listData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.post('/folders', { data: { name: 'Test Folder' } })];
                case 1:
                    folderRes = _a.sent();
                    (0, test_1.expect)(folderRes.ok()).toBeTruthy();
                    return [4 /*yield*/, folderRes.json()];
                case 2:
                    folderData = _a.sent();
                    folderId = folderData.folder.id;
                    return [4 /*yield*/, ownerApi.post('/files', { data: { name: 'File to Move.txt', type: 'text/plain', size: 10 } })];
                case 3:
                    fileRes = _a.sent();
                    (0, test_1.expect)(fileRes.ok()).toBeTruthy();
                    return [4 /*yield*/, fileRes.json()];
                case 4:
                    fileData = _a.sent();
                    fileToMoveId = fileData.file.id;
                    return [4 /*yield*/, ownerApi.post("/files/".concat(fileToMoveId, "/move"), { data: { targetFolderId: folderId } })];
                case 5:
                    moveRes = _a.sent();
                    (0, test_1.expect)(moveRes.ok()).toBeTruthy();
                    return [4 /*yield*/, moveRes.json()];
                case 6:
                    moveData = _a.sent();
                    (0, test_1.expect)(moveData.file.folderId).toBe(folderId);
                    (0, test_1.expect)(moveData.message).toBe('File moved successfully');
                    return [4 /*yield*/, ownerApi.get("/files?folderId=".concat(folderId))];
                case 7:
                    listRes = _a.sent();
                    (0, test_1.expect)(listRes.ok()).toBeTruthy();
                    return [4 /*yield*/, listRes.json()];
                case 8:
                    listData = _a.sent();
                    (0, test_1.expect)(listData.files.some(function (f) { return f.id === fileToMoveId; })).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    // TODO: Add upload and download tests when file upload endpoint is ready
});
