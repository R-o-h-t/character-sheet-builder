import { NodeProps, useNodeConnections, useNodes, useNodesData, useReactFlow } from "@xyflow/react";
import { Radical } from "lucide-react";
import * as math from 'mathjs';
import { memo, useMemo } from "react";
import { Node, NodeDefinition, nodeTypes } from '../../node-registry';
import { Resizable } from "../base/node-resizer";
import assert from "assert";

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

  const { updateNodeData, getNode } = useReactFlow<Node>();

  const connections = useNodeConnections({
    handleType: 'target',
  });

  const sourceNodes = useMemo(() => {
    return connections
      .map(connection => getNode(connection.source))
      .filter((node): node is Node => node !== undefined);
  }, [connections, getNode]);

  // Use useNodesData to only track specific source nodes
  const sourceNodeIds = useMemo(() =>
    sourceNodes.map(node => node.id),
    [sourceNodes]
  );

  const sourceNodesData = useNodesData<Node>(sourceNodeIds);

  const result = useMemo(() => {
    return getResult(data.formula, sourceNodesData.map(({ data }) => data), data.ref);
  }, [data.formula, data.ref, sourceNodesData, sourceNodeIds, getNode]);

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
          {data.value !== undefined ? data.value.toString() : "_"}
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



export const getResult = (formula: string, allNodes: Node["data"][], selfRef?: string): number | undefined => {
  try {

    // Replace all node references (UPPER_CASE)
    formula = formula.replace(/([A-Z_]+)/g, (match) => {
      if (selfRef) {
        assert(match !== selfRef, "Cannot reference self in formula");
      }
      const node = allNodes.find((n) => n.ref === match);
      if (node) {
        return node.value;
      }
      else {
        console.warn(`Node reference "${match}" not found in formula "${formula}"`);
      }
      return match;
    });

    // Evaluate the formula using mathjs
    const result = math.evaluate(formula);
    console.log(`Evaluating formula: ${formula} = ${result}`);

    if (typeof result === 'number') {
      return result;
    }
  }
  catch (error) {
    console.error(`Error evaluating formula "${formula}":`, error);
    return undefined;
  }
}
