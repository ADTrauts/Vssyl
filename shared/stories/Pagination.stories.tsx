import type { Meta, StoryObj } from '@storybook/react';
import { Pagination } from '../src/components/Pagination';
import React, { useState } from 'react';

const meta: Meta<typeof Pagination> = {
  title: 'Shared/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return <Pagination page={page} pageCount={5} onPageChange={setPage} />;
  },
}; 