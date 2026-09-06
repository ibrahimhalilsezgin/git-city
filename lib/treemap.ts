import { getLanguageForFile } from './languages';

export interface FileItem {
  path: string;
  lines: number;
  status?: 'added' | 'modified' | 'unmodified' | 'deleted';
}

export interface BuildingLayout {
  path: string;
  name: string;
  directory: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  targetHeight: number;
  color: string;
  language: string;
  lines: number;
}

export interface DistrictLayout {
  path: string;
  name: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  level: number;
}

export interface CityLayout {
  buildings: BuildingLayout[];
  districts: DistrictLayout[];
  totalFiles: number;
  totalLines: number;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    depth: number;
  };
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  value: number;
  children: Map<string, TreeNode>;
  file?: FileItem;
}

function buildHierarchy(files: FileItem[]): TreeNode {
  const root: TreeNode = {
    name: 'root',
    path: '',
    isDirectory: true,
    value: 0,
    children: new Map(),
  };

  for (const file of files) {
    if (file.status === 'deleted') continue;

    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const subPath = parts.slice(0, i + 1).join('/');

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: subPath,
          isDirectory: !isFile,
          value: 0,
          children: new Map(),
          file: isFile ? file : undefined,
        });
      }

      current = current.children.get(part)!;
    }
  }

  // Calculate values (weighted sum of lines with baseline)
  function computeValue(node: TreeNode): number {
    if (!node.isDirectory) {
      // Baseline minimum weight so small files still get visible ground footprint
      node.value = Math.max(10, node.file?.lines || 10);
      return node.value;
    }

    let sum = 0;
    for (const child of node.children.values()) {
      sum += computeValue(child);
    }
    node.value = Math.max(1, sum);
    return node.value;
  }

  computeValue(root);
  return root;
}

interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

// Squarified treemap partition
function squarify(
  children: TreeNode[],
  rect: Rect,
  districts: DistrictLayout[],
  buildings: BuildingLayout[],
  level: number
) {
  if (children.length === 0) return;

  const totalValue = children.reduce((acc, c) => acc + c.value, 0);
  if (totalValue === 0) return;

  // Sort descending by value for optimal aspect ratio
  const sorted = [...children].sort((a, b) => b.value - a.value);

  // Layout orientation: cut along the longer dimension
  let currentX = rect.x;
  let currentZ = rect.z;
  const isHorizontal = rect.w >= rect.d;

  let remainingW = rect.w;
  let remainingD = rect.d;

  for (let i = 0; i < sorted.length; i++) {
    const child = sorted[i];
    const fraction = child.value / totalValue;

    let childW: number;
    let childD: number;

    if (isHorizontal) {
      childW = remainingW * fraction;
      childD = remainingD;
    } else {
      childW = remainingW;
      childD = remainingD * fraction;
    }

    // Minimum size clamps
    childW = Math.max(0.6, childW);
    childD = Math.max(0.6, childD);

    const childRect: Rect = {
      x: currentX,
      z: currentZ,
      w: childW,
      d: childD,
    };

    if (child.isDirectory) {
      districts.push({
        path: child.path,
        name: child.name,
        x: childRect.x + childRect.w / 2,
        z: childRect.z + childRect.d / 2,
        width: childRect.w,
        depth: childRect.d,
        level,
      });

      // Internal district padding for street network
      const padding = Math.min(0.3, childRect.w * 0.08, childRect.d * 0.08);
      const innerRect: Rect = {
        x: childRect.x + padding,
        z: childRect.z + padding,
        w: Math.max(0.4, childRect.w - padding * 2),
        d: Math.max(0.4, childRect.d - padding * 2),
      };

      squarify(
        Array.from(child.children.values()),
        innerRect,
        districts,
        buildings,
        level + 1
      );
    } else {
      // File building
      const lang = getLanguageForFile(child.path);
      const lines = child.file?.lines || 10;
      const height = Math.max(0.4, Math.log10(lines + 1) * 3.8);

      const margin = 0.08;
      const bW = Math.max(0.4, childRect.w - margin * 2);
      const bD = Math.max(0.4, childRect.d - margin * 2);

      buildings.push({
        path: child.path,
        name: child.name,
        directory: child.path.substring(0, child.path.lastIndexOf('/')) || 'root',
        x: childRect.x + childRect.w / 2,
        z: childRect.z + childRect.d / 2,
        width: bW,
        depth: bD,
        targetHeight: height,
        color: lang.color,
        language: lang.name,
        lines,
      });
    }

    if (isHorizontal) {
      currentX += childW;
      remainingW = Math.max(0, remainingW - childW);
    } else {
      currentZ += childD;
      remainingD = Math.max(0, remainingD - childD);
    }
  }
}

export function computeCityLayout(files: FileItem[], islandSize = 60): CityLayout {
  const root = buildHierarchy(files);
  const buildings: BuildingLayout[] = [];
  const districts: DistrictLayout[] = [];

  const baseRect: Rect = {
    x: -islandSize / 2,
    z: -islandSize / 2,
    w: islandSize,
    d: islandSize,
  };

  squarify(Array.from(root.children.values()), baseRect, districts, buildings, 0);

  let totalLines = 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (const b of buildings) {
    totalLines += b.lines;
    minX = Math.min(minX, b.x - b.width / 2);
    maxX = Math.max(maxX, b.x + b.width / 2);
    minZ = Math.min(minZ, b.z - b.depth / 2);
    maxZ = Math.max(maxZ, b.z + b.depth / 2);
  }

  if (buildings.length === 0) {
    minX = -5;
    maxX = 5;
    minZ = -5;
    maxZ = 5;
  }

  return {
    buildings,
    districts,
    totalFiles: buildings.length,
    totalLines,
    bounds: {
      minX,
      maxX,
      minZ,
      maxZ,
      width: maxX - minX,
      depth: maxZ - minZ,
    },
  };
}
