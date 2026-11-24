/**
 * Builds a drawable recipient-centred evidence graph from backend data only:
 * - RecipientEvidenceSummary: the recipient node, its directly connected nodes and incident edges.
 * - RecipientIntelligenceProfile.supporting_evidence: items whose `path` spans more than
 *   one hop (e.g. recipient -> shared identifier -> other beneficiary). Only the path's node
 *   identifiers are known for the far end, so those nodes are drawn as "path entities".
 *
 * No nodes or edges are invented. The backend does not expose the full graph.
 */
import type { ProvenanceKind } from '../../types/assessment';
import type { EvidenceEdge, RecipientEvidenceSummary, RecipientIntelligenceProfile, VerificationAudit } from '../../types/investigator';
import { provenanceKind } from '../assessment/buildAssessmentView';

export type GraphNodeRole = 'focus' | 'direct' | 'path';

export interface GraphNode {
  id: string;
  label: string;
  type: string | null;
  role: GraphNodeRole;
  createdAt: string | null;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  provenance: ProvenanceKind;
  provenanceRaw: string;
  description: string;
  sourceReference: string;
  observedAt: string | null;
  expiresAt: string | null;
  /** 'edge' = stored evidence edge; 'path' = segment of a multi-hop inferred path reported by the profile. */
  origin: 'edge' | 'path';
  path: string[] | null;
  verification: VerificationAudit | null;
}

export interface EvidenceGraphModel {
  focusId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  bounds: { minX: number; minY: number; width: number; height: number };
}

const DIRECT_RADIUS = 190;
const PATH_RADIUS = 340;
const MARGIN = 120;

function edgeFromEvidence(edge: EvidenceEdge): GraphEdge {
  return {
    id: edge.edge_id,
    source: edge.source_node_id,
    target: edge.target_node_id,
    relationship: edge.relationship_type,
    provenance: provenanceKind(edge.evidence_status),
    provenanceRaw: edge.evidence_status,
    description: edge.description,
    sourceReference: edge.source_reference,
    observedAt: edge.observed_at,
    expiresAt: edge.expires_at,
    origin: 'edge',
    path: null,
    verification: edge.verification_audit,
  };
}

export function buildEvidenceGraph(
  evidence: RecipientEvidenceSummary,
  profile: RecipientIntelligenceProfile | null,
): EvidenceGraphModel | null {
  const focus = evidence.recipient_node;
  if (!focus) return null;

  const nodes = new Map<string, Omit<GraphNode, 'x' | 'y'>>();
  nodes.set(focus.node_id, { id: focus.node_id, label: focus.display_label, type: focus.node_type, role: 'focus', createdAt: focus.created_at });
  for (const node of evidence.connected_nodes) {
    if (!nodes.has(node.node_id)) {
      nodes.set(node.node_id, { id: node.node_id, label: node.display_label, type: node.node_type, role: 'direct', createdAt: node.created_at });
    }
  }

  const edges: GraphEdge[] = evidence.evidence_edges.map(edgeFromEvidence);
  const pathParent = new Map<string, string>();

  for (const item of profile?.supporting_evidence ?? []) {
    const path = item.path ?? [];
    if (path.length < 3 || path[0] !== focus.node_id) continue;
    for (let i = 1; i < path.length - 1; i += 1) {
      const from = path[i];
      const to = path[i + 1];
      if (!nodes.has(to)) {
        nodes.set(to, { id: to, label: to, type: null, role: 'path', createdAt: null });
        pathParent.set(to, from);
      }
      const id = `${item.edge_id}#${i}`;
      if (!edges.some((edge) => edge.id === id)) {
        edges.push({
          id,
          source: to,
          target: from,
          relationship: item.relationship_type,
          provenance: provenanceKind(item.evidence_status),
          provenanceRaw: item.evidence_status,
          description: item.description,
          sourceReference: item.source_reference,
          observedAt: item.observed_at,
          expiresAt: null,
          origin: 'path',
          path,
          verification: null,
        });
      }
    }
  }

  // Radial layout: focus at the centre, direct neighbours on an inner ring, path entities outside their parent.
  const placed = new Map<string, { x: number; y: number }>();
  placed.set(focus.node_id, { x: 0, y: 0 });
  const direct = [...nodes.values()].filter((node) => node.role === 'direct');
  direct.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(direct.length, 1)) * Math.PI * 2;
    placed.set(node.id, { x: Math.cos(angle) * DIRECT_RADIUS, y: Math.sin(angle) * DIRECT_RADIUS });
  });
  const childrenByParent = new Map<string, string[]>();
  for (const [child, parent] of pathParent) childrenByParent.set(parent, [...(childrenByParent.get(parent) ?? []), child]);
  for (const [parent, children] of childrenByParent) {
    const anchor = placed.get(parent) ?? { x: DIRECT_RADIUS, y: 0 };
    const baseAngle = Math.atan2(anchor.y, anchor.x);
    children.forEach((child, index) => {
      const spread = (index - (children.length - 1) / 2) * 0.35;
      placed.set(child, { x: Math.cos(baseAngle + spread) * PATH_RADIUS, y: Math.sin(baseAngle + spread) * PATH_RADIUS });
    });
  }

  const laidOut: GraphNode[] = [...nodes.values()].map((node) => ({ ...node, ...(placed.get(node.id) ?? { x: 0, y: 0 }) }));
  const xs = laidOut.map((node) => node.x);
  const ys = laidOut.map((node) => node.y);
  const minX = Math.min(...xs) - MARGIN;
  const minY = Math.min(...ys) - MARGIN;
  return {
    focusId: focus.node_id,
    nodes: laidOut,
    edges,
    bounds: { minX, minY, width: Math.max(...xs) + MARGIN - minX, height: Math.max(...ys) + MARGIN - minY },
  };
}
