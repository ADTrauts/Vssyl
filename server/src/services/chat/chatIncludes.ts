export const conversationParticipantInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} as const;

export const messageListInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  fileReferences: {
    include: {
      file: {
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          url: true,
        },
      },
    },
  },
  reactions: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  readReceipts: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  replyTo: {
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  replies: {
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} as const;

export const messageDetailInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  fileReferences: {
    include: {
      file: {
        select: {
          id: true,
          name: true,
          type: true,
          size: true,
          url: true,
        },
      },
    },
  },
  reactions: true,
  readReceipts: true,
  replyTo: {
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  replies: {
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} as const;

export const threadListInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  messages: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  _count: {
    select: {
      messages: true,
    },
  },
} as const;
