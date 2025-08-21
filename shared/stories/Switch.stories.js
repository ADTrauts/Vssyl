"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Switch_1 = require("../src/components/Switch");
var react_1 = require("react");
var meta = {
    title: 'Shared/Switch',
    component: Switch_1.Switch,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)(false), checked = _a[0], setChecked = _a[1];
        return <Switch_1.Switch checked={checked} onChange={setChecked} label="Toggle me"/>;
    },
};
