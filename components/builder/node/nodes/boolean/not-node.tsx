import { memo, useEffect, useMemo } from 'react';
import { CircleOff } from 'lucide-react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { ConnectionField } from '../../base/connection-field';
import { getEntryByHandle, parseBoolean, resolveBoolean } from '../../utils/value';

const properties = {
  inputValue: {
    label: 'Value',
    type: 'boolean' as const,
    value: 'false',
  },
};

type NotNodeProperties = typeof properties;

const HANDLE_INPUT = 'inputValue';

function NotNode({ id, data, selected }: NodeProps<Node<NotNodeProperties, boolean>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const entry = useMemo(() => getEntryByHandle(data.entries, HANDLE_INPUT), [data.entries]);

  const output = useMemo(() => {
    const fallback = parseBoolean(data.inputValue);
    const value = resolveBoolean(entry, 'Input', fallback);
    if (typeof value !== 'boolean') {
      return value;
    }
    return !value;
  }, [data.inputValue, entry]);

  useEffect(() => {
    updateNodeData(id, { value: output });
  }, [id, output, updateNodeData]);

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
      <div className="flex flex-col gap-2 p-3 text-xs">
        <header className="text-sm font-semibold">NOT</header>
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_INPUT}
          label="Input"
          type="boolean"
          value={data.inputValue}
          entry={entry}
          onChange={(value) => updateNodeData(id, { inputValue: value })}
        />
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<NotNodeProperties> = {
  type: 'boolean-not',
  icon: CircleOff,
  label: 'NOT',
  properties,
  component: memo(NotNode),
  isResizable: true,
  isModifiable: true,
  category: 'Boolean',
};

export default definition;
