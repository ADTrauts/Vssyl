import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from '../src/components/Tabs';
import React, { useState } from 'react';

const meta: Meta<typeof Tabs> = {
  title: 'Shared/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Tabs>;

const tabs = [
  { label: 'Tab 1', key: 'tab1' },
  { label: 'Tab 2', key: 'tab2' },
  { label: 'Tab 3', key: 'tab3' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('tab1');
    return (
      <Tabs tabs={tabs} value={value} onChange={setValue}>
        {value === 'tab1' && <div>Content for Tab 1</div>}
        {value === 'tab2' && <div>Content for Tab 2</div>}
        {value === 'tab3' && <div>Content for Tab 3</div>}
      </Tabs>
    );
  },
}; 