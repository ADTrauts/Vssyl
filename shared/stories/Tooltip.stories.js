"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Tooltip_1 = require("../src/components/Tooltip");
var react_1 = require("react");
var meta = {
    title: 'Shared/Tooltip',
    component: Tooltip_1.Tooltip,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    render: function () { return (<Tooltip_1.Tooltip content="This is a tooltip!">
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Hover me</button>
    </Tooltip_1.Tooltip>); },
};
