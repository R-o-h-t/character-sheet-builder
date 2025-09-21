'use client';

import {
  Connection,
  Edge,
  Node as FlowNode,
  NodeTypes,
  OnEdgesChange,
  OnNodesChange,
  OnSelectionChangeParams,
  PanelPosition,
  ReactFlow,
  ReactFlowInstance,
  SelectionMode,
  addEdge,
  reconnectEdge,
  useReactFlow,
} from '@xyflow/react';
import type { MouseEvent, ReactNode } from 'react';
import { useCallback, useMemo, useRef, useEffect } from 'react';

import { useDnd } from '@/lib/context/dnd.context';
import { addNode } from './node-registry';

export type FlowCanvasProps = {
  nodes: FlowNode[];
  edges: Edge[];
  nodeTypes: NodeTypes;
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: OnNodesChange<FlowNode>;
  onEdgesChange: OnEdgesChange<Edge>;
  onInit?: (instance: ReactFlowInstance<FlowNode>) => void;
  isReadOnly?: boolean;
  onNodeDoubleClick?: (event: MouseEvent, node: FlowNode) => void;
  onNodeContextMenu?: (event: MouseEvent, node: FlowNode) => void;
  onPaneClick?: () => void;
  onSelectionChange?: (params: OnSelectionChangeParams<FlowNode, Edge>) => void;
  fitView?: boolean;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
  className?: string;
  children?: ReactNode;
  hideAttribution?: boolean;
  attributionPosition?: PanelPosition;
};

export function FlowCanvas({
  nodes,
  edges,
  nodeTypes,
  setNodes,
  setEdges,
  onNodesChange,
  onEdgesChange,
  onInit,
  isReadOnly = false,
  onNodeDoubleClick,
  onNodeContextMenu,
  onPaneClick,
  onSelectionChange,
  fitView = true,
  snapToGrid = true,
  snapGrid = [15, 15],
  className,
  children,
  hideAttribution = false,
  attributionPosition,
}: FlowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow<FlowNode>();
  const { type } = useDnd();
  const edgeReconnectSuccessful = useRef(true);

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (isReadOnly || !type) return;

      event.preventDefault();
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = addNode({
        type,
        position,
      });

      if (newNode) {
        setNodes((current) => current.concat(newNode as FlowNode));
      }
    },
    [isReadOnly, screenToFlowPosition, setNodes, type]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (isReadOnly) return;
      setEdges((current) => addEdge(connection, current));
    },
    [isReadOnly, setEdges]
  );

  const handleReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (isReadOnly) return;
      edgeReconnectSuccessful.current = true;
      setEdges((current) => reconnectEdge(oldEdge, newConnection, current));
    },
    [isReadOnly, setEdges]
  );

  const handleReconnectStart = useCallback(() => {
    if (isReadOnly) return;
    edgeReconnectSuccessful.current = false;
  }, [isReadOnly]);

  const handleReconnectEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (isReadOnly) return;
      if (!edgeReconnectSuccessful.current) {
        setEdges((current) => current.filter((candidate) => candidate.id !== edge.id));
      }
      edgeReconnectSuccessful.current = true;
    },
    [isReadOnly, setEdges]
  );

  const handlePaneClick = useCallback(() => {
    setNodes((current) =>
      current.map((node) => (node.selected ? { ...node, selected: false } : node))
    );
    onPaneClick?.();
  }, [onPaneClick, setNodes]);

  const resolvedOnNodesChange = useMemo(
    () => (isReadOnly ? undefined : onNodesChange),
    [isReadOnly, onNodesChange]
  );

  const resolvedOnEdgesChange = useMemo(
    () => (isReadOnly ? undefined : onEdgesChange),
    [isReadOnly, onEdgesChange]
  );

  // Disable delete key functionality globally
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        // Prevent the default delete behavior unless the user is typing in an input field
        const activeElement = document.activeElement;
        const isInputField = activeElement?.tagName === 'INPUT' ||
          activeElement?.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement)?.contentEditable === 'true';

        if (!isInputField) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  return (
    <div className={className ?? 'h-full w-full'}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={resolvedOnNodesChange}
        onEdgesChange={resolvedOnEdgesChange}
        onInit={onInit}
        onConnect={isReadOnly ? undefined : handleConnect}
        onReconnect={isReadOnly ? undefined : handleReconnect}
        onReconnectStart={isReadOnly ? undefined : handleReconnectStart}
        onReconnectEnd={isReadOnly ? undefined : handleReconnectEnd}
        onDrop={isReadOnly ? undefined : handleDrop}
        onDragOver={isReadOnly ? undefined : handleDragOver}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={isReadOnly ? undefined : onNodeContextMenu}
        onPaneClick={handlePaneClick}
        onSelectionChange={onSelectionChange}
        fitView={fitView}
        snapToGrid={!isReadOnly && snapToGrid}
        snapGrid={snapGrid}
        selectionMode={SelectionMode.Partial}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        panOnDrag={onNodeContextMenu ? undefined : true}
        attributionPosition={attributionPosition}
        proOptions={{ hideAttribution }}
      >
        {children}
      </ReactFlow>
    </div>
  );
}
