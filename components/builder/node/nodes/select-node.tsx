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
  explode: {
    label: "Explode Options",
    type: "boolean" as const,
    value: false,
  },
};

type SelectNodeProperties = typeof properties;

const defaultSize = { width: 160, height: 50 };

function SelectNode({ id, data, selected }: NodeProps<Node<SelectNodeProperties>>) {

  const { updateNodeData, getNode, getEdges, setEdges } = useReactFlow<Node>();

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

  useMemo(() => {
    // Update the options based on source nodes
    let options: string[];

    if (data.explode) {
      // Explode nested values
      options = [];
      sourceNodesData.forEach(node => {
        if (node.data.value && typeof node.data.value === 'object' && !Array.isArray(node.data.value)) {
          // Add keys from nested object with parent ref prefix
          const parentRef = node.data.ref || node.id;
          options.push(...Object.keys(node.data.value).map(key => `${parentRef}.${key}`));
        } else {
          // Add the node ref if value is not an object
          if (node.data.ref) {
            options.push(node.data.ref);
          }
        }
      });
    } else {
      // Use node refs as options (existing behavior)
      options = sourceNodesData.map(node => node.data.ref).filter(value => value !== undefined);
    }

    updateNodeData(id, { options });
    if (options.length > 0 && (!data.select || options.indexOf(data.select) === -1)) {
      // Set the first option as default if no select is set or if the current select is not in options
      updateNodeData(id, { select: options[0] });
    }
  }, [sourceNodesData, updateNodeData, id, data.explode]);

  // set data.value to sourceNode.data.value or nested value
  useMemo(() => {
    let selectedValue;

    if (data.explode) {
      // Find the value from nested objects using group.subnode format
      for (const node of sourceNodesData) {
        if (node.data.value && typeof node.data.value === 'object' && !Array.isArray(node.data.value)) {
          const parentRef = node.data.ref || node.id;
          // Check if the selected option matches this node's format
          if (data.select.startsWith(`${parentRef}.`)) {
            const subKey = data.select.substring(`${parentRef}.`.length);
            if (subKey in node.data.value) {
              selectedValue = node.data.value[subKey];
              break;
            }
          }
        } else if (node.data.ref === data.select) {
          selectedValue = node.data.value;
          break;
        }
      }
    } else {
      // Existing behavior - find by ref
      const selectedNode = sourceNodesData.find(node => node.data.ref === data.select);
      selectedValue = selectedNode?.data.value;
    }

    updateNodeData(id, { value: selectedValue });
  }, [sourceNodesData, data.select, updateNodeData, id, data.explode]);

  const selectedNodeId = useMemo(() => {
    if (data.explode) {
      // Find the node that contains the selected key using group.subnode format
      const selectedNode = sourceNodesData.find(node => {
        if (node.data.value && typeof node.data.value === 'object' && !Array.isArray(node.data.value)) {
          const parentRef = node.data.ref || node.id;
          if (data.select.startsWith(`${parentRef}.`)) {
            const subKey = data.select.substring(`${parentRef}.`.length);
            return subKey in node.data.value;
          }
        }
        return node.data.ref === data.select;
      });
      return selectedNode ? selectedNode.id : null;
    } else {
      // Existing behavior
      const selectedNode = sourceNodesData.find(node => node.data.ref === data.select);
      return selectedNode ? selectedNode.id : null;
    }
  }, [sourceNodesData, data.select, data.explode]);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: false,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
        edges: {
          highlightedConnectionsTo: sourceNodeIds.filter(nodeId => nodeId !== selectedNodeId),
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
