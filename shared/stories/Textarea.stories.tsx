import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from '../src/components/Textarea';

const meta: Meta<typeof Textarea> = {
  title: 'Shared/Textarea',
  component: Textarea,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {},
};

export const WithValue: Story = {
  args: {
    value: 'Some text',
    placeholder: 'Type here...'
  },
}; 