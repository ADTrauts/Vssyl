import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '../src/components/Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Shared/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {},
};

export const WithImage: Story = {
  args: {
    src: 'https://randomuser.me/api/portraits/men/32.jpg',
    alt: 'User Avatar',
  },
};

export const Large: Story = {
  args: {
    size: 80,
  },
}; 