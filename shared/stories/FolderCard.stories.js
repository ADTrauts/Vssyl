"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithChildren = exports.Default = void 0;
var FolderCard_1 = require("../src/components/FolderCard");
var react_1 = require("react");
var meta = {
    title: 'Shared/FolderCard',
    component: FolderCard_1.FolderCard,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {
        name: 'Projects',
    },
};
exports.WithChildren = {
    args: {
        name: 'Photos',
        children: <div className="text-sm text-gray-500">Contains 24 items</div>,
    },
};
