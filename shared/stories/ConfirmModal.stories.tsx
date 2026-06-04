import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { ConfirmModal } from '../src/components/ConfirmModal';

const meta: Meta<typeof ConfirmModal> = {
  title: 'Shared/ConfirmModal',
  component: ConfirmModal,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ConfirmModal>;

function ConfirmModalDemo({
  variant,
  title,
  description,
  confirmLabel,
}: {
  variant: 'standard' | 'destructive' | 'informational';
  title: string;
  description?: string;
  confirmLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string>('—');

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open {variant} confirm
      </button>
      <p className="mt-2 text-sm text-v-text-secondary">Last result: {result}</p>
      <ConfirmModal
        open={open}
        onClose={() => {
          setOpen(false);
          setResult('cancelled');
        }}
        onConfirm={() => {
          setOpen(false);
          setResult('confirmed');
        }}
        title={title}
        description={description}
        variant={variant}
        confirmLabel={confirmLabel}
      />
    </div>
  );
}

export const Standard: Story = {
  render: () => (
    <ConfirmModalDemo
      variant="standard"
      title="Save changes?"
      description="Your edits will be applied to this dashboard."
    />
  ),
};

export const Destructive: Story = {
  render: () => (
    <ConfirmModalDemo
      variant="destructive"
      title="Remove module?"
      description="This removes the widget from this dashboard."
      confirmLabel="Remove"
    />
  ),
};

export const Informational: Story = {
  render: () => (
    <ConfirmModalDemo
      variant="informational"
      title="Apply preset?"
      description="This will override your current color settings."
      confirmLabel="Apply"
    />
  ),
};

export const OpenDestructive: Story = {
  args: {
    open: true,
    title: 'Delete file?',
    description: 'This action cannot be undone.',
    variant: 'destructive',
    confirmLabel: 'Delete',
    onClose: () => undefined,
    onConfirm: () => undefined,
  },
};
