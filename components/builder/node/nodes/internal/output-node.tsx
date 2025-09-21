import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { ArrowUpRight } from 'lucide-react';
import { memo, useEffect } from 'react';
import { nanoid } from 'nanoid';

import { generateReadableId } from '../../base/base-node-properties';
import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';

const defaultSize = { width: 260, height: 160 };

const properties = {
  handleId: {
    label: 'Handle ID',
    type: 'string' as const,
    value: '',
  },
  label: {
    label: 'Label',
    type: 'string' as const,
    value: 'Output',
  },
};

type OutputNodeProperties = typeof properties;

function OutputNode({ id, data, selected }: NodeProps<Node<OutputNodeProperties, unknown>>) {
  const { updateNodeData } = useReactFlow<Node>();

  useEffect(() => {
    const patch: Record<string, unknown> = {};
    if (!data.handleId) {
      patch.handleId = `output_${nanoid(4)}`;
    }
    if (!data.label) {
      patch.label = generateReadableId().toLowerCase();
    }
    if (Object.keys(patch).length > 0) {
      updateNodeData(id, patch);
    }
  }, [data.handleId, data.label, id, updateNodeData]);

  // Output node just passes through the connected input value
  useEffect(() => {
    const entries = Object.values(data.entries ?? {});
    const firstEntry = entries.length > 0 ? entries[0] : null;
    updateNodeData(id, { value: firstEntry?.value ?? null });
  }, [data.entries, id, updateNodeData]);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: {
            position: Position.Left,
            separateHandles: false,
          },
          source: null,
        },
      }}
    >
      <div className="relative flex h-full w-full flex-col gap-2 p-3">
        <Handle
          type="target"
          position={Position.Left}
          id={`${id}-target-${data.handleId || 'handle'}`}
          className="!h-2 !w-2"
          style={{ top: '50%', transform: 'translate(-50%, -50%)' }}
          isConnectable={data.entries && Object.keys(data.entries).length === 0}
        />
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>{data.label || 'Output'}</span>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </header>
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<OutputNodeProperties> = {
  type: 'internal-output',
  icon: ArrowUpRight,
  label: 'Output',
  properties,
  component: memo(OutputNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Internal',
};

export default definition;
