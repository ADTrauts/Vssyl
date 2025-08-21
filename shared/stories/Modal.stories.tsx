import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from '../src/components/Modal';
import React, { useState } from 'react';

const meta: Meta<typeof Modal> = {
  title: 'Shared/Modal',
  component: Modal,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Modal>;

export const Open: Story = {
  render: (args) => <Modal {...args}>This is a modal!</Modal>,
  args: {
    open: true,
    onClose: () => alert('Closed!'),
  },
};

export const Interactive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <button onClick={() => setOpen(true)}>Open Modal</button>
        <Modal open={open} onClose={() => setOpen(false)}>
          Modal content here
        </Modal>
      </div>
    );
  },
}; 