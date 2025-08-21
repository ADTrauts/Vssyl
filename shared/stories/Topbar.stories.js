"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Topbar_1 = require("../src/components/Topbar");
var react_1 = require("react");
var meta = {
    title: 'Shared/Topbar',
    component: Topbar_1.Topbar,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    render: function () { return (<Topbar_1.Topbar left={<span>Logo</span>} center={<span>Dashboard</span>} right={<span>User</span>}/>); },
};
