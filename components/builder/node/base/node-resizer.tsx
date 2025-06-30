import { Button } from '@/components/ui/button';
import { Connection, Edge, Handle, NodeResizer, NodeToolbar, Position, useNodeConnections, useNodesData, useOnSelectionChange, useReactFlow } from '@xyflow/react';
import { Trash } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Node } from '../../node-registry';


export function Resizable({
  id,
  children,
  options,
}: {
  id: string;
  children: React.ReactNode;
  selected: boolean;
  options?: {
    minWidth?: number;
    minHeight?: number;
    isResizable?: boolean;
    handles?: {
      target?: {
        position?: Position;
        separateHandles?: boolean;
        maxConnections?: number;
        onConnect?: (connections: Connection[]) => void;
        onDisconnect?: (connections: Connection[]) => void;
      } | null;
      source?: {
        position?: Position;
        separateHandles?: boolean;
        maxConnections?: number;
        onConnect?: (connections: Connection[]) => void;
        onDisconnect?: (connections: Connection[]) => void;
      } | null;
    }
    edges?: {
      highlightedConnectionsTo?: string[];
      highlightedColor?: string;
      animateHighlight?: boolean;
      color?: string;
    };
  };
}) {

  // implement delete current node logic here
  const { deleteElements, addNodes, addEdges, getEdges, setEdges, getNodes, updateNodeData } = useReactFlow<Node>();

  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const onSelectionChange = useCallback((changes: { nodes: Node[]; edges: Edge[] }) => {
    console.log('onSelectionChange', changes);
    const selectedNodeIds = changes.nodes.map(node => node.id);
    setSelectedNodes(selectedNodeIds);
  }, []);

  useOnSelectionChange<Node>({ onChange: onSelectionChange });


  const selected = useMemo(() => {
    return selectedNodes.includes(id);
  }, [id, selectedNodes]);

  const handleDelete = async () => {
    if (isWaitingForConfirmation) {
      return onDeleteConfirmed();
    }

    if (!id) {
      console.error('Node ID is required for deletion');
      return;
    }

    setIsWaitingForConfirmation(true);
    toast('Delete ? ', {
      action: {
        label: 'Confirm',
        onClick: () => {
          onDeleteConfirmed();
        },
      },
      duration: 2000,
      onDismiss: () => {
        setIsWaitingForConfirmation(false);
      },
      onAutoClose: () => {
        setIsWaitingForConfirmation(false);
      }
    });
  }

  const onDeleteConfirmed = () => {
    setIsWaitingForConfirmation(false);
    toast.promise(
      deleteElements({ nodes: [{ id }] }),
      {
        loading: 'Deleting node...',
        success: (data) => {
          return {
            message: 'Node deleted successfully',
            action: {
              label: 'Undo',
              onClick: () => {
                addNodes(data.deletedNodes.map(node => (node as Node)));
                addEdges(data.deletedEdges);
              }
            }
          };
        },
        error: 'Failed to delete node',
      }
    );
  };

  // set data.entries from the connections data.value
  const connections = useNodeConnections({
    handleType: 'target',
  });
  const sourceNodesId: {
    nodeId: string;
    handleId: string | null;
  }[] = useMemo(() => {
    return connections
      .map(connection => ({
        nodeId: connection.source,
        handleId: connection.targetHandle
      }))
  }, [connections]);

  const sourceNodesData = useNodesData<Node>(sourceNodesId.map(({ nodeId }) => nodeId).filter(nodeId => nodeId && nodeId !== id));

  // set the node data.entries to the source nodes data.value
  useEffect(() => {
    const entries: Record<string, { value: any; handle?: string }> = {};
    sourceNodesData.forEach(node => {
      const handleId = sourceNodesId.find(source => source.nodeId === node.id)?.handleId?.replace(`${id}-target`, '')?.replace('-', '');
      if (node.data.value !== undefined) {
        entries[node.data.ref] = {
          value: node.data.value,
          handle: handleId || undefined
        };
      }
    });
    updateNodeData(id, { entries });
  }, [sourceNodesData, sourceNodesId, id, updateNodeData]);


  useEffect(() => {
    const edges = getEdges();
    const updatedEdges = edges
      .map(edge => {
        if (edge.source !== id && edge.target !== id) {
          return edge;
        }
        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: (edge.source === id || edge.target === id) && selected ? 1 : 0.4,
            stroke: (isHighlighted(edge) && options?.edges?.highlightedColor) ? options?.edges?.highlightedColor : isSelected(edge) ? options?.edges?.color || '#ff0071' : '#ccc',
            transition: 'opacity 0.2s ease'
          },
        }
      });
    setEdges(updatedEdges);
  }, [selected, id, getEdges, setEdges, options?.edges?.highlightedConnectionsTo]);



  function isHighlighted(edge: Edge) {
    return (edge.source === id || edge.target === id) && selected && (options?.edges?.highlightedConnectionsTo?.includes(edge.target) || options?.edges?.highlightedConnectionsTo?.includes(edge.source));
  }

  function isSelected(edge: Edge) {
    return (edge.source === id || edge.target === id) && selected;
  }

  return (
    <>
      <NodeToolbar
        isVisible={selected}
        className="bg-white border border-gray-300 rounded-lg shadow-md"
        style={{ zIndex: 1000 }}
      >
        {/* delete button  */}
        <Button
          variant="destructive"
          size="icon"
          onClick={handleDelete}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </NodeToolbar>
      <NodeResizer
        color="#ff0071"
        isVisible={selected && options?.isResizable !== false}
        minWidth={100}
        minHeight={50}
      />
      {
        getHandles({
          nodeId: id,
          type: 'target',
          options
        })
      }

      <div className="w-full h-full bg-accent rounded-lg">
        {children}
      </div>
      {
        getHandles({
          nodeId: id,
          type: 'source',
          options
        })
      }
    </>
  );
};

const getHandles = ({
  nodeId,
  type,
  options
}: {
  nodeId: string,
  type: 'target' | 'source',
  options?: {
    handles?: {
      target?: {
        position?: Position;
        maxConnections?: number;
        separateHandles?: boolean;
      } | null;
      source?: {
        position?: Position;
        maxConnections?: number;
        separateHandles?: boolean;
      } | null;
    };
  }
}) => {
  if (type === 'target' && options?.handles?.target === null) {
    return <></>
  }
  if (type === 'source' && options?.handles?.source === null) {
    return <></>
  }


  if (!options?.handles?.[type]?.separateHandles || !options?.handles?.[type]?.maxConnections) {
    return (
      <MaxConnectionsHandle
        id={`${nodeId}-${type}`}
        key={`${nodeId}-${type}`}
        type={type}
        position={options?.handles?.[type]?.position || (type === 'target' ? Position.Left : Position.Right)}
        maxConnections={options?.handles?.[type]?.maxConnections}
      />
    );
  }

  // If separate handles and maxConnections are defined, create multiple handles

  const handles = [];
  for (let i = 0; i < options.handles[type].maxConnections; i++) {
    handles.push(
      <MaxConnectionsHandle
        id={`${nodeId}-${type}-${i}`}
        key={`${nodeId}-${type}-${i}`}
        type={type}
        position={options?.handles?.[type]?.position || (type === 'target' ? Position.Left : Position.Right)}
        style={{
          position: 'relative',
          top: 0,
          left: 0,
          right: 0,
          transform: 'none'
        }}
        maxConnections={1}
      />

    );
  }


  return (
    <div style={{
      position: 'absolute',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
      gap: '4px',
      top: 0,
      ...{
        [type === 'target' ? 'left' : 'right']: 0,
        height: '100%',
        transform: type === 'target' ? 'translateX(-50%)' : 'translateX(50%)'
      }
    }}>
      {handles}
    </div>
  )
};

function MaxConnectionsHandle({ maxConnections, id, ...props }: React.ComponentProps<typeof Handle> & { maxConnections?: number, id: string }) {
  const connections = useNodeConnections({
    handleId: id
  }).filter((connection => connection.targetHandle === id || connection.sourceHandle === id));


  return (
    <Handle
      {...props}
      isConnectable={maxConnections ? connections.length < maxConnections : true}
      id={id}
    />
  );
}
