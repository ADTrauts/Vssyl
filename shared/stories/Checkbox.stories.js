"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checked = exports.Unchecked = void 0;
var Checkbox_1 = require("../src/components/Checkbox");
var meta = {
    title: 'Shared/Checkbox',
    component: Checkbox_1.Checkbox,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Unchecked = {
    args: {
        checked: false,
        onChange: function () { },
    },
};
exports.Checked = {
    args: {
        checked: true,
        onChange: function () { },
    },
};
