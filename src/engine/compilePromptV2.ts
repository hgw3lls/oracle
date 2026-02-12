import { type SchemaV2 } from '../schema/hypnagnosisSchemaV2';
import { migrateToV2 } from '../schema/migrateToV2';

type DebugSection = { title: string; text: string };

export const compilePromptV2 = (schemaInput: SchemaV2, frameOverrides: Partial<SchemaV2> = {}) => {
  const schema = migrateToV2({ ...schemaInput, ...frameOverrides });
  const isOn = (moduleName: keyof SchemaV2['MODULES']) => schema.MODULES[moduleName] || !schema.IGNORE_RULES.hard_disable;

  const lines: string[] = ['HYPNAGNOSIS ORACLE V2'];
  const debugSections: DebugSection[] = [];

  if (isOn('INPUT')) {
    lines.push(`INPUT :: mode=${schema.INPUT.mode} subject=${schema.INPUT.subject || 'Unnamed subject'} seed=${schema.INPUT.seed} batch=${schema.INPUT['batch-id']}`);
    if (schema.INPUT.notes) lines.push(`NOTES :: ${schema.INPUT.notes}`);
  }

  if (isOn('STATE_MAP')) {
    lines.push(`STATE MAP :: ${schema['STATE-MAP']['state-name']} via ${schema['STATE-MAP'].flow}`);
  }

  if (isOn('HALLUCINATION')) {
    lines.push(`HALLUCINATION LEVEL :: ${schema.HALLUCINATION.level}`);
  }

  if (isOn('HYPNA_MATRIX')) {
    const m = schema['HYPNA-MATRIX'];
    lines.push(`HYPNA MATRIX :: temporal ${m.temporal}, material ${m.material}, space ${m.space}, symbol ${m.symbol}, agency ${m.agency}`);
  }

  if (isOn('PROMPT_GENOME')) {
    const g = schema['PROMPT-GENOME'];
    lines.push(`PROMPT GENOME :: ${g.structure.composition}, tension ${g.structure.tension}, recursion ${g.structure.recursion}; grain ${g.perception.grain}, wobble ${g.perception['line-wobble']}, erasure ${g.perception.erasure}, annotation ${g.perception.annotation}`);
  }

  if (isOn('VISUAL_GRAMMAR')) {
    const v = schema['VISUAL-GRAMMAR'];
    lines.push(`VISUAL GRAMMAR :: field density ${v['field-structure'].density}, segmentation ${v['field-structure'].segmentation}, rhythm ${v['field-structure'].rhythm}; node bias ${v['diagram-behavior'].node_bias}, arc noise ${v['diagram-behavior'].arc_noise}`);
  }

  if (isOn('INFLUENCE_ENGINE')) {
    const weights = schema['INFLUENCE-ENGINE']['INFLUENCE-WEIGHTS'];
    const behaviors = schema['INFLUENCE-ENGINE']['MATERIAL-BEHAVIORS'];
    lines.push('INFLUENCE MATERIAL ACTIONS ::');
    Object.keys(weights).forEach((k) => {
      const key = k as keyof typeof weights;
      lines.push(`- ${key} (${weights[key]}): ${behaviors[key]}`);
    });
    debugSections.push({ title: 'INFLUENCE-WEIGHTS', text: JSON.stringify(weights, null, 2) });
  }

  if (isOn('PALETTE')) {
    const p = schema.PALETTE;
    if (p.mode === 'RISO_PLATES') {
      const plateText = p.riso.plates.map((plate) => `${plate.name} ${plate.hex} (${plate.role}, opacity ${plate.opacity})`).join(', ');
      lines.push(`PALETTE :: RISO plates ${plateText}; flat ink, visible overlaps, slight misregistration, no gradients.`);
    } else if (p.mode === 'IMAGE_EXTRACT') {
      const hexes = p.image_extract.palette.map((entry) => entry.hex).join(', ');
      lines.push(`PALETTE :: use this exact palette: ${hexes}`);
    } else if (p.mode === 'COLOR_WHEEL') {
      const hexes = p.wheel.palette.join(', ');
      lines.push(`PALETTE :: use this exact palette: ${hexes}`);
    } else {
      lines.push(`PALETTE :: ${p.descriptive.text}; keywords ${p.descriptive.keywords.join(', ') || 'none'}; enforce limited palette and flat inks.`);
    }
  }

  if (isOn('CONSTRAINTS')) {
    const req = schema.CONSTRAINTS.require.length ? `REQUIRE: ${schema.CONSTRAINTS.require.join('; ')}` : null;
    const forb = schema.CONSTRAINTS.forbid.length ? `FORBID: ${schema.CONSTRAINTS.forbid.join('; ')}` : null;
    [req, forb].filter(Boolean).forEach((line) => lines.push(`CONSTRAINTS :: ${line}`));
  }

  const included = Object.keys(schema.MODULES).filter((key) => schema.MODULES[key as keyof SchemaV2['MODULES']]);
  const skipped = Object.keys(schema.MODULES).filter((key) => !schema.MODULES[key as keyof SchemaV2['MODULES']]);
  debugSections.unshift({ title: 'MODULES', text: `included=${included.join(', ') || 'none'}\nskipped=${skipped.join(', ') || 'none'}` });

  return { compiledPrompt: lines.join('\n'), debugSections };
};
