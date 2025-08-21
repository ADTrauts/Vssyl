"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Basic = void 0;
var components_1 = require("../src/components");
var react_1 = require("react");
var meta = {
    title: 'Shared/DraggableWrapper',
    component: components_1.DraggableWrapper,
    tags: ['autodocs'],
};
exports.default = meta;
var initialItems = [
    { id: '1', title: 'Module 1' },
    { id: '2', title: 'Module 2' },
    { id: '3', title: 'Module 3' },
];
exports.Basic = {
    render: function () {
        var _a = (0, react_1.useState)(initialItems), items = _a[0], setItems = _a[1];
        var onDragEnd = function (result) {
            if (!result.destination)
                return;
            var reordered = Array.from(items);
            var removed = reordered.splice(result.source.index, 1)[0];
            reordered.splice(result.destination.index, 0, removed);
            setItems(reordered);
        };
        return (<components_1.DraggableWrapper items={items} onDragEnd={onDragEnd} renderItem={function (item) { return <components_1.ModuleCard title={item.title}/>; }}/>);
    },
};
