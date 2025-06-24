import { definition as TextNode } from './node/text-node';
import { definition as NumberNode } from './node/number-input-node';
import { LucideIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
// Import others here

export const nodeRegistry: NodeDefinition[] = [TextNode, NumberNode /*, ...other nodes */];

// For React Flow nodeTypes:
export const nodeTypes = Object.fromEntries(
  nodeRegistry.map((n) => [n.type, n.component])
);

// For sidebar or DnD logic:
export const getNodeDefinition = (type: string) =>
  nodeRegistry.find((n) => n.type === type);


export type NodeProperty<T = any> = {
  label?: string;
  value: T;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'date';
  options?: string[]; // For select type
}

export type NodeProperties = Record<string, NodeProperty<any>>;


export type NodeDefinition<T extends NodeProperties = any> = {
  type: string;
  icon: LucideIcon;
  label: string;
  component: React.ComponentType<any>;
  defaultSize?: { width: number; height: number };
  isResizable?: boolean;
  isModifiable?: boolean;
  properties?: T
}

export type NodeDataFromProperties<T extends NodeProperties> = {
  isModifiable?: boolean;
  isResizable?: boolean;
} & {
  [K in keyof T]: T[K]['value']
};

export type Node<T extends NodeProperties = NodeProperties> = {
  id: string;
  type: string;
  data: NodeDataFromProperties<T>;
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
    },
    width: nodeDef.defaultSize?.width,
    height: nodeDef.defaultSize?.height,
  };
}
