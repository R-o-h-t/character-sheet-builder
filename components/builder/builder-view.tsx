'use client';

import {
  Background,
  BackgroundVariant,
  Edge,
  Node,
  OnConnect,
  OnReconnect,
  Panel,
  ReactFlow,
  ReactFlowInstance,
  ReactFlowProvider,
  SelectionMode,
  addEdge,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react';
import React, { useCallback, useRef, useState } from 'react';

import { DndTypeProvider } from '@/lib/context/dnd.context';
import '@xyflow/react/dist/style.css';
import { addNode, nodeTypes } from './node-registry';
import DndSidebar from './sidebar';

import { useDnd } from '@/lib/context/dnd.context';
import NodeDataMenu from './data-menu';
import { Button } from '@/components/ui/button';
import { SelectionRect } from '@xyflow/react';


const initNodes: Node[] = [];

const initialEdges: Edge[] = [];

const flowKey = 'dnd-flow';

const DnDFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node> | null>(null);

  const { screenToFlowPosition, setViewport } = useReactFlow();

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

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [rfInstance]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flowData = localStorage.getItem(flowKey);
      if (!flowData) {
        return;
      }
      const flow = JSON.parse(flowData);

      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setViewport({ x, y, zoom });
      }
    };

    restoreFlow();
  }, [setNodes, setViewport]);

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
          onInit={setRfInstance}
          fitView
          nodeTypes={nodeTypes}
          snapToGrid
          snapGrid={[15, 15]}
          attributionPosition="top-right"
          selectionMode={SelectionMode.Partial}

        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="top-right">
            <div className="absolute top-4 right-90 space-x-2 flex">
              <Button onClick={onSave}>
                save
              </Button>
              <Button onClick={onRestore}>
                restore
              </Button>
            </div>
          </Panel>

        </ReactFlow>
      </div>
      <DndSidebar />
      <NodeDataMenu />
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
