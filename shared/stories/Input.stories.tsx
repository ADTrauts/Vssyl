import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../src/components/Input';

const meta: Meta<typeof Input> = {
  title: 'Shared/Input',
  component: Input,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Type here...'
  },
};

export const WithValue: Story = {
  args: {
    value: 'Hello World',
    placeholder: 'Type here...'
  },
}; 