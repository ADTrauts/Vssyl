import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from '../src/components/Alert';

const meta: Meta<typeof Alert> = {
  title: 'Shared/Alert',
  component: Alert,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    children: 'This is an info alert.',
    type: 'info',
  },
};
export const Success: Story = {
  args: {
    children: 'This is a success alert.',
    type: 'success',
  },
};
export const Warning: Story = {
  args: {
    children: 'This is a warning alert.',
    type: 'warning',
  },
};
export const Error: Story = {
  args: {
    children: 'This is an error alert.',
    type: 'error',
  },
}; 