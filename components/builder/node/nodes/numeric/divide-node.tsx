import { memo, useEffect, useMemo } from 'react';
import { Slash } from 'lucide-react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { ConnectionField } from '../../base/connection-field';
import { createError, getEntryByHandle, resolveNumber, toNumber } from '../../utils/value';

const properties = {
  numerator: {
    label: 'Numerator',
    type: 'number' as const,
    value: '0',
  },
  denominator: {
    label: 'Denominator',
    type: 'number' as const,
    value: '1',
  },
};

type DivideNodeProperties = typeof properties;

const HANDLE_NUMERATOR = 'numerator';
const HANDLE_DENOMINATOR = 'denominator';

function DivideNode({ id, data, selected }: NodeProps<Node<DivideNodeProperties, number>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const numeratorEntry = useMemo(() => getEntryByHandle(data.entries, HANDLE_NUMERATOR), [data.entries]);
  const denominatorEntry = useMemo(() => getEntryByHandle(data.entries, HANDLE_DENOMINATOR), [data.entries]);

  const output = useMemo(() => {
    const fallbackNumerator = toNumber(data.numerator);
    const fallbackDenominator = toNumber(data.denominator);

    const numerator = resolveNumber(numeratorEntry, 'Numerator', fallbackNumerator);
    if (typeof numerator !== 'number') {
      return numerator;
    }

    const denominator = resolveNumber(denominatorEntry, 'Denominator', fallbackDenominator);
    if (typeof denominator !== 'number') {
      return denominator;
    }

    if (denominator === 0) {
      return createError('Division by zero');
    }

    return numerator / denominator;
  }, [data.denominator, data.numerator, denominatorEntry, numeratorEntry]);

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
        <header className="text-sm font-semibold">Divide</header>
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_NUMERATOR}
          label="Numerator"
          type="number"
          value={data.numerator}
          entry={numeratorEntry}
          onChange={(value) => updateNodeData(id, { numerator: value })}
        />
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_DENOMINATOR}
          label="Denominator"
          type="number"
          value={data.denominator}
          entry={denominatorEntry}
          onChange={(value) => updateNodeData(id, { denominator: value })}
        />
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<DivideNodeProperties> = {
  type: 'number-divide',
  icon: Slash,
  label: 'Divide',
  properties,
  component: memo(DivideNode),
  isResizable: true,
  isModifiable: true,
  category: 'Number',
};

export default definition;
