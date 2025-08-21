"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Basic = void 0;
var Accordion_1 = require("../src/components/Accordion");
var meta = {
    title: 'Shared/Accordion',
    component: Accordion_1.Accordion,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Basic = {
    args: {
        items: [
            { title: 'Item 1', content: 'Content 1' },
            { title: 'Item 2', content: 'Content 2' },
        ],
        allowMultiple: false,
    },
};
