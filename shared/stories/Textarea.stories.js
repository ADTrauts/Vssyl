"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithValue = exports.Default = void 0;
var Textarea_1 = require("../src/components/Textarea");
var meta = {
    title: 'Shared/Textarea',
    component: Textarea_1.Textarea,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {},
};
exports.WithValue = {
    args: {
        value: 'Some text',
        placeholder: 'Type here...'
    },
};
