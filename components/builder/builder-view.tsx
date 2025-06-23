'use client';

import React, { useRef, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  NodeChange,
  applyNodeChanges,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import DndSidebar from './sidebar';

import { NodeData, useSheetStore } from '@/lib/stores/sheetStore';
import { useDnd } from '@/lib/context/dnd.context';




const initialEdges: { id: string; source: string; target: string }[] = [];



const DnDFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const { type } = useDnd();
  const { nodes, addNode, setNodes } = useSheetStore();

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const onDragOver: React.DragEventHandler<HTMLDivElement> = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault();
      const nodeDef = getNodeDefinition(type);
      if (!nodeDef) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(
        nodeDef.type,
        position,
      );
    },
    [screenToFlowPosition, type]
  );


  const onDragStart: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.dataTransfer.setData('text/plain', type);
    event.dataTransfer.effectAllowed = 'move';
  };


  const onNodesChange = useCallback((changes: NodeChange[]) => {
    return setNodes(applyNodeChanges<NodeData>(changes, nodes));
  }, [setNodes, nodes]);



  return (
    <div className="relative h-full w-full">
      <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          fitView
          nodeTypes={nodeTypes}
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
      <DndSidebar />
    </div>
  );
};

import { DndTypeProvider } from '@/lib/context/dnd.context';
import { getNodeDefinition, nodeTypes } from './node-registry';

export default function Page() {
  return (
    <ReactFlowProvider>
      <DndTypeProvider>
        <DnDFlow />
      </DndTypeProvider>
    </ReactFlowProvider>
  );
}
