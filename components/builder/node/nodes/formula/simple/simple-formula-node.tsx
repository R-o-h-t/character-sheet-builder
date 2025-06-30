import { NodeProps, useReactFlow } from "@xyflow/react";
import { Calculator, CircleDivide, CircleMinus, CirclePlus, CircleX, Radical } from "lucide-react";
import * as math from "mathjs";
import { memo, useMemo } from "react";
import { Node, NodeDefinition } from '../../../../node-registry';
import { Resizable } from "../../../base/node-resizer";

const SimpleFormulaNodeData = {
  operator: {
    type: 'select' as const,
    label: 'Operator',
    value: '+',
    options: ['+', '-', '*', '/'],
  },

};

type SimpleFormulaNodeProperties = typeof SimpleFormulaNodeData

const defaultSize = { width: 80, height: 50 };

function SimpleFormulaNode({ id, data, selected }: NodeProps<Node<SimpleFormulaNodeProperties, number | undefined>>) {

  const { updateNodeData } = useReactFlow<Node>();

  const result = useMemo(() => {
    const entries = Object.values(data.entries).sort((a, b) => {
      if (a.handle && b.handle) {
        return a.handle.localeCompare(b.handle);
      }
      return 0;
    })
    // expect a 2 element array of entries
    if (entries.length !== 2) {
      return undefined;
    }

    // check that both entries are numbers
    if (typeof entries[0].value !== 'number' || typeof entries[1].value !== 'number') {
      return undefined;
    }
    return math.evaluate(`(${entries[0].value}) ${data.operator} (${entries[1].value})`);
  }, [data.ref, data.operator, data.entries]);

  // Update node data with computed result
  useMemo(() => {
    updateNodeData(id, { value: result });
  }, [result, id, updateNodeData]);


  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: true,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
        handles: {
          target: {
            maxConnections: 2,
            separateHandles: true,
          },
        },
      }} >
      <div className="w-full h-full flex items-center justify-between px-2">
        <OperatorIcon operator={data.operator} />
        <span className="text-sm font-medium">
          {result !== undefined ? result.toFixed(2) : 'N/A'}
        </span>
      </div>
    </Resizable>
  );
}

const OperatorIcon = ({ operator }: { operator: string }) => {
  switch (operator) {
    case '+':
      return <CirclePlus className="w-4 h-4" />;
    case '-':
      return <CircleMinus className="w-4 h-4" />;
    case '*':
      return <CircleX className="w-4 h-4" />;
    case '/':
      return <CircleDivide className="w-4 h-4" />;
    default:
      return <Radical className="w-4 h-4" />;
  }
};

export const definition: NodeDefinition<SimpleFormulaNodeProperties> = {
  type: 'SimpleFormula',
  icon: Calculator,
  label: 'SimpleFormula Node',
  properties: SimpleFormulaNodeData,
  component: memo(SimpleFormulaNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};

export default definition;
