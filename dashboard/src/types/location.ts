import type { Post } from './index';

export interface Location {
  id: string;
  businessId: string;
  businessName: string;
  ghlLocationId: string;
  requiresApproval: boolean;
  ghlLastPostDateFieldId: string | null;
  ghlPostStatusFieldId: string | null;
  status: string;
  timezone: string;
}

export interface LocationSummary extends Location {
  lastPost: Post | null;
  totalPosts: number;
  pendingCount: number;
  hasPostToday: boolean;
}

export type PendingPostItem = Post & {
  locationName: string;
  ghlLocationId: string;
};

export type PostType = Post['type'];
