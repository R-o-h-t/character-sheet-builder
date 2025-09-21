import { Node as FlowNode, Edge } from '@xyflow/react';
import * as math from 'mathjs';

export type SimulatedNodeData = {
  [key: string]: any;
  value?: any;
  entries?: Record<string, { value: any; handle?: string; handleId?: string }>;
  handleId?: string;
  expression?: string;
};

export type SimulatedNode = FlowNode & {
  data: SimulatedNodeData;
};

/**
 * Simulates the execution of an internal graph within a composite node.
 * Takes external input values and propagates them through the internal nodes.
 */
export function simulateInternalGraph(
  internalNodes: SimulatedNode[],
  internalEdges: Edge[],
  externalInputs: Record<string, any>
): Record<string, any> {
  function normalizeHandleId(rawId: string | null | undefined, nodeId: string, type: 'target' | 'source'): string | undefined {
    if (!rawId) return undefined;
    let trimmed = rawId;
    const prefixNode = `${nodeId}-`;
    const prefixType = `${type}-`;
    if (trimmed.startsWith(prefixNode)) trimmed = trimmed.slice(prefixNode.length);
    if (trimmed.startsWith(prefixType)) trimmed = trimmed.slice(prefixType.length);
    return trimmed;
  }

  // Create working copies of nodes with initial state
  const workingNodes = internalNodes.map(node => ({
    ...node,
    data: {
      ...node.data,
      entries: {},
      value: node.data.value
    }
  }));

  // Create edge lookup for faster access
  const edgesByTarget = internalEdges.reduce((acc, edge) => {
    if (!acc[edge.target]) acc[edge.target] = [];
    acc[edge.target].push(edge);
    return acc;
  }, {} as Record<string, Edge[]>);

  // Step 1: Initialize internal input nodes with external input values
  workingNodes.forEach(node => {
    if (node.type === 'internal-input') {
      // Use explicit handleId when present, otherwise fall back to a stable id
      const handleId = (node.data.handleId as string) || `input_${node.id}`;
      if (handleId && externalInputs[handleId] !== undefined) {
        node.data.value = externalInputs[handleId];
      }
    }
  });

  // Step 2: Propagate values through the graph using topological execution
  let maxIterations = 50; // Prevent infinite loops but allow longer chains to settle
  let hasChanges = true;

  while (hasChanges && maxIterations-- > 0) {
    hasChanges = false;

    for (const node of workingNodes) {
      const nodeId = node.id;
      const incomingEdges = edgesByTarget[nodeId] || [];

      // Build entries from incoming connections
      const newEntries: Record<string, { value: any; handle?: string; handleId?: string }> = {};

      for (const edge of incomingEdges) {
        const sourceNode = workingNodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.data.value !== undefined) {
          // Normalize handles so entries use the expected identifiers
          const targetHandleId = normalizeHandleId(edge.targetHandle, edge.target, 'target') || 'default';
          const sourceHandleId = normalizeHandleId(edge.sourceHandle, edge.source, 'source');

          // Respect per-handle outputs when available
          const handleValues = (sourceNode.data as any)?.handleValues as Record<string, any> | undefined;
          const sourceValue = (sourceHandleId && handleValues && sourceHandleId in handleValues)
            ? handleValues[sourceHandleId]
            : sourceNode.data.value;

          newEntries[targetHandleId] = {
            value: sourceValue,
            handle: targetHandleId,
            handleId: targetHandleId
          };
        }
      }

      // Check if entries have changed and update
      const entriesChanged = !deepEqual(node.data.entries, newEntries);
      if (entriesChanged) {
        node.data.entries = newEntries;
        hasChanges = true;
      }

      // Always simulate node execution to propagate upstream changes through chains
      const newValue = simulateNodeExecution(node);
      if (newValue !== node.data.value) {
        node.data.value = newValue;
        hasChanges = true;
      }
    }
  }

  // Step 3: Extract output values from internal output nodes
  const outputs: Record<string, any> = {};
  workingNodes.forEach(node => {
    if (node.type === 'internal-output') {
      // Use explicit handleId when present, otherwise fall back to a stable id
      const handleId = (node.data.handleId as string) || `output_${node.id}`;
      if (handleId) {
        outputs[handleId] = node.data.value;
      }
    }
  });

  return outputs;
}

/**
 * Simulates the execution of a single node based on its type and inputs
 */
function simulateNodeExecution(node: SimulatedNode): any {
  const { type, data } = node;

  switch (type) {
    case 'internal-input':
      // Input nodes just pass through their value
      return data.value;

    case 'internal-output':
      // Output nodes pass through the first connected input
      const entries = Object.values(data.entries || {});
      return entries.length > 0 ? entries[0].value : null;

    case 'brick-formula':
      return simulateFormulaBrick(data);

    case 'brick-value':
      return data.value || 0;

    case 'composite-node': {
      // Support nested composite nodes by simulating their internal graphs
      const nestedInputsDef = (data as any).inputs as Array<{ handleId: string }> | undefined;
      const nestedNodes = (data as any).internalNodes as SimulatedNode[] | undefined;
      const nestedEdges = (data as any).internalEdges as Edge[] | undefined;
      if (!nestedNodes || !nestedNodes.length) {
        return data.value;
      }
      // Build external inputs for the nested composite from current entries
      const nestedExternalInputs: Record<string, any> = {};
      if (nestedInputsDef && Array.isArray(nestedInputsDef)) {
        for (const io of nestedInputsDef) {
          const key = io.handleId;
          const entry = data.entries?.[key];
          if (entry) nestedExternalInputs[key] = entry.value;
        }
      } else {
        // Fallback: use all entries as inputs
        for (const [key, entry] of Object.entries(data.entries || {})) {
          nestedExternalInputs[key] = entry.value;
        }
      }

      const nestedOutputs = simulateInternalGraph(nestedNodes, nestedEdges || [], nestedExternalInputs);

      // Expose per-handle outputs for downstream edges
      (data as any).handleValues = nestedOutputs;

      // For node.value, prefer single-output value; otherwise attach the object
      const outputKeys = Object.keys(nestedOutputs);
      if (outputKeys.length === 1) {
        return nestedOutputs[outputKeys[0]];
      }
      return nestedOutputs;
    }

    default:
      // For unknown node types, just return the current value
      return data.value;
  }
}

/**
 * Simulates a formula brick execution
 */
function simulateFormulaBrick(data: SimulatedNodeData): number | { error: string } {
  const expression = data.expression as string;

  if (!expression?.trim()) {
    return { error: 'Expression is empty' };
  }

  try {
    // Extract variables from the expression
    const TOKEN_REGEX = /([A-Z_][A-Z0-9_]*)/gi;
    const variables = new Set<string>();
    let match;
    const regex = new RegExp(TOKEN_REGEX);
    while ((match = regex.exec(expression)) !== null) {
      variables.add(match[1]);
    }

    // Build scope from connected inputs
    const scope: Record<string, number> = {};

    for (const variable of variables) {
      const entry = data.entries?.[variable];
      if (!entry) {
        return { error: `Variable ${variable} not connected` };
      }

      if (entry.value && typeof entry.value === 'object' && 'error' in entry.value) {
        return entry.value;
      }

      const numericValue = typeof entry.value === 'number' ? entry.value : Number(entry.value);
      if (!Number.isFinite(numericValue)) {
        return { error: `Variable ${variable} is not a valid number` };
      }

      scope[variable] = numericValue;
    }

    const result = math.evaluate(expression, scope);

    if (typeof result === 'number' && Number.isFinite(result)) {
      return result;
    }

    return { error: 'Expression did not resolve to a valid number' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Expression evaluation failed' };
  }
}

/**
 * Deep equality check for objects
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return false;
}
