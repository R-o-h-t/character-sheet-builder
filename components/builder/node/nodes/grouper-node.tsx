import { Button } from "@/components/ui/button";
import { NodeProps, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { Copy, Group } from "lucide-react";
import { memo, useMemo } from 'react';
import { toast } from "sonner";
import { Node, NodeDefinition } from '../../node-registry';
import { Resizable } from "../base/node-resizer";

const properties = {
};

type GrouperNodeProperties = typeof properties;

const defaultSize = { width: 180, height: 60 };

function GrouperNode({ id, data, selected }: NodeProps<Node<GrouperNodeProperties>>) {

  const { updateNodeData, getNode } = useReactFlow<Node>();

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

  // Group all source node values by their ref (ID)
  useMemo(() => {
    const groupedValues: Record<string, any> = {};

    sourceNodesData.forEach(node => {
      if (node.data.ref) {
        groupedValues[node.data.ref] = node.data.value;
      }
    });

    updateNodeData(id, { value: groupedValues });
  }, [sourceNodesData, updateNodeData, id]);

  const connectedNodeCount = sourceNodeIds.length;
  const valueCount = Object.keys(data.value || {}).length;

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
          <span className="text-xs text-gray-400">
            {connectedNodeCount} nodes, {valueCount} values
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
