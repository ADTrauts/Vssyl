import { VLinkEntityType } from '@prisma/client';
import {
  resolveCalendarEventForVLink,
  userCanLinkCalendarEvent,
} from './calendarVlinkAccessService';
import {
  resolveChatConversationForVLink,
  userCanLinkChatConversation,
} from './chatVlinkAccessService';
import {
  resolveDriveFileForVLink,
  resolveDriveFolderForVLink,
  userCanLinkDriveFile,
  userCanLinkDriveFolder,
} from './driveVlinkAccessService';
import {
  resolveTodoTaskForVLink,
  userCanLinkTodoTask,
} from './todoVlinkAccessService';
import {
  resolveNoteForVLink,
  userCanLinkNote,
} from './notesVlinkAccessService';
import {
  resolvePlaceListingForVLink,
  resolvePlaceMeetingForVLink,
  userCanLinkPlaceListing,
  userCanLinkPlaceMeeting,
} from './place/placeVlinkAccessService';
import {
  resolveScheduleForVLink,
  resolveShiftForVLink,
  resolveShiftSwapRequestForVLink,
  userCanLinkSchedule,
  userCanLinkShift,
  userCanLinkShiftSwapRequest,
} from './schedulingVlinkAccessService';
import {
  resolveAttendanceExceptionForVLink,
  resolveEmployeeProfileForVLink,
  resolveOnboardingJourneyForVLink,
  resolveTimeOffRequestForVLink,
  userCanLinkAttendanceException,
  userCanLinkEmployeeProfile,
  userCanLinkOnboardingJourney,
  userCanLinkTimeOffRequest,
} from './hrVlinkAccessService';
import {
  resolveWorkforceCampaignForVLink,
  resolveWorkforceCommunicationForVLink,
  userCanLinkWorkforceCampaign,
  userCanLinkWorkforceCommunication,
} from './workforceVlinkAccessService';

export type EntityAccessLevel = 'full' | 'restricted';

export interface ResolvedVLinkEntity {
  id: string;
  entityType: VLinkEntityType;
  entityId: string;
  moduleId: string | null;
  access: EntityAccessLevel;
  title?: string;
  url?: string;
  linkedAt: Date;
}

export async function resolveEntityAccess(
  userId: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<{ access: EntityAccessLevel; title?: string; url?: string }> {
  switch (entityType) {
    case VLinkEntityType.FILE: {
      const result = await resolveDriveFileForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return { access: 'full', title: result.title, url: result.url };
    }
    case VLinkEntityType.FOLDER: {
      const result = await resolveDriveFolderForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return { access: 'full', title: result.title, url: result.url };
    }
    case VLinkEntityType.CHAT_CONVERSATION: {
      const result = await resolveChatConversationForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.CALENDAR_EVENT: {
      const result = await resolveCalendarEventForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.TASK:
    case VLinkEntityType.TODO: {
      const result = await resolveTodoTaskForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.NOTE: {
      const result = await resolveNoteForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.PLACE_LISTING: {
      const result = await resolvePlaceListingForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.PLACE_MEETING: {
      const result = await resolvePlaceMeetingForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.SCHEDULE: {
      const result = await resolveScheduleForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.SCHEDULE_SHIFT: {
      const result = await resolveShiftForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.SHIFT_SWAP_REQUEST: {
      const result = await resolveShiftSwapRequestForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.HR_EMPLOYEE_PROFILE: {
      const result = await resolveEmployeeProfileForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.HR_TIME_OFF_REQUEST: {
      const result = await resolveTimeOffRequestForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.HR_ATTENDANCE_EXCEPTION: {
      const result = await resolveAttendanceExceptionForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.HR_ONBOARDING_JOURNEY: {
      const result = await resolveOnboardingJourneyForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.WORKFORCE_COMMUNICATION: {
      const result = await resolveWorkforceCommunicationForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    case VLinkEntityType.WORKFORCE_CAMPAIGN: {
      const result = await resolveWorkforceCampaignForVLink(userId, entityId);
      if (!result.allowed) {
        return { access: 'restricted', title: result.title };
      }
      return {
        access: 'full',
        title: result.title,
        url: result.url,
      };
    }
    default:
      return resolveNonDriveEntityAccess(userId, entityType, entityId);
  }
}

async function resolveNonDriveEntityAccess(
  userId: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<{ access: EntityAccessLevel; title?: string; url?: string }> {
  switch (entityType) {
    default:
      return { access: 'restricted' };
  }
}

export async function userCanLinkEntity(
  userId: string,
  entityType: VLinkEntityType,
  entityId: string
): Promise<boolean> {
  switch (entityType) {
    case VLinkEntityType.FILE:
      return userCanLinkDriveFile(userId, entityId);
    case VLinkEntityType.FOLDER:
      return userCanLinkDriveFolder(userId, entityId);
    case VLinkEntityType.CHAT_CONVERSATION:
      return userCanLinkChatConversation(userId, entityId);
    case VLinkEntityType.CALENDAR_EVENT:
      return userCanLinkCalendarEvent(userId, entityId);
    case VLinkEntityType.TASK:
    case VLinkEntityType.TODO:
      return userCanLinkTodoTask(userId, entityId);
    case VLinkEntityType.NOTE:
      return userCanLinkNote(userId, entityId);
    case VLinkEntityType.PLACE_LISTING:
      return userCanLinkPlaceListing(userId, entityId);
    case VLinkEntityType.PLACE_MEETING:
      return userCanLinkPlaceMeeting(userId, entityId);
    case VLinkEntityType.SCHEDULE:
      return userCanLinkSchedule(userId, entityId);
    case VLinkEntityType.SCHEDULE_SHIFT:
      return userCanLinkShift(userId, entityId);
    case VLinkEntityType.SHIFT_SWAP_REQUEST:
      return userCanLinkShiftSwapRequest(userId, entityId);
    case VLinkEntityType.HR_EMPLOYEE_PROFILE:
      return userCanLinkEmployeeProfile(userId, entityId);
    case VLinkEntityType.HR_TIME_OFF_REQUEST:
      return userCanLinkTimeOffRequest(userId, entityId);
    case VLinkEntityType.HR_ATTENDANCE_EXCEPTION:
      return userCanLinkAttendanceException(userId, entityId);
    case VLinkEntityType.HR_ONBOARDING_JOURNEY:
      return userCanLinkOnboardingJourney(userId, entityId);
    case VLinkEntityType.WORKFORCE_COMMUNICATION:
      return userCanLinkWorkforceCommunication(userId, entityId);
    case VLinkEntityType.WORKFORCE_CAMPAIGN:
      return userCanLinkWorkforceCampaign(userId, entityId);
    default: {
      const resolved = await resolveEntityAccess(userId, entityType, entityId);
      return resolved.access === 'full';
    }
  }
}

export function entityTypeLabel(entityType: VLinkEntityType): string {
  switch (entityType) {
    case VLinkEntityType.FILE:
      return 'File';
    case VLinkEntityType.FOLDER:
      return 'Folder';
    case VLinkEntityType.CALENDAR_EVENT:
      return 'Calendar event';
    case VLinkEntityType.CHAT_CONVERSATION:
      return 'Conversation';
    case VLinkEntityType.CHAT_THREAD:
      return 'Thread';
    case VLinkEntityType.TASK:
    case VLinkEntityType.TODO:
      return 'Task';
    case VLinkEntityType.NOTE:
      return 'Note';
    case VLinkEntityType.PLACE_LISTING:
      return 'Place listing';
    case VLinkEntityType.PLACE_MEETING:
      return 'Place meeting';
    case VLinkEntityType.SCHEDULE:
      return 'Schedule';
    case VLinkEntityType.SCHEDULE_SHIFT:
      return 'Shift';
    case VLinkEntityType.SHIFT_SWAP_REQUEST:
      return 'Shift swap request';
    case VLinkEntityType.HR_EMPLOYEE_PROFILE:
      return 'Employee profile';
    case VLinkEntityType.HR_TIME_OFF_REQUEST:
      return 'Time-off request';
    case VLinkEntityType.HR_ATTENDANCE_EXCEPTION:
      return 'Attendance exception';
    case VLinkEntityType.HR_ONBOARDING_JOURNEY:
      return 'Onboarding journey';
    case VLinkEntityType.WORKFORCE_COMMUNICATION:
      return 'Communication';
    case VLinkEntityType.WORKFORCE_CAMPAIGN:
      return 'Campaign';
    default:
      return 'Item';
  }
}
