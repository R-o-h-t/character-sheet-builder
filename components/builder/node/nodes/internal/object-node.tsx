import { PlusCircle } from 'lucide-react';
import { memo } from 'react';
import { NodeProps } from '@xyflow/react';

import { Node, NodeDefinition, NodeProperties } from '../../../node-registry';
import { BaseFieldNode, NodeField } from '../../base/base-field-node';

const defaultSize = { width: 260, height: 180 };

type ObjectNodeProperties = Record<string, never>;

function ObjectNode({ id, data, selected }: NodeProps<Node<ObjectNodeProperties>>) {
  // Cast data to access our custom fields property
  const nodeData = data as typeof data & { fields?: NodeField[] };

  return (
    <BaseFieldNode
      id={id}
      data={nodeData}
      selected={selected}
      title="Object"
      icon={PlusCircle}
    />
  );
}

export const definition: NodeDefinition<ObjectNodeProperties> = {
  type: 'internal-object',
  icon: PlusCircle,
  label: 'Object',
  properties: {},
  component: memo(ObjectNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Internal',
};

export default definition;
