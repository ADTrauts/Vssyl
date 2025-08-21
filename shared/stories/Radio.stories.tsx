import type { Meta, StoryObj } from '@storybook/react';
import { Radio } from '../src/components/Radio';

const meta: Meta<typeof Radio> = {
  title: 'Shared/Radio',
  component: Radio,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Radio>;

export const Unchecked: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
}; 