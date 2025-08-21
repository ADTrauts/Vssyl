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
test_1.test.describe('Chat Reactions', function () {
    test_1.test.beforeEach(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Navigate to chat page
                return [4 /*yield*/, page.goto('/chat')];
                case 1:
                    // Navigate to chat page
                    _c.sent();
                    // Wait for chat to load
                    return [4 /*yield*/, page.waitForSelector('[data-testid="chat-main-panel"]', { timeout: 10000 })];
                case 2:
                    // Wait for chat to load
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should display reaction buttons on messages', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var reactionButtons;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Wait for messages to load
                return [4 /*yield*/, page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 })];
                case 1:
                    // Wait for messages to load
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="reaction-button"]')];
                case 2:
                    reactionButtons = _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(reactionButtons.first()).toBeVisible()];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should show quick reactions when clicking reaction button', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var firstReactionButton, quickReactions;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Wait for messages to load
                return [4 /*yield*/, page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 })];
                case 1:
                    // Wait for messages to load
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="reaction-button"]').first()];
                case 2:
                    firstReactionButton = _c.sent();
                    return [4 /*yield*/, firstReactionButton.click()];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="quick-reactions"]')];
                case 4:
                    quickReactions = _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(quickReactions).toBeVisible()];
                case 5:
                    _c.sent();
                    // Check if common emojis are present
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=👍')).toBeVisible()];
                case 6:
                    // Check if common emojis are present
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=❤️')).toBeVisible()];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=😂')).toBeVisible()];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should add reaction when clicking on quick reaction', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var firstReactionButton, thumbsUpButton, reactionDisplay;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Wait for messages to load
                return [4 /*yield*/, page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 })];
                case 1:
                    // Wait for messages to load
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="reaction-button"]').first()];
                case 2:
                    firstReactionButton = _c.sent();
                    return [4 /*yield*/, firstReactionButton.click()];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="quick-reaction-👍"]')];
                case 4:
                    thumbsUpButton = _c.sent();
                    return [4 /*yield*/, thumbsUpButton.click()];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="reaction-display"]')];
                case 6:
                    reactionDisplay = _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(reactionDisplay).toBeVisible()];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=👍')).toBeVisible()];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should show emoji picker when clicking more emojis', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var firstReactionButton, moreEmojisButton, emojiPicker;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Wait for messages to load
                return [4 /*yield*/, page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 })];
                case 1:
                    // Wait for messages to load
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="reaction-button"]').first()];
                case 2:
                    firstReactionButton = _c.sent();
                    return [4 /*yield*/, firstReactionButton.click()];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="more-emojis-button"]')];
                case 4:
                    moreEmojisButton = _c.sent();
                    return [4 /*yield*/, moreEmojisButton.click()];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="emoji-picker"]')];
                case 6:
                    emojiPicker = _c.sent();
                    return [4 /*yield*/, (0, test_1.expect)(emojiPicker).toBeVisible()];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, test_1.test)('should toggle reaction when clicking on existing reaction', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
        var firstReactionButton, thumbsUpButton, reactionButton;
        var page = _b.page;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Wait for messages to load
                return [4 /*yield*/, page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 })];
                case 1:
                    // Wait for messages to load
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="reaction-button"]').first()];
                case 2:
                    firstReactionButton = _c.sent();
                    return [4 /*yield*/, firstReactionButton.click()];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="quick-reaction-👍"]')];
                case 4:
                    thumbsUpButton = _c.sent();
                    return [4 /*yield*/, thumbsUpButton.click()];
                case 5:
                    _c.sent();
                    // Wait for reaction to appear
                    return [4 /*yield*/, page.waitForSelector('[data-testid="reaction-display"]')];
                case 6:
                    // Wait for reaction to appear
                    _c.sent();
                    return [4 /*yield*/, page.locator('[data-testid="reaction-👍"]')];
                case 7:
                    reactionButton = _c.sent();
                    return [4 /*yield*/, reactionButton.click()];
                case 8:
                    _c.sent();
                    // Check if reaction is removed
                    return [4 /*yield*/, (0, test_1.expect)(page.locator('text=👍')).not.toBeVisible()];
                case 9:
                    // Check if reaction is removed
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
