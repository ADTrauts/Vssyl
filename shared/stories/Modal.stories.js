"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interactive = exports.Open = void 0;
var Modal_1 = require("../src/components/Modal");
var react_1 = require("react");
var meta = {
    title: 'Shared/Modal',
    component: Modal_1.Modal,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Open = {
    render: function (args) { return <Modal_1.Modal {...args}>This is a modal!</Modal_1.Modal>; },
    args: {
        open: true,
        onClose: function () { return alert('Closed!'); },
    },
};
exports.Interactive = {
    render: function () {
        var _a = (0, react_1.useState)(false), open = _a[0], setOpen = _a[1];
        return (<div>
        <button onClick={function () { return setOpen(true); }}>Open Modal</button>
        <Modal_1.Modal open={open} onClose={function () { return setOpen(false); }}>
          Modal content here
        </Modal_1.Modal>
      </div>);
    },
};
