import type { Meta, StoryObj } from '@storybook/react';
import { FilePreview } from '../src/components/FilePreview';
import React from 'react';

const meta: Meta<typeof FilePreview> = {
  title: 'Shared/FilePreview',
  component: FilePreview,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof FilePreview>;

export const Image: Story = {
  args: {
    file: {
      name: 'cat.jpg',
      type: 'image/jpeg',
      url: 'https://placekitten.com/200/200',
    },
  },
};

export const Document: Story = {
  args: {
    file: {
      name: 'Resume.pdf',
      type: 'application/pdf',
      url: '',
    },
  },
}; 