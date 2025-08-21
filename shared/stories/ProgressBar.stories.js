"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomColor = exports.Default = void 0;
var ProgressBar_1 = require("../src/components/ProgressBar");
var meta = {
    title: 'Shared/ProgressBar',
    component: ProgressBar_1.ProgressBar,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {
        value: 60,
        label: 'Task Completion',
    },
};
exports.CustomColor = {
    args: {
        value: 85,
        label: 'Upload Progress',
        color: 'bg-green-500',
    },
};
