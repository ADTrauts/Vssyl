"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FourColumns = exports.ThreeColumns = void 0;
var components_1 = require("../src/components");
var meta = {
    title: 'Shared/GridLayout',
    component: components_1.GridLayout,
    tags: ['autodocs'],
};
exports.default = meta;
exports.ThreeColumns = {
    render: function () { return (<components_1.GridLayout columns={3}>
      <components_1.ModuleCard title="Module 1"/>
      <components_1.ModuleCard title="Module 2"/>
      <components_1.ModuleCard title="Module 3"/>
    </components_1.GridLayout>); },
};
exports.FourColumns = {
    render: function () { return (<components_1.GridLayout columns={4}>
      <components_1.ModuleCard title="Module 1"/>
      <components_1.ModuleCard title="Module 2"/>
      <components_1.ModuleCard title="Module 3"/>
      <components_1.ModuleCard title="Module 4"/>
    </components_1.GridLayout>); },
};
