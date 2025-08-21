"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Breadcrumbs_1 = require("../src/components/Breadcrumbs");
var meta = {
    title: 'Shared/Breadcrumbs',
    component: Breadcrumbs_1.Breadcrumbs,
    tags: ['autodocs'],
};
exports.default = meta;
var items = [
    { label: 'Home', onClick: function () { return alert('Home'); } },
    { label: 'Documents', onClick: function () { return alert('Documents'); } },
    { label: 'Projects', active: true },
];
exports.Default = {
    args: { items: items },
};
