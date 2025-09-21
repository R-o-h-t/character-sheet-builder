import { NodeProps, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';
import { memo, useEffect } from 'react';
import { nanoid } from 'nanoid';

import { Node, NodeDefinition } from '../../../node-registry';
import { CompositeIO } from '@/lib/composite/graph';

const defaultSize = { width: 200, height: 120 };

// Define the internal structure of a MULTIPLY composite node
const multiplyCompositeTemplate = {
  inputs: [
    {
      id: 'input_a',
      label: 'A',
      handleId: 'input_a',
    },
    {
      id: 'input_b',
      label: 'B',
      handleId: 'input_b',
    },
  ] as CompositeIO[],
  outputs: [
    {
      id: 'result',
      label: 'Product',
      handleId: 'result',
      source: {
        nodeId: 'formula_node',
        handleId: 'result',
      },
    },
  ] as CompositeIO[],
  internalNodes: [
    {
      id: 'input_a_node',
      type: 'internal-input',
      position: { x: 50, y: 50 },
      data: {
        handleId: 'input_a',
        label: 'A',
        ref: nanoid(),
        entries: {},
      },
    },
    {
      id: 'input_b_node',
      type: 'internal-input',
      position: { x: 50, y: 120 },
      data: {
        handleId: 'input_b',
        label: 'B',
        ref: nanoid(),
        entries: {},
      },
    },
    {
      id: 'formula_node',
      type: 'brick-formula',
      position: { x: 200, y: 85 },
      data: {
        expression: 'A * B',
        ref: nanoid(),
        entries: {},
      },
    },
    {
      id: 'output_node',
      type: 'internal-output',
      position: { x: 350, y: 85 },
      data: {
        handleId: 'result',
        label: 'Product',
        ref: nanoid(),
        entries: {},
      },
    },
  ],
  internalEdges: [
    {
      id: 'edge_a',
      source: 'input_a_node',
      target: 'formula_node',
      sourceHandle: 'source',
      targetHandle: 'A',
    },
    {
      id: 'edge_b',
      source: 'input_b_node',
      target: 'formula_node',
      sourceHandle: 'source',
      targetHandle: 'B',
    },
    {
      id: 'edge_result',
      source: 'formula_node',
      target: 'output_node',
      sourceHandle: 'source',
      targetHandle: 'target',
    },
  ],
};

type MultiplyCompositeProperties = Record<string, never>;

function MultiplyComposite({ id, data, selected }: NodeProps<Node<MultiplyCompositeProperties>>) {
  const { updateNodeData } = useReactFlow<Node>();

  // Initialize the composite template on first load
  useEffect(() => {
    if (!data.inputs || !data.outputs) {
      updateNodeData(id, {
        name: 'Multiply',
        inputs: multiplyCompositeTemplate.inputs,
        outputs: multiplyCompositeTemplate.outputs,
        // Store the internal graph structure for when the composite is opened
        internalNodes: multiplyCompositeTemplate.internalNodes,
        internalEdges: multiplyCompositeTemplate.internalEdges,
      });
    }
  }, [id, data.inputs, data.outputs, updateNodeData]);

  // Import the base composite node and render it
  const CompositeNode = require('../composite-node').default.component;

  return (
    <CompositeNode
      id={id}
      data={data}
      selected={selected}
    />
  );
}

export const definition: NodeDefinition<MultiplyCompositeProperties> = {
  type: 'composite-multiply',
  icon: X,
  label: 'Multiply',
  properties: {},
  component: memo(MultiplyComposite),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Arithmetic',
};

export default definition;
