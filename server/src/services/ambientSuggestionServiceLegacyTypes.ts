/** Legacy type for proactiveSuggestionsService re-exports. */

export interface DocumentUploadContext {
  userId: string;
  fileId: string;
  fileName: string;
  mimetype: string;
  dashboardId?: string;
  businessId?: string | null;
}
