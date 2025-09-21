import { memo, useEffect, useMemo } from 'react';
import { Asterisk } from 'lucide-react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { ConnectionField } from '../../base/connection-field';
import { getEntryByHandle, resolveNumber, toNumber } from '../../utils/value';

const properties = {
  operandA: {
    label: 'Operand A',
    type: 'number' as const,
    value: '1',
  },
  operandB: {
    label: 'Operand B',
    type: 'number' as const,
    value: '1',
  },
};

type MultiplyNodeProperties = typeof properties;

const HANDLE_A = 'operandA';
const HANDLE_B = 'operandB';

function MultiplyNode({ id, data, selected }: NodeProps<Node<MultiplyNodeProperties, number>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const inputA = useMemo(() => getEntryByHandle(data.entries, HANDLE_A), [data.entries]);
  const inputB = useMemo(() => getEntryByHandle(data.entries, HANDLE_B), [data.entries]);

  const output = useMemo(() => {
    const fallbackA = toNumber(data.operandA);
    const fallbackB = toNumber(data.operandB);

    const valueA = resolveNumber(inputA, 'A', fallbackA);
    if (typeof valueA !== 'number') {
      return valueA;
    }

    const valueB = resolveNumber(inputB, 'B', fallbackB);
    if (typeof valueB !== 'number') {
      return valueB;
    }

    return valueA * valueB;
  }, [data.operandA, data.operandB, inputA, inputB]);

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
        <header className="text-sm font-semibold">Multiply</header>
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_A}
          label="A"
          type="number"
          value={data.operandA}
          entry={inputA}
          onChange={(value) => updateNodeData(id, { operandA: value })}
        />
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_B}
          label="B"
          type="number"
          value={data.operandB}
          entry={inputB}
          onChange={(value) => updateNodeData(id, { operandB: value })}
        />
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<MultiplyNodeProperties> = {
  type: 'number-multiply',
  icon: Asterisk,
  label: 'Multiply',
  properties,
  component: memo(MultiplyNode),
  isResizable: true,
  isModifiable: true,
  category: 'Number',
};

export default definition;
