const downloadJson = (filename: string, payload: unknown) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportEvolutionManifest = (
  framesOrSteps: Array<Record<string, unknown>>,
  options: { seed?: string; mode?: string; filename?: string } = {},
) => {
  const payload = {
    type: 'evolution-manifest',
    createdAt: new Date().toISOString(),
    seed: options.seed || 'n/a',
    mode: options.mode || 'FULL',
    count: framesOrSteps.length,
    items: framesOrSteps,
  };

  downloadJson(options.filename || 'evolution-manifest.json', payload);
};

export const exportChainManifest = (
  chainResult: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
    bestNodeId?: string;
  },
  options: { seed?: string; filename?: string } = {},
) => {
  const payload = {
    type: 'chain-manifest',
    createdAt: new Date().toISOString(),
    seed: options.seed || 'n/a',
    bestNodeId: chainResult.bestNodeId || null,
    nodeCount: chainResult.nodes.length,
    edgeCount: chainResult.edges.length,
    chain: chainResult,
  };

  downloadJson(options.filename || 'chain-manifest.json', payload);
};
