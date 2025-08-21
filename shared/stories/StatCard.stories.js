"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithChange = exports.Default = void 0;
var StatCard_1 = require("../src/components/StatCard");
var meta = {
    title: 'Shared/StatCard',
    component: StatCard_1.StatCard,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {
        label: 'Active Users',
        value: 1200,
        icon: '👤',
    },
};
exports.WithChange = {
    args: {
        label: 'Revenue',
        value: '$5,000',
        icon: '💰',
        change: '+8%',
        description: 'Compared to last week',
    },
};
