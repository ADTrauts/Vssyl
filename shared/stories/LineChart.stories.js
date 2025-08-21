"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var LineChart_1 = require("../src/components/LineChart");
var meta = {
    title: 'Shared/LineChart',
    component: LineChart_1.LineChart,
    tags: ['autodocs'],
};
exports.default = meta;
var data = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 200 },
    { name: 'Mar', value: 150 },
    { name: 'Apr', value: 250 },
];
exports.Default = {
    args: {
        data: data,
        xKey: 'name',
        lineKey: 'value',
    },
};
