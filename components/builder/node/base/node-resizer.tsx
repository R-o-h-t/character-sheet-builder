import { Button } from '@/components/ui/button';
import { Handle, Position, NodeResizer, NodeToolbar, useReactFlow, useNodeConnections, Connection } from '@xyflow/react';
import { Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

export function Resizable({
  id,
  children,
  selected,
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
        maxConnections?: number;
        onConnect?: (connections: Connection[]) => void;
        onDisconnect?: (connections: Connection[]) => void;
      } | null;
      source?: {
        position?: Position;
        maxConnections?: number;
        onConnect?: (connections: Connection[]) => void;
        onDisconnect?: (connections: Connection[]) => void;
      } | null;
    }
  };
}) {

  // implemeent delete current node logic here
  const { deleteElements, addNodes, addEdges, getEdges, setEdges } = useReactFlow();

  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);

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
          // allow undo
          return {
            message: 'Node deleted successfully',
            action: {
              label: 'Undo',
              onClick: () => {
                addNodes(data.deletedNodes);
                addEdges(data.deletedEdges);
              }
            }
          };
        },
        error: 'Failed to delete node',
      }
    );
  };

  const targetConnections = useNodeConnections({
    id,
    handleType: 'target',
    onConnect: options?.handles?.target?.onConnect,
    onDisconnect: options?.handles?.target?.onDisconnect,
  })

  const sourceConnections = useNodeConnections({
    id,
    handleType: 'source',
    onConnect: options?.handles?.source?.onConnect,
    onDisconnect: options?.handles?.source?.onDisconnect,
  });





  useEffect(() => {

    const edges = getEdges();
    const updatedEdges = edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: (edge.source === id || edge.target === id) && selected ? 1 : 0.4,
        stroke: (edge.source === id || edge.target === id) && selected ? '#ff0071' : '#ccc',

        transition: 'opacity 0.2s ease'
      }
    }));
    setEdges(updatedEdges);
  }, [selected, id, getEdges, setEdges]);

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
        options?.handles?.target !== null && (
          <Handle
            type="target"
            position={options?.handles?.target?.position || Position.Left}
            isConnectable={options?.handles?.target?.maxConnections ? options?.handles?.target?.maxConnections > targetConnections.length : true}
          />
        )
      }
      <div className="w-full h-full bg-accent rounded-lg">
        {children}
      </div>
      {
        options?.handles?.source !== null && (
          <Handle
            type="source"
            position={options?.handles?.source?.position || Position.Right}
            isConnectable={options?.handles?.source?.maxConnections ? options?.handles?.source?.maxConnections > sourceConnections.length : true}
          />
        )
      }
    </>
  );
};


