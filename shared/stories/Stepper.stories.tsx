import type { Meta, StoryObj } from '@storybook/react';
import { Stepper } from '../src/components/Stepper';
import React, { useState } from 'react';

const meta: Meta<typeof Stepper> = {
  title: 'Shared/Stepper',
  component: Stepper,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Stepper>;

const steps = [
  { label: 'Step 1' },
  { label: 'Step 2' },
  { label: 'Step 3' },
];

export const Default: Story = {
  render: () => {
    const [activeStep, setActiveStep] = useState(0);
    return <Stepper steps={steps} activeStep={activeStep} onStepChange={setActiveStep} />;
  },
}; 