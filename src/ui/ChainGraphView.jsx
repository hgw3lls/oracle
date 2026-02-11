import { useMemo, useState } from 'react';

const NODE_W = 140;
const NODE_H = 58;

const layoutEvolution = (frames = []) => {
  const nodes = frames.map((frame, idx) => ({
    id: frame.id || `frame-${idx}`,
    label: `#${idx + 1} ${(frame.meta?.score ?? '').toString()}`.trim(),
    score: frame.meta?.score,
    x: 24 + idx * (NODE_W + 36),
    y: 70,
  }));
  const edges = nodes.slice(1).map((node, idx) => ({
    id: `edge-${nodes[idx].id}-${node.id}`,
    from: nodes[idx].id,
    to: node.id,
  }));
  return { nodes, edges };
};

const layoutChain = (chainResult) => {
  const byGen = new Map();
  (chainResult?.nodes || []).forEach((node) => {
    const list = byGen.get(node.gen) || [];
    list.push(node);
    byGen.set(node.gen, list);
  });

  const generations = Array.from(byGen.keys()).sort((a, b) => a - b);
  const nodes = [];

  generations.forEach((genIdx) => {
    const row = (byGen.get(genIdx) || []).sort((a, b) => a.agent - b.agent);
    row.forEach((node, i) => {
      nodes.push({
        id: node.id,
        label: `G${node.gen}/A${node.agent}`,
        score: node.score,
        x: 24 + i * (NODE_W + 24),
        y: 24 + genIdx * (NODE_H + 34),
      });
    });
  });

  const edges = (chainResult?.edges || []).map((edge) => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
  }));

  return { nodes, edges };
};

const boundsFor = (nodes) => {
  if (!nodes.length) return { width: 600, height: 300 };
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_W)) + 32;
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_H)) + 32;
  return { width: Math.max(620, maxX), height: Math.max(280, maxY) };
};

export default function ChainGraphView({ mode, frames = [], chainResult = null, selectedId, onSelect }) {
  const [viewBox, setViewBox] = useState('0 0 1200 500');

  const { nodes, edges } = useMemo(() => {
    if (mode === 'chain') return layoutChain(chainResult);
    return layoutEvolution(frames);
  }, [mode, chainResult, frames]);

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);
  const bounds = boundsFor(nodes);

  const fitView = () => {
    setViewBox(`0 0 ${bounds.width} ${bounds.height}`);
  };

  const centerOnSelected = () => {
    const n = nodeMap[selectedId];
    if (!n) return;
    const w = 560;
    const h = 260;
    const x = Math.max(0, n.x - w / 2 + NODE_W / 2);
    const y = Math.max(0, n.y - h / 2 + NODE_H / 2);
    setViewBox(`${x} ${y} ${w} ${h}`);
  };

  return (
    <article className="graph-wrap">
      <div className="button-row">
        <button type="button" className="manifest-btn" onClick={fitView}>Fit View</button>
        <button type="button" className="manifest-btn" onClick={centerOnSelected} disabled={!selectedId}>Center on Selected</button>
      </div>
      <svg className="chain-graph" viewBox={viewBox}>
        {edges.map((edge) => {
          const a = nodeMap[edge.from];
          const b = nodeMap[edge.to];
          if (!a || !b) return null;
          const x1 = a.x + NODE_W / 2;
          const y1 = a.y + NODE_H;
          const x2 = b.x + NODE_W / 2;
          const y2 = b.y;
          return <line key={edge.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#111" strokeWidth="2" />;
        })}

        {nodes.map((node) => {
          const active = node.id === selectedId;
          return (
            <g key={node.id} onClick={() => onSelect?.(node.id)} style={{ cursor: 'pointer' }}>
              <rect
                x={node.x}
                y={node.y}
                rx="0"
                ry="0"
                width={NODE_W}
                height={NODE_H}
                fill={active ? '#00dbff' : '#fff'}
                stroke="#111"
                strokeWidth={active ? 3 : 2}
              />
              <text x={node.x + 8} y={node.y + 21} fontSize="13" fontFamily="Courier New, monospace" fill="#111">{node.label}</text>
              <text x={node.x + 8} y={node.y + 40} fontSize="12" fontFamily="Courier New, monospace" fill="#111">Score {typeof node.score === 'number' ? node.score.toFixed(3) : '—'}</text>
            </g>
          );
        })}
      </svg>
    </article>
  );
}
