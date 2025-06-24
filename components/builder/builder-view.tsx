'use client';

import {
  Background,
  BackgroundVariant,
  DefaultEdgeOptions,
  Edge,
  HandleType,
  MarkerType,
  Node,
  OnConnect,
  OnReconnect,
  ReactFlow,
  ReactFlowProps,
  ReactFlowProvider,
  addEdge,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react';
import React, { useCallback, useRef } from 'react';

import { DndTypeProvider } from '@/lib/context/dnd.context';
import '@xyflow/react/dist/style.css';
import { nanoid } from 'nanoid';
import { addNode, getNodeDefinition, nodeTypes } from './node-registry';
import DndSidebar from './sidebar';

import { useDnd } from '@/lib/context/dnd.context';
import FloatingEdge from './floating-edge/floating-edge';
import FloatingConnectionLine from './floating-edge/floating-connection-line';


const initNodes: Node[] = [];

const initialEdges: Edge[] = [];



const DnDFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);

  const { screenToFlowPosition } = useReactFlow();

  const { type } = useDnd();

  const onDragOver: React.DragEventHandler<HTMLDivElement> = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop: React.DragEventHandler<HTMLDivElement> = useCallback(
    (event) => {
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
        setNodes((nds) => nds.concat(newNode));
      }

    },
    [screenToFlowPosition, type]
  );


  const onDragStart: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.dataTransfer.setData('text/plain', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const edgeReconnectSuccessful = useRef(true);

  const onReconnect: OnReconnect<Edge> = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [],
  );


  const onConnect: OnConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    [],
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnectEnd = useCallback((_: unknown, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }

    edgeReconnectSuccessful.current = true;
  }, []);

  return (
    <div className="relative h-full w-full">
      <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onEdgesChange={onEdgesChange}
          onNodesChange={onNodesChange}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          fitView
          nodeTypes={nodeTypes}
          snapToGrid
          snapGrid={[15, 15]}
          attributionPosition="top-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
      <DndSidebar />
    </div>
  );
};


export default function Page() {
  return (
    <ReactFlowProvider>
      <DndTypeProvider>
        <DnDFlow />
      </DndTypeProvider>
    </ReactFlowProvider>
  );
}
