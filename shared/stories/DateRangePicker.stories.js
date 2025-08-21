"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var DateRangePicker_1 = require("../src/components/DateRangePicker");
var react_1 = require("react");
var meta = {
    title: 'Shared/DateRangePicker',
    component: DateRangePicker_1.DateRangePicker,
    tags: ['autodocs'],
};
exports.default = meta;
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)({ startDate: '2024-06-01', endDate: '2024-06-15' }), range = _a[0], setRange = _a[1];
        return <DateRangePicker_1.DateRangePicker value={range} onChange={setRange}/>;
    },
};
