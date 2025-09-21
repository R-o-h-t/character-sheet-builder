import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Link2 } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { createError, isErrorValue } from '../../utils/value';

const defaultSize = { width: 240, height: 140 };

const properties = {
  targetRef: {
    label: 'Target ref',
    type: 'string' as const,
    value: '',
  },
};

type ReferenceNodeProperties = typeof properties;

function ReferenceNode({ id, data, selected }: NodeProps<Node<ReferenceNodeProperties, unknown>>) {
  const { updateNodeData, getNodes } = useReactFlow<Node>();

  const target = useMemo(() => {
    if (!data.targetRef) {
      return undefined;
    }
    const nodes = getNodes();
    return nodes.find((node) => node.data?.ref === data.targetRef);
  }, [data.targetRef, getNodes]);

  const resolved = useMemo(() => {
    if (!data.targetRef) {
      return createError('No target reference provided');
    }
    if (!target) {
      return createError(`Component ${data.targetRef} not found`);
    }
    if (isErrorValue(target.data.value)) {
      return target.data.value;
    }
    if (target.data.value === undefined) {
      return createError(`Component ${data.targetRef} has no value`);
    }
    return target.data.value;
  }, [data.targetRef, target]);

  useEffect(() => {
    updateNodeData(id, { value: resolved });
  }, [id, resolved, updateNodeData]);

  const availableRefs = useMemo(() => {
    const seen = new Set<string>();
    return getNodes()
      .filter((nodeItem) => nodeItem.id !== id && typeof nodeItem.data?.ref === 'string')
      .map((nodeItem) => nodeItem.data.ref as string)
      .filter((ref) => {
        if (seen.has(ref)) {
          return false;
        }
        seen.add(ref);
        return true;
      })
      .sort();
  }, [getNodes, id]);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: null,
          source: {
            position: Position.Right,
            separateHandles: false,
            maxConnections: undefined,
          },
        },
      }}
    >
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>Reference</span>
          <span className="text-xs text-muted-foreground">{data.targetRef || '—'}</span>
        </header>
        <select
          value={data.targetRef}
          onChange={(event) => updateNodeData(id, { targetRef: event.target.value })}
          className="h-8 rounded border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1"
        >
          <option value="">Select component</option>
          {availableRefs.map((refValue) => (
            <option key={refValue} value={refValue}>
              {refValue}
            </option>
          ))}
        </select>
        <div className="text-xs text-muted-foreground">
          {target ? `Resolved node: ${target.data.ref}` : 'Not resolved'}
        </div>
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<ReferenceNodeProperties> = {
  type: 'internal-reference',
  icon: Link2,
  label: 'Reference',
  properties,
  component: memo(ReferenceNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Internal',
};

export default definition;
