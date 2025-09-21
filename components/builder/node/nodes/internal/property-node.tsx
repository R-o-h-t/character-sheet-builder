import { Input } from '@/components/ui/input';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Tags } from 'lucide-react';
import { memo, useEffect } from 'react';
import { nanoid } from 'nanoid';

import { generateReadableId } from '../../base/base-node-properties';
import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';

const defaultSize = { width: 220, height: 120 };

const properties = {
  handleId: {
    label: 'Key',
    type: 'string' as const,
    value: '',
  },
  label: {
    label: 'Label',
    type: 'string' as const,
    value: 'property',
  },
};

type PropertyNodeProperties = typeof properties;

function PropertyNode({ id, data, selected }: NodeProps<Node<PropertyNodeProperties, unknown>>) {
  const { updateNodeData } = useReactFlow<Node>();

  useEffect(() => {
    const patch: Record<string, unknown> = {};
    if (!data.handleId) {
      patch.handleId = `prop_${nanoid(4)}`;
    }
    if (!data.label) {
      patch.label = generateReadableId().toLowerCase();
    }
    if (Object.keys(patch).length) {
      updateNodeData(id, patch);
    }
  }, [data.handleId, data.label, id, updateNodeData]);

  useEffect(() => {
    updateNodeData(id, { value: data.handleId });
  }, [data.handleId, id, updateNodeData]);

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
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <header className="text-sm font-semibold">Property</header>
        <Input
          value={data.label}
          onChange={(event) => updateNodeData(id, { label: event.target.value })}
          placeholder="Label"
          className="h-8"
        />
        <Input
          value={data.handleId}
          onChange={(event) => updateNodeData(id, { handleId: event.target.value })}
          placeholder="Key"
          className="h-8"
        />
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<PropertyNodeProperties> = {
  type: 'internal-property',
  icon: Tags,
  label: 'Property',
  properties,
  component: memo(PropertyNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Internal',
};

export default definition;
