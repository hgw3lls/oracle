import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../../schema/hypnagnosisSchemaV2';
import {
  buildFrameSeries,
  buildFrameTimeline,
  exportFramePromptSheet,
  exportTimelineJSON,
  interpolateAtTime,
} from '../animationEngine';
import { compilePromptV2 } from '../compilePromptV2';

const schema = {
  ...defaultSchemaV2,
  animation: {
    ...defaultSchemaV2.animation,
    enabled: true,
    frames: 5,
    keyframes: [
      { t: 0, state: 'ANCHOR', curves: { 'HALLUCINATION.level': 20, 'INFLUENCE-WEIGHTS.smear': 10, 'STATE-MAP.state-name': 'ANCHOR' } },
      { t: 1, state: 'WATCHER', curves: { 'HALLUCINATION.level': 80, 'INFLUENCE-WEIGHTS.smear': 90, 'STATE-MAP.state-name': 'WATCHER' } },
    ],
  },
};

describe('animationEngine', () => {
  it('interpolates numeric curves and snaps categorical curves', () => {
    const mid = interpolateAtTime(schema, 0.5);
    expect(mid.hallucination).toBeCloseTo(50, 6);
    expect(mid.humanizerLevel).toBeCloseTo(50, 6);
    expect(['ANCHOR', 'WATCHER']).toContain(mid.triptychPanel1State);
  });

  it('builds frame timeline from animation config', () => {
    const timeline = buildFrameTimeline(schema);
    expect(timeline.frames).toBe(5);
    expect(timeline.fps).toBe(12);
    expect(timeline.times[0]).toBe(0);
    expect(timeline.times[4]).toBe(1);
  });

  it('builds frame series and exports timeline and prompt sheet', () => {
    const frames = buildFrameSeries(schema, compilePromptV2);
    expect(frames).toHaveLength(5);
    expect(frames[0].compiledPrompt).toContain('HYPNAGNOSIS PROMPT V2');

    const timelineJson = exportTimelineJSON(schema);
    expect(timelineJson).toContain('"schemaVersion": 2');
    expect(timelineJson).toContain('"keyframes"');

    const sheet = exportFramePromptSheet(frames);
    expect(sheet).toContain('# FRAME 1');
    expect(sheet).toContain('HYPNAGNOSIS PROMPT V2');
  });

  it('is deterministic for same schema and compiler', () => {
    const first = buildFrameSeries(schema, compilePromptV2);
    const second = buildFrameSeries(schema, compilePromptV2);
    expect(first).toEqual(second);
  });
});
