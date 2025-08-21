import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../src/components/Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Shared/Spinner',
  component: Spinner,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  args: {},
};

export const Large: Story = {
  args: {
    size: 48,
  },
}; 