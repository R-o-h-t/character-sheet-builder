import { memo } from "react";
import { cn } from "@/lib/utils";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { CaseUpper } from "lucide-react";
import { Resizable } from "../base/node-resizer";
import { Node, NodeDefinition } from "../../node-registry";

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

const defaultSize = { width: 160, height: 50 };

function TextNode({ id, data, selected }: NodeProps<Node<TextNodeProperties>>) {
  const { updateNodeData } = useReactFlow();

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: data.isResizable !== false,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
        handles: {
          target: null,
        },
      }} >
      <div className={
        cn("w-full h-full p-4 flex overflow-hidden",
          getAlignmentClass(data.alignmentX, 'X'),
        )}>
        {data.isModifiable ? (
          <input
            type="string"
            value={data.value}
            onChange={(e) => updateNodeData(id, { value: e.target.value })}
            className={cn("bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center w-full max-w-full",
              getTextAlignmentClass(data.alignmentX),
            )}
          />
        ) : (
          data.value
        )}
      </div>
    </Resizable>
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
