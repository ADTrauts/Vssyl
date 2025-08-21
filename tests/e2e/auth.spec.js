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
var randomEmail = function () { return "testuser_".concat(Date.now(), "@example.com"); };
var testPassword = 'TestPassword123!';
var testName = 'Test User';
// Helper to register a new user
function register(page, email, password, name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.goto('/auth/register')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.getByLabel('Name').fill(name)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.getByLabel('Email').fill(email)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, page.getByLabel('Password').fill(password)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, page.getByRole('button', { name: /register/i }).click()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Helper to login
function login(page, email, password) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.goto('/auth/signin')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.getByLabel('Email').fill(email)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.getByLabel('Password').fill(password)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, page.getByRole('button', { name: /sign in/i }).click()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
test_1.test.describe('Authentication Flows', function () {
    (0, test_1.test)('Registration page loads', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/auth/register')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/.*register/)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.getByRole('heading', { name: /register/i })).toBeVisible()];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('Login page loads', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/auth/signin')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/.*signin/)];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.getByRole('heading', { name: /login/i })).toBeVisible()];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('User can register, login, and update profile', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var email, newName;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    email = randomEmail();
                    // Register
                    return [4 /*yield*/, register(page, email, testPassword, testName)];
                case 1:
                    // Register
                    _c.sent();
                    // Should redirect to login
                    return [4 /*yield*/, page.waitForURL(/.*login|signin/)];
                case 2:
                    // Should redirect to login
                    _c.sent();
                    // Login
                    return [4 /*yield*/, login(page, email, testPassword)];
                case 3:
                    // Login
                    _c.sent();
                    // Should redirect to dashboard or profile (assume /profile for this test)
                    return [4 /*yield*/, page.goto('/profile')];
                case 4:
                    // Should redirect to dashboard or profile (assume /profile for this test)
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.getByRole('heading', { name: /profile/i })).toBeVisible()];
                case 5:
                    _c.sent();
                    newName = 'Updated User';
                    return [4 /*yield*/, page.getByLabel('Name').fill(newName)];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, page.getByRole('button', { name: /update name/i }).click()];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.getByText('Profile updated!')).toBeVisible()];
                case 8:
                    _c.sent();
                    // Confirm name updated in profile JSON
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('pre')).toContainText(newName)];
                case 9:
                    // Confirm name updated in profile JSON
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('Registration fails with missing fields', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, page.goto('/auth/register')];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, page.getByRole('button', { name: /register/i }).click()];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.getByText(/required/i)).toBeVisible()];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('Login fails with invalid credentials', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var _c, _d, errorLocator;
        var page = _b.page;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, page.goto('/auth/signin')];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, page.getByLabel('Email').fill('notarealuser@example.com')];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, page.getByLabel('Password').fill('wrongpassword')];
                case 3:
                    _e.sent();
                    return [4 /*yield*/, Promise.all([
                            page.waitForNavigation(),
                            page.getByRole('button', { name: /sign in/i }).click(),
                        ])];
                case 4:
                    _e.sent();
                    // Debug: print page content after failed login
                    _d = (_c = console).log;
                    return [4 /*yield*/, page.content()];
                case 5:
                    // Debug: print page content after failed login
                    _d.apply(_c, [_e.sent()]);
                    errorLocator = page.getByText('Invalid credentials');
                    return [4 /*yield*/, (0, test_1.expect)(errorLocator).toBeVisible({ timeout: 10000 })];
                case 6:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
