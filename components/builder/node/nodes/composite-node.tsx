import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Blocks } from 'lucide-react';
import { memo, useEffect, useMemo, useRef } from 'react';

import type { CompositeIO } from '@/lib/composite/graph';
import { Node, NodeDefinition } from '../../node-registry';
import { Resizable } from '../base/node-resizer';
import { createError, formatValue, getEntryByHandle, isErrorValue } from '../utils/value';

const defaultSize = { width: 260, height: 180 };

type CompositeNodeProperties = Record<string, never>;

type CompositeNodeValue =
  | { outputs: Record<string, unknown>; inputs: CompositeIO[]; outputsMeta: CompositeIO[] }
  | { error: string };

function CompositeNode({ id, data, selected }: NodeProps<Node<CompositeNodeProperties, CompositeNodeValue>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const inputs = useMemo(() => readIo(data, 'inputs'), [data]);
  const outputs = useMemo(() => readIo(data, 'outputs'), [data]);

  const inputHandles = useMemo(
    () =>
      inputs.map((io) => ({
        id: io.handleId,
        maxConnections: 1,
      })),
    [inputs]
  );

  const outputHandles = useMemo(
    () =>
      outputs.map((io) => ({
        id: io.handleId,
        maxConnections: 1,
      })),
    [outputs]
  );

  const resolved = useMemo<CompositeNodeValue>(() => {
    if (!outputs.length) {
      return createError('Configure outputs inside the composite editor');
    }

    const scope: Record<string, unknown> = {};

    for (const input of inputs) {
      const entry = getEntryByHandle(data.entries, input.handleId);
      if (!entry) {
        scope[input.handleId] = null;
        scope[input.id] = null;
        const safeLabel = sanitizeIdentifier(input.label);
        if (safeLabel) {
          scope[safeLabel] = null;
        }
        continue;
      }

      if (isErrorValue(entry.value)) {
        return entry.value;
      }

      scope[input.handleId] = entry.value;
      scope[input.id] = entry.value;
      const safeLabel = sanitizeIdentifier(input.label);
      if (safeLabel) {
        scope[safeLabel] = entry.value;
      }
    }

    const result: Record<string, unknown> = {};

    for (const output of outputs) {
      const key = output.handleId;
      if (output.source?.handleId) {
        const value = scope[output.source.handleId];
        result[key] = value ?? null;
      } else {
        result[key] = null;
      }
    }

    return { outputs: result, inputs, outputsMeta: outputs };
  }, [data.entries, inputs, outputs]);

  // Create a stable key for comparison based on the resolved content
  const resolvedKey = useMemo(() => {
    if ('error' in resolved) {
      return `error:${resolved.error}`;
    }

    const outputKeys = Object.keys(resolved.outputs).sort();
    const outputValues = outputKeys.map(key => `${key}:${JSON.stringify(resolved.outputs[key])}`).join('|');
    return `success:${outputValues}:inputs:${resolved.inputs.length}:outputs:${resolved.outputsMeta.length}`;
  }, [resolved]);

  // Track the last update key to prevent infinite loops
  const lastUpdateKeyRef = useRef<string>('');

  useEffect(() => {
    if (lastUpdateKeyRef.current !== resolvedKey) {
      lastUpdateKeyRef.current = resolvedKey;
      updateNodeData(id, { value: resolved });
    }
  }, [id, resolved, resolvedKey, updateNodeData]);

  const hasHandles = inputHandles.length > 0 || outputHandles.length > 0;

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: inputHandles.length
            ? {
              position: Position.Left,
              definitions: inputHandles,
            }
            : null,
          source: outputHandles.length
            ? {
              position: Position.Right,
              definitions: outputHandles,
            }
            : null,
        },
      }}
    >
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>Composite</span>
          <span className="text-xs text-muted-foreground">
            {inputs.length} in · {outputs.length} out
          </span>
        </header>
        {!hasHandles && (
          <p className="text-xs text-muted-foreground">
            Double click to open the internal editor and add inputs/outputs.
          </p>
        )}
        {!isErrorValue(resolved) ? (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {Object.entries(resolved.outputs).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-2">
                <span>{key}</span>
                <span>{formatValue(value)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {resolved.error}
          </div>
        )}
        <div className="mt-auto rounded border border-border bg-background p-2 text-xs">
          <span className="font-semibold">Status: </span>
          <span>{isErrorValue(resolved) ? 'Error' : 'Ready'}</span>
        </div>
      </div>
    </Resizable>
  );
}

function readIo(data: Node['data'], key: 'inputs' | 'outputs'): CompositeIO[] {
  const raw = (data as Record<string, unknown>)[key];
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const value = item as Record<string, unknown>;
      const handleId = getString(value.handleId) ?? getString(value.id);
      if (!handleId) {
        return null;
      }

      const label = getString(value.label) ?? handleId;

      const sourceValue = value.source;
      let source: CompositeIO['source'];
      if (sourceValue && typeof sourceValue === 'object') {
        const sourceRecord = sourceValue as Record<string, unknown>;
        const nodeId = getString(sourceRecord.nodeId);
        if (nodeId) {
          const handle = getString(sourceRecord.handleId);
          source = {
            nodeId,
            handleId: handle ?? undefined,
          };
        }
      }

      return {
        id: handleId,
        label,
        handleId,
        source,
      } as CompositeIO;
    })
    .filter((item): item is CompositeIO => item !== null);
}

function sanitizeIdentifier(label?: string) {
  if (!label) {
    return null;
  }
  return label.replace(/[^a-zA-Z0-9_]/g, '_');
}

function getString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

export const definition: NodeDefinition<CompositeNodeProperties, CompositeNodeValue> = {
  type: 'composite-node',
  icon: Blocks,
  label: 'Composite',
  properties: {},
  component: memo(CompositeNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Components',
};

export default definition;
