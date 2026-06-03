import type { Place, PlaceFollowVisibility, PlaceInterest, PlaceNode, PlaceSettings } from '@prisma/client';
import type { PlaceNodeType } from '@prisma/client';

export interface PlaceGraphSnapshot extends Place {
  nodes: PlaceNode[];
  settings: PlaceSettings | null;
  interests: PlaceInterest[];
}

export interface UpdatePlaceSettingsInput {
  userId: string;
  neighborhoodVisibility?: string;
  defaultFollowVisibility?: boolean;
  layoutMode?: string;
  showLabels?: boolean;
  highContrastMode?: boolean;
  showLocalSuggestions?: boolean;
  suggestionRadius?: number;
}

export interface AddPlaceNodeInput {
  userId: string;
  nodeType: PlaceNodeType;
  entityId: string;
  positionX?: number | null;
  positionY?: number | null;
  label?: string | null;
  color?: string | null;
}

export interface UpdatePlaceNodeInput {
  userId: string;
  nodeId: string;
  positionX?: number | null;
  positionY?: number | null;
  label?: string | null;
  color?: string | null;
  pinned?: boolean;
}

export interface RemovePlaceNodeInput {
  userId: string;
  nodeId: string;
}

export interface SetPlaceInterestsInput {
  userId: string;
  categories: string[];
}

export interface UpdateFollowVisibilityInput {
  userId: string;
  businessId: string;
  isVisible: boolean;
}

export type FollowVisibilityRecord = PlaceFollowVisibility | {
  userId: string;
  businessId: string;
  isVisible: boolean;
};
