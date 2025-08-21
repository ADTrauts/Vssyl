"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checked = exports.Unchecked = void 0;
var Radio_1 = require("../src/components/Radio");
var meta = {
    title: 'Shared/Radio',
    component: Radio_1.Radio,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Unchecked = {
    args: {
        checked: false,
    },
};
exports.Checked = {
    args: {
        checked: true,
    },
};
