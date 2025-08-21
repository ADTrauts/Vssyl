"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Basic = void 0;
var Table_1 = require("../src/components/Table");
var meta = {
    title: 'Shared/Table',
    component: Table_1.Table,
    tags: ['autodocs'],
};
exports.default = meta;
var columns = [
    { key: 'name', label: 'Name' },
    { key: 'age', label: 'Age' },
    { key: 'email', label: 'Email' },
];
var data = [
    { name: 'Alice', age: 25, email: 'alice@example.com' },
    { name: 'Bob', age: 30, email: 'bob@example.com' },
    { name: 'Charlie', age: 22, email: 'charlie@example.com' },
];
exports.Basic = {
    render: function () { return <Table_1.Table columns={columns} data={data}/>; },
};
