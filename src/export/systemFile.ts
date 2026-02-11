const SYSTEM_TITLE = 'HYPNAGNOSIS SYSTEM FILE — WEB EDITION';

export const buildSystemFileDocument = ({
  mode,
  selectedPrompt,
}: {
  mode: string;
  selectedPrompt: string;
}) => [
  '=========================================',
  SYSTEM_TITLE,
  '=========================================',
  '',
  'WHAT THIS IS',
  '- A paste-anytime instruction document for the HYPNAGNOSIS web app.',
  '- It defines minimums, canonical prompt format, and embeds the selected snapshot prompt.',
  '',
  'MODES',
  '- FULL: complete stack (style + dynamics + matrix + humanizer + evolution).',
  '- STYLE: style-only guidance and references.',
  '- GESTURE: gesture/composition dominant guidance.',
  '- PRINT: print/plate-facing guidance.',
  '- LIVE: evolving sequence guidance.',
  `- Current mode: ${mode || 'FULL'}`,
  '',
  'MINIMUMS',
  '1) MODE (FULL / STYLE / GESTURE / PRINT / LIVE)',
  '2) Subject (unless STYLE or PRINT only intent)',
  '3) Hallucination range or target intensity (0–100)',
  '',
  'CANONICAL FORMAT',
  '- INPUT',
  '- STYLE',
  '- HYPNA-MATRIX',
  '- STATE-MAP',
  '- AUTO-GESTURE / AUTO-COMP / AUTO-EVOLVE (as applicable)',
  '- HUMANIZER',
  '',
  'EMBEDDED COMPILED PROMPT (SELECTED SNAPSHOT)',
  '-----------------------------------------',
  selectedPrompt || '(no prompt selected)',
].join('\n');

export const exportTextFile = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const copyTextToClipboard = async (content: string) => {
  await navigator.clipboard.writeText(content);
};
