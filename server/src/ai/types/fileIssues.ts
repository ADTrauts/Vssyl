/**
 * Phase 5: Error taxonomy for file/attachment handling.
 * UI renders message; optional developerDetails behind flag for debugging.
 */

export const FILE_ISSUE_CODES = [
  'NO_TEXT_EXTRACTED',
  'OCR_UNAVAILABLE_IN_PROD',
  'VISION_NOT_ENABLED',
  'FILE_NOT_FETCHABLE_FROM_STORAGE',
  'FILE_NOT_IN_STORAGE',
  'FILE_TOO_LARGE_POLICY',
  'PROVIDER_REJECTED_MEDIA_TYPE',
] as const;

export type FileIssueCode = (typeof FILE_ISSUE_CODES)[number];

export interface FileIssue {
  fileId: string;
  code: FileIssueCode;
  message: string;
  details?: string;
  /** Only included when INCLUDE_FILE_ISSUE_DEVELOPER_DETAILS is set; never to end users. */
  developerDetails?: string;
}

const USER_MESSAGES: Record<FileIssueCode, string> = {
  NO_TEXT_EXTRACTED: 'Text could not be extracted from this file.',
  OCR_UNAVAILABLE_IN_PROD: 'Image text extraction is not available in this environment.',
  VISION_NOT_ENABLED: 'This file could not be used as an image (vision not available for this request).',
  FILE_NOT_FETCHABLE_FROM_STORAGE: 'File could not be loaded from storage.',
  FILE_NOT_IN_STORAGE: 'File could not be found in storage.',
  FILE_TOO_LARGE_POLICY: 'This file exceeds the size limit for analysis.',
  PROVIDER_REJECTED_MEDIA_TYPE: 'This image type is not supported for vision.',
};

export function getMessageForCode(code: FileIssueCode): string {
  return USER_MESSAGES[code] ?? 'This file could not be used.';
}
