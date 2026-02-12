import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../../schema/hypnagnosisSchemaV2';
import { buildFrameSeries, exportFramePromptSheet, exportTimelineJSON, interpolateAtTime } from '../animationEngine';

const schema = {
  ...defaultSchemaV2,
  MODULES: { ...defaultSchemaV2.MODULES, ANIMATION: true, PALETTE: false },
  ANIMATION: {
    ...defaultSchemaV2.ANIMATION,
    enabled: true,
    fps: 4,
    duration_s: 1,
    keyframes: [
      { t: 0, curves: { 'HALLUCINATION.level': 10, 'PALETTE.mode': 'DESCRIPTIVE' } },
      { t: 1, curves: { 'HALLUCINATION.level': 90, 'PALETTE.mode': 'COLOR_WHEEL' } },
    ],
  },
};

describe('animationEngine', () => {
  it('interpolates numeric curves linearly', () => {
    const out = interpolateAtTime(schema, 0.5) as any;
    expect(out.HALLUCINATION.level).toBe(50);
  });

  it('suppresses disabled module curves', () => {
    const out = interpolateAtTime(schema, 0.5) as any;
    expect(out.PALETTE).toBeUndefined();
  });

  it('exports frame sheet and timeline', () => {
    const frames = buildFrameSeries(schema);
    expect(frames.length).toBe(4);
    expect(exportFramePromptSheet(frames)).toContain('# FRAME 1');
    expect(exportTimelineJSON(schema)).toContain('"ANIMATION"');
  });
});
