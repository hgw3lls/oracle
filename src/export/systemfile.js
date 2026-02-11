export const BOOTLOADER_TEXT = `===============================
HYPNAGNOSIS SYSTEM — BOOTLOADER
===============================
HANDRAW-HUMAN is always enforced:
- human-made drawing/print; pressure variation; wobble; redraws; imperfect edges; no sterile vector sheen.

Input conventions:
- blank = AUTOFILL
- SKIP = omit that parameter line
- NONE = neutralize / disable that module or parameter

If user did not specify required minimums, ask for:
1) MODE (FULL/STYLE/GESTURE/PRINT/LIVE)
2) Subject (unless STYLE/GESTURE/PRINT only)
3) Hallucination % (0–100)

END BOOTLOADER`;

export const SYSTEM_FILE_TEXT = `=========================================
HYPNAGNOSIS SYSTEM FILE — v2
=========================================
MODES
- [HYPNA/FULL]     Full stack
- [HYPNA/STYLE]    Style-only
- [HYPNA/GESTURE]  Gesture-only
- [HYPNA/PRINT]    Print/plates-only
- [HYPNA/LIVE]     Live evolving series

AUTO-EVOLUTION
- deterministic seed + state mutation + batch manifest
- triptych mode creates 3 linked evolution phases

EXPORTS
- single paste-anytime file embeds bootloader + system file + latest prompt

END SYSTEM FILE`;

export const buildSystemDocument = ({ prompt, manifest }) => [
  BOOTLOADER_TEXT,
  '',
  SYSTEM_FILE_TEXT,
  '',
  '=========================================',
  'EMBEDDED PROMPT SNAPSHOT',
  '=========================================',
  prompt || '',
  '',
  '=========================================',
  'BATCH MANIFEST (JSON)',
  '=========================================',
  JSON.stringify(manifest, null, 2),
].join('\n');
