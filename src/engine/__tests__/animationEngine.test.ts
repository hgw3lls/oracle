import { describe, expect, it, vi } from 'vitest';
import { defaultSchemaV2 } from '../../schema/hypnagnosisSchemaV2';
import {
  buildFrameSeries,
  buildFrameTimeline,
  exportFramePromptSheet,
  exportSchema,
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
      {
        t: 0,
        state: 'ANCHOR',
        curves: {
          'HALLUCINATION.level': 20,
          'INFLUENCE-WEIGHTS.smear': 10,
          'HYPNA-MATRIX.material': 15,
          'PALETTE.tint': 10,
          'STATE-MAP.state-name': 'ANCHOR',
        },
      },
      {
        t: 1,
        state: 'WATCHER',
        curves: {
          'HALLUCINATION.level': 80,
          'INFLUENCE-WEIGHTS.smear': 90,
          'HYPNA-MATRIX.material': 85,
          'PALETTE.tint': 70,
          'STATE-MAP.state-name': 'WATCHER',
        },
      },
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

  it('ignores disabled-module curves and does not mutate input schema', () => {
    const disabledInput = {
      ...schema,
      MODULES: {
        ...schema.MODULES,
        INFLUENCE_ENGINE: false,
        HYPNA_MATRIX: false,
        PALETTE: false,
      },
    };

    const snapshot = JSON.parse(JSON.stringify(disabledInput));
    const mid = interpolateAtTime(disabledInput, 0.5);

    expect(mid.humanizerLevel).toBeUndefined();
    expect(mid.mutateStrength).toBeUndefined();
    expect(mid.hallucination).toBeCloseTo(50, 6);

    expect(disabledInput).toEqual(snapshot);
    expect(disabledInput.animation.keyframes[0].curves['INFLUENCE-WEIGHTS.smear']).toBe(10);
    expect(disabledInput.animation.keyframes[0].curves['HYPNA-MATRIX.material']).toBe(15);
    expect(disabledInput.animation.keyframes[0].curves['PALETTE.tint']).toBe(10);
  });

  it('returns empty frame series with clear status when MODULES.ANIMATION is false', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const frames = buildFrameSeries({
      ...schema,
      MODULES: {
        ...schema.MODULES,
        ANIMATION: false,
      },
    }, compilePromptV2);

    expect(frames).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('buildFrameSeries: skipped because MODULES.ANIMATION is disabled');

    warnSpy.mockRestore();
  });

  it('exports enabled-only schema with disabled module tags', () => {
    const exported = exportSchema({
      ...schema,
      MODULES: {
        ...schema.MODULES,
        INFLUENCE_ENGINE: false,
        PALETTE: false,
      },
    }, { enabledOnly: true });

    const parsed = JSON.parse(exported);
    expect(parsed.MODULES.INFLUENCE_ENGINE).toBe(false);
    expect(parsed.MODULES.PALETTE).toBe(false);
    expect(parsed.exportMeta.mode).toBe('enabled-only');
    expect(parsed.exportMeta.disabledModules).toContain('INFLUENCE_ENGINE');
    expect(parsed.exportMeta.disabledModules).toContain('PALETTE');
  });

  it('optionally annotates frame prompt sheet with disabled module notes', () => {
    const frames = buildFrameSeries({
      ...schema,
      MODULES: {
        ...schema.MODULES,
        CONSTRAINTS: false,
      },
    }, compilePromptV2);

    const sheet = exportFramePromptSheet(frames, { includeDisabledNotes: true });
    expect(sheet).toContain('Disabled modules: CONSTRAINTS');

    const plainSheet = exportFramePromptSheet(frames, { includeDisabledNotes: false });
    expect(plainSheet).not.toContain('Disabled modules:');
  });

});
