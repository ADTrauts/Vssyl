'use client'

import * as RadixContextMenu from '@radix-ui/react-context-menu'

export const ContextMenuRoot = RadixContextMenu.Root
export const ContextMenuTrigger = RadixContextMenu.Trigger

export const ContextMenuContent = ({ children, ...props }) => (
  <RadixContextMenu.Portal>
    <RadixContextMenu.Content
      className="radix-context-menu z-[9999] min-w-[160px] rounded-md border bg-white dark:bg-gray-900 p-1 shadow-md text-sm"
      {...props}
    >
      {children}
    </RadixContextMenu.Content>
  </RadixContextMenu.Portal>
)

export const ContextMenuItem = ({ children, ...props }) => (
  <RadixContextMenu.Item
    className="px-2 py-1.5 cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-800"
    {...props}
  >
    {children}
  </RadixContextMenu.Item>
)
