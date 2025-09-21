import { memo, useEffect, useMemo } from 'react';
import { Minus } from 'lucide-react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { ConnectionInput, ConnectionOutput } from '../../base/connection-io';
import {
  getInputConnection,
  resolveNumberInput,
  isErrorValue
} from '../../utils/connection-system';

// Remove properties - data comes only from connections
const properties = {};

type MinusNodeProperties = typeof properties;

const HANDLE_A = 'input_a';
const HANDLE_B = 'input_b';
const HANDLE_OUTPUT = 'result';

function MinusNode({ id, data, selected }: NodeProps<Node<MinusNodeProperties, number | { error: string }>>) {
  const { updateNodeData } = useReactFlow<Node>();

  // Get input connections
  const inputA = useMemo(() => getInputConnection(data, HANDLE_A), [data]);
  const inputB = useMemo(() => getInputConnection(data, HANDLE_B), [data]);

  // Fallback values for unconnected inputs
  const fallbackA = (data as any)[HANDLE_A] ?? 0;
  const fallbackB = (data as any)[HANDLE_B] ?? 0;

  const result = useMemo(() => {
    // Resolve inputs with fallback values for unconnected inputs
    const valueA = resolveNumberInput(inputA, fallbackA);
    if (isErrorValue(valueA)) {
      return valueA;
    }

    const valueB = resolveNumberInput(inputB, fallbackB);
    if (isErrorValue(valueB)) {
      return valueB;
    }

    return valueA - valueB;
  }, [inputA, inputB, fallbackA, fallbackB]);

  useEffect(() => {
    updateNodeData(id, { value: result });
  }, [id, result, updateNodeData]);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: null, // Handled by ConnectionInput components
          source: null, // Handled by ConnectionOutput components
        },
      }}
    >
      <div className="flex flex-col gap-3 p-3 text-xs min-w-[200px]">
        <header className="text-sm font-semibold">Minus</header>

        {/* Input connections with fallback input fields */}
        <ConnectionInput
          nodeId={id}
          handleId={HANDLE_A}
          label="A"
          type="number"
          connection={inputA}
          fallbackValue={fallbackA}
          onChange={(value) => {
            // Update the fallback value when user types in the input field
            updateNodeData(id, { [HANDLE_A]: value });
          }}
        />

        <ConnectionInput
          nodeId={id}
          handleId={HANDLE_B}
          label="B"
          type="number"
          connection={inputB}
          fallbackValue={fallbackB}
          onChange={(value) => {
            // Update the fallback value when user types in the input field
            updateNodeData(id, { [HANDLE_B]: value });
          }}
        />

        {/* Output connection */}
        <div className="border-t pt-2 mt-1">
          <ConnectionOutput
            nodeId={id}
            handleId={HANDLE_OUTPUT}
            label="Result"
            value={result}
          />
        </div>
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<MinusNodeProperties, number | { error: string }> = {
  type: 'number-minus',
  icon: Minus,
  label: 'Minus',
  properties,
  component: memo(MinusNode),
  isResizable: true,
  isModifiable: true,
  category: 'Number',
};
