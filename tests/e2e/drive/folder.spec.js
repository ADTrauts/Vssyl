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
var owner = { email: 'owner2@example.com', password: 'Password123!' };
var ownerToken;
var ownerApi;
var folderId;
test_1.test.describe('Drive API - Folder Endpoints', function () {
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
                    return [4 /*yield*/, (0, setup_1.loginUser)(api, owner.email, owner.password)];
                case 3:
                    ownerToken = _a.sent();
                    return [4 /*yield*/, (0, setup_1.getAuthContext)(setup_1.baseURL, ownerToken)];
                case 4:
                    ownerApi = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should create a folder', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.post('/folders', { data: { name: 'Test Folder' } })];
                case 1:
                    res = _a.sent();
                    (0, test_1.expect)(res.ok()).toBeTruthy();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    (0, test_1.expect)(data.folder.name).toBe('Test Folder');
                    folderId = data.folder.id;
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should list folders', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.get('/folders')];
                case 1:
                    res = _a.sent();
                    (0, test_1.expect)(res.ok()).toBeTruthy();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    (0, test_1.expect)(Array.isArray(data.folders)).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should update a folder', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.put("/folders/".concat(folderId), { data: { name: 'Updated Folder' } })];
                case 1:
                    res = _a.sent();
                    (0, test_1.expect)(res.ok()).toBeTruthy();
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = _a.sent();
                    (0, test_1.expect)(data.folder.name).toBe('Updated Folder');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should delete a folder', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.delete("/folders/".concat(folderId))];
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
    (0, test_1.test)('should move a folder to a different parent folder', function () { return __awaiter(void 0, void 0, void 0, function () {
        var parentRes, parentData, parentId, folderRes, folderData, folderToMoveId, moveRes, moveData, listRes, listData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ownerApi.post('/folders', { data: { name: 'Parent Folder' } })];
                case 1:
                    parentRes = _a.sent();
                    (0, test_1.expect)(parentRes.ok()).toBeTruthy();
                    return [4 /*yield*/, parentRes.json()];
                case 2:
                    parentData = _a.sent();
                    parentId = parentData.folder.id;
                    return [4 /*yield*/, ownerApi.post('/folders', { data: { name: 'Folder to Move' } })];
                case 3:
                    folderRes = _a.sent();
                    (0, test_1.expect)(folderRes.ok()).toBeTruthy();
                    return [4 /*yield*/, folderRes.json()];
                case 4:
                    folderData = _a.sent();
                    folderToMoveId = folderData.folder.id;
                    return [4 /*yield*/, ownerApi.post("/folders/".concat(folderToMoveId, "/move"), { data: { targetParentId: parentId } })];
                case 5:
                    moveRes = _a.sent();
                    (0, test_1.expect)(moveRes.ok()).toBeTruthy();
                    return [4 /*yield*/, moveRes.json()];
                case 6:
                    moveData = _a.sent();
                    (0, test_1.expect)(moveData.folder.parentId).toBe(parentId);
                    (0, test_1.expect)(moveData.message).toBe('Folder moved successfully');
                    return [4 /*yield*/, ownerApi.get("/folders?parentId=".concat(parentId))];
                case 7:
                    listRes = _a.sent();
                    (0, test_1.expect)(listRes.ok()).toBeTruthy();
                    return [4 /*yield*/, listRes.json()];
                case 8:
                    listData = _a.sent();
                    (0, test_1.expect)(listData.folders.some(function (f) { return f.id === folderToMoveId; })).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should prevent moving a folder into itself', function () { return __awaiter(void 0, void 0, void 0, function () {
        var folderRes, folderData, folderId, moveRes;
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
                    return [4 /*yield*/, ownerApi.post("/folders/".concat(folderId, "/move"), { data: { targetParentId: folderId } })];
                case 3:
                    moveRes = _a.sent();
                    (0, test_1.expect)(moveRes.ok()).toBeFalsy();
                    (0, test_1.expect)(moveRes.status()).toBe(400);
                    return [2 /*return*/];
            }
        });
    }); });
});
