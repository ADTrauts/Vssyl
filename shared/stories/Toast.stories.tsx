import type { Meta, StoryObj } from '@storybook/react';
import { Toast } from '../src/components/Toast';
import React, { useState } from 'react';

const meta: Meta<typeof Toast> = {
  title: 'Shared/Toast',
  component: Toast,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Toast>;

export const Info: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return <Toast open={open} onClose={() => setOpen(false)} message="This is an info toast!" type="info" />;
  },
};

export const Success: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return <Toast open={open} onClose={() => setOpen(false)} message="Success!" type="success" />;
  },
};

export const Error: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return <Toast open={open} onClose={() => setOpen(false)} message="Something went wrong." type="error" />;
  },
}; 