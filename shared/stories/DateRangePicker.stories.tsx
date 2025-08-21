import type { Meta, StoryObj } from '@storybook/react';
import { DateRangePicker } from '../src/components/DateRangePicker';
import React, { useState } from 'react';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Shared/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof DateRangePicker>;

export const Default: Story = {
  render: () => {
    const [range, setRange] = useState({ startDate: '2024-06-01', endDate: '2024-06-15' });
    return <DateRangePicker value={range} onChange={setRange} />;
  },
}; 