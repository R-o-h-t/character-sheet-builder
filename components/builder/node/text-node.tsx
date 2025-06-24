import { memo } from "react";
import { Resizable } from "./base/node-resizer";
import { cn } from "@/lib/utils";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { Node, NodeDefinition, NodeProperties } from '../node-registry';
import { CaseUpper } from "lucide-react";


const properties = {
  text: {
    label: "Text",
    type: "text" as const,
    value: "New Text",
  },
  alignmentX: {
    label: "Horizontal Alignment",
    type: "select" as const,
    options: ["left", "center", "right"],
    value: "center",
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
      }} >
      <div className={
        cn("w-full h-full p-4 overflow-hidden",
          data.alignmentX === "left" ? "text-left" :
            data.alignmentX === "center" ? "text-center" :
              data.alignmentX === "right" ? "text-right" : "",
          data.alignmentY === "top" ? "justify-start" :
            data.alignmentY === "center" ? "justify-center" :
              data.alignmentY === "bottom" ? "justify-end" : "",
        )}>
        <div className="text-sm text-gray-700">
          {data.isModifiable ? (
            <input
              type="text"
              value={data.text}
              onChange={(e) => updateNodeData(id, { text: e.target.value })}
              className="w-full bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
            />
          ) : (
            data.text
          )}
        </div>
      </div>
    </Resizable>
  );
}


export const definition: NodeDefinition<TextNodeProperties> = {
  type: 'text',
  icon: CaseUpper,
  label: 'Text Node',
  properties,
  component: memo(TextNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};
