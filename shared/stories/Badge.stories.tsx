import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../src/components/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Shared/Badge',
  component: Badge,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Gray: Story = {
  args: {
    children: 'Gray Badge',
    color: 'gray',
  },
};
export const Blue: Story = {
  args: {
    children: 'Blue Badge',
    color: 'blue',
  },
};
export const Green: Story = {
  args: {
    children: 'Green Badge',
    color: 'green',
  },
};
export const Red: Story = {
  args: {
    children: 'Red Badge',
    color: 'red',
  },
};
export const Yellow: Story = {
  args: {
    children: 'Yellow Badge',
    color: 'yellow',
  },
}; 