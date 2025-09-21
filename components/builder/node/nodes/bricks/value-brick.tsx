import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Hash } from 'lucide-react';
import { memo, useEffect } from 'react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';

const defaultSize = { width: 160, height: 100 };

const properties = {
  value: {
    label: 'Value',
    type: 'number' as const,
    value: 0,
  },
};

type ValueBrickProperties = typeof properties;

function ValueBrick({ id, data, selected }: NodeProps<Node<ValueBrickProperties, number>>) {
  const { updateNodeData } = useReactFlow<Node>();

  useEffect(() => {
    updateNodeData(id, { value: data.value });
  }, [id, data.value, updateNodeData]);

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
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>Value</span>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </header>

        <input
          type="number"
          value={data.value}
          onChange={(e) => updateNodeData(id, { value: parseFloat(e.target.value) || 0 })}
          className="w-full rounded border border-border bg-background p-1 text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          step="any"
        />

        <div className="text-xs text-muted-foreground text-center">
          Constant: {data.value}
        </div>
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<ValueBrickProperties, number> = {
  type: 'brick-value',
  icon: Hash,
  label: 'Value Brick',
  properties,
  component: memo(ValueBrick),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Bricks',
};

export default definition;
