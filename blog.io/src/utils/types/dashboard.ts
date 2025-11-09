// types/index.ts

/**
 * Represents a Firestore timestamp.
 */
export interface FirestoreTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

/**
 * Defines the structure for a site's statistics.
 */
export interface SiteStats {
  views: number;
  likes: number;
}

/**
 * Defines the possible statuses for a site.
 */
export type SiteStatus = 'published' | 'draft';

/**
 * Represents a single site object.
 */
export interface Site {
  isFavourite: boolean;
  id: string;
  title: string;
  subdomain: string;
  status: SiteStatus;
  createdAt: FirestoreTimestamp;
  lastPublishedAt: FirestoreTimestamp;
  stats: SiteStats;
}

/**
 * Represents a user's profile information.
 */
export interface UserProfile {
  firstName?: string;
}

/**
 * Defines the overall statistics for the dashboard.
 */
export interface DashboardStats {
  totalSites?: number;
  totalLikes?: number;
  totalViews?: number;
}

/**
 * Represents a recent post entry.
 */
export interface RecentPost {
    id: string;
    title: string;
    status: SiteStatus;
}

/**
 * Defines the complete data structure fetched for the dashboard.
 */
export interface UserData {
  user: UserProfile | null;
  sites: Site[];
  recentPosts: RecentPost[];
  stats: DashboardStats;
}