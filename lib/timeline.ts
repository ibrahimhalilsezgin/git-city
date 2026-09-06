import { CommitInfo, FileSnapshot, TimelineFrame } from './types';

export function buildTimelineFrames(commits: CommitInfo[]): TimelineFrame[] {
  const frames: TimelineFrame[] = [];
  const currentFiles = new Map<string, FileSnapshot>();

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    let addedCount = 0;
    let modifiedCount = 0;
    let deletedCount = 0;

    // Reset status of existing files to 'unmodified' for the new frame
    for (const [path, snapshot] of currentFiles.entries()) {
      currentFiles.set(path, {
        ...snapshot,
        status: 'unmodified',
      });
    }

    if (commit.filesChanged && commit.filesChanged.length > 0) {
      for (const change of commit.filesChanged) {
        const path = change.filename;

        if (change.status === 'removed') {
          if (currentFiles.has(path)) {
            currentFiles.delete(path);
            deletedCount++;
          }
        } else if (change.status === 'added') {
          const lines = Math.max(10, change.additions || 25);
          currentFiles.set(path, {
            path,
            lines,
            status: 'added',
            lastAuthor: commit.author.name,
            lastCommitSha: commit.shortSha,
          });
          addedCount++;
        } else {
          // modified or renamed
          const existing = currentFiles.get(path);
          const currentLines = existing ? existing.lines : 30;
          const delta = (change.additions || 0) - (change.deletions || 0);
          const newLines = Math.max(10, currentLines + delta);

          currentFiles.set(path, {
            path,
            lines: newLines,
            status: 'modified',
            lastAuthor: commit.author.name,
            lastCommitSha: commit.shortSha,
          });
          modifiedCount++;
        }
      }
    }

    // Clone files map for this frame
    const frameFiles = new Map<string, FileSnapshot>();
    let totalLines = 0;

    for (const [p, s] of currentFiles.entries()) {
      frameFiles.set(p, { ...s });
      totalLines += s.lines;
    }

    frames.push({
      index: i,
      commit,
      files: frameFiles,
      totalFiles: frameFiles.size,
      totalLines,
      stats: {
        added: addedCount,
        modified: modifiedCount,
        deleted: deletedCount,
      },
    });
  }

  return frames;
}
