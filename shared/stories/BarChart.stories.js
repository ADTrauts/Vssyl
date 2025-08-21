"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var BarChart_1 = require("../src/components/BarChart");
var meta = {
    title: 'Shared/BarChart',
    component: BarChart_1.BarChart,
    tags: ['autodocs'],
};
exports.default = meta;
var data = [
    { name: 'Jan', users: 400 },
    { name: 'Feb', users: 300 },
    { name: 'Mar', users: 500 },
    { name: 'Apr', users: 200 },
];
exports.Default = {
    args: {
        data: data,
        xKey: 'name',
        barKey: 'users',
    },
};
