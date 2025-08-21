"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Pagination_1 = require("../src/components/Pagination");
var react_1 = require("react");
var meta = {
    title: 'Shared/Pagination',
    component: Pagination_1.Pagination,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)(1), page = _a[0], setPage = _a[1];
        return <Pagination_1.Pagination page={page} pageCount={5} onPageChange={setPage}/>;
    },
};
