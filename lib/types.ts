export interface CommitInfo {
  sha: string;
  shortSha: string;
  author: {
    name: string;
    avatarUrl?: string;
  };
  date: string;
  message: string;
  filesChanged?: {
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions: number;
    deletions: number;
    changes: number;
  }[];
}

export interface FileSnapshot {
  path: string;
  lines: number;
  status: 'added' | 'modified' | 'unmodified' | 'deleted';
  lastAuthor: string;
  lastCommitSha: string;
}

export interface TimelineFrame {
  index: number;
  commit: CommitInfo;
  files: Map<string, FileSnapshot>;
  totalFiles: number;
  totalLines: number;
  stats: {
    added: number;
    modified: number;
    deleted: number;
  };
}

export interface RepoMetadata {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  forks: number;
  defaultBranch: string;
  language: string;
}
