# To-Do Module - Visual Mockup & UI Examples

This document shows what the To-Do module would look like with code examples and visual descriptions.

---

## 1. Main Todo Page - List View

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  To-Do                    [+ New Task]  [Filters] [⚙️] │
├─────────────────────────────────────────────────────────────┤
│  [List] [Board] [Calendar]  │  Filter: [All ▼]  Sort: [Due ▼]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Review project proposal          Due: Today       │   │
│  │    High Priority • Work • 3 subtasks • 2 comments   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☐ Buy groceries                    Due: Tomorrow     │   │
│  │    Medium Priority • Personal • 5 items             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ☑ Complete quarterly report        Completed 2h ago  │   │
│  │    ✓ Done • Work • 2h 30m actual time              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Code Example: Main Todo Page

```typescript
// web/src/app/todo/page.tsx
'use client';

import React, { useState } from 'react';
import { Button, Card, Badge, Spinner } from 'shared/components';
import { Plus, List, LayoutGrid, Calendar, Filter, MoreVertical } from 'lucide-react';
import { TodoModule } from '@/components/todo/TodoModule';
import { useDashboard } from '@/contexts/DashboardContext';

export default function TodoPage() {
  const { currentDashboardId } = useDashboard();
  const [view, setView] = useState<'list' | 'board' | 'calendar'>('list');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold">To-Do</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your tasks and get things done</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Button>
          <Button variant="ghost" size="md">
            <Filter className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="md">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-1">
          <Button
            variant={view === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
          <Button
            variant={view === 'board' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('board')}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Board
          </Button>
          <Button
            variant={view === 'calendar' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('calendar')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border rounded px-3 py-1">
            <option>All Tasks</option>
            <option>Today</option>
            <option>This Week</option>
            <option>Overdue</option>
          </select>
          <select className="text-sm border rounded px-3 py-1">
            <option>Sort by Due Date</option>
            <option>Sort by Priority</option>
            <option>Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <TodoModule view={view} dashboardId={currentDashboardId} />
      </div>
    </div>
  );
}
```

---

## 2. Task Item - List View

### Visual Design
```
┌──────────────────────────────────────────────────────────────┐
│ ☐ Review project proposal                                    │
│                                                               │
│    📅 Due: Today                    🔴 High Priority         │
│    🏷️ Work • Project Alpha                                   │
│    📋 3 subtasks  💬 2 comments  👤 @john                   │
│                                                               │
│    [Complete] [Snooze] [Edit] [⋯]                            │
└──────────────────────────────────────────────────────────────┘
```

### Code Example: Task Item Component

```typescript
// web/src/components/todo/TaskItem.tsx
'use client';

import React from 'react';
import { Card, Button, Badge, Avatar } from 'shared/components';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  Flag, 
  Tag, 
  ListChecks, 
  MessageSquare,
  User,
  MoreVertical,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Task } from '@/types/todo';

interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onSelect: (id: string) => void;
  view?: 'list' | 'board' | 'compact';
}

export function TaskItem({ task, onComplete, onSelect, view = 'list' }: TaskItemProps) {
  const isCompleted = task.status === 'DONE';
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
  
  const priorityColors = {
    URGENT: 'bg-red-100 text-red-800 border-red-300',
    HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    BLOCKED: 'bg-red-100 text-red-800',
    REVIEW: 'bg-purple-100 text-purple-800',
    DONE: 'bg-green-100 text-green-800',
  };

  return (
    <Card 
      className={`
        p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow
        ${isCompleted ? 'opacity-60' : ''}
        ${isOverdue ? 'border-l-4 border-l-red-500' : ''}
      `}
      onClick={() => onSelect(task.id)}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          className="mt-1"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className={`
            font-semibold text-lg mb-2
            ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}
          `}>
            {task.title}
          </h3>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Due Date */}
            {task.dueDate && (
              <div className={`
                flex items-center gap-1 text-sm
                ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'}
              `}>
                <Calendar className="w-4 h-4" />
                {new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  ...(isOverdue ? {} : { year: 'numeric' })
                })}
                {isOverdue && <span className="ml-1">(Overdue)</span>}
              </div>
            )}

            {/* Priority */}
            <Badge className={priorityColors[task.priority]}>
              <Flag className="w-3 h-3 mr-1" />
              {task.priority}
            </Badge>

            {/* Status */}
            <Badge className={statusColors[task.status]}>
              {task.status.replace('_', ' ')}
            </Badge>

            {/* Category/Tags */}
            {task.category && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Tag className="w-4 h-4" />
                {task.category}
              </div>
            )}

            {/* Subtasks Count */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <ListChecks className="w-4 h-4" />
                {task.subtasks.filter(st => st.status === 'DONE').length} / {task.subtasks.length}
              </div>
            )}

            {/* Comments Count */}
            {task.comments && task.comments.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4" />
                {task.comments.length}
              </div>
            )}

            {/* Assignee (Business) */}
            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <Avatar 
                  src={task.assignedTo.avatar} 
                  name={task.assignedTo.name}
                  size="sm"
                />
                <span className="text-sm text-gray-600">{task.assignedTo.name}</span>
              </div>
            )}

            {/* Time Estimate */}
            {task.timeEstimate && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {task.timeEstimate}m
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

---

## 3. Kanban Board View

### Visual Layout
```
┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│   TODO (5)   │ IN PROGRESS  │   BLOCKED    │   REVIEW     │   DONE (12)  │
│              │     (3)      │     (1)      │     (2)      │              │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│              │              │              │              │              │
│ ┌──────────┐│ ┌──────────┐│ ┌──────────┐│ ┌──────────┐│ ┌──────────┐│
│ │☐ Task 1  ││ │☐ Task 6  ││ │☐ Task 9  ││ │☐ Task 11 ││ │☑ Task 13 ││
│ │High      ││ │Medium    ││ │Urgent    ││ │Medium    ││ │          ││
│ │Due Today ││ │Due 2d    ││ │Blocked   ││ │Review    ││ │          ││
│ └──────────┘│ └──────────┘│ └──────────┘│ └──────────┘│ └──────────┘│
│              │              │              │              │              │
│ ┌──────────┐│ ┌──────────┐│              │ ┌──────────┐│ ┌──────────┐│
│ │☐ Task 2  ││ │☐ Task 7  ││              │ │☐ Task 12 ││ │☑ Task 14 ││
│ │Medium    ││ │Low       ││              │ │High      ││ │          ││
│ │Due 3d    ││ │Due 5d    ││              │ │Review    ││ │          ││
│ └──────────┘│ └──────────┘│              │ └──────────┘│ └──────────┘│
│              │              │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Code Example: Board View Component

```typescript
// web/src/components/todo/TaskBoard.tsx
'use client';

import React, { useState } from 'react';
import { Card, Badge } from 'shared/components';
import { TaskItem } from './TaskItem';
import { Task, TaskStatus } from '@/types/todo';
import { DragDropContext, Droppable, Draggable, DropResult } from '@dnd-kit/core';

interface TaskBoardProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, status: TaskStatus) => void;
}

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { id: 'BLOCKED', label: 'Blocked', color: 'bg-red-100' },
  { id: 'REVIEW', label: 'Review', color: 'bg-purple-100' },
  { id: 'DONE', label: 'Done', color: 'bg-green-100' },
];

export function TaskBoard({ tasks, onTaskUpdate }: TaskBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    
    onTaskUpdate(taskId, newStatus);
  };

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto p-4">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || [];
          
          return (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    flex-shrink-0 w-80
                    ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}
                  `}
                >
                  <Card className={`p-4 ${column.color} h-full`}>
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">{column.label}</h3>
                      <Badge>{columnTasks.length}</Badge>
                    </div>

                    {/* Tasks */}
                    <div className="space-y-3 min-h-[200px]">
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                ${snapshot.isDragging ? 'opacity-50' : ''}
                              `}
                            >
                              <TaskItem 
                                task={task} 
                                view="compact"
                                onComplete={() => {}}
                                onSelect={() => {}}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </Card>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
```

---

## 4. Task Detail Panel (Right Sidebar)

### Visual Layout
```
┌─────────────────────────────────────────┐
│  Review project proposal            [×]  │
├─────────────────────────────────────────┤
│  ☐ In Progress                          │
│  🔴 High Priority                        │
│  📅 Due: Today                          │
│  👤 Assigned to: John Doe               │
│  🏷️ Work • Project Alpha                │
├─────────────────────────────────────────┤
│  Description:                           │
│  Review the Q4 project proposal and     │
│  provide feedback on budget and timeline│
├─────────────────────────────────────────┤
│  Subtasks (2/3)                         │
│  ☑ Review budget                        │
│  ☑ Check timeline                       │
│  ☐ Get stakeholder approval             │
│  [+ Add Subtask]                        │
├─────────────────────────────────────────┤
│  Dependencies                           │
│  ⚠️ Blocks: "Finalize budget"           │
│  ✓ Depends on: "Gather requirements"   │
├─────────────────────────────────────────┤
│  Comments (2)                           │
│  👤 John: "Looks good, minor edits"     │
│  👤 You: "Will review by EOD"          │
│  [Add Comment...]                       │
├─────────────────────────────────────────┤
│  Attachments                            │
│  📎 proposal-draft.pdf                  │
│  📎 budget-breakdown.xlsx               │
│  [+ Attach File]                        │
├─────────────────────────────────────────┤
│  Activity                                │
│  • Created 2 days ago                   │
│  • Assigned to John 1 day ago           │
│  • Status changed to In Progress 3h ago │
├─────────────────────────────────────────┤
│  [Complete] [Edit] [Delete]             │
└─────────────────────────────────────────┘
```

### Code Example: Task Detail Panel

```typescript
// web/src/components/todo/TaskDetail.tsx
'use client';

import React, { useState } from 'react';
import { Card, Button, Badge, Avatar, Textarea } from 'shared/components';
import { 
  X, 
  Calendar, 
  Flag, 
  User, 
  Tag, 
  ListChecks, 
  MessageSquare,
  Paperclip,
  Clock,
  CheckCircle2,
  Edit,
  Trash2
} from 'lucide-react';
import { Task } from '@/types/todo';

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskDetail({ task, onClose, onUpdate, onDelete }: TaskDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [comment, setComment] = useState('');

  return (
    <div className="w-96 h-full border-l bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold">Task Details</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Title & Status */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <input 
              type="checkbox" 
              checked={task.status === 'DONE'}
              className="w-5 h-5"
            />
            <h3 className="text-2xl font-bold">{task.title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{task.status}</Badge>
            <Badge className="bg-red-100 text-red-800">
              <Flag className="w-3 h-3 mr-1" />
              {task.priority}
            </Badge>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-2">
          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.assignedTo && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500" />
              <Avatar src={task.assignedTo.avatar} name={task.assignedTo.name} size="sm" />
              <span>Assigned to: {task.assignedTo.name}</span>
            </div>
          )}
          {task.category && (
            <div className="flex items-center gap-2 text-sm">
              <Tag className="w-4 h-4 text-gray-500" />
              <span>{task.category}</span>
            </div>
          )}
          {task.timeEstimate && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Estimate: {task.timeEstimate} minutes</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <h4 className="font-semibold mb-2">Description</h4>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {task.description || 'No description'}
          </p>
        </div>

        {/* Subtasks */}
        {task.subtasks && task.subtasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold flex items-center gap-2">
                <ListChecks className="w-4 h-4" />
                Subtasks ({task.subtasks.filter(st => st.status === 'DONE').length}/{task.subtasks.length})
              </h4>
            </div>
            <div className="space-y-2">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={subtask.status === 'DONE'}
                    className="w-4 h-4"
                  />
                  <span className={subtask.status === 'DONE' ? 'line-through text-gray-500' : ''}>
                    {subtask.title}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2">
              + Add Subtask
            </Button>
          </div>
        )}

        {/* Comments */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comments ({task.comments?.length || 0})
          </h4>
          <div className="space-y-3 mb-3">
            {task.comments?.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar src={comment.user.avatar} name={comment.user.name} size="sm" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.user.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1"
            />
            <Button variant="primary" size="sm">
              Post
            </Button>
          </div>
        </div>

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Attachments
            </h4>
            <div className="space-y-2">
              {task.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{attachment.name}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2">
              + Attach File
            </Button>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t flex gap-2">
        <Button variant="primary" className="flex-1">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Complete
        </Button>
        <Button variant="secondary">
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

---

## 5. Task Creation Form (Modal)

### Visual Layout
```
┌─────────────────────────────────────────┐
│  Create New Task                    [×] │
├─────────────────────────────────────────┤
│  Title *                                │
│  ┌───────────────────────────────────┐  │
│  │ Review project proposal          │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Description                             │
│  ┌───────────────────────────────────┐  │
│  │ Review the Q4 project proposal  │  │
│  │ and provide feedback...         │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌──────────────┬─────────────────────┐ │
│  │ Priority:    │ [High ▼]           │ │
│  │ Status:      │ [To Do ▼]          │ │
│  └──────────────┴─────────────────────┘ │
│                                          │
│  ┌──────────────┬─────────────────────┐ │
│  │ Due Date:   │ [📅 Today]           │ │
│  │ Assign To:  │ [👤 Select...]       │ │
│  └──────────────┴─────────────────────┘ │
│                                          │
│  Category                                │
│  ┌───────────────────────────────────┐  │
│  │ Work • Project Alpha             │  │
│  └───────────────────────────────────┘  │
│                                          │
│  Time Estimate (minutes)                │
│  ┌───────────────────────────────────┐  │
│  │ 120                              │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ☑ Make this a recurring task           │
│  ☐ Add subtasks                          │
│                                          │
│  [Cancel]              [Create Task]     │
└─────────────────────────────────────────┘
```

---

## 6. Calendar View Integration

### Visual Layout
```
┌─────────────────────────────────────────────────────────────┐
│  January 2025                    [<] Today [>]             │
├─────────────────────────────────────────────────────────────┤
│  Sun    Mon    Tue    Wed    Thu    Fri    Sat              │
├─────────────────────────────────────────────────────────────┤
│         │      │      │      │      │      │                │
│         │  1   │  2   │  3   │  4   │  5   │  6             │
│         │      │      │      │      │      │                │
│         │      │ ☐ T1 │ ☐ T2 │      │ ☐ T3 │                │
│         │      │      │      │      │      │                │
├─────────────────────────────────────────────────────────────┤
│   7     │  8   │  9   │ 10   │ 11   │ 12   │ 13             │
│         │      │      │      │      │      │                │
│ ☐ T4    │ ☐ T5 │      │ ☐ T6 │      │ ☐ T7 │                │
│         │      │      │      │      │      │                │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Mobile Responsive View

### Compact Task Card (Mobile)
```
┌────────────────────────────────────┐
│ ☐ Review project proposal         │
│    🔴 High • Due Today            │
│    3 subtasks • 2 comments        │
└────────────────────────────────────┘
```

---

## 8. AI-Powered Features UI

### Smart Suggestions Panel
```
┌─────────────────────────────────────────┐
│  🤖 AI Suggestions                      │
├─────────────────────────────────────────┤
│  💡 Suggested Priority:                │
│     "Review project proposal" should be │
│     HIGH priority (due today)           │
│     [Accept] [Dismiss]                  │
│                                          │
│  ⏰ Optimal Schedule:                   │
│     Schedule "Buy groceries" for        │
│     tomorrow at 2 PM (after lunch)      │
│     [Schedule] [Dismiss]                │
│                                          │
│  📋 Task Breakdown:                    │
│     "Complete quarterly report" can be  │
│     broken into 3 subtasks              │
│     [View Breakdown]                   │
└─────────────────────────────────────────┘
```

---

## Summary

The To-Do module will feature:

1. **Clean, Modern UI** - Following Vssyl's design system with cards, badges, and consistent spacing
2. **Multiple Views** - List, Board (Kanban), and Calendar views for different workflows
3. **Rich Task Details** - Comprehensive task information with subtasks, comments, attachments
4. **Context-Aware** - Different features for personal vs business contexts
5. **AI Integration** - Smart suggestions, prioritization, and scheduling
6. **Responsive Design** - Works beautifully on desktop, tablet, and mobile
7. **Drag & Drop** - Intuitive task management with drag-and-drop
8. **Real-time Updates** - Live updates via WebSockets

The UI will feel familiar to users of modern task management tools (Todoist, Asana, Linear) while maintaining Vssyl's unique design language and AI-powered features.

