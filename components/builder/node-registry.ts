import { NodeProps } from '@xyflow/react';
import { LucideIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { BaseNodeProperties, generateBaseProperties, generateReadableId } from './node/base/base-node-properties';
import { withNodeErrorBoundary } from '../error-boundary/with-node-error-boundary';
// Import others here
import nodeRegistry from './node/nodes';

// For React Flow nodeTypes - wrap each component with error boundary:
export const nodeTypes = Object.fromEntries(
  nodeRegistry.map((n) => [
    n.type, 
    withNodeErrorBoundary(n.component, n.label)
  ])
);

// For sidebar or DnD logic:
export const getNodeDefinition = (type: string) =>
  nodeRegistry.find((n) => n.type === type);


export type NodeProperty<T = unknown> = {
  label?: string;
  hidden?: boolean;
  value: T;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'date' | 'formula' | 'id' | 'options';
  options?: string[];
}

export type NodeProperties = Record<string, NodeProperty<unknown>>;


export type NodeDefinition<T extends NodeProperties = NodeProperties, U = unknown> = {
  type: string;
  icon: LucideIcon;
  label: string;
  component: React.ComponentType<NodeProps<Node<T, U>>>
  defaultSize?: { width: number; height: number };
  isResizable?: boolean;
  isModifiable?: boolean;
  properties?: T
  description?: string;
  info?: string;
  category?: string;
}

export type NodeDataFromProperties<T extends NodeProperties, U = unknown> = {
  isModifiable?: boolean;
  isResizable?: boolean;
  value?: U;
  ref: string;
  entries: Record<string, {
    value: unknown;
    handleId: string;
    sourceNodeId?: string;
    sourceHandleId?: string;
    sourceRef?: string;
  }>
} & {
  [K in keyof T]: T[K]['value']
} & {
  [K in keyof BaseNodeProperties]: BaseNodeProperties[K]['value']
};

export type Node<T extends NodeProperties = NodeProperties, U = unknown> = {
  id: string;
  type: string;
  data: NodeDataFromProperties<T, U>;
  position: { x: number; y: number };
  selected?: boolean;
  width?: number;
  height?: number;
};

export function addNode({
  type,
  position,
}: {
  type: string;
  position: { x: number; y: number };
}): Node | undefined {
  const nodeDef = getNodeDefinition(type);
  if (!nodeDef) return undefined;

  const defaultPropertiesValues = nodeDef.properties && Object.fromEntries(
    Object.entries(nodeDef.properties).map(([key, prop]) => [
      key,
      (prop as NodeProperty).value
    ])
  );

  return {
    id: nanoid(),
    type: nodeDef.type,
    position,
    data: {
      isModifiable: nodeDef.isModifiable ?? true,
      isResizable: nodeDef.isResizable ?? true,
      ...defaultPropertiesValues,
      ...generateBaseProperties(),
      ref: generateReadableId(),
      entries: {},
    },
  };
}
