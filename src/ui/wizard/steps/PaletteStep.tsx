import { useMemo } from 'react';
import { useOracleStore } from '../../../state/store';
import type { Harmony, PlateRole } from '../../../schema/schemaV2';
import { extractDominantPalette } from '../../../engine/palette/imageExtract';
import { generateHarmonyPalette } from '../../../engine/palette/colorWheel';
import { renderPaletteFooter, toRisoPlates } from '../../../engine/palette/paletteEngine';

const roles: PlateRole[] = ['keyline', 'shadow', 'midtone', 'highlight', 'accent'];
const harmonies: Harmony[] = ['complementary', 'analogous', 'triadic', 'split_complementary', 'tetradic', 'monochrome'];
const keywordChips = ['graphite', 'bone', 'acid yellow', 'ink black', 'oxide red', 'cold cyan'];

async function fileToImageData(file: File): Promise<ImageData> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D context');
  ctx.drawImage(bitmap, 0, 0);
  return ctx.getImageData(0, 0, bitmap.width, bitmap.height);
}

export function PaletteStep() {
  const schema = useOracleStore((s) => s.schema);
  const setValue = useOracleStore((s) => s.set);

  const footer = useMemo(() => renderPaletteFooter(schema.PALETTE), [schema.PALETTE]);

  const applyGeneratedAsRiso = (hexes: string[]) => {
    const plates = toRisoPlates(hexes.map((hex) => ({ hex, weight: 1 / Math.max(1, hexes.length) })), 4);
    setValue('PALETTE.riso_plates', plates);
    setValue('PALETTE.mode', 'RISO_PLATES');
  };

  return (
    <div>
      <label>Mode</label>
      <select value={schema.PALETTE.mode} onChange={(e) => setValue('PALETTE.mode', e.target.value)}>
        <option value="RISO_PLATES">Riso Plates</option>
        <option value="DESCRIPTIVE">Descriptive</option>
        <option value="IMAGE_EXTRACT">Image Extract</option>
        <option value="COLOR_WHEEL">Color Wheel</option>
      </select>

      {schema.PALETTE.mode === 'RISO_PLATES' && (
        <div>
          {schema.PALETTE.riso_plates.map((plate, i) => (
            <div key={`${plate.hex}-${i}`} className="panel">
              <label>Hex</label>
              <input value={plate.hex} onChange={(e) => setValue(`PALETTE.riso_plates.${i}.hex`, e.target.value)} />
              <label>Role</label>
              <select value={plate.role} onChange={(e) => setValue(`PALETTE.riso_plates.${i}.role`, e.target.value)}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <label>Opacity {plate.opacity}</label>
              <input type="range" min={0} max={100} value={plate.opacity} onChange={(e) => setValue(`PALETTE.riso_plates.${i}.opacity`, Number(e.target.value))} />
              <label>Misregistration {plate.misregistration}</label>
              <input type="range" min={0} max={20} value={plate.misregistration} onChange={(e) => setValue(`PALETTE.riso_plates.${i}.misregistration`, Number(e.target.value))} />
            </div>
          ))}
          {schema.PALETTE.riso_plates.length < 4 && (
            <button
              type="button"
              onClick={() => setValue('PALETTE.riso_plates', [...schema.PALETTE.riso_plates, { hex: '#888888', role: 'accent', opacity: 70, misregistration: 2 }])}
            >
              Add plate
            </button>
          )}
        </div>
      )}

      {schema.PALETTE.mode === 'IMAGE_EXTRACT' && (
        <div>
          <label>Image extract method</label>
          <select value={schema.PALETTE.image_extract.method} onChange={(e) => setValue('PALETTE.image_extract.method', e.target.value)}>
            <option value="kmeans">kmeans</option>
            <option value="median_cut">median_cut</option>
          </select>
          <label>Max colors</label>
          <input type="number" min={1} max={8} value={schema.PALETTE.image_extract.max_colors} onChange={(e) => setValue('PALETTE.image_extract.max_colors', Number(e.target.value))} />
                    <label>
            <input
              type="checkbox"
              checked={schema.PALETTE.image_extract.enabled}
              onChange={(e) => setValue('PALETTE.image_extract.enabled', e.target.checked)}
            />{' '}
            Auto-apply extracted palette as Riso plates
          </label>
<input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const data = await fileToImageData(file);
              const extracted = extractDominantPalette(data, schema.PALETTE.image_extract.max_colors, schema.PALETTE.image_extract.method);
              setValue('PALETTE.image_extract.extracted', extracted);

              if (schema.PALETTE.image_extract.enabled) {
                applyGeneratedAsRiso(extracted.map((x) => x.hex));
                setValue('PALETTE.lock_palette', true);
              }
}}
          />
          <div className="chip-row">
            {schema.PALETTE.image_extract.extracted.map((sw, i) => (
              <span key={`${sw.hex}-${i}`} title={`${sw.hex} ${Math.round(sw.weight * 100)}%`} className="chip" style={{ background: sw.hex }} />
            ))}
          </div>
          <button type="button" onClick={() => applyGeneratedAsRiso(schema.PALETTE.image_extract.extracted.map((x) => x.hex))}>Use as Riso Plates</button>
          <label>
            <input type="checkbox" checked={schema.PALETTE.lock_palette} onChange={(e) => setValue('PALETTE.lock_palette', e.target.checked)} /> Lock palette
          </label>
        </div>
      )}

      {schema.PALETTE.mode === 'COLOR_WHEEL' && (
        <div>
          <label>Base color</label>
          <input type="color" value={schema.PALETTE.color_wheel.base_hex} onChange={(e) => setValue('PALETTE.color_wheel.base_hex', e.target.value)} />
          <label>Harmony</label>
          <select value={schema.PALETTE.color_wheel.scheme} onChange={(e) => setValue('PALETTE.color_wheel.scheme', e.target.value)}>
            {harmonies.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          <label>Count</label>
          <input type="number" min={1} max={8} value={schema.PALETTE.color_wheel.count} onChange={(e) => setValue('PALETTE.color_wheel.count', Number(e.target.value))} />
          <label>Rotate {schema.PALETTE.color_wheel.rotate_deg}°</label>
          <input type="range" min={0} max={360} value={schema.PALETTE.color_wheel.rotate_deg} onChange={(e) => setValue('PALETTE.color_wheel.rotate_deg', Number(e.target.value))} />
          <button
            type="button"
            onClick={() => {
              const generated = generateHarmonyPalette(
                schema.PALETTE.color_wheel.base_hex,
                schema.PALETTE.color_wheel.scheme,
                schema.PALETTE.color_wheel.count,
                schema.PALETTE.color_wheel.rotate_deg,
              ).map((hex) => ({ hex, weight: 1 / schema.PALETTE.color_wheel.count }));
              setValue('PALETTE.color_wheel.generated', generated);
            }}
          >
            Generate swatches
          </button>
          <div className="chip-row">
            {schema.PALETTE.color_wheel.generated.map((sw, i) => (
              <span key={`${sw.hex}-${i}`} title={sw.hex} className="chip" style={{ background: sw.hex }} />
            ))}
          </div>
          <button type="button" onClick={() => applyGeneratedAsRiso(schema.PALETTE.color_wheel.generated.map((x) => x.hex))}>Use as Riso Plates</button>
        </div>
      )}

      {schema.PALETTE.mode === 'DESCRIPTIVE' && (
        <div>
          <textarea value={schema.PALETTE.descriptive} onChange={(e) => setValue('PALETTE.descriptive', e.target.value)} />
          <div className="chip-row">
            {keywordChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  if (!schema.PALETTE.descriptive_keywords.includes(chip)) {
                    setValue('PALETTE.descriptive_keywords', [...schema.PALETTE.descriptive_keywords, chip]);
                  }
                }}
              >
                {chip}
              </button>
            ))}
          </div>
          <p>Keywords: {schema.PALETTE.descriptive_keywords.join(', ')}</p>
        </div>
      )}

      <div className="panel">
        <h4>Compiled palette footer preview</h4>
        <p>{footer}</p>
      </div>
    </div>
  );
}
