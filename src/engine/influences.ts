import type { SchemaV2 } from '../schema/schemaV2';

export type InfluenceWeights = {
  inkSpray: number;
  meatBrush: number;
  collageBreak: number;
  networkMap: number;
  occultDiagram: number;
  graphicNovel: number;
  printMaterial: number;
  handDrawn: number;
};

export type InfluenceBehaviorOptions = {
  intensity?: number;
  punctuation?: 'period' | 'semicolon';
};

const ACTION_VERBS = {
  inkSpray: 'spray and splatter pigment clouds',
  meatBrush: 'smear, scrape, and drag flesh-like strokes',
  collageBreak: 'graft torn collage seams and fracture edges',
  networkMap: 'arc evidence lines between indexed nodes',
  occultDiagram: 'inscribe correspondences in concentric sigils',
  graphicNovel: 'frame memory as panel cuts and hard gutters',
  printMaterial: 'overprint riso/gelli/screen textures with plate drift',
  handDrawn: 'trace hesitant hand-drawn contours and corrections',
} as const;

export function isWeightsWithinBounds(weights: InfluenceWeights): boolean {
  return Object.values(weights).every((v) => typeof v === 'number' && v >= 0 && v <= 100);
}

export function renderInfluenceBehaviors(
  weights: InfluenceWeights,
  options: InfluenceBehaviorOptions = {},
): string[] {
  const punctuation = options.punctuation === 'semicolon' ? ';' : '.';
  const intensity = options.intensity ?? 100;

  const entries = (Object.entries(weights) as [keyof InfluenceWeights, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);

  return entries.map(([key, value]) => {
    const scaled = Math.round((value * intensity) / 100);
    return `${ACTION_VERBS[key]} at force ${scaled}${punctuation}`;
  });
}

export const INFLUENCE_PRESETS: Record<string, Partial<SchemaV2>> = {
  BRUS_LOMBARDI: {
    INFLUENCE_ENGINE: {
      weights: {
        inkSpray: 88,
        meatBrush: 22,
        collageBreak: 34,
        networkMap: 92,
        occultDiagram: 20,
        graphicNovel: 35,
        printMaterial: 58,
        handDrawn: 49,
      },
      behavior: {
        density: 76,
        turbulence: 55,
      },
    },
  },
  BACON_COLLAPSE: {
    INFLUENCE_ENGINE: {
      weights: {
        inkSpray: 40,
        meatBrush: 95,
        collageBreak: 52,
        networkMap: 30,
        occultDiagram: 25,
        graphicNovel: 38,
        printMaterial: 46,
        handDrawn: 61,
      },
      behavior: {
        density: 84,
        turbulence: 82,
      },
    },
  },
  BASQUIAT_OCCULT: {
    INFLUENCE_ENGINE: {
      weights: {
        inkSpray: 67,
        meatBrush: 48,
        collageBreak: 91,
        networkMap: 54,
        occultDiagram: 90,
        graphicNovel: 62,
        printMaterial: 44,
        handDrawn: 79,
      },
      behavior: {
        density: 73,
        turbulence: 69,
      },
    },
  },
  PRINT_PURITY: {
    INFLUENCE_ENGINE: {
      weights: {
        inkSpray: 18,
        meatBrush: 10,
        collageBreak: 24,
        networkMap: 42,
        occultDiagram: 21,
        graphicNovel: 40,
        printMaterial: 96,
        handDrawn: 36,
      },
      behavior: {
        density: 58,
        turbulence: 28,
      },
    },
  },
};
