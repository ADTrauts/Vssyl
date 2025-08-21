"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Large = exports.WithImage = exports.Default = void 0;
var Avatar_1 = require("../src/components/Avatar");
var meta = {
    title: 'Shared/Avatar',
    component: Avatar_1.Avatar,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {},
};
exports.WithImage = {
    args: {
        src: 'https://randomuser.me/api/portraits/men/32.jpg',
        alt: 'User Avatar',
    },
};
exports.Large = {
    args: {
        size: 80,
    },
};
