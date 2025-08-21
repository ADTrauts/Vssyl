"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Document = exports.Image = void 0;
var FilePreview_1 = require("../src/components/FilePreview");
var meta = {
    title: 'Shared/FilePreview',
    component: FilePreview_1.FilePreview,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Image = {
    args: {
        file: {
            name: 'cat.jpg',
            type: 'image/jpeg',
            url: 'https://placekitten.com/200/200',
        },
    },
};
exports.Document = {
    args: {
        file: {
            name: 'Resume.pdf',
            type: 'application/pdf',
            url: '',
        },
    },
};
