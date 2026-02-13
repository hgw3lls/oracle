import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../../schema/defaults';
import { buildFrameSeries, exportFramePromptSheet, exportTimelineJson, getInterpolatedValue, interpolateAtTime } from './animationEngine';

describe('animation engine', () => {
  it('interpolates numeric values linearly', () => {
    const schema = defaultSchemaV2();
    schema.ANIMATION.keyframes = [
      { t: 0, curves: { 'HALLUCINATION.drift': 10 } },
      { t: 1, curves: { 'HALLUCINATION.drift': 90 } },
    ];
    const atHalf = getInterpolatedValue(schema, 0.5, 'HALLUCINATION.drift');
    expect(atHalf).toBe(50);
  });

  it('suppresses disabled module curves with hard_disable', () => {
    const schema = defaultSchemaV2();
    schema.MODULES.PALETTE = false;
    schema.PALETTE.color_wheel.rotate_deg = 0;
    schema.ANIMATION.keyframes = [
      { t: 0, curves: { 'PALETTE.color_wheel.rotate_deg': 0 } },
      { t: 1, curves: { 'PALETTE.color_wheel.rotate_deg': 180 } },
    ];

    const frame = interpolateAtTime(schema, 0.75);
    expect(frame.PALETTE.color_wheel.rotate_deg).toBe(0);
  });

  it('exports are stable', () => {
    const schema = defaultSchemaV2();
    schema.MODULES.ANIMATION = true;
    schema.ANIMATION.fps = 2;
    schema.ANIMATION.duration = 2;
    schema.ANIMATION.export_mode = 'every_n';
    schema.ANIMATION.every_n = 1;

    const series = buildFrameSeries(schema);
    const json1 = exportTimelineJson(series);
    const json2 = exportTimelineJson(series);
    const txt1 = exportFramePromptSheet(series);
    const txt2 = exportFramePromptSheet(series);

    expect(json1).toBe(json2);
    expect(txt1).toBe(txt2);
  });
});
