"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Tabs_1 = require("../src/components/Tabs");
var react_1 = require("react");
var meta = {
    title: 'Shared/Tabs',
    component: Tabs_1.Tabs,
    tags: ['autodocs'],
};
exports.default = meta;
var tabs = [
    { label: 'Tab 1', key: 'tab1' },
    { label: 'Tab 2', key: 'tab2' },
    { label: 'Tab 3', key: 'tab3' },
];
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)('tab1'), value = _a[0], setValue = _a[1];
        return (<Tabs_1.Tabs tabs={tabs} value={value} onChange={setValue}>
        {value === 'tab1' && <div>Content for Tab 1</div>}
        {value === 'tab2' && <div>Content for Tab 2</div>}
        {value === 'tab3' && <div>Content for Tab 3</div>}
      </Tabs_1.Tabs>);
    },
};
