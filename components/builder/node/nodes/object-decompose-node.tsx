import { NodeProps, Position } from '@xyflow/react';
import { Braces } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';

import { Node, NodeDefinition } from '../../node-registry';
import { Resizable } from '../base/node-resizer';
import { getEntryByHandle, isErrorValue, formatValue } from '../utils/value';

const defaultSize = { width: 280, height: 180 };

type ObjectDecomposeProperties = Record<string, never>;

const INPUT_HANDLE_ID = 'object';

function ObjectDecomposeNode({ id, data, selected }: NodeProps<Node<ObjectDecomposeProperties, unknown>>) {
  // Resolve the incoming object value from the single target handle
  const inputEntry = useMemo(() => getEntryByHandle(data.entries, INPUT_HANDLE_ID), [data.entries]);

  const resolvedObject = useMemo(() => {
    if (!inputEntry) return null;
    if (isErrorValue(inputEntry.value)) return inputEntry.value;
    const v = inputEntry.value as unknown;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
    return null;
  }, [inputEntry]);

  // Build dynamic source handles from object keys
  const outputHandles = useMemo(() => {
    if (!resolvedObject || isErrorValue(resolvedObject)) return [] as { id: string; maxConnections: number }[];
    return Object.keys(resolvedObject).map((key) => ({ id: key, maxConnections: 99 }));
  }, [resolvedObject]);

  // Map per-handle values so downstream connections can pick specific attributes
  const handleValues = useMemo(() => {
    const map: Record<string, unknown> = {};
    if (resolvedObject && !isErrorValue(resolvedObject)) {
      for (const [k, v] of Object.entries(resolvedObject)) {
        map[k] = v;
      }
    } else if (isErrorValue(resolvedObject)) {
      // propagate error on all existing connections by exposing a generic handle
      map['error'] = resolvedObject;
    }
    return map;
  }, [resolvedObject]);

  // Build a stable key for rerenders when the object contents change
  const valueSignature = useMemo(() => {
    try {
      return JSON.stringify(resolvedObject);
    } catch {
      // Fallback for non-serializable objects
      return String(resolvedObject);
    }
  }, [resolvedObject]);

  // Push value and handleValues downstream so node-resizer can propagate
  useEffect(() => {
    // For value, keep the original object
    (window as any).requestAnimationFrame?.(() => { }); // no-op to avoid SSR warnings if any
  }, []);

  // Using a separate effect tied to signature to bump value and _valueTick
  useEffect(() => {
    // Avoid circular import of useReactFlow here; Resizable will handle entries; we only need to set value/handleValues via a synthetic update.
    // We cannot access updateNodeData in this scope directly; the Resizable wrapper parent owns updates via hooks.
    // Therefore, we rely on Resizable's getHandleSpecificValue to read `data.value` and `data.handleValues`.
    // To update them, we use a custom event via the global update pattern is not available here.
    // Instead, we store values directly on data via mutation is not allowed. So we render a view and let Resizable propagate connections.
    // Note: Actual update of value/handleValues is handled by the Display below through a minimal state-less approach.
  }, [valueSignature]);

  const hasError = isErrorValue(resolvedObject);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: {
            position: Position.Left,
            definitions: [
              { id: INPUT_HANDLE_ID, maxConnections: 1 },
            ],
          },
          source: {
            position: Position.Right,
            definitions: outputHandles,
          },
        },
      }}
    >
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>Decompose Object</span>
          <span className="text-xs text-muted-foreground">
            {resolvedObject && !hasError ? `${Object.keys(resolvedObject).length} keys` : '—'}
          </span>
        </header>

        {hasError ? (
          <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {(resolvedObject as any).error}
          </div>
        ) : !resolvedObject ? (
          <div className="text-xs text-muted-foreground">Connect an object to the left handle</div>
        ) : (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {Object.entries(resolvedObject).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span>{k}</span>
                <span>{formatValue(v)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Hidden output exposure: ensure downstream readers can read handleValues */}
        <OutputBinder id={id} value={resolvedObject} handleValues={handleValues} />
      </div>
    </Resizable>
  );
}

// A tiny side-effect component to push value and handleValues using useReactFlow's updateNodeData.
import { useReactFlow } from '@xyflow/react';
function OutputBinder({ id, value, handleValues }: { id: string; value: any; handleValues: Record<string, unknown> }) {
  const { updateNodeData } = useReactFlow<Node>();
  const signature = useMemo(() => {
    try { return JSON.stringify({ v: value, h: handleValues }); } catch { return String(Date.now()); }
  }, [value, handleValues]);

  useEffect(() => {
    updateNodeData(id, { value, handleValues, _valueTick: Date.now() });
  }, [id, signature, updateNodeData]);
  return null;
}

export const definition: NodeDefinition<ObjectDecomposeProperties> = {
  type: 'object-decompose',
  icon: Braces,
  label: 'Decompose Object',
  properties: {},
  component: memo(ObjectDecomposeNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Transform',
};

export default definition;
