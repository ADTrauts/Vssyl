import type { Meta, StoryObj } from '@storybook/react';
import { DraggableWrapper, ModuleCard } from '../src/components';
import React, { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';

const meta: Meta<typeof DraggableWrapper> = {
  title: 'Shared/DraggableWrapper',
  component: DraggableWrapper,
  tags: ['autodocs'],
};
export default meta;

type Item = { id: string; title: string };

const initialItems: Item[] = [
  { id: '1', title: 'Module 1' },
  { id: '2', title: 'Module 2' },
  { id: '3', title: 'Module 3' },
];

type Story = StoryObj<typeof DraggableWrapper<Item>>;

export const Basic: Story = {
  render: () => {
    const [items, setItems] = useState(initialItems);
    const onDragEnd = (result: DropResult) => {
      if (!result.destination) return;
      const reordered = Array.from(items);
      const [removed] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, removed);
      setItems(reordered);
    };
    return (
      <DraggableWrapper
        items={items}
        onDragEnd={onDragEnd}
        renderItem={(item) => <ModuleCard title={item.title} />}
      />
    );
  },
}; 