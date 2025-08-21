"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Popover_1 = require("../src/components/Popover");
var react_1 = require("react");
var meta = {
    title: 'Shared/Popover',
    component: Popover_1.Popover,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)(false), open = _a[0], setOpen = _a[1];
        return (<Popover_1.Popover content={<div>This is a popover!</div>} open={open} onOpenChange={setOpen}>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Click me</button>
      </Popover_1.Popover>);
    },
};
