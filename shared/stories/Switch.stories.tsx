import type { Meta, StoryObj } from '@storybook/react';
import { Switch } from '../src/components/Switch';
import React, { useState } from 'react';

const meta: Meta<typeof Switch> = {
  title: 'Shared/Switch',
  component: Switch,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Switch checked={checked} onChange={setChecked} label="Toggle me" />;
  },
}; 