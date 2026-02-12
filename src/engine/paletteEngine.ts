import { hexToHsl } from './colorWheel';

export type PaletteEntry = { hex: string; weight: number };

const toHex = (r: number, g: number, b: number) => `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const distSq = (a: number[], b: number[]) => ((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2) + ((a[2] - b[2]) ** 2);

export const extractDominantPalette = (imageData: { data: Uint8ClampedArray; width: number; height: number }, k = 5, method: 'median_cut' | 'kmeans' = 'kmeans'): PaletteEntry[] => {
  const stride = Math.max(1, Math.floor(Math.sqrt((imageData.width * imageData.height) / 1200)));
  const pixels: number[][] = [];
  for (let y = 0; y < imageData.height; y += stride) {
    for (let x = 0; x < imageData.width; x += stride) {
      const i = (y * imageData.width + x) * 4;
      if (imageData.data[i + 3] < 10) continue;
      pixels.push([imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]]);
    }
  }
  if (!pixels.length) return [];

  if (method === 'median_cut') {
    const buckets: number[][][] = [pixels];
    while (buckets.length < k) {
      buckets.sort((a, b) => b.length - a.length);
      const bucket = buckets.shift();
      if (!bucket || bucket.length < 2) break;
      const ranges = [0, 1, 2].map((idx) => Math.max(...bucket.map((p) => p[idx])) - Math.min(...bucket.map((p) => p[idx])));
      const axis = ranges.indexOf(Math.max(...ranges));
      bucket.sort((a, b) => a[axis] - b[axis]);
      const mid = Math.floor(bucket.length / 2);
      buckets.push(bucket.slice(0, mid), bucket.slice(mid));
    }
    return buckets.map((bucket) => {
      const avg = bucket.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]).map((v) => v / bucket.length);
      return { hex: toHex(avg[0], avg[1], avg[2]), weight: bucket.length / pixels.length };
    }).sort((a, b) => b.weight - a.weight);
  }

  const centroids = Array.from({ length: Math.max(1, k) }, (_, idx) => pixels[Math.floor((idx / Math.max(1, k - 1)) * (pixels.length - 1))]);
  for (let iter = 0; iter < 8; iter += 1) {
    const groups = centroids.map(() => [] as number[][]);
    pixels.forEach((p) => {
      let best = 0;
      let bestD = distSq(p, centroids[0]);
      for (let i = 1; i < centroids.length; i += 1) {
        const d = distSq(p, centroids[i]);
        if (d < bestD) { best = i; bestD = d; }
      }
      groups[best].push(p);
    });
    groups.forEach((group, idx) => {
      if (!group.length) return;
      centroids[idx] = group.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]], [0, 0, 0]).map((v) => v / group.length);
    });
  }
  const clusterWeights = centroids.map((c) => ({ c, count: 0 }));
  pixels.forEach((p) => {
    let best = 0; let bestD = distSq(p, centroids[0]);
    for (let i = 1; i < centroids.length; i += 1) {
      const d = distSq(p, centroids[i]);
      if (d < bestD) { best = i; bestD = d; }
    }
    clusterWeights[best].count += 1;
  });
  return clusterWeights.filter((x) => x.count > 0).map((x) => ({ hex: toHex(x.c[0], x.c[1], x.c[2]), weight: x.count / pixels.length })).sort((a, b) => b.weight - a.weight);
};

export const toRisoPlates = (palette: PaletteEntry[], maxPlates = 4) => {
  const picked = palette.slice(0, maxPlates);
  const sorted = [...picked].sort((a, b) => hexToHsl(a.hex).l - hexToHsl(b.hex).l);
  return sorted.map((entry, idx) => ({
    name: `PLATE_${idx + 1}`,
    hex: entry.hex,
    role: idx === 0 ? 'keyline' : 'overlay',
    opacity: idx === 0 ? 1 : 0.6 + (0.3 * entry.weight),
  }));
};
