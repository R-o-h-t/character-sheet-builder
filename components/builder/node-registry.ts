

import { LucideIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { BaseNodeProperties, baseProperties, generateBaseProperties, generateReadableId } from './node/base/base-node-properties';
// Import others here
import nodeRegistry from './node/nodes';

// For React Flow nodeTypes:
export const nodeTypes = Object.fromEntries(
  nodeRegistry.map((n) => [n.type, n.component])
);

// For sidebar or DnD logic:
export const getNodeDefinition = (type: string) =>
  nodeRegistry.find((n) => n.type === type);


export type NodeProperty<T = any> = {
  label?: string;
  hidden?: boolean;
  value: T;
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'date' | 'formula' | 'id' | 'options';
  options?: string[];
}

export type NodeProperties = Record<string, NodeProperty<any>>;


export type NodeDefinition<T extends NodeProperties = NodeProperties> = {
  type: string;
  icon: LucideIcon;
  label: string;
  component: React.ComponentType<any>;
  defaultSize?: { width: number; height: number };
  isResizable?: boolean;
  isModifiable?: boolean;
  properties?: T
  description?: string;
  info?: string;
  category?: string;
}

export type NodeDataFromProperties<T extends NodeProperties, U = any> = {
  isModifiable?: boolean;
  isResizable?: boolean;
  value?: U;
  ref: string;
} & {
  [K in keyof T]: T[K]['value']
} & {
  [K in keyof BaseNodeProperties]: BaseNodeProperties[K]['value']
};

export type Node<T extends NodeProperties = NodeProperties, U = any> = {
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
    },
    width: nodeDef.defaultSize?.width,
    height: nodeDef.defaultSize?.height,
  };
}

