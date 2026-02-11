import { HUMANIZER_QUALITIES, STYLE_TOKENS } from '../models/schema';

const line = (key, value) => (value === '' || value == null ? null : `${key}: ${value}`);

const block = (title, lines) => {
  const body = lines.filter(Boolean);
  if (!body.length) return '';
  return `${title}\n${body.join('\n')}`;
};

export const expandStyleTokens = (tokens) => tokens.map((token) => STYLE_TOKENS[token] || token).join('; ');

export const compilePrompt = (st) => {
  const qualities = HUMANIZER_QUALITIES.filter(([key]) => st.humanizerQualities[key]).map(([, label]) => label);

  return [
    '===============================',
    'HYPNAGNOSIS SYSTEM — WEB EDITION',
    '===============================',
    block('INPUT', [
      line('mode', st.mode),
      line('subject', st.subject),
      line('hallucination(0-100)', st.hallucination),
      line('state-index', `${st.step + 1}/${st.steps}`),
      line('batch-id', st.batchId),
      line('seed', st.seed),
    ]),
    block('STYLE', [
      line('style-tokens', st.styleTokens.join(', ')),
      line('expanded-style', st.styleExpanded),
      line('notes', st.notes),
    ]),
    block('DYNAMICS', [
      line('state-name', st.stateName),
      line('temporal', st.temporal),
      line('material', st.material),
      line('space', st.space),
      line('symbol', st.symbol),
      line('agency', st.agency),
      line('saturation', st.saturation),
      line('motion', st.motion),
      line('flow', st.flow),
      line('mutation', st.mutationNote),
      line('linked-from', st.linkedFrom),
    ]),
    block('AUTO-COLOR', [
      line('palette', st.paletteDesc),
      line('plate-palette', st.platePalette),
    ]),
    block('HUMANIZER', [
      line('level(0-100)', st.humanizerLevel),
      line('qualities', qualities.join(', ')),
    ]),
  ].filter(Boolean).join('\n\n');
};
