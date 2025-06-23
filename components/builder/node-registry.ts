import { definition as TextNode } from './node/text-node';
// Import others here

export const nodeRegistry = [TextNode /*, ...other nodes */];

// For React Flow nodeTypes:
export const nodeTypes = Object.fromEntries(
  nodeRegistry.map((n) => [n.type, n.component])
);

// For sidebar or DnD logic:
export const getNodeDefinition = (type: string) =>
  nodeRegistry.find((n) => n.type === type);
