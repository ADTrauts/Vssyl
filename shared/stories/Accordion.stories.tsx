import type { Meta, StoryObj } from '@storybook/react';
import { Accordion } from '../src/components/Accordion';
import React from 'react';

const meta: Meta<typeof Accordion> = {
  title: 'Shared/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Accordion>;

export const Basic: Story = {
  args: {
    items: [
      { title: 'Item 1', content: 'Content 1' },
      { title: 'Item 2', content: 'Content 2' },
    ],
    allowMultiple: false,
  },
}; 