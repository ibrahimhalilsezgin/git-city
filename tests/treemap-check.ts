import assert from 'node:assert';
import { computeCityLayout, FileItem } from '../lib/treemap';

console.log('Testing computeCityLayout...');

const sampleFiles: FileItem[] = [
  { path: 'src/index.ts', lines: 120 },
  { path: 'src/components/App.tsx', lines: 450 },
  { path: 'src/components/Button.tsx', lines: 80 },
  { path: 'src/utils/math.ts', lines: 35 },
  { path: 'package.json', lines: 60 },
  { path: 'README.md', lines: 15 },
  { path: 'deleted-old.js', lines: 200, status: 'deleted' },
];

const layout = computeCityLayout(sampleFiles, 40);

assert.strictEqual(layout.totalFiles, 6, 'Should ignore deleted files and have 6 buildings');
assert(layout.totalLines > 0, 'Total lines should be > 0');
assert(layout.buildings.length === 6, 'Buildings count must be 6');
assert(layout.districts.length > 0, 'Districts should be created for folders');

for (const b of layout.buildings) {
  assert(!Number.isNaN(b.x), `Building ${b.path} x is NaN`);
  assert(!Number.isNaN(b.z), `Building ${b.path} z is NaN`);
  assert(b.width > 0, `Building ${b.path} width must be > 0`);
  assert(b.depth > 0, `Building ${b.path} depth must be > 0`);
  assert(b.targetHeight > 0, `Building ${b.path} height must be > 0`);
  assert(b.color.startsWith('#'), `Building ${b.path} color must be hex`);
}

console.log('PASS: treemap-check passed all assertions! Total buildings:', layout.buildings.length, 'Districts:', layout.districts.length);
