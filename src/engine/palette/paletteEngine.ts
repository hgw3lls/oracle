import type { PaletteBlock, PaletteSwatch, PlateRole, RisoPlate } from '../../schema/schemaV2';

const hexToRgb = (hex: string): [number, number, number] => {
  const v = Number.parseInt(hex.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((c) => c / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function toRisoPlates(palette: PaletteSwatch[], maxPlates = 4): RisoPlate[] {
  const sorted = [...palette].sort((a, b) => b.weight - a.weight).slice(0, maxPlates);
  const darkestHex = [...sorted].sort((a, b) => luminance(a.hex) - luminance(b.hex))[0]?.hex;

  return sorted.map((swatch, index) => {
    const role: PlateRole = swatch.hex === darkestHex
      ? 'keyline'
      : (['shadow', 'midtone', 'highlight', 'accent'][Math.min(index, 3)] as PlateRole);

    return {
      hex: swatch.hex,
      role,
      opacity: Math.max(45, Math.round(100 * swatch.weight)),
      misregistration: role === 'keyline' ? 1 : 2,
    };
  });
}

export function renderPaletteFooter(paletteState: PaletteBlock): string {
  const modeHint =
    paletteState.mode === 'DESCRIPTIVE'
      ? `Use keywords: ${paletteState.descriptive}`
      : `Use ${paletteState.riso_plates.length} plate(s) with ${paletteState.mode}`;

  return `${modeHint}. Enforce limited palette, flat ink fields, visible overprint overlaps, slight misregistration, no gradients.`;
}
