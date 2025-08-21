"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var ModuleCard_1 = require("../src/components/ModuleCard");
var react_1 = require("react");
var meta = {
    title: 'Shared/ModuleCard',
    component: ModuleCard_1.ModuleCard,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {
        title: 'Drive',
        description: 'File storage and sharing module',
        icon: '📁',
        children: <button>Open</button>,
    },
};
