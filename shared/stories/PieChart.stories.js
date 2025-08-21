"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var PieChart_1 = require("../src/components/PieChart");
var meta = {
    title: 'Shared/PieChart',
    component: PieChart_1.PieChart,
    tags: ['autodocs'],
};
exports.default = meta;
var data = [
    { name: 'A', value: 40 },
    { name: 'B', value: 30 },
    { name: 'C', value: 20 },
    { name: 'D', value: 10 },
];
exports.Default = {
    args: {
        data: data,
        dataKey: 'value',
        nameKey: 'name',
    },
};
