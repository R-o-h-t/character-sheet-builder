import { memo } from "react";
import { cn } from "@/lib/utils";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { CaseUpper } from "lucide-react";
import { Node, NodeDefinition } from "../../node-registry";
import { BaseFieldNode, NodeField } from "../base/base-field-node";

const properties = {
  value: {
    label: "Value",
    type: "string" as const,
    value: "New Text",
  },
  alignmentX: {
    label: "Horizontal Alignment",
    type: "select" as const,
    options: ["left", "center", "right"],
    value: "left",
  },
  alignmentY: {
    label: "Vertical Alignment",
    type: "select" as const,
    options: ["top", "center", "bottom"],
    value: "center",
  },
};

type TextNodeProperties = typeof properties;

const defaultSize = { width: 220, height: 100 };

function TextNode({ id, data, selected }: NodeProps<Node<TextNodeProperties>>) {
  const { updateNodeData } = useReactFlow();
  // Cast data to access our custom fields property
  const nodeData = data as typeof data & { fields?: NodeField[] };

  const processFields = (fields: NodeField[], entries: Record<string, any>) => {
    // Single-field node: prefer connected input, else fall back to property value
    const field = fields[0];
    const entry = field ? entries[field.handleId] : undefined;
    const connected = entry && entry.value !== undefined && entry.value !== null;
    return String(connected ? entry.value : data.value ?? '');
  };

  return (
    <BaseFieldNode
      id={id}
      data={nodeData}
      selected={selected}
      title="Text"
      icon={CaseUpper}
      allowAddField={false}
      allowRemoveField={false}
      processFields={processFields}
      customFieldRenderer={(field, _entry, onKeyChange) => (
        <div key={field.id} className={cn("relative flex items-center gap-2 pl-6 w-full",
          getAlignmentClass(data.alignmentX, 'X'),
        )}>
          {/* use hidden input for key to satisfy structure */}
          <input
            value={field.key}
            onChange={(e) => onKeyChange(e.target.value)}
            className="hidden"
          />
          <input
            type="string"
            value={String(data.value ?? '')}
            onChange={(e) => updateNodeData(id, { value: e.target.value })}
            className={cn("bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center w-full max-w-full",
              getTextAlignmentClass(data.alignmentX),
            )}
            readOnly={!data.isModifiable}
          />
        </div>
      )}
    />
  );
}


const getAlignmentClass = (alignment: string, axis: 'X' | 'Y') => {
  switch (alignment) {
    case 'left':
      return axis === 'X' ? 'justify-start' : 'items-start';
    case 'center':
      return axis === 'X' ? 'justify-center' : 'items-center';
    case 'right':
      return axis === 'X' ? 'justify-end' : 'items-end';
    case 'top':
      return axis === 'Y' ? 'items-start' : '';
    case 'bottom':
      return axis === 'Y' ? 'items-end' : '';
    default:
      return '';
  }
}

const getTextAlignmentClass = (alignment: string) => {
  switch (alignment) {
    case 'left':
      return 'text-left';
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return '';
  }
};


export const definition: NodeDefinition<TextNodeProperties> = {
  type: "string",
  icon: CaseUpper,
  label: 'Text Node',
  properties,
  component: memo(TextNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};


export default definition;
