export type TimelinePost = {
  id: number;
  publicId: string;
  premise1: string;
  premise2: string;
  code: string;
  language: string;
  version: string | null;
  aiSummary: string | null;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string | null;
  authorProfileLanguages: string[];
  likeCount: number;
  commentCount: number;
  tags: string[];
  likedByMe: boolean;
};

export type AuthUser = {
  id: number;
  name: string;
  handle: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  profileLanguages?: string[];
};

export type ComposerSuggestions = {
  languages: string[];
  versions: string[];
  tags: string[];
};
