"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Error = exports.Warning = exports.Success = exports.Info = void 0;
var Alert_1 = require("../src/components/Alert");
var meta = {
    title: 'Shared/Alert',
    component: Alert_1.Alert,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Info = {
    args: {
        children: 'This is an info alert.',
        type: 'info',
    },
};
exports.Success = {
    args: {
        children: 'This is a success alert.',
        type: 'success',
    },
};
exports.Warning = {
    args: {
        children: 'This is a warning alert.',
        type: 'warning',
    },
};
exports.Error = {
    args: {
        children: 'This is an error alert.',
        type: 'error',
    },
};
