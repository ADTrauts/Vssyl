"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Default = void 0;
var Stepper_1 = require("../src/components/Stepper");
var react_1 = require("react");
var meta = {
    title: 'Shared/Stepper',
    component: Stepper_1.Stepper,
    tags: ['autodocs'],
};
exports.default = meta;
var steps = [
    { label: 'Step 1' },
    { label: 'Step 2' },
    { label: 'Step 3' },
];
exports.Default = {
    render: function () {
        var _a = (0, react_1.useState)(0), activeStep = _a[0], setActiveStep = _a[1];
        return <Stepper_1.Stepper steps={steps} activeStep={activeStep} onStepChange={setActiveStep}/>;
    },
};
