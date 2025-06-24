import { memo } from "react";
import { Resizable } from "./base/node-resizer";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Hash, Minus, Plus } from "lucide-react";
import { Node, NodeDefinition, NodeProperties, NodeProperty } from "../node-registry";

const numberNodeData = {
  value: {
    label: "Value",
    type: "number" as const,
    value: 0,
  },
  min: {
    label: "Minimum Value",
    type: "number" as const,
    value: 0,
  },
  max: {
    label: "Maximum Value",
    type: "number" as const,
    value: 20,
  },
};

type NumberNodeProperties = typeof numberNodeData;

const defaultSize = { width: 160, height: 50 };

function NumberNode({ id, data, selected }: NodeProps<Node<NumberNodeProperties>>) {
  const { updateNodeData } = useReactFlow();

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: true,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
      }} >
      <div className="w-full h-full p-4 flex items-center justify-between overflow-hidden flex-nowrap number-sm number-gray-700">
        {data.isModifiable ? (
          <>
            <Button
              className="w-8 h-8 flex items-center justify-center"
              disabled={data.value <= data.min}
              onClick={() => {
                updateNodeData(id, { value: Math.max(data.value - 1, data.min) });
              }}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <input
              type="text"
              value={data.value}
              onChange={(e) => {
                updateNodeData(id, { value: Number(e.target.value) });
              }}
              className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center max-w-[50px] mx-2"
            />

            <Button
              className="w-8 h-8 flex items-center justify-center"
              disabled={data.value >= data.max}
              onClick={() => {
                updateNodeData(id, { value: Math.min(data.value + 1, data.max) });
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <span>{data.value}</span>
        )}
      </div>
    </Resizable>
  );
}


export const definition: NodeDefinition<NumberNodeProperties> = {
  type: 'number',
  icon: Hash,
  label: 'Number Node',
  properties: numberNodeData,
  component: memo(NumberNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};
