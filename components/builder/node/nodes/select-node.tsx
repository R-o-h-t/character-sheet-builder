// this nodes value sets the id of the target node


import { Button } from "@/components/ui/button";
import { NodeProps, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { Copy, Split } from "lucide-react";
import { memo, useMemo, useEffect } from 'react';
import { toast } from "sonner";
import { Node, NodeDefinition } from '../../node-registry';
import { Resizable } from "../base/node-resizer";
import { select } from "slate";

const properties = {
  select: {
    label: "Selected Option",
    type: "select" as const,
    value: "",
  },
  options: {
    label: "Options",
    type: "options" as const,
    value: [],
  },
  flatten: {
    label: "Flatten Options",
    type: "boolean" as const,
    value: false,
  },
  ref: {
    label: "Node ID",
    type: "id" as const,
    value: "",
  },

};

type SelectNodeProperties = typeof properties;

const defaultSize = { width: 160, height: 50 };

function SelectNode({ id, data, selected }: NodeProps<Node<SelectNodeProperties>>) {

  const { updateNodeData } = useReactFlow<Node>();



  useMemo(() => {
    let options: string[];

    if (data.flatten) {
      options = [];
      Object.entries(data.entries).forEach(([key, node]) => {
        if (node.value && typeof node.value === 'object' && !Array.isArray(node.value)) {
          // Add keys from nested object
          options.push(...Object.keys(node.value));
        } else {
          options.push(key);
        }
      });
    } else {
      options = Object.entries(data.entries).map(([key, node]) => key).filter(value => value !== undefined);
    }

    updateNodeData(id, { options });
    if (options.length > 0 && (!data.select || options.indexOf(data.select) === -1)) {
      // Set the first option as default if no select is set or if the current select is not in options
      updateNodeData(id, { select: options[0] });
    }
  }, [updateNodeData, id, data.flatten, data.entries, data.select]);

  // set data.value to sourceNode.data.value or nested value
  useMemo(() => {
    let selectedValue;

    if (data.flatten) {
      // Find the value from nested objects
      for (const [key, node] of Object.entries(data.entries)) {
        if (node.value && typeof node.value === 'object' && !Array.isArray(node.value)) {
          if (data.select in node.value) {
            selectedValue = node.value[data.select];
            break;
          }
        } else if (key === data.select) {
          selectedValue = node.value;
          break;
        }
      }
    } else {
      // Existing behavior - find by ref
      const selectedNode = Object.entries(data.entries).find(([key, node]) => key === data.select);
      selectedValue = selectedNode?.[1].value;
    }

    updateNodeData(id, { value: selectedValue });
  }, [updateNodeData, id, data.select, data.entries, data.flatten]);

  const selectedNodeId = useMemo(() => {
    if (data.flatten) {
      // Find the node that contains the selected key
      const selectedNode = Object.entries(data.entries).find(([key, node]) => {
        if (node.value && typeof node.value === 'object' && !Array.isArray(node.value)) {
          return data.select in node.value;
        }
        return key === data.select;
      });
      return selectedNode ? selectedNode[0] : null;
    } else {
      // Existing behavior
      const selectedNode = Object.entries(data.entries).find(([key, node]) => key === data.select);
      return selectedNode ? selectedNode[0] : null;
    }
  }, [data.entries, data.select, data.flatten]);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: false,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
        edges: {
          highlightedConnectionsTo: Object.keys(data.entries).filter(nodeId => nodeId !== selectedNodeId),
          highlightedColor: '#ff007130',
        },
      }} >
      <div className="w-full h-full p-4 flex items-center space-x-2 flex-nowrap overflow-hidden">
        <Split className="h-4 w-4" />
        <span className="text-sm text-gray-500 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {data.ref ? data.ref : "No ID set"}
        </span>
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


export const definition: NodeDefinition<SelectNodeProperties> = {
  type: 'select-node',
  icon: Split,
  label: 'Select Node',
  properties,
  component: memo(SelectNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};

export default definition;
