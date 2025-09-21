'use client';

import {
  Background,
  BackgroundVariant,
  Edge,
  Node as FlowNode,
  Panel,
  type NodeTypes,
  ReactFlowInstance,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DndTypeProvider, useDnd } from '@/lib/context/dnd.context';
import { useProjectManager } from '@/lib/context/project-manager.context';
import { deriveCompositeInputs, deriveCompositeOutputs } from '@/lib/composite/graph';
import type { ProjectData } from '@/lib/projects/types';
import { GraphErrorBoundary } from '../error-boundary/error-boundary';
import { ErrorMonitor } from '../error-boundary/error-monitor';
import { nodeTypes, type Node, addNode } from './node-registry';
import { FlowCanvas } from './flow-canvas';
import nodeDefinitions from './node/nodes';
import NodeDataMenu from './data-menu';
import DndSidebar from './sidebar';

const flowKey = 'dnd-flow';

const initialNodes: FlowNode[] = [];
const initialEdges: Edge[] = [];

interface BuilderCanvasProps {
  projectId?: string;
  isPreviewMode?: boolean;
}

function BuilderCanvas({ projectId, isPreviewMode = false }: BuilderCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<FlowNode> | null>(null);
  const [editingCompositeNodeId, setEditingCompositeNodeId] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [projectLoading, setProjectLoading] = useState(false);
  const [showErrorMonitor, setShowErrorMonitor] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FlowNode;
  } | null>(null);

  const { setViewport, deleteElements } = useReactFlow<FlowNode>();
  const { projectService } = useProjectManager();

  // Load project data when projectId changes
  useEffect(() => {
    if (!projectId) {
      setCurrentProject(null);
      setNodes([]);
      setEdges([]);
      return;
    }

    const loadProject = async () => {
      try {
        setProjectLoading(true);
        const project = await projectService.loadProject(projectId);
        if (project) {
          setCurrentProject(project);
          setNodes(project.nodes);
          setEdges(project.edges);
        } else {
          toast.error('Project not found');
        }
      } catch (error) {
        console.error('Failed to load project:', error);
        toast.error('Failed to load project');
      } finally {
        setProjectLoading(false);
      }
    };

    loadProject();
  }, [projectId, projectService, setNodes, setEdges]);

  // Auto-save project changes (only in edit mode)
  useEffect(() => {
    if (!currentProject || !projectId || isPreviewMode) {
      return;
    }

    const saveProject = async () => {
      try {
        const updatedProject: ProjectData = {
          ...currentProject,
          nodes,
          edges,
          metadata: {
            ...currentProject.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        await projectService.saveProject(updatedProject);
        setCurrentProject(updatedProject);
      } catch (error) {
        console.error('Failed to auto-save project:', error);
      }
    };

    // Debounce auto-save
    const timeoutId = setTimeout(saveProject, 1000);
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, currentProject, projectId, isPreviewMode, projectService]);

  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onNodeContextMenu = useCallback((event: MouseEvent, node: FlowNode) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  const onNodeDoubleClick = useCallback(
    (event: MouseEvent, node: FlowNode) => {
      setContextMenu(null);
      if (node.type !== 'composite-node') {
        return;
      }
      event.preventDefault();
      setEditingCompositeNodeId(node.id);
    },
    []
  );

  const onSave = useCallback(() => {
    if (!rfInstance || isPreviewMode) return;

    if (projectId && currentProject) {
      // Save to project
      const saveProject = async () => {
        try {
          const updatedProject: ProjectData = {
            ...currentProject,
            nodes,
            edges,
            metadata: {
              ...currentProject.metadata,
              updatedAt: new Date().toISOString(),
            },
          };
          await projectService.saveProject(updatedProject);
          setCurrentProject(updatedProject);
          toast.success('Project saved');
        } catch (error) {
          console.error('Failed to save project:', error);
          toast.error('Failed to save project');
        }
      };
      saveProject();
    } else {
      // Fallback to localStorage
      const flow = rfInstance.toObject();
      localStorage.setItem(flowKey, JSON.stringify(flow));
      toast.success('Flow saved locally');
    }
  }, [rfInstance, isPreviewMode, projectId, currentProject, nodes, edges, projectService]);

  const onRestore = useCallback(() => {
    const flowData = localStorage.getItem(flowKey);
    if (!flowData) {
      toast.error('No saved flow found');
      return;
    }
    const flow = JSON.parse(flowData);
    const { x = 0, y = 0, zoom = 1 } = flow.viewport ?? {};
    setNodes(flow.nodes ?? []);
    setEdges(flow.edges ?? []);
    setViewport({ x, y, zoom });
    toast.success('Flow restored');
  }, [setEdges, setNodes, setViewport]);

  const handleCopyNode = useCallback(() => {
    if (!contextMenu) return;
    navigator.clipboard.writeText(JSON.stringify(contextMenu.node, null, 2));
    toast.success('Node copied to clipboard');
    setContextMenu(null);
  }, [contextMenu]);

  const handleCutNode = useCallback(() => {
    if (!contextMenu) return;
    deleteElements({ nodes: [{ id: contextMenu.node.id }] });
    toast.success('Node removed');
    setContextMenu(null);
  }, [contextMenu, deleteElements]);

  const handleEditNode = useCallback(() => {
    if (!contextMenu) return;
    const node = contextMenu.node;
    if (node.type !== 'composite-node') {
      toast.warning('Only composite nodes support editing');
      return;
    }
    setEditingCompositeNodeId(node.id);
    setContextMenu(null);
  }, [contextMenu]);

  return (
    <div className="relative h-full w-full">
      <GraphErrorBoundary>
        <FlowCanvas
          className="h-screen w-screen"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes as NodeTypes}
          setNodes={setNodes}
          setEdges={setEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={setRfInstance}
          isReadOnly={isPreviewMode}
          onNodeContextMenu={isPreviewMode ? undefined : onNodeContextMenu}
          onNodeDoubleClick={isPreviewMode ? undefined : onNodeDoubleClick}
          onPaneClick={handlePaneClick}
          attributionPosition="top-right"
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <Panel position="top-right" className="flex gap-2">
            {projectLoading && (
              <div className="text-sm text-muted-foreground px-3 py-1.5">
                Loading...
              </div>
            )}
            {currentProject && (
              <div className="text-sm text-muted-foreground px-3 py-1.5">
                {isPreviewMode ? 'Preview:' : 'Editing:'} {currentProject.metadata.name}
              </div>
            )}
            {!isPreviewMode && (
              <>
                <Button variant="outline" size="sm" onClick={onSave}>
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={onRestore}>
                  Restore
                </Button>
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowErrorMonitor(!showErrorMonitor)}
                  >
                    {showErrorMonitor ? 'Hide' : 'Show'} Errors
                  </Button>
                )}
              </>
            )}
          </Panel>
        </FlowCanvas>
      </GraphErrorBoundary>

      {contextMenu && (
        <div
          className="fixed z-50 flex flex-col rounded border border-border bg-card text-sm shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="px-4 py-2 text-left hover:bg-accent" onClick={handleCopyNode}>
            Copy
          </button>
          <button className="px-4 py-2 text-left hover:bg-accent" onClick={handleCutNode}>
            Cut
          </button>
          {contextMenu.node.type === 'composite-node' && (
            <button className="px-4 py-2 text-left hover:bg-accent" onClick={handleEditNode}>
              Edit
            </button>
          )}
        </div>
      )}

      {editingCompositeNodeId && !isPreviewMode && (
        <CompositeEditorModal
          nodeId={editingCompositeNodeId}
          onClose={() => setEditingCompositeNodeId(null)}
        />
      )}

      {!isPreviewMode && (
        <>
          <DndSidebar />
          <NodeDataMenu />
        </>
      )}
    </div>
  );
}


function CompositeEditorModal({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const { getNode, updateNodeData } = useReactFlow<Node>();
  const availableNodes = useMemo(
    () => nodeDefinitions.filter((definition) => definition.category === 'Internal'),
    []
  );

  const [draftNodes, setDraftNodes] = useState<FlowNode[]>(() => {
    const target = getNode(nodeId);
    return cloneNodes(readInternalNodes(target));
  });
  const [draftEdges, setDraftEdges] = useState<Edge[]>(() => {
    const target = getNode(nodeId);
    return cloneEdges(readInternalEdges(target));
  });

  useEffect(() => {
    const target = getNode(nodeId);
    setDraftNodes(cloneNodes(readInternalNodes(target)));
    setDraftEdges(cloneEdges(readInternalEdges(target)));
  }, [getNode, nodeId]);

  const handleGraphChange = useCallback((nodes: FlowNode[], edges: Edge[]) => {
    setDraftNodes(cloneNodes(nodes));
    setDraftEdges(cloneEdges(edges));
  }, []);

  const handleSave = useCallback(() => {
    const inputs = deriveCompositeInputs(draftNodes);
    const outputs = deriveCompositeOutputs(draftNodes, draftEdges);

    updateNodeData(nodeId, {
      internalNodes: cloneNodes(draftNodes),
      internalEdges: cloneEdges(draftEdges),
      inputs,
      outputs,
    });
    onClose();
  }, [draftEdges, draftNodes, nodeId, onClose, updateNodeData]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  const node = getNode(nodeId);

  if (!node) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="rounded bg-card px-6 py-4 shadow-xl">
          <p className="text-sm text-destructive">Composite node not found.</p>
          <Button className="mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  const rawName = (node.data as Record<string, unknown>)?.name;
  const nodeName = typeof rawName === 'string' && rawName.trim() ? rawName.trim() : 'Composite Node';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60">
      <div className="flex h-full flex-col bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">{nodeName}</h2>
            <p className="text-xs text-muted-foreground">Edit composite node internals</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <InternalGraphEditor
            nodes={draftNodes}
            edges={draftEdges}
            availableNodes={availableNodes}
            onGraphChange={handleGraphChange}
          />
        </div>
      </div>
    </div>
  );
}

type InternalDefinition = (typeof nodeDefinitions)[number];

type InternalGraphEditorProps = {
  nodes: FlowNode[];
  edges: Edge[];
  availableNodes: readonly InternalDefinition[];
  onGraphChange: (nodes: FlowNode[], edges: Edge[]) => void;
};

function InternalGraphEditor({
  nodes,
  edges,
  availableNodes,
  onGraphChange,
}: InternalGraphEditorProps) {
  const [addNodeHandler, setAddNodeHandler] = useState<(type: string) => void>(() => () => { });

  const nodeTypes = useMemo(
    () => Object.fromEntries(availableNodes.map((definition) => [definition.type, definition.component])),
    [availableNodes]
  );

  const handleRegisterAddNode = useCallback((fn: (type: string) => void) => {
    setAddNodeHandler(() => fn);
  }, []);

  return (
    <DndTypeProvider>
      <div className="flex h-full">
        <InternalSidebar availableNodes={availableNodes} onAddNode={addNodeHandler} />
        <div className="flex-1">
          <ReactFlowProvider>
            <InternalWorkspace
              initialNodes={nodes}
              initialEdges={edges}
              nodeTypes={nodeTypes}
              onChange={onGraphChange}
              onRegisterAddNode={handleRegisterAddNode}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </DndTypeProvider>
  );
}

type InternalSidebarProps = {
  availableNodes: readonly InternalDefinition[];
  onAddNode: (type: string) => void;
};

function InternalSidebar({ availableNodes, onAddNode }: InternalSidebarProps) {
  const { setType } = useDnd();

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/reactflow', nodeType);
  };

  return (
    <aside className="w-60 overflow-y-auto border-r border-border bg-muted/40 p-3 text-sm">
      <p className="mb-2 font-semibold">Internal Nodes</p>
      <div className="flex flex-col gap-2">
        {availableNodes.map((definition) => (
          <button
            key={definition.type}
            draggable
            onDragStart={(event) => handleDragStart(event, definition.type)}
            onClick={() => onAddNode(definition.type)}
            className="flex items-center gap-2 rounded border border-border bg-card px-2 py-1 text-left hover:bg-accent"
          >
            <definition.icon className="h-4 w-4" />
            <span>{definition.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

type InternalWorkspaceProps = {
  initialNodes: FlowNode[];
  initialEdges: Edge[];
  nodeTypes: Record<string, InternalDefinition['component']>;
  onChange: (nodes: FlowNode[], edges: Edge[]) => void;
  onRegisterAddNode: (handler: (type: string) => void) => void;
};

function InternalWorkspace({
  initialNodes,
  initialEdges,
  nodeTypes,
  onChange,
  onRegisterAddNode,
}: InternalWorkspaceProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const { deleteElements } = useReactFlow<FlowNode>();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FlowNode;
  } | null>(null);

  useEffect(() => {
    onChange(nodes, edges);
  }, [edges, nodes, onChange]);
  const handlePaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const onNodeContextMenu = useCallback((event: MouseEvent, node: FlowNode) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }, []);

  const handleCopyNode = useCallback(() => {
    if (!contextMenu) return;
    navigator.clipboard.writeText(JSON.stringify(contextMenu.node, null, 2));
    setContextMenu(null);
    toast.success('Node copied to clipboard');
  }, [contextMenu]);

  const handleCutNode = useCallback(() => {
    if (!contextMenu) return;
    deleteElements({ nodes: [{ id: contextMenu.node.id }] });
    setContextMenu(null);
    toast.success('Node removed');
  }, [contextMenu, deleteElements]);

  useEffect(() => {
    const handler = (nodeType: string) => {
      if (!nodeType) return;
      const position = { x: 100, y: 100 };
      const newNode = addNode({ type: nodeType, position });
      if (!newNode) return;
      setNodes((current) => current.concat(newNode as FlowNode));
    };

    onRegisterAddNode(handler);
    return () => onRegisterAddNode(() => { });
  }, [onRegisterAddNode, setNodes]);

  return (
    <div className="relative h-full w-full">
      <GraphErrorBoundary>
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes as NodeTypes}
          setNodes={setNodes}
          setEdges={setEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={handlePaneClick}
          hideAttribution
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </FlowCanvas>
      </GraphErrorBoundary>
      {contextMenu && (
        <div
          className="fixed z-50 flex flex-col rounded border border-border bg-card text-sm shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="px-4 py-2 text-left hover:bg-accent" onClick={handleCopyNode}>
            Copy
          </button>
          <button className="px-4 py-2 text-left hover:bg-accent" onClick={handleCutNode}>
            Cut
          </button>
        </div>
      )}
      
      <ErrorMonitor 
        isVisible={showErrorMonitor} 
        onClose={() => setShowErrorMonitor(false)} 
      />
    </div>
  );
}

function readInternalNodes(node: Node | undefined): FlowNode[] {
  if (!node) {
    return [];
  }

  const data = (node.data as Record<string, unknown>) ?? {};
  const stored = data.internalNodes;
  if (Array.isArray(stored)) {
    return stored as FlowNode[];
  }
  return [];
}

function readInternalEdges(node: Node | undefined): Edge[] {
  if (!node) {
    return [];
  }

  const data = (node.data as Record<string, unknown>) ?? {};
  const stored = data.internalEdges;
  if (Array.isArray(stored)) {
    return stored as Edge[];
  }
  return [];
}

function cloneNodes(nodes: FlowNode[]): FlowNode[] {
  return nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...((node.data as Record<string, unknown>) ?? {}) },
    selected: false,
  }));
}

function cloneEdges(edges: Edge[]): Edge[] {
  return edges.map((edge) => ({ ...edge }));
}

interface BuilderViewProps {
  projectId?: string;
  isPreviewMode?: boolean;
}

export default function BuilderView({ projectId, isPreviewMode = false }: BuilderViewProps) {
  return (
    <GraphErrorBoundary>
      <ReactFlowProvider>
        <DndTypeProvider>
          <BuilderCanvas projectId={projectId} isPreviewMode={isPreviewMode} />
        </DndTypeProvider>
      </ReactFlowProvider>
    </GraphErrorBoundary>
  );
}
