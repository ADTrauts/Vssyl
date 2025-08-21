import type { Meta, StoryObj } from '@storybook/react';
import { Table } from '../src/components/Table';

const meta: Meta<typeof Table> = {
  title: 'Shared/Table',
  component: Table,
  tags: ['autodocs'],
};
export default meta;

type Row = { name: string; age: number; email: string };

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'email', label: 'Email' },
];

const data: Row[] = [
  { name: 'Alice', age: 25, email: 'alice@example.com' },
  { name: 'Bob', age: 30, email: 'bob@example.com' },
  { name: 'Charlie', age: 22, email: 'charlie@example.com' },
];

type Story = StoryObj<typeof Table<Row>>;

export const Basic: Story = {
  render: () => <Table columns={columns} data={data} />,
}; 