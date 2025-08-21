"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Error = exports.Success = exports.Info = void 0;
var Toast_1 = require("../src/components/Toast");
var react_1 = require("react");
var meta = {
    title: 'Shared/Toast',
    component: Toast_1.Toast,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Info = {
    render: function () {
        var _a = (0, react_1.useState)(true), open = _a[0], setOpen = _a[1];
        return <Toast_1.Toast open={open} onClose={function () { return setOpen(false); }} message="This is an info toast!" type="info"/>;
    },
};
exports.Success = {
    render: function () {
        var _a = (0, react_1.useState)(true), open = _a[0], setOpen = _a[1];
        return <Toast_1.Toast open={open} onClose={function () { return setOpen(false); }} message="Success!" type="success"/>;
    },
};
exports.Error = {
    render: function () {
        var _a = (0, react_1.useState)(true), open = _a[0], setOpen = _a[1];
        return <Toast_1.Toast open={open} onClose={function () { return setOpen(false); }} message="Something went wrong." type="error"/>;
    },
};
