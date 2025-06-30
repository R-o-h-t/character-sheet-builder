import { NodeProps, useReactFlow } from "@xyflow/react";
import assert from "assert";
import { Radical } from "lucide-react";
import * as math from 'mathjs';
import { memo, useMemo } from "react";
import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from "../../base/node-resizer";

const formulaNodeData = {
  formula: {
    label: "Formula",
    type: "formula" as const,
    value: ""
  },
};



type FormulaNodeProperties = typeof formulaNodeData

const defaultSize = { width: 160, height: 50 };

function FormulaNode({ id, data, selected }: NodeProps<Node<FormulaNodeProperties, number | undefined>>) {

  const { updateNodeData } = useReactFlow<Node>();

  const result = useMemo(() => {
    return getResult(data.formula, data.entries, data.ref);
  }, [data.formula, data.ref, data.entries]);

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
      }} >
      {/* display only the result */}
      <div className="w-full h-full p-4 flex items-center justify-center">
        <span className="text-lg font-mono">
          {result !== undefined ? result.toFixed(2) : 'N/A'}
        </span>
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<FormulaNodeProperties> = {
  type: 'formula',
  icon: Radical,
  label: 'Formula Node',
  properties: formulaNodeData,
  component: memo(FormulaNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};


export default definition;


export const getResult = (formula: string, allNodes: Record<string, { value: any }>, selfRef?: string): number | undefined => {
  try {

    // Replace all node references (UPPER_CASE with optional dot notation)
    formula = formula.replace(/([A-Z_]+(?:\.[A-Z_]+)*)/g, (match) => {
      const parts = match.split('.');
      const nodeRef = parts[0];

      if (selfRef) {
        assert(nodeRef !== selfRef, "Cannot reference self in formula");
      }

      const node = allNodes[nodeRef];
      if (node) {
        // Start with the node's value
        let value = node.value;

        // Navigate through the property chain
        for (let i = 1; i < parts.length; i++) {
          const property = parts[i];
          if (value && typeof value === 'object' && property in value) {
            value = value[property];
          } else {
            console.warn(`Property "${property}" not found in node "${nodeRef}" for formula "${formula}"`);
            return match; // Return the original match if property not found
          }
        }

        return value;
      }
      else {
        console.warn(`Node reference "${nodeRef}" not found in formula "${formula}"`);
      }
      return match;
    });

    // Evaluate the formula using mathjs
    const result = math.evaluate(formula);

    if (typeof result === 'number') {
      return result;
    }
  }
  catch (error) {
    return undefined;
  }
}
