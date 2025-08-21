"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesOnly = exports.Default = void 0;
var UploadButton_1 = require("../src/components/UploadButton");
var meta = {
    title: 'Shared/UploadButton',
    component: UploadButton_1.UploadButton,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    args: {
        onFiles: function (files) { return alert("Selected ".concat(files.length, " file(s)")); },
    },
};
exports.ImagesOnly = {
    args: {
        onFiles: function (files) { return alert("Selected ".concat(files.length, " image(s)")); },
        label: 'Upload Images',
        accept: 'image/*',
    },
};
