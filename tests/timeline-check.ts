import assert from 'node:assert';
import { buildTimelineFrames } from '../lib/timeline';
import { DEMO_REPOS } from '../lib/mockData';

console.log('Testing buildTimelineFrames with demo repos...');

const swrCommits = DEMO_REPOS['vercel/swr'].commits;
const frames = buildTimelineFrames(swrCommits);

assert.strictEqual(frames.length, swrCommits.length, 'Frames length must match commits count');

// Frame 0: Initial commit
const frame0 = frames[0];
assert.strictEqual(frame0.index, 0);
assert(frame0.totalFiles > 0, 'Frame 0 should have initial files');
assert(frame0.files.has('src/index.ts'), 'src/index.ts should exist in frame 0');

// Frame 3: src/utils/hash.ts was removed in commit index 3
const frame3 = frames[3];
assert(!frame3.files.has('src/utils/hash.ts'), 'src/utils/hash.ts should be removed in frame 3');
assert(frame3.stats.deleted >= 1, 'Frame 3 should register deletion');

// Last frame has most evolved codebase
const lastFrame = frames[frames.length - 1];
assert(lastFrame.totalFiles > frame0.totalFiles, 'Evolved repo should have more files');
assert(lastFrame.totalLines > 0, 'Total lines should be positive');

console.log('PASS: timeline-check passed all assertions! Total frames:', frames.length, 'Final files:', lastFrame.totalFiles, 'Final lines:', lastFrame.totalLines);
