"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithCustomActions = exports.Default = void 0;
var components_1 = require("../src/components");
var react_1 = require("react");
var meta = {
    title: 'Shared/ModuleList',
    component: components_1.ModuleList,
    tags: ['autodocs'],
};
exports.default = meta;
var initialModules = [
    { id: '1', name: 'Drive', description: 'File storage and sharing', icon: '📁', installed: false },
    { id: '2', name: 'Chat', description: 'Real-time messaging', icon: '💬', installed: true },
    { id: '3', name: 'Analytics', description: 'Data visualization', icon: '📊', installed: false },
];
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)(initialModules), modules = _a[0], setModules = _a[1];
        var handleInstall = function (module) {
            setModules(modules.map(function (m) { return m.id === module.id ? __assign(__assign({}, m), { installed: true }) : m; }));
        };
        return <components_1.ModuleList modules={modules} onSelect={handleInstall}/>;
    },
};
exports.WithCustomActions = {
    render: function () {
        var _a = (0, react_1.useState)(initialModules), modules = _a[0], setModules = _a[1];
        var _b = (0, react_1.useState)(null), loadingId = _b[0], setLoadingId = _b[1];
        var handleInstall = function (module) {
            setLoadingId(module.id);
            setTimeout(function () {
                setModules(modules.map(function (m) { return m.id === module.id ? __assign(__assign({}, m), { installed: true }) : m; }));
                setLoadingId(null);
            }, 1000);
        };
        return (<components_1.ModuleList modules={modules} renderActions={function (mod) { return (<components_1.ModuleInstallButton installed={!!mod.installed} loading={loadingId === mod.id} onInstall={function () { return handleInstall(mod); }}/>); }}/>);
    },
};
