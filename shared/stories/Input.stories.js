"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithValue = exports.Default = void 0;
var Input_1 = require("../src/components/Input");
var meta = {
    title: 'Shared/Input',
    component: Input_1.Input,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {
        value: '',
        placeholder: 'Type here...'
    },
};
exports.WithValue = {
    args: {
        value: 'Hello World',
        placeholder: 'Type here...'
    },
};
