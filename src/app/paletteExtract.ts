const clamp = (n: number, lo = 0, hi = 255) => Math.max(lo, Math.min(hi, n));

const toHex = (r: number, g: number, b: number) => `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;

export async function extractPaletteFromImage(file: File, count = 5): Promise<string[]> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const maxDim = 240;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  canvas.width = Math.max(1, Math.floor(bitmap.width * scale));
  canvas.height = Math.max(1, Math.floor(bitmap.height * scale));

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas not available in this browser.');
  }

  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const bucketMap = new Map<string, { count: number; r: number; g: number; b: number }>();

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 16) continue;

    const br = Math.round(r / 32) * 32;
    const bg = Math.round(g / 32) * 32;
    const bb = Math.round(b / 32) * 32;
    const key = `${br}-${bg}-${bb}`;

    const prev = bucketMap.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    prev.count += 1;
    prev.r += r;
    prev.g += g;
    prev.b += b;
    bucketMap.set(key, prev);
  }

  const sorted = [...bucketMap.values()].sort((a, b) => b.count - a.count).slice(0, Math.max(1, Math.min(12, count * 2)));
  const unique: string[] = [];

  for (const c of sorted) {
    const hex = toHex(Math.round(c.r / c.count), Math.round(c.g / c.count), Math.round(c.b / c.count));
    if (!unique.includes(hex)) {
      unique.push(hex);
    }
    if (unique.length >= count) break;
  }

  if (!unique.length) {
    throw new Error('No colors detected from image.');
  }

  return unique;
}
