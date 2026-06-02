export const taskWithUsersInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
} as const;

/** List/browse shape (matches legacy `getTasks` include). */
export const taskListInclude = {
  ...taskWithUsersInclude,
  subtasks: {
    where: { trashedAt: null },
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  comments: {
    take: 5,
    orderBy: { createdAt: 'desc' as const },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  },
  attachments: {
    select: {
      id: true,
      name: true,
      url: true,
      size: true,
      mimeType: true,
    },
  },
  project: {
    select: {
      id: true,
      name: true,
      color: true,
    },
  },
  _count: {
    select: {
      subtasks: true,
      comments: true,
      watchers: true,
      attachments: true,
    },
  },
} as const;

/** Detail shape (matches legacy `getTaskById` include). */
export const taskDetailInclude = {
  ...taskWithUsersInclude,
  subtasks: {
    where: { trashedAt: null },
    orderBy: { createdAt: 'asc' as const },
  },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  },
  attachments: true,
  linkedFiles: true,
  linkedEvents: true,
  dependsOnTasks: {
    include: {
      dependsOn: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
  blockingTasks: {
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
  watchers: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  },
} as const;
