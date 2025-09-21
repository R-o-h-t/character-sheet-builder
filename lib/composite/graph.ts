import type { Edge, Node as FlowNode } from '@xyflow/react';

export type CompositeIO = {
  id: string;
  label: string;
  handleId: string;
  source?: {
    nodeId: string;
    handleId?: string;
  };
};

export type CompositeGraph = {
  nodes: FlowNode[];
  edges: Edge[];
  inputs: CompositeIO[];
  outputs: CompositeIO[];
};

/**
 * A lightweight specification describing how to compute a specific output
 * of a composite from its inputs. We avoid serializing executable code and
 * instead use a declarative type that the runtime understands.
 *
 * Currently supported:
 * - type "composite-sim": compute by simulating the saved internal graph
 *   and returning the value for the given handleId.
 */
export type OutputHandlerSpec = {
  handleId: string;
  type: 'composite-sim';
  version: 1;
};

export function deriveCompositeInputs(nodes: FlowNode[]): CompositeIO[] {
  return nodes
    .filter((node) => node.type === 'internal-input')
    .map((node) => {
      const data = (node.data as Record<string, unknown>) ?? {};
      const handleId = getHandleId(data.handleId, `input_${node.id}`);
      const label = getLabel(data.label, handleId);

      return {
        id: handleId,
        label,
        handleId,
      };
    });
}

export function deriveCompositeOutputs(nodes: FlowNode[], edges: Edge[]): CompositeIO[] {
  const edgeLookup = edges.reduce<Record<string, Edge>>((acc, edge) => {
    acc[edge.target] = edge;
    return acc;
  }, {});

  return nodes
    .filter((node) => node.type === 'internal-output')
    .map((node) => {
      const data = (node.data as Record<string, unknown>) ?? {};
      const handleId = getHandleId(data.handleId, `output_${node.id}`);
      const label = getLabel(data.label, handleId);

      const incoming = edgeLookup[node.id];
      let source: { nodeId: string; handleId?: string } | undefined;

      if (incoming) {
        const sourceNodeId = incoming.source;
        const sourceNode = nodes.find((candidate) => candidate.id === sourceNodeId);
        const sourceHandle = normalizeHandleId(incoming.sourceHandle, incoming.source, 'source');

        if (sourceNode?.type === 'internal-input') {
          const sourceData = (sourceNode.data as Record<string, unknown>) ?? {};
          const inputHandle = getOptionalHandleId(sourceData.handleId);
          source = { nodeId: sourceNodeId, handleId: inputHandle ?? sourceHandle ?? undefined };
        } else if (sourceNode) {
          source = { nodeId: sourceNodeId, handleId: sourceHandle ?? undefined };
        }
      }

      return {
        id: handleId,
        label,
        handleId,
        source,
      };
    });
}

/**
 * Generate default per-output handler specs for a composite's outputs.
 * These handlers tell the runtime to compute outputs by simulating the
 * internal graph and reading the value for each handle.
 */
export function generateOutputHandlers(outputs: CompositeIO[]): OutputHandlerSpec[] {
  return outputs.map((o) => ({ handleId: o.handleId, type: 'composite-sim', version: 1 as const }));
}

export function normalizeHandleId(
  rawId: string | null | undefined,
  nodeId: string,
  type: 'target' | 'source',
): string | undefined {
  if (!rawId) {
    return undefined;
  }

  let trimmed = rawId;
  if (trimmed.startsWith(`${nodeId}-`)) {
    trimmed = trimmed.slice(`${nodeId}-`.length);
  }
  if (trimmed.startsWith(`${type}-`)) {
    trimmed = trimmed.slice(`${type}-`.length);
  }
  return trimmed;
}

function getHandleId(raw: unknown, fallback: string): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return fallback;
}

function getLabel(raw: unknown, fallback: string): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return fallback;
}

function getOptionalHandleId(raw: unknown): string | undefined {
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim();
  }
  return undefined;
}
