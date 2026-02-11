import { generateEvolutionSeries } from './evolver';

export const generateTriptych = (form) => {
  const segments = [
    { label: 'TRIPTYCH-I', startH: Math.max(0, form.startH - 20), endH: Math.max(5, form.startH) },
    { label: 'TRIPTYCH-II', startH: form.startH, endH: form.endH },
    { label: 'TRIPTYCH-III', startH: Math.min(95, form.endH), endH: Math.min(100, form.endH + 8) },
  ];

  const all = [];
  let previousId = null;

  segments.forEach((segment, segmentIndex) => {
    const states = generateEvolutionSeries({
      form,
      seed: `${form.seed}::triptych::${segment.label}`,
      batchId: segment.label,
      hallucinationRange: { startH: segment.startH, endH: segment.endH },
      linkedFrom: previousId,
    });

    const terminal = states.at(-1);
    previousId = terminal ? `${segment.label}:${terminal.stateName}:${terminal.hallucination}` : previousId;

    all.push(...states.map((item) => ({ ...item, triptychSegment: segmentIndex + 1 })));
  });

  return all;
};
