export const calendarMemberForUserInclude = {
  members: { where: { userId: '' as string } },
} as const;

export const eventWithRelationsInclude = {
  attendees: true,
  reminders: true,
  attachments: true,
} as const;
