import { describe, expect, it } from 'vitest';
import { defaultSchemaV2 } from '../hypnagnosisSchemaV2';
import { migrateToV2 } from '../migrateToV2';

describe('migrateToV2', () => {
  it('returns defaults for unknown input', () => {
    expect(migrateToV2(null)).toEqual(defaultSchemaV2);
  });

  it('keeps existing flat presets and tags as schema v2', () => {
    const migrated = migrateToV2({
      mode: 'STYLE',
      subject: 'Salt dunes',
      styleTokens: ['STYLE.HYPNAGOGIC'],
      startH: 20,
      endH: 80,
      humanizerQualities: {
        wobble_lines: true,
      },
    });

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.mode).toBe('STYLE');
    expect(migrated.subject).toBe('Salt dunes');
    expect(migrated.startH).toBe(20);
    expect(migrated.endH).toBe(80);
    expect(migrated.humanizerQualities.wobble_lines).toBe(true);
  });

  it('maps equivalent legacy nested fields into v2 fields', () => {
    const migrated = migrateToV2({
      autoEvolve: { enabled: false, steps: 9, curve: 'exp' },
      humanizerRange: { min: 5, max: 65 },
      triptych: {
        panels: [
          { panelName: 'A', stateName: 'ANCHOR', pathPreset: 'drift', steps: 3 },
          { panelName: 'B', stateName: 'POROUS', pathPreset: 'fracture', steps: 4 },
        ],
      },
      'start-h': 14,
      'end-h': 77,
      'mutation-strength': 31,
    });

    expect(migrated.evolveEnabled).toBe(false);
    expect(migrated.evolveSteps).toBe(9);
    expect(migrated.curve).toBe('exp');
    expect(migrated.humanizerMin).toBe(5);
    expect(migrated.humanizerMax).toBe(65);
    expect(migrated.triptychPanel1Name).toBe('A');
    expect(migrated.triptychPanel2Path).toBe('fracture');
    expect(migrated.triptychPanel3Name).toBe(defaultSchemaV2.triptychPanel3Name);
    expect(migrated.startH).toBe(14);
    expect(migrated.endH).toBe(77);
    expect(migrated.mutateStrength).toBe(31);
  });

  it('applies MODULES and IGNORE_RULES defaults when missing', () => {
    const migrated = migrateToV2({ mode: 'FULL' });

    expect(migrated.MODULES).toEqual(defaultSchemaV2.MODULES);
    expect(migrated.IGNORE_RULES).toEqual(defaultSchemaV2.IGNORE_RULES);
    expect(migrated.MODULES.ANIMATION).toBe(false);
  });

  it('preserves MODULES and IGNORE_RULES across export/import', () => {
    const source = migrateToV2({
      MODULES: {
        ...defaultSchemaV2.MODULES,
        INPUT: false,
        ANIMATION: true,
      },
      IGNORE_RULES: {
        hard_disable: true,
        preserve_state: true,
      },
    });

    const exported = JSON.stringify(source);
    const imported = migrateToV2(JSON.parse(exported));

    expect(imported.MODULES).toEqual(source.MODULES);
    expect(imported.IGNORE_RULES).toEqual(source.IGNORE_RULES);
  });

});
