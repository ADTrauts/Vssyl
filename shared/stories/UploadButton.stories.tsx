import type { Meta, StoryObj } from '@storybook/react';
import { UploadButton } from '../src/components/UploadButton';
import React from 'react';

const meta: Meta<typeof UploadButton> = {
  title: 'Shared/UploadButton',
  component: UploadButton,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof UploadButton>;

export const Default: Story = {
  args: {
    onFiles: (files) => alert(`Selected ${files.length} file(s)`),
  },
};

export const ImagesOnly: Story = {
  args: {
    onFiles: (files) => alert(`Selected ${files.length} image(s)`),
    label: 'Upload Images',
    accept: 'image/*',
  },
}; 