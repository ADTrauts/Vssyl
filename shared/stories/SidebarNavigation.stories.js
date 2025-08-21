"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var SidebarNavigation_1 = require("../src/components/SidebarNavigation");
var meta = {
    title: 'Shared/SidebarNavigation',
    component: SidebarNavigation_1.SidebarNavigation,
    tags: ['autodocs'],
};
exports.default = meta;
var items = [
    { label: 'Dashboard', active: true },
    { label: 'Drive' },
    { label: 'Chat' },
    { label: 'Analytics' },
];
exports.Default = {
    args: { items: items },
};
