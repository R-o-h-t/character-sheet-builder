import { Button } from '@/components/ui/button';
import { Handle, Position, NodeResizer, NodeToolbar, useReactFlow } from '@xyflow/react';
import { Trash } from 'lucide-react';
import { toast } from 'sonner';

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
  };
}) {

  // implemeent delete current node logic here
  const { deleteElements, addNodes, addEdges } = useReactFlow();
  const handleDelete = async () => {

    if (!id) {
      console.error('Node ID is required for deletion');
      return;
    }

    toast('Delete ? ', {
      action: {
        label: 'Confirm',
        onClick: () => {
          onDeleteConfirmed();
        },
      }
    });
  }

  const onDeleteConfirmed = () => {

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
      <Handle type="target" position={Position.Left} />
      <div className="w-full h-full bg-accent rounded-lg">
        {children}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};


