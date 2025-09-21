import { Type } from 'lucide-react';
import { memo } from 'react';
import { NodeProps } from '@xyflow/react';

import { Node, NodeDefinition, NodeProperty } from '../../node-registry';
import { BaseFieldNode, NodeField } from '../base/base-field-node';

const defaultSize = { width: 220, height: 150 };

type TextConcatProperties = {
  separator: NodeProperty<string>;
};

function TextConcatNode({ id, data, selected }: NodeProps<Node<TextConcatProperties>>) {
  // Cast data to access our custom fields property
  const nodeData = data as typeof data & { fields?: NodeField[] };

  const processFields = (fields: NodeField[], entries: Record<string, any>) => {
    const separator = data.separator || '';
    const values: string[] = [];

    for (const field of fields) {
      const entry = entries[field.handleId];
      if (entry && entry.value !== undefined && entry.value !== null) {
        values.push(String(entry.value));
      }
    }

    return values.join(separator);
  };

  return (
    <BaseFieldNode
      id={id}
      data={nodeData}
      selected={selected}
      title="Text Concat"
      icon={Type}
      fieldKeyPlaceholder="text input"
      processFields={processFields}
    />
  );
}

export const definition: NodeDefinition<TextConcatProperties> = {
  type: 'text-concat',
  icon: Type,
  label: 'Text Concat',
  properties: {
    separator: {
      label: 'Separator',
      value: ' ',
      type: 'string',
    },
  },
  component: memo(TextConcatNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Text',
};

export default definition;
