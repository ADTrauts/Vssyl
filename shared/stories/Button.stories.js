"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Secondary = exports.Primary = void 0;
var Button_1 = require("../src/components/Button");
var meta = {
    title: 'Shared/Button',
    component: Button_1.Button,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Primary = {
    args: {
        children: 'Primary Button',
        variant: 'primary',
    },
};
exports.Secondary = {
    args: {
        children: 'Secondary Button',
        variant: 'secondary',
    },
};
