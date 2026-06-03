/** Notebook product label: Page — storage model remains Prisma `Note`. */

export interface NotePageSnapshot {
  id: string;
  title: string;
  dashboardId: string;
  businessId: string | null;
  folderId: string | null;
  tags: string[];
  pinned: boolean;
  createdById: string;
}

export interface NotePageListItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  pinned: boolean;
  dashboardId: string;
  businessId: string | null;
  folderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  isOwner: boolean;
}

export interface NotePageDetail extends NotePageListItem {
  canEdit: boolean;
}

export interface ListPagesQuery {
  userId: string;
  dashboardId: string;
  businessId?: string | null;
  search?: string;
  tag?: string;
  pinned?: boolean;
  folderId?: string | null;
  sharedWithMe?: boolean;
}
