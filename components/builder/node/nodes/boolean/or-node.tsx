import { memo, useEffect, useMemo } from 'react';
import { Split } from 'lucide-react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { ConnectionField } from '../../base/connection-field';
import { getEntryByHandle, parseBoolean, resolveBoolean } from '../../utils/value';

const properties = {
  inputA: {
    label: 'Input A',
    type: 'boolean' as const,
    value: 'false',
  },
  inputB: {
    label: 'Input B',
    type: 'boolean' as const,
    value: 'false',
  },
};

type OrNodeProperties = typeof properties;

const HANDLE_A = 'inputA';
const HANDLE_B = 'inputB';

function OrNode({ id, data, selected }: NodeProps<Node<OrNodeProperties, boolean>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const entryA = useMemo(() => getEntryByHandle(data.entries, HANDLE_A), [data.entries]);
  const entryB = useMemo(() => getEntryByHandle(data.entries, HANDLE_B), [data.entries]);

  const output = useMemo(() => {
    const fallbackA = parseBoolean(data.inputA);
    const fallbackB = parseBoolean(data.inputB);

    const valueA = resolveBoolean(entryA, 'A', fallbackA);
    if (typeof valueA !== 'boolean') {
      return valueA;
    }

    const valueB = resolveBoolean(entryB, 'B', fallbackB);
    if (typeof valueB !== 'boolean') {
      return valueB;
    }

    return valueA || valueB;
  }, [data.inputA, data.inputB, entryA, entryB]);

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
        <header className="text-sm font-semibold">OR</header>
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_A}
          label="A"
          type="boolean"
          value={data.inputA}
          entry={entryA}
          onChange={(value) => updateNodeData(id, { inputA: value })}
        />
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_B}
          label="B"
          type="boolean"
          value={data.inputB}
          entry={entryB}
          onChange={(value) => updateNodeData(id, { inputB: value })}
        />
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<OrNodeProperties> = {
  type: 'boolean-or',
  icon: Split,
  label: 'OR',
  properties,
  component: memo(OrNode),
  isResizable: true,
  isModifiable: true,
  category: 'Boolean',
};

export default definition;
