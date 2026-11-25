import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react';
import type { ProvenanceKind } from '../../types/assessment';
import type { EvidenceGraphModel, GraphEdge, GraphNode } from '../../utils/investigator/graphModel';
import { nodeTypeLabel, relationshipLabel } from './investigatorUi';

export type GraphSelection = { kind: 'node'; id: string } | { kind: 'edge'; id: string } | null;

interface EdgeStyle {
  stroke: string;
  dash?: string;
  width: number;
}

/** Provenance is encoded by colour AND line pattern (solid / dashed / dotted), and labelled in the legend and panel. */
const edgeStyles: Record<ProvenanceKind, EdgeStyle> = {
  verified: { stroke: 'var(--color-danger)', width: 2.75 },
  reported: { stroke: 'var(--color-warning)', dash: '9 6', width: 2.25 },
  inferred: { stroke: 'var(--color-ink-muted)', dash: '2 6', width: 2.25 },
  extracted: { stroke: 'var(--color-ink-muted)', width: 1.5 },
  statistical: { stroke: 'var(--color-ink-muted)', width: 1.5 },
  unknown: { stroke: 'var(--color-ink-muted)', dash: '4 4', width: 1.5 },
};

const NODE_RADIUS = 22;
const FOCUS_RADIUS = 30;
const MIN_SCALE = 0.4;
const MAX_SCALE = 3;

function NodeShape({ node, selected }: { node: GraphNode; selected: boolean }) {
  const r = node.role === 'focus' ? FOCUS_RADIUS : NODE_RADIUS;
  const fill = node.role === 'focus' ? 'var(--color-primary)' : node.role === 'path' ? 'var(--color-muted)' : 'var(--color-surface)';
  const stroke = selected ? 'var(--color-ink)' : node.role === 'focus' ? 'var(--color-primary-hover)' : 'var(--color-ink-muted)';
  const common = { fill, stroke, strokeWidth: selected ? 3 : 1.5, strokeDasharray: node.role === 'path' ? '3 3' : undefined };
  switch (node.type) {
    case 'FRAUD_CASE':
      return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={4} {...common} />;
    case 'IDENTIFIER':
      return <polygon points={`0,${-r - 3} ${r + 3},0 0,${r + 3} ${-r - 3},0`} {...common} />;
    case 'COMMUNICATION':
    case 'TRANSACTION':
      return <rect x={-r - 4} y={-r + 4} width={(r + 4) * 2} height={(r - 4) * 2} rx={8} {...common} />;
    default:
      return <circle r={r} {...common} />;
  }
}

function truncate(text: string, max = 24): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function edgeGeometry(edge: GraphEdge, nodes: Map<string, GraphNode>, offset: number) {
  const a = nodes.get(edge.source);
  const b = nodes.get(edge.target);
  if (!a || !b) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const rA = a.role === 'focus' ? FOCUS_RADIUS : NODE_RADIUS;
  const rB = (b.role === 'focus' ? FOCUS_RADIUS : NODE_RADIUS) + 6;
  const sx = a.x + (dx / length) * rA;
  const sy = a.y + (dy / length) * rA;
  const tx = b.x - (dx / length) * rB;
  const ty = b.y - (dy / length) * rB;
  const cx = (sx + tx) / 2 + nx * offset;
  const cy = (sy + ty) / 2 + ny * offset;
  return { d: `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`, labelX: (sx + tx) / 2 + nx * offset * 0.5, labelY: (sy + ty) / 2 + ny * offset * 0.5 };
}

interface EvidenceGraphProps {
  model: EvidenceGraphModel;
  selection: GraphSelection;
  onSelect: (selection: GraphSelection) => void;
}

/** Interactive SVG rendering of a recipient-centred SPEG neighbourhood: zoom, pan, keyboard-selectable nodes and edges. */
export function EvidenceGraph({ model, selection, onSelect }: EvidenceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const nodes = new Map(model.nodes.map((node) => [node.id, node]));
  const { minX, minY, width, height } = model.bounds;

  // Native, non-passive wheel listener so zooming the graph does not scroll the page.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      setView((current) => ({ ...current, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor)) }));
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const unitsPerPixel = () => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 1;
    return Math.max(width / rect.width, height / rect.height);
  };

  const onPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if ((event.target as Element).closest('[data-graph-item]')) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const dy = event.clientY - drag.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.current.moved = true;
    drag.current.x = event.clientX;
    drag.current.y = event.clientY;
    const k = unitsPerPixel();
    setView((current) => ({ ...current, x: current.x + dx * k, y: current.y + dy * k }));
  };
  const onPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const moved = drag.current?.moved ?? false;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!moved && !(event.target as Element).closest('[data-graph-item]')) onSelect(null);
  };

  const zoom = (factor: number) =>
    setView((current) => ({ ...current, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor)) }));

  const activate = (event: KeyboardEvent, next: GraphSelection) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(next);
    }
  };

  // Spread parallel edges between the same pair of nodes.
  const pairIndex = new Map<string, number>();
  const pairTotals = new Map<string, number>();
  for (const edge of model.edges) {
    const key = [edge.source, edge.target].sort().join('|');
    pairTotals.set(key, (pairTotals.get(key) ?? 0) + 1);
  }

  const cx = minX + width / 2;
  const cy = minY + height / 2;

  return (
    <div className="relative">
      <div className="absolute right-3.5 top-3.5 z-10 flex flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-surface/95 backdrop-blur-md shadow-card ring-1 ring-slate-900/5">
        <button type="button" onClick={() => zoom(1.25)} aria-label="Zoom in" className="flex size-10 cursor-pointer items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors">
          <ZoomIn className="size-4" aria-hidden="true" />
        </button>
        <button type="button" onClick={() => zoom(0.8)} aria-label="Zoom out" className="flex size-10 cursor-pointer items-center justify-center border-t border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors">
          <ZoomOut className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setView({ x: 0, y: 0, scale: 1 })}
          aria-label="Reset view"
          className="flex size-10 cursor-pointer items-center justify-center border-t border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-colors"
        >
          <Maximize className="size-4" aria-hidden="true" />
        </button>
      </div>

      <svg
        ref={svgRef}
        role="group"
        aria-label={`Evidence graph centred on ${model.focusId}: ${model.nodes.length} entities and ${model.edges.length} relationships. Use Tab to move between items and Enter to select.`}
        viewBox={`${minX} ${minY} ${width} ${height}`}
        className="h-[420px] w-full cursor-grab touch-none select-none rounded-lg bg-canvas active:cursor-grabbing sm:h-[520px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          {(['verified', 'reported', 'inferred', 'unknown'] as const).map((kind) => (
            <marker key={kind} id={`arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeStyles[kind].stroke} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${view.x} ${view.y}) translate(${cx} ${cy}) scale(${view.scale}) translate(${-cx} ${-cy})`}>
          {model.edges.map((edge) => {
            const key = [edge.source, edge.target].sort().join('|');
            const index = pairIndex.get(key) ?? 0;
            pairIndex.set(key, index + 1);
            const total = pairTotals.get(key) ?? 1;
            const geometry = edgeGeometry(edge, nodes, (index - (total - 1) / 2) * 36);
            if (!geometry) return null;
            const style = edgeStyles[edge.provenance];
            const selected = selection?.kind === 'edge' && selection.id === edge.id;
            const markerKind = edge.provenance === 'verified' || edge.provenance === 'reported' || edge.provenance === 'inferred' ? edge.provenance : 'unknown';
            const other = nodes.get(edge.target)?.label ?? edge.target;
            return (
              <g
                key={edge.id}
                data-graph-item=""
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`${relationshipLabel(edge.relationship)} relationship to ${other}, ${edge.provenanceRaw} evidence`}
                onClick={() => onSelect({ kind: 'edge', id: edge.id })}
                onKeyDown={(event) => activate(event, { kind: 'edge', id: edge.id })}
                className="cursor-pointer outline-none [&:focus-visible>path:first-child]:stroke-primary/30"
              >
                <path d={geometry.d} fill="none" stroke="transparent" strokeWidth={18} />
                <path
                  d={geometry.d}
                  fill="none"
                  stroke={style.stroke}
                  strokeWidth={selected ? style.width + 2 : style.width}
                  strokeDasharray={style.dash}
                  strokeLinecap="round"
                  markerEnd={edge.origin === 'edge' ? `url(#arrow-${markerKind})` : undefined}
                />
                {selected && (
                  <text x={geometry.labelX} y={geometry.labelY - 8} textAnchor="middle" className="fill-ink text-[12px] font-semibold" paintOrder="stroke" stroke="var(--color-canvas)" strokeWidth={4}>
                    {relationshipLabel(edge.relationship)}
                  </text>
                )}
              </g>
            );
          })}

          {model.nodes.map((node) => {
            const selected = selection?.kind === 'node' && selection.id === node.id;
            const r = node.role === 'focus' ? FOCUS_RADIUS : NODE_RADIUS;
            return (
              <g
                key={node.id}
                data-graph-item=""
                role="button"
                tabIndex={0}
                aria-pressed={selected}
                aria-label={`${nodeTypeLabel(node.type)}: ${node.label}${node.role === 'focus' ? ' (selected recipient)' : ''}`}
                transform={`translate(${node.x} ${node.y})`}
                onClick={() => onSelect({ kind: 'node', id: node.id })}
                onKeyDown={(event) => activate(event, { kind: 'node', id: node.id })}
                className="cursor-pointer outline-none [&:focus-visible>*:first-child]:stroke-primary [&:focus-visible>*:first-child]:[stroke-width:4]"
              >
                <NodeShape node={node} selected={selected} />
                <text y={r + 18} textAnchor="middle" className="fill-ink text-[12px] font-medium" paintOrder="stroke" stroke="var(--color-canvas)" strokeWidth={4}>
                  {truncate(node.label)}
                </text>
                <text y={r + 33} textAnchor="middle" className="fill-ink-muted text-[10px]" paintOrder="stroke" stroke="var(--color-canvas)" strokeWidth={4}>
                  {node.role === 'path' ? 'via inferred path' : nodeTypeLabel(node.type)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <p className="mt-2 text-xs text-ink-muted">Drag to pan, scroll or use the buttons to zoom. Select an entity or relationship for details.</p>
    </div>
  );
}

export function GraphLegend() {
  const lines: { kind: ProvenanceKind; label: string; meaning: string }[] = [
    { kind: 'verified', label: 'Verified', meaning: 'Formally corroborated' },
    { kind: 'reported', label: 'Reported', meaning: 'Unconfirmed report or allegation' },
    { kind: 'inferred', label: 'Inferred', meaning: 'Derived link; not proof of common ownership' },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 text-xs text-ink-muted sm:grid-cols-2">
      <div>
        <p className="mb-2 font-semibold uppercase tracking-wide">Relationship provenance</p>
        <ul className="space-y-1.5">
          {lines.map(({ kind, label, meaning }) => (
            <li key={kind} className="flex items-center gap-2">
              <svg width="40" height="10" aria-hidden="true">
                <line x1="2" y1="5" x2="38" y2="5" stroke={edgeStyles[kind].stroke} strokeWidth={edgeStyles[kind].width} strokeDasharray={edgeStyles[kind].dash} strokeLinecap="round" />
              </svg>
              <span>
                <span className="font-semibold text-ink">{label}</span> · {meaning}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-2 font-semibold uppercase tracking-wide">Entities</p>
        <ul className="grid grid-cols-2 gap-1.5">
          <li className="flex items-center gap-2"><span className="size-3 rounded-full bg-primary" aria-hidden="true" />Selected recipient</li>
          <li className="flex items-center gap-2"><span className="size-3 rounded-full border border-ink-muted" aria-hidden="true" />Beneficiary / customer</li>
          <li className="flex items-center gap-2"><span className="size-3 rounded-sm border border-ink-muted" aria-hidden="true" />Case / report</li>
          <li className="flex items-center gap-2"><span className="size-2.5 rotate-45 border border-ink-muted" aria-hidden="true" />Shared identifier</li>
          <li className="col-span-2 flex items-center gap-2"><span className="size-3 rounded-full border border-dashed border-ink-muted bg-muted" aria-hidden="true" />Entity reached via an inferred path</li>
        </ul>
      </div>
      <p className="sm:col-span-2">A relationship in this graph is not proof of criminal activity.</p>
    </div>
  );
}
