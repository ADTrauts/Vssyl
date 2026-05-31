import { validateAccessibleFileIds } from './driveVisibilityService';
import { ChatServiceError } from './chat/chatErrors';

const API_BASE_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://vssyl-server-235369681725.us-central1.run.app';

type MessageFileRef = {
  file: { url: string };
  [key: string]: unknown;
};

type MessageWithFiles = {
  fileReferences: MessageFileRef[];
  [key: string]: unknown;
};

/** Validates Drive file attachments before message create (FH Pattern 10 / Phase 0 blocker). */
export async function validateMessageAttachmentFileIds(
  userId: string,
  fileIds: string[] | undefined
): Promise<string[]> {
  if (!fileIds?.length) {
    return [];
  }

  const { accessibleIds, deniedIds } = await validateAccessibleFileIds(userId, fileIds);
  if (deniedIds.length > 0) {
    throw new ChatServiceError('One or more attachments are not accessible', 'forbidden', 403);
  }
  return accessibleIds;
}

export function withFullFileUrls<T extends MessageWithFiles>(message: T): T {
  return {
    ...message,
    fileReferences: message.fileReferences.map((fileRef) => ({
      ...fileRef,
      file: {
        ...fileRef.file,
        url: `${API_BASE_URL}${fileRef.file.url}`,
      },
    })),
  };
}

export function withFullFileUrlsOnMessages<T extends MessageWithFiles>(messages: T[]): T[] {
  return messages.map((m) => withFullFileUrls(m));
}
