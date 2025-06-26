// this nodes value sets the id of the target node


import { Button } from "@/components/ui/button";
import { NodeProps, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { Copy, Split } from "lucide-react";
import { memo, useMemo, useEffect } from 'react';
import { toast } from "sonner";
import { Node, NodeDefinition } from '../node-registry';
import { Resizable } from "./base/node-resizer";
import { select } from "slate";

const properties = {
  ref: {
    label: "ID",
    type: "id" as const,
    value: "",
  },
  select: {
    label: "Selected Option",
    type: "select" as const,
    value: "",
  },
  options: {
    label: "Options",
    type: "options" as const,
    value: [],
  }
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
    const options = sourceNodesData.map(node => node.data.ref).filter(value => value !== undefined);
    updateNodeData(id, { options });
    if (options.length > 0 && !data.select || options.indexOf(data.select) === -1) {
      // Set the first option as default if no select is set or if the current select is not in options
      updateNodeData(id, { select: options[0] });
    }
  }, [sourceNodesData, updateNodeData, id]);

  // set data.value to sourceNode.data.value
  useMemo(() => {
    const selectedNode = sourceNodesData.find(node => node.data.ref === data.select);
    updateNodeData(id, { value: selectedNode?.data.value });
  }, [sourceNodesData, data.select, updateNodeData, id]);


  const selectedNodeId = useMemo(() => {
    const selectedNode = sourceNodesData.find(node => node.data.ref === data.select);
    return selectedNode ? selectedNode.id : null;
  }, [sourceNodesData, data.select]);

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
