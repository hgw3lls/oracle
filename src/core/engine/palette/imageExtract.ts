export type WeightedColor = { hex: string; weight: number };

type RGB = [number, number, number];

const rgbToHex = ([r, g, b]: RGB) =>
  `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;

const dist2 = (a: RGB, b: RGB) => ((a[0] - b[0]) ** 2) + ((a[1] - b[1]) ** 2) + ((a[2] - b[2]) ** 2);

function downsamplePixels(imageData: ImageData, target = 4096): RGB[] {
  const { data, width, height } = imageData;
  const total = width * height;
  const step = Math.max(1, Math.floor(Math.sqrt(total / target)));
  const pixels: RGB[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < 16) continue;
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  return pixels;
}

function deterministicInit(pixels: RGB[], k: number): RGB[] {
  if (pixels.length === 0) return Array.from({ length: k }, () => [0, 0, 0] as RGB);
  return Array.from({ length: k }, (_, i) => pixels[Math.floor((i * pixels.length) / k)] ?? pixels[pixels.length - 1]);
}

function runKMeans(pixels: RGB[], k: number): WeightedColor[] {
  let centers = deterministicInit(pixels, k);
  const assignments = new Array<number>(pixels.length).fill(0);

  for (let iter = 0; iter < 10; iter += 1) {
    for (let i = 0; i < pixels.length; i += 1) {
      let best = 0;
      let bestD = Number.POSITIVE_INFINITY;
      for (let c = 0; c < centers.length; c += 1) {
        const d = dist2(pixels[i], centers[c]);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assignments[i] = best;
    }

    const sums = Array.from({ length: k }, () => [0, 0, 0, 0] as [number, number, number, number]);
    for (let i = 0; i < pixels.length; i += 1) {
      const a = assignments[i];
      sums[a][0] += pixels[i][0];
      sums[a][1] += pixels[i][1];
      sums[a][2] += pixels[i][2];
      sums[a][3] += 1;
    }

    centers = sums.map((s, i) => (s[3] > 0 ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] as RGB : centers[i]));
  }

  const counts = new Array(k).fill(0);
  assignments.forEach((a) => { counts[a] += 1; });
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  return centers.map((c, i) => ({ hex: rgbToHex(c), weight: counts[i] / total }));
}

function runMedianCut(pixels: RGB[], k: number): WeightedColor[] {
  type Bucket = RGB[];
  const buckets: Bucket[] = [pixels];

  while (buckets.length < k) {
    buckets.sort((a, b) => b.length - a.length);
    const bucket = buckets.shift();
    if (!bucket || bucket.length < 2) break;

    const ranges = [0, 1, 2].map((ch) => {
      const vals = bucket.map((p) => p[ch]);
      return Math.max(...vals) - Math.min(...vals);
    });
    const channel = ranges.indexOf(Math.max(...ranges));
    bucket.sort((p1, p2) => p1[channel] - p2[channel]);

    const mid = Math.floor(bucket.length / 2);
    buckets.push(bucket.slice(0, mid), bucket.slice(mid));
  }

  const total = pixels.length || 1;
  return buckets.slice(0, k).map((bucket) => {
    const n = bucket.length || 1;
    const avg: RGB = [
      bucket.reduce((s, p) => s + p[0], 0) / n,
      bucket.reduce((s, p) => s + p[1], 0) / n,
      bucket.reduce((s, p) => s + p[2], 0) / n,
    ];
    return { hex: rgbToHex(avg), weight: bucket.length / total };
  });
}

export function extractDominantPalette(
  imageData: ImageData,
  k: number,
  method: 'kmeans' | 'median_cut' = 'kmeans',
): WeightedColor[] {
  const targetK = Math.max(1, k);
  const pixels = downsamplePixels(imageData);
  const raw = method === 'median_cut' ? runMedianCut(pixels, targetK) : runKMeans(pixels, targetK);

  const normalizedTotal = raw.reduce((s, x) => s + x.weight, 0) || 1;
  return raw
    .map((x) => ({ hex: x.hex, weight: x.weight / normalizedTotal }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, targetK);
}
