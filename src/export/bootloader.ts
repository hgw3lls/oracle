export const buildBootloaderDocument = ({
  mode,
  selectedPrompt,
}: {
  mode: string;
  selectedPrompt: string;
}) => [
  '===============================',
  'HYPNAGNOSIS BOOTLOADER — WEB',
  '===============================',
  '',
  'RUN THIS',
  '- Use HYPNAGNOSIS web framing and respect human-made artifact constraints.',
  `- Mode: ${mode || 'FULL'}`,
  '- Keep outputs grounded in physical mark-making (wobble, pressure, redraw, imperfect edge).',
  '',
  'MINIMAL USAGE',
  '1) Paste this header + embedded prompt into your model session.',
  '2) If required minimums are missing, ask for mode / subject / hallucination intensity.',
  '3) Continue with the canonical HYPNAGNOSIS block structure.',
  '',
  'EMBEDDED PROMPT (SELECTED SNAPSHOT)',
  '------------------------------------',
  selectedPrompt || '(no prompt selected)',
].join('\n');
