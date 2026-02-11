// NOTE: Environment package policy blocks installing external deps.
// This file provides a zod-style schema contract with safeParse semantics for presets.

type Issue = { path: string; message: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const inRange = (v: unknown, lo = 0, hi = 100) => isNum(v) && v >= lo && v <= hi;

const validate = (input: unknown): { success: true; data: Record<string, unknown> } | { success: false; error: { issues: Issue[] } } => {
  if (!isObj(input)) {
    return { success: false, error: { issues: [{ path: 'root', message: 'Preset must be a JSON object.' }] } };
  }

  const issues: Issue[] = [];
  const o = input as Record<string, unknown>;

  if (o.mode != null && !['FULL', 'STYLE', 'GESTURE', 'PRINT', 'LIVE'].includes(String(o.mode))) {
    issues.push({ path: 'mode', message: 'Mode must be FULL/STYLE/GESTURE/PRINT/LIVE.' });
  }
  if (o.styleTokens != null && !Array.isArray(o.styleTokens)) {
    issues.push({ path: 'styleTokens', message: 'styleTokens must be an array of strings.' });
  }
  if (o.evolveSteps != null && !(isNum(o.evolveSteps) && o.evolveSteps >= 1 && o.evolveSteps <= 20)) {
    issues.push({ path: 'evolveSteps', message: 'evolveSteps must be between 1 and 20.' });
  }
  if (o.curve != null && !['linear', 's-curve', 'exp'].includes(String(o.curve))) {
    issues.push({ path: 'curve', message: 'curve must be linear, s-curve, or exp.' });
  }
  if (o.humanizerMin != null && !inRange(o.humanizerMin)) issues.push({ path: 'humanizerMin', message: 'humanizerMin must be 0-100.' });
  if (o.humanizerMax != null && !inRange(o.humanizerMax)) issues.push({ path: 'humanizerMax', message: 'humanizerMax must be 0-100.' });
  if (o.startH != null && !inRange(o.startH)) issues.push({ path: 'startH', message: 'startH must be 0-100.' });
  if (o.endH != null && !inRange(o.endH)) issues.push({ path: 'endH', message: 'endH must be 0-100.' });
  if (o.mutateStrength != null && !inRange(o.mutateStrength)) issues.push({ path: 'mutateStrength', message: 'mutateStrength must be 0-100.' });

  if (issues.length) return { success: false, error: { issues } };
  return { success: true, data: o };
};

export const PresetSchema = {
  safeParse: validate,
};

export const formatPresetIssues = (issues: Issue[]) => issues.map((i) => `${i.path}: ${i.message}`).join('\n');
