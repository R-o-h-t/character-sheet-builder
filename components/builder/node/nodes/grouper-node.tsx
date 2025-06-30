import { Button } from "@/components/ui/button";
import { NodeProps, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { Copy, Group } from "lucide-react";
import { memo, useMemo } from 'react';
import { toast } from "sonner";
import { Node, NodeDefinition } from '../../node-registry';
import { Resizable } from "../base/node-resizer";

const properties = {
  flatten: {
    label: "Flatten Values",
    type: "boolean" as const,
    value: false,
  },
  ref: {
    label: "Node ID",
    type: "id" as const,
    value: "",
  },
};

type GrouperNodeProperties = typeof properties;

const defaultSize = { width: 180, height: 60 };

function GrouperNode({ id, data, selected }: NodeProps<Node<GrouperNodeProperties>>) {

  const { updateNodeData } = useReactFlow<Node>();


  // Group all source node values by their ref (ID)
  useMemo(() => {
    const groupedValues: Record<string, any> = {};

    Object.entries(data.entries).forEach(([key, node]) => {
      const nodeValue = node.value;

      if (data.flatten && typeof nodeValue === 'object' && nodeValue !== null && !Array.isArray(nodeValue)) {
        // Flatten: merge child properties directly into groupedValues
        Object.assign(groupedValues, nodeValue);
      } else {
        // Normal: use node ref as key
        groupedValues[key] = nodeValue;
      }
    });

    updateNodeData(id, { value: groupedValues });
  }, [data.entries, data.flatten, id, updateNodeData]);


  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: false,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
      }} >
      <div className="w-full h-full p-4 flex items-center space-x-2 flex-nowrap overflow-hidden">
        <Group className="h-4 w-4" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <span className="text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap">
            {data.ref ? data.ref : "No ID set"}
          </span>
        </div>
        <Button
          size="icon"
          className="ml-auto"
          onClick={() => {
            navigator.clipboard.writeText(data.ref);
            toast.success("ID copied to clipboard");
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </Resizable>
  );
}

const definition: NodeDefinition<GrouperNodeProperties> = {
  type: 'grouper-node',
  icon: Group,
  label: 'Grouper Node',
  properties,
  component: memo(GrouperNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};

export default definition;
