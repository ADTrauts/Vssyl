"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithCustomRender = exports.Default = void 0;
var components_1 = require("../src/components");
var react_1 = require("react");
var meta = {
    title: 'Shared/FileGrid',
    component: components_1.FileGrid,
    tags: ['autodocs'],
};
exports.default = meta;
var items = [
    { id: '1', name: 'Documents', type: 'folder' },
    { id: '2', name: 'Photo.jpg', type: 'file' },
    { id: '3', name: 'Music', type: 'folder' },
    { id: '4', name: 'Resume.pdf', type: 'file' },
];
exports.Default = {
    args: {
        items: items,
    },
};
exports.WithCustomRender = {
    render: function (args) { return (<components_1.FileGrid {...args} renderItem={function (item) {
            return item.type === 'folder' ? (<components_1.FolderCard name={item.name}/>) : (<div className="flex flex-col items-center">
            <span className="text-3xl mb-1">📄</span>
            <span className="truncate w-20 text-center text-sm">{item.name}</span>
          </div>);
        }}/>); },
    args: {
        items: items,
    },
};
