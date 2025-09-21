import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { PlugZap } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';
import { nanoid } from 'nanoid';

import { generateReadableId } from '../../base/base-node-properties';
import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { isErrorValue } from '../../utils/value';

const defaultSize = { width: 220, height: 140 };

const properties = {
  handleId: {
    label: 'Handle ID',
    type: 'string' as const,
    value: '',
  },
  label: {
    label: 'Label',
    type: 'string' as const,
    value: 'Input',
  },
  maxConnections: {
    label: 'Max connections (0 = unlimited)',
    type: 'number' as const,
    value: 0,
  },
};

type InputNodeProperties = typeof properties;

function InputNode({ id, data, selected }: NodeProps<Node<InputNodeProperties, unknown>>) {
  const { updateNodeData } = useReactFlow<Node>();

  useEffect(() => {
    const patch: Record<string, unknown> = {};
    if (!data.handleId) {
      patch.handleId = `input_${nanoid(4)}`;
    }
    if (!data.label) {
      patch.label = generateReadableId().toLowerCase();
    }
    if (Object.keys(patch).length) {
      updateNodeData(id, patch);
    }
  }, [data.handleId, data.label, id, updateNodeData]);

  const firstValue = useMemo(() => {
    const entries = Object.values(data.entries ?? {});
    if (!entries.length) {
      return null;
    }

    const entry = entries[0];
    if (isErrorValue(entry.value)) {
      return entry.value;
    }

    return entry.value;
  }, [data.entries]);

  useEffect(() => {
    updateNodeData(id, { value: firstValue });
  }, [firstValue, id, updateNodeData]);

  const connections = Object.values(data.entries ?? {});
  const maxConnections = data.maxConnections;
  const resolvedMax = maxConnections && maxConnections > 0 ? maxConnections : undefined;

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
          },
        },
      }}
    >
      <div className="relative flex h-full w-full flex-col gap-2 p-3">
        <Handle
          type="source"
          position={Position.Right}
          id={`${id}-source-${data.handleId || 'handle'}`}
          className="!h-2 !w-2"
          style={{ top: '50%', transform: 'translate(50%, -50%)' }}
        />
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>{data.label || 'Input'}</span>
          <span className="text-xs text-muted-foreground">
            {resolvedMax ? `${connections.length}/${resolvedMax}` : `${connections.length}`}
          </span>
        </header>
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<InputNodeProperties> = {
  type: 'internal-input',
  icon: PlugZap,
  label: 'Input',
  properties,
  component: memo(InputNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Internal',
};

export default definition;
