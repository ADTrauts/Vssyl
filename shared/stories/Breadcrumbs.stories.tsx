import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from '../src/components/Breadcrumbs';
import React from 'react';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Shared/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

const items = [
  { label: 'Home', onClick: () => alert('Home') },
  { label: 'Documents', onClick: () => alert('Documents') },
  { label: 'Projects', active: true },
];

export const Default: Story = {
  args: { items },
}; 