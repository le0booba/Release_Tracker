export interface RepoInfo {
  url: string;
  owner: string;
  name: string;
  originalUrl: string;
}

export interface ReleaseData {
  stable: string | null;
  prerelease: string | null;
  stableUrl: string | null;
  prereleaseUrl: string | null;
  stableDate?: string | null;
  prereleaseDate?: string | null;
  isTagFallback?: boolean;
  isVersionFile?: boolean;
}

export interface RepoState {
  id: string;
  info: RepoInfo;
  data: ReleaseData | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}
