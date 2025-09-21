'use client';

import {
  Background,
  BackgroundVariant,
  Edge,
  Node as FlowNode,
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
import Topbar from './topbar';
import { DndTypeProvider, useDnd } from '@/lib/context/dnd.context';
import { useProjectManager } from '@/lib/context/project-manager.context';
import { deriveCompositeInputs, deriveCompositeOutputs, CompositeIO, generateOutputHandlers } from '@/lib/composite/graph';
import type { ProjectData } from '@/lib/projects/types';
import { GraphErrorBoundary } from '../error-boundary/error-boundary';
import { nodeTypes, type Node, addNode } from './node-registry';
import { FlowCanvas } from './flow-canvas';
import nodeDefinitions from './node/nodes';
import NodeDataMenu from './data-menu';
import DndSidebar from './sidebar';
import { downloadNodeAsJSON, downloadTestParametersTemplate } from '@/lib/cli-export';
import { CompositeTestingPanel } from '@/components/testing/composite-testing-panel';
import type { CompositeTestSuite } from '@/lib/testing/composite-test-types';

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
  const [projectBaseline, setProjectBaseline] = useState<{ nodes: FlowNode[]; edges: Edge[] } | null>(null);
  const [showProjectTests, setShowProjectTests] = useState(false);
  const [projectTestSuite, setProjectTestSuite] = useState<CompositeTestSuite>({ tests: [], results: [] });
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
          setProjectBaseline({ nodes: project.nodes, edges: project.edges });
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
        setProjectBaseline({ nodes: updatedProject.nodes, edges: updatedProject.edges });
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

  const onCancel = useCallback(() => {
    if (projectBaseline) {
      setNodes(projectBaseline.nodes);
      setEdges(projectBaseline.edges);
      toast.message('Reverted changes');
    } else if (!projectId) {
      // If no project, revert to last local save
      onRestore();
    }
  }, [onRestore, projectBaseline, projectId, setEdges, setNodes]);

  const onTestProject = useCallback(() => {
    // Placeholder: toggle a simple tests drawer/panel for the project
    setShowProjectTests((v) => !v);
  }, []);

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

  const handleExportNode = useCallback(() => {
    if (!contextMenu) return;
    const node = contextMenu.node as Node;
    downloadNodeAsJSON(node);
    toast.success('Node exported as JSON');
    setContextMenu(null);
  }, [contextMenu]);

  const handleExportTestParams = useCallback(() => {
    if (!contextMenu) return;
    const node = contextMenu.node as Node;
    downloadTestParametersTemplate(node);
    toast.success('Test parameters template exported');
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
          {!isPreviewMode && (
            <div className="absolute top-0 inset-x-0 z-40 h-16">
              <Topbar
                title={`Project: ${currentProject?.metadata.name ?? 'Untitled'}`}
                subtitle={projectLoading ? 'Loading…' : undefined}
                onSave={onSave}
                onCancel={onCancel}
                onTest={onTestProject}
                showSave
                showCancel
                showTest
              />
            </div>
          )}
        </FlowCanvas>
      </GraphErrorBoundary>

      {contextMenu && (
        <div
          className="fixed z-50 flex flex-col rounded border border-border bg-card text-sm shadow-lg"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <Button className="px-4 py-2 text-left hover:bg-accent" onClick={handleCopyNode}>
            Copy
          </Button>
          <Button className="px-4 py-2 text-left hover:bg-accent" onClick={handleCutNode}>
            Cut
          </Button>
          {contextMenu.node.type === 'composite-node' && (
            <>
              <Button className="px-4 py-2 text-left hover:bg-accent" onClick={handleEditNode}>
                Edit
              </Button>
              <Button className="px-4 py-2 text-left hover:bg-accent" onClick={handleExportNode}>
                Export for CLI
              </Button>
              <Button className="px-4 py-2 text-left hover:bg-accent" onClick={handleExportTestParams}>
                Export Test Template
              </Button>
            </>
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

      {showProjectTests && !isPreviewMode && (
        <div className="fixed right-4 top-16 bottom-4 z-40 w-[520px] max-w-[95vw] rounded border bg-card shadow-xl flex flex-col">
          <div className="border-b px-4 py-2 text-sm font-semibold">Project Tests</div>
          <div className="flex-1 overflow-auto">
            <CompositeTestingPanel
              node={{
                id: 'project',
                type: 'composite-node',
                position: { x: 0, y: 0 },
                data: {
                  // Treat current canvas as internal graph of a composite
                  internalNodes: nodes as any,
                  internalEdges: edges as any,
                  inputs: deriveCompositeInputs(nodes as any),
                  outputs: deriveCompositeOutputs(nodes as any, edges as any),
                  enableTesting: true,
                  testSuite: projectTestSuite,
                  // minimal required base fields
                  ref: 'project',
                  entries: {},
                  isModifiable: true,
                  isResizable: true,
                } as any,
              } as any}
              testSuite={projectTestSuite}
              onTestSuiteChange={(suite) => setProjectTestSuite(suite)}
            />
          </div>
          <div className="px-4 py-2 border-t flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowProjectTests(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}


function CompositeEditorModal({ nodeId, onClose }: { nodeId: string; onClose: () => void }) {
  const { getNode, updateNodeData } = useReactFlow<Node>();
  const availableNodes = useMemo(
    () => nodeDefinitions,
    []
  );

  const [draftNodes, setDraftNodes] = useState<FlowNode[]>(() => {
    const target = getNode(nodeId);
    const nodes = cloneNodes(readInternalNodes(target));
    return injectExternalValuesIntoInternalNodes(nodes, target);
  });
  const [draftEdges, setDraftEdges] = useState<Edge[]>(() => {
    const target = getNode(nodeId);
    return cloneEdges(readInternalEdges(target));
  });

  useEffect(() => {
    const target = getNode(nodeId);
    const nodes = cloneNodes(readInternalNodes(target));
    setDraftNodes(injectExternalValuesIntoInternalNodes(nodes, target));
    setDraftEdges(cloneEdges(readInternalEdges(target)));
  }, [getNode, nodeId]);

  const handleGraphChange = useCallback((nodes: FlowNode[], edges: Edge[]) => {
    setDraftNodes(cloneNodes(nodes));
    setDraftEdges(cloneEdges(edges));
  }, []);

  const handleSave = useCallback(() => {
    const inputs = deriveCompositeInputs(draftNodes);
    const outputs = deriveCompositeOutputs(draftNodes, draftEdges);
    const outputHandlers = generateOutputHandlers(outputs);

    updateNodeData(nodeId, {
      internalNodes: cloneNodes(draftNodes),
      internalEdges: cloneEdges(draftEdges),
      inputs,
      outputs,
      outputHandlers,
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
        <Topbar
          title={`Node: ${nodeName}`}
          subtitle="Edit composite node internals"
          onCancel={handleCancel}
          onSave={handleSave}
          onTest={() => {
            // Save, enable testing on node, and close to allow testing in canvas
            const inputs = deriveCompositeInputs(draftNodes);
            const outputs = deriveCompositeOutputs(draftNodes, draftEdges);
            const outputHandlers = generateOutputHandlers(outputs);
            updateNodeData(nodeId, {
              internalNodes: cloneNodes(draftNodes),
              internalEdges: cloneEdges(draftEdges),
              inputs,
              outputs,
              outputHandlers,
              enableTesting: true,
            });
            onClose();
          }}
          showSave
          showCancel
          showTest
        />
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
    <div className="flex h-full">
      {/* Reuse existing global sidebar/context; do not render a new one here */}
      <div className="flex-1 relative">
        <ReactFlowProvider>
          <InternalWorkspace
            initialNodes={nodes}
            initialEdges={edges}
            nodeTypes={nodeTypes}
            onChange={onGraphChange}
            onRegisterAddNode={handleRegisterAddNode}
          />
          <div className="absolute top-0 right-0 h-full">
            <NodeDataMenu />
          </div>
        </ReactFlowProvider>
      </div>
    </div>
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

function injectExternalValuesIntoInternalNodes(internalNodes: FlowNode[], compositeNode: Node | undefined): FlowNode[] {
  if (!compositeNode) {
    return internalNodes;
  }

  // Get the external input values from the composite node's entries
  const externalEntries = compositeNode.data.entries || {};
  const compositeInputs = compositeNode.data.inputs as CompositeIO[] || [];

  return internalNodes.map(node => {
    if (node.type === 'internal-input') {
      // Find the corresponding external input
      const nodeHandleId = (node.data as any)?.handleId;
      if (nodeHandleId) {
        // Look for the external input value
        const externalEntry = Object.values(externalEntries).find((entry: any) => {
          // Match by handle ID in the entries
          return entry.handleId === nodeHandleId;
        });

        if (externalEntry) {
          // Inject the external value into the internal input node
          return {
            ...node,
            data: {
              ...node.data,
              value: externalEntry.value,
              // Also set up the entries as if this value was connected internally
              entries: {
                external: {
                  value: externalEntry.value,
                  handleId: 'external'
                }
              }
            }
          };
        }
      }
    }
    return node;
  });
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
