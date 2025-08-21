"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var ContextMenu_1 = require("../src/components/ContextMenu");
var react_1 = require("react");
var outline_1 = require("@heroicons/react/24/outline");
var meta = {
    title: 'Shared/ContextMenu',
    component: ContextMenu_1.ContextMenu,
    tags: ['autodocs'],
};
exports.default = meta;
var items = [
    { icon: <outline_1.ArrowDownTrayIcon className="w-5 h-5"/>, label: 'Download', onClick: function () { return alert('Download'); } },
    { icon: <outline_1.PencilIcon className="w-5 h-5"/>, label: 'Rename', onClick: function () { return alert('Rename'); } },
    { divider: true },
    { icon: <outline_1.TrashIcon className="w-5 h-5"/>, label: 'Delete', onClick: function () { return alert('Delete'); }, shortcut: 'Del' },
];
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)(true), open = _a[0], setOpen = _a[1];
        return (<ContextMenu_1.ContextMenu open={open} onClose={function () { return setOpen(false); }} anchorPoint={{ x: 100, y: 100 }} items={items}/>);
    },
};
