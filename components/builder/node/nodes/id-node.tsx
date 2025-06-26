// this nodes value sets the id of the target node


import { Button } from "@/components/ui/button";
import { NodeProps, useNodeConnections, useNodesData, useReactFlow } from "@xyflow/react";
import { ArrowDownToDot, Copy } from "lucide-react";
import { memo, useMemo } from "react";
import { toast } from "sonner";
import { Node, NodeDefinition } from '../../node-registry';
import { Resizable } from "../base/node-resizer";

const properties = {

};

type RefNodeProperties = typeof properties;

const defaultSize = { width: 160, height: 50 };

function RefNode({ id, data, selected }: NodeProps<Node<RefNodeProperties>>) {

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

  // set data.value to sourceNode.data.value
  useMemo(() => {
    updateNodeData(id, { value: sourceNodesData[0]?.data.value });
  }, [sourceNodesData]);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: false,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
        handles: {
          // source: null,
          target: {
            // position: Position.Bottom,
            maxConnections: 1,
          },
        }
      }} >
      <div className="w-full h-full p-4 flex items-center space-x-2 flex-nowrap overflow-hidden">
        <ArrowDownToDot className="h-4 w-4" />
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
    </Resizable >
  );
}


export const definition: NodeDefinition<RefNodeProperties> = {
  type: 'ref-node',
  icon: ArrowDownToDot,
  label: 'Reference Node',
  properties,
  component: memo(RefNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};

export default definition;
