import { Button } from '@/components/ui/button';
import { Connection, Edge, Handle, NodeToolbar, Position, useNodeConnections, useNodesData, useOnSelectionChange, useReactFlow, useUpdateNodeInternals } from '@xyflow/react';
import { Trash } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, JSX } from 'react';
import { toast } from 'sonner';
import { Node } from '../../node-registry';
import { isErrorValue } from '../utils/value';

type HandleDefinition = {
  id: string;
  position?: Position;
  maxConnections?: number;
};

type HandleOptions = {
  position?: Position;
  separateHandles?: boolean;
  maxConnections?: number;
  definitions?: HandleDefinition[];
  onConnect?: (connections: Connection[]) => void;
  onDisconnect?: (connections: Connection[]) => void;
} | null;

type ResizableOptions = {
  minWidth?: number;
  minHeight?: number;
  isResizable?: boolean;
  handles?: {
    target?: HandleOptions;
    source?: HandleOptions;
  };
  edges?: {
    highlightedConnectionsTo?: string[];
    highlightedColor?: string;
    animateHighlight?: boolean;
    color?: string;
  };
};

export function Resizable({
  id,
  children,
  options,
}: {
  id: string;
  children: React.ReactNode;
  selected: boolean;
  options?: ResizableOptions;
}) {

  // implement delete current node logic here
  const { deleteElements, addNodes, addEdges, getEdges, setEdges, updateNodeData } = useReactFlow<Node>();

  const updateNodeInternals = useUpdateNodeInternals();

  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState(false);

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const onSelectionChange = useCallback((changes: { nodes: Node[]; edges: Edge[] }) => {
    const selectedNodeIds = changes.nodes.map((node) => node.id);
    setSelectedNodes(selectedNodeIds);
  }, []);

  useOnSelectionChange<Node>({ onChange: onSelectionChange });


  const selected = useMemo(() => {
    return selectedNodes.includes(id);
  }, [id, selectedNodes]);

  const currentNode = useNodesData<Node>(id);

  const nodeHasError = useMemo(() => {
    if (!currentNode) {
      return false;
    }
    return isErrorValue(currentNode.data?.value);
  }, [currentNode]);

  const errorMessage = useMemo(() => {
    if (!nodeHasError || !currentNode) {
      return undefined;
    }
    const value = currentNode.data?.value as { error: string };
    return value?.error;
  }, [nodeHasError, currentNode]);

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sourceNodeIds = useMemo(() => {
    const identifiers = new Set<string>();
    connections.forEach((connection) => {
      if (connection.source && connection.source !== id) {
        identifiers.add(connection.source);
      }
    });
    return Array.from(identifiers);
  }, [connections, id]);

  const sourceNodesData = useNodesData<Node>(sourceNodeIds);

  // Build a signature that changes when any source node updates its value
  const sourcesSignature = useMemo(() => {
    return sourceNodesData
      .map((n) => `${n.id}:${(n.data as any)?._valueTick ?? 0}:${(n.data as any)?._entriesTick ?? 0}`)
      .join('|');
  }, [sourceNodesData]);

  // set the node data.entries to the source nodes data.value
  useEffect(() => {
    const lookup = new Map(sourceNodesData.map((node) => [node.id, node]));
    const entries: Record<string, {
      value: unknown;
      handleId: string;
      sourceNodeId?: string;
      sourceHandleId?: string;
      sourceRef?: string;
    }> = {};

    connections.forEach((connection) => {
      const targetHandleId = normalizeHandleId(connection.targetHandle, id, 'target');
      if (!targetHandleId) {
        return;
      }

      const sourceNode = lookup.get(connection.source);
      if (!sourceNode) {
        return;
      }

      const sourceHandleId = normalizeHandleId(connection.sourceHandle, connection.source, 'source');
      const value = getHandleSpecificValue(sourceNode.data, sourceHandleId);

      if (value === undefined) {
        return;
      }

      entries[targetHandleId] = {
        value,
        handleId: targetHandleId,
        sourceNodeId: connection.source,
        sourceHandleId,
        sourceRef: sourceNode.data.ref,
      };
    });

    // Include a monotonic tick to signal downstream nodes that entries changed,
    // ensuring memoized computations can re-run even if shapes are similar.
    updateNodeData(id, { entries, _entriesTick: Date.now() });
  }, [connections, id, sourceNodesData, sourcesSignature, updateNodeData]);


  const isHighlighted = useCallback((edge: Edge) => {
    return (
      (edge.source === id || edge.target === id) &&
      selected &&
      (options?.edges?.highlightedConnectionsTo?.includes(edge.target) ||
        options?.edges?.highlightedConnectionsTo?.includes(edge.source))
    );
  }, [id, options?.edges?.highlightedConnectionsTo, selected]);

  const isSelected = useCallback((edge: Edge) => {
    return (edge.source === id || edge.target === id) && selected;
  }, [id, selected]);

  useEffect(() => {
    const edges = getEdges();
    const updatedEdges = edges.map(edge => {
      if (edge.source !== id && edge.target !== id) {
        return edge;
      }
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: (edge.source === id || edge.target === id) && selected ? 1 : 0.4,
          stroke: isHighlighted(edge)
            ? options?.edges?.highlightedColor ?? options?.edges?.color ?? '#ff0071'
            : isSelected(edge)
              ? options?.edges?.color || '#ff0071'
              : '#ccc',
          transition: 'opacity 0.2s ease',
        },
      };
    });
    setEdges(updatedEdges);
  }, [getEdges, id, isHighlighted, isSelected, options?.edges?.color, options?.edges?.highlightedColor, selected, setEdges]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    let frame: number | null = null;
    const observer = new ResizeObserver(() => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => updateNodeInternals(id));
    });

    observer.observe(element);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      observer.disconnect();
    };
  }, [id, updateNodeInternals]);

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
      {
        getHandles({
          nodeId: id,
          type: 'target',
          options
        })
      }

      <div
        ref={containerRef}
        className={`inline-flex min-w-[160px] max-w-xl flex-col rounded-lg bg-accent ${nodeHasError ? 'border-2 border-destructive shadow-inner' : ''}`}
        style={{ width: 'auto', height: 'auto' }}
        title={errorMessage}
      >
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

function normalizeHandleId(rawId: string | null | undefined, nodeId: string, type: 'target' | 'source'): string | undefined {
  if (!rawId) {
    return undefined;
  }

  let trimmed = rawId;
  if (trimmed.startsWith(`${nodeId}-`)) {
    trimmed = trimmed.slice(`${nodeId}-`.length);
  }
  if (trimmed.startsWith(`${type}-`)) {
    trimmed = trimmed.slice(`${type}-`.length);
  }
  return trimmed;
}

function getHandleSpecificValue(data: Node['data'], handleId?: string) {
  const handleValues = (data as unknown as { handleValues?: Record<string, unknown> }).handleValues;
  if (handleId && handleValues && handleId in handleValues) {
    return handleValues[handleId];
  }
  // Fallbacks for composite nodes with multiple outputs where value may be an object
  const val: any = (data as any).value;
  if (handleId && val && typeof val === 'object') {
    // Case 1: composite set value to the resolved object: { outputs: { handleId: value }, ... }
    if (val.outputs && typeof val.outputs === 'object' && handleId in val.outputs) {
      return val.outputs[handleId];
    }
    // Case 2: value itself is a simple map of handleId -> value
    if (handleId in val) {
      return val[handleId];
    }
  }
  return data.value;
}

const getHandles = ({
  nodeId,
  type,
  options
}: {
  nodeId: string;
  type: 'target' | 'source';
  options?: ResizableOptions;
}) => {
  const config = options?.handles?.[type];

  if (config === null) {
    return <></>;
  }

  const defaultPosition = config?.position ?? (type === 'target' ? Position.Left : Position.Right);
  const handlesToRender: JSX.Element[] = [];

  if (config?.definitions && config.definitions.length > 0) {
    config.definitions.forEach((definition) => {
      handlesToRender.push(
        <MaxConnectionsHandle
          id={`${nodeId}-${type}-${definition.id}`}
          key={`${nodeId}-${type}-${definition.id}`}
          type={type}
          position={definition.position ?? defaultPosition}
          style={multiHandleStyle}
          maxConnections={definition.maxConnections ?? config.maxConnections ?? 1}
        />
      );
    });
  } else if (!config?.separateHandles || !config?.maxConnections) {
    handlesToRender.push(
      <MaxConnectionsHandle
        id={`${nodeId}-${type}`}
        key={`${nodeId}-${type}`}
        type={type}
        position={defaultPosition}
        maxConnections={config?.maxConnections}
      />
    );
  } else {
    for (let i = 0; i < config.maxConnections; i++) {
      handlesToRender.push(
        <MaxConnectionsHandle
          id={`${nodeId}-${type}-${i}`}
          key={`${nodeId}-${type}-${i}`}
          type={type}
          position={defaultPosition}
          style={multiHandleStyle}
          maxConnections={1}
        />
      );
    }
  }

  if (handlesToRender.length === 0) {
    return <></>;
  }

  if (
    handlesToRender.length === 1 &&
    !(config?.definitions && config.definitions.length > 0) &&
    (!config?.separateHandles || !config?.maxConnections)
  ) {
    return handlesToRender[0];
  }

  return (
    <div style={getHandleContainerStyle(type)}>
      {handlesToRender}
    </div>
  );
};

const multiHandleStyle: CSSProperties = {
  position: 'relative',
  top: 0,
  left: 0,
  right: 0,
  transform: 'none',
};

function getHandleContainerStyle(type: 'target' | 'source'): CSSProperties {
  const style: CSSProperties = {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    gap: '4px',
    top: 0,
    height: '100%',
    transform: type === 'target' ? 'translateX(-50%)' : 'translateX(50%)',
  };

  if (type === 'target') {
    style.left = 0;
  } else {
    style.right = 0;
  }

  return style;
}

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
