export interface InkPlate {
  key: string;
  label: string;
  color: string;
}

export interface PlateWeights {
  cyan: number;
  magenta: number;
  yellow: number;
  black: number;
}

export interface PlateOffset {
  x: number;
  y: number;
}

export interface RenderStateLike {
  hallucination?: number;
  temporal?: number;
  material?: number;
  space?: number;
  symbol?: number;
  agency?: number;
  grain?: number;
  lineWobble?: number;
  'line-wobble'?: number;
  erasure?: number;
  annotation?: number;
  paletteValue?: number;
  palette?: number;
  gestureValue?: number;
  gesture?: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const clamp100 = (n: number) => Math.max(0, Math.min(100, Number(n) || 0));

const hashSeed = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const rngFromSeed = (seed: string) => {
  let a = hashSeed(seed || 'oracle-plates') || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const autoColorMap = (hallucination = 50, paletteMode = 'balanced'): InkPlate[] => {
  const h = clamp100(hallucination);
  if (paletteMode === 'dense' || h > 72) {
    return [
      { key: 'cyan', label: 'Cyan Plate', color: '#12B5FF' },
      { key: 'magenta', label: 'Magenta Plate', color: '#FF3E95' },
      { key: 'yellow', label: 'Yellow Plate', color: '#FFD400' },
      { key: 'black', label: 'Key Plate', color: '#161616' },
    ];
  }

  if (paletteMode === 'sparse' || h < 38) {
    return [
      { key: 'cyan', label: 'Blue Plate', color: '#339DFF' },
      { key: 'magenta', label: 'Coral Plate', color: '#FF5A52' },
      { key: 'yellow', label: 'Bone Plate', color: '#F1DF8A' },
      { key: 'black', label: 'Charcoal Plate', color: '#1A1A1A' },
    ];
  }

  return [
    { key: 'cyan', label: 'Sky Plate', color: '#24A6FF' },
    { key: 'magenta', label: 'Rose Plate', color: '#F84D8A' },
    { key: 'yellow', label: 'Sun Plate', color: '#F3D233' },
    { key: 'black', label: 'Ink Plate', color: '#222222' },
  ];
};

export const plateWeightsFromState = (state: RenderStateLike = {}): PlateWeights => {
  const palette = clamp100(state.paletteValue ?? state.palette ?? 50);
  const gesture = clamp100(state.gestureValue ?? state.gesture ?? 50);
  const hallucination = clamp100(state.hallucination ?? 50);
  const material = clamp100(state.material ?? 50);
  const symbol = clamp100(state.symbol ?? 50);
  const lineWobble = clamp100(state.lineWobble ?? state['line-wobble'] ?? 40);

  return {
    cyan: clamp01((palette * 0.55 + gesture * 0.25 + hallucination * 0.2) / 100),
    magenta: clamp01((hallucination * 0.45 + symbol * 0.35 + gesture * 0.2) / 100),
    yellow: clamp01((material * 0.45 + palette * 0.35 + (100 - hallucination) * 0.2) / 100),
    black: clamp01((symbol * 0.35 + lineWobble * 0.35 + (100 - palette) * 0.3) / 100),
  };
};

export const misregistrationOffsetsFromSeed = (seed: string, spread = 5): Record<string, PlateOffset> => {
  const rng = rngFromSeed(seed || 'oracle-plates');
  const jitter = () => (rng() - 0.5) * 2 * spread;
  return {
    cyan: { x: jitter(), y: jitter() },
    magenta: { x: jitter(), y: jitter() },
    yellow: { x: jitter(), y: jitter() },
    black: { x: jitter() * 0.55, y: jitter() * 0.55 },
  };
};

const gaussian = (x: number, y: number, cx: number, cy: number, sigma: number) => {
  const dx = x - cx;
  const dy = y - cy;
  const d = (dx * dx + dy * dy) / (2 * sigma * sigma);
  return Math.exp(-d);
};

export const coverageFieldAt = (
  xNorm: number,
  yNorm: number,
  plateKey: string,
  seed: string,
  intensity = 1,
): number => {
  const rng = rngFromSeed(`${seed}:${plateKey}`);
  const blobs = 4;
  let blobContribution = 0;

  for (let i = 0; i < blobs; i += 1) {
    const cx = rng();
    const cy = rng();
    const sigma = 0.12 + rng() * 0.28;
    blobContribution += gaussian(xNorm, yNorm, cx, cy, sigma);
  }

  const grid = (
    0.45
      + 0.3 * Math.sin((xNorm * (2.8 + rng())) * Math.PI)
      + 0.25 * Math.cos((yNorm * (3.4 + rng())) * Math.PI)
  );
  const noise = (rng() - 0.5) * 0.22;

  return clamp01((blobContribution / blobs) * 0.55 + grid * 0.35 + noise * 0.1) * clamp01(intensity);
};

const fillPlateField = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  plate: InkPlate,
  seed: string,
  weight: number,
  offset: PlateOffset,
) => {
  const cols = 22;
  const rows = 16;
  const cw = width / cols;
  const rh = height / rows;

  ctx.save();
  ctx.translate(offset.x, offset.y);

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const xn = cols === 1 ? 0 : x / (cols - 1);
      const yn = rows === 1 ? 0 : y / (rows - 1);
      const coverage = coverageFieldAt(xn, yn, plate.key, seed, weight);
      if (coverage < 0.03) continue;
      ctx.fillStyle = plate.color;
      ctx.globalAlpha = Math.min(0.88, coverage * 0.95);
      ctx.fillRect(x * cw, y * rh, cw + 0.8, rh + 0.8);
    }
  }

  ctx.restore();
  ctx.globalAlpha = 1;
};

export const drawLegend = (
  ctx: CanvasRenderingContext2D,
  plates: InkPlate[],
  weights: PlateWeights,
  offsets: Record<string, PlateOffset>,
  width: number,
  height: number,
) => {
  const legendHeight = Math.min(108, Math.max(76, Math.floor(height * 0.22)));
  const y = height - legendHeight;

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillRect(0, y, width, legendHeight);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, y + 0.5, width - 1, legendHeight - 1);
  ctx.font = '11px Courier New, monospace';
  ctx.fillStyle = '#111';

  plates.forEach((plate, idx) => {
    const rowY = y + 18 + idx * 20;
    const weight = weights[plate.key as keyof PlateWeights] ?? 0;
    const off = offsets[plate.key] || { x: 0, y: 0 };
    ctx.fillStyle = plate.color;
    ctx.fillRect(8, rowY - 9, 14, 10);
    ctx.fillStyle = '#111';
    ctx.fillText(
      `${plate.label}  w:${weight.toFixed(2)}  off(${off.x.toFixed(1)}, ${off.y.toFixed(1)})`,
      28,
      rowY,
    );
  });

  ctx.restore();
};

export const renderPlatePreview = ({
  ctx,
  width,
  height,
  seed,
  state,
  showLegend,
  plateMode,
  soloPlate,
}: {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  seed: string;
  state: RenderStateLike;
  showLegend: boolean;
  plateMode: 'composite' | 'separate' | 'solo';
  soloPlate?: string;
}) => {
  const plates = autoColorMap(state.hallucination ?? 50, (state as { saturation?: string }).saturation || 'balanced');
  const weights = plateWeightsFromState(state);
  const offsets = misregistrationOffsetsFromSeed(seed, 6);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#f7f7f7';
  ctx.fillRect(0, 0, width, height);

  if (plateMode === 'separate') {
    const margin = 8;
    const gap = 10;
    const cols = 2;
    const rows = 2;
    const cellW = (width - margin * 2 - gap) / cols;
    const cellH = (height - margin * 2 - gap) / rows;

    plates.forEach((plate, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const x = margin + c * (cellW + gap);
      const y = margin + r * (cellH + gap);
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.strokeStyle = '#111';
      ctx.strokeRect(x, y, cellW, cellH);
      ctx.save();
      ctx.translate(x, y);
      fillPlateField(ctx, cellW, cellH, plate, seed, weights[plate.key as keyof PlateWeights], offsets[plate.key]);
      ctx.restore();
      ctx.fillStyle = '#111';
      ctx.font = '11px Courier New, monospace';
      ctx.fillText(plate.label, x + 6, y + 14);
    });
  } else {
    const selected = plateMode === 'solo' ? plates.filter((p) => p.key === (soloPlate || 'cyan')) : plates;
    selected.forEach((plate) => {
      fillPlateField(ctx, width, height, plate, seed, weights[plate.key as keyof PlateWeights], offsets[plate.key]);
    });
  }

  if (showLegend) {
    drawLegend(ctx, plates, weights, offsets, width, height);
  }

  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  return { plates, weights, offsets };
};
