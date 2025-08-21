import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '../src/components/Card';

const meta: Meta<typeof Card> = {
  title: 'Shared/Card',
  component: Card,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: 'This is a card with some content.'
  },
}; 