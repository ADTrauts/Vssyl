import type { Meta, StoryObj } from '@storybook/react';
import { GridLayout, ModuleCard } from '../src/components';

const meta: Meta<typeof GridLayout> = {
  title: 'Shared/GridLayout',
  component: GridLayout,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof GridLayout>;

export const ThreeColumns: Story = {
  render: () => (
    <GridLayout columns={3}>
      <ModuleCard title="Module 1" />
      <ModuleCard title="Module 2" />
      <ModuleCard title="Module 3" />
    </GridLayout>
  ),
};

export const FourColumns: Story = {
  render: () => (
    <GridLayout columns={4}>
      <ModuleCard title="Module 1" />
      <ModuleCard title="Module 2" />
      <ModuleCard title="Module 3" />
      <ModuleCard title="Module 4" />
    </GridLayout>
  ),
}; 