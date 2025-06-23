import { nodeRegistry } from '@/components/builder/node-registry';
import { Node, XYPosition } from '@xyflow/react';
import { create } from 'zustand';

export interface NodeData extends Node {
  id: string;
  type: string;
  position: XYPosition;
  width?: number;
  height?: number;
  data: Record<string, any>;
};

type SheetStore = {
  nodes: NodeData[];
  addNode: (type: string, position: XYPosition) => void;
  updateNode: (id: string, update: Partial<NodeData>) => void;
  removeNode: (id: string) => void;
  setNodes: (nodes: NodeData[]) => void;
};

let counter = 0;
const generateId = (prefix: string = 'node') => `${prefix}-${counter++}`;

export const useSheetStore = create<SheetStore>((set) => ({
  nodes: [],
  addNode: (type, position) =>
    set((state) => {
      const node = nodeRegistry.find((n) => n.type === type);
      if (!node) {
        console.error(`Node type "${type}" not found in registry.`);
        return state;
      }
      const id = generateId(type);

      return {
        nodes: [
          ...state.nodes,
          {
            ...node,
            id,
            position,
            data: {
              ...node.defaultData,
              id,
              position
            }
          },
        ],
      };
    }),
  updateNode: (id, update) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...update, data: { ...n.data, ...update.data } } : n
      ),
    })),
  removeNode: (id) =>
    set((state) => ({ nodes: state.nodes.filter((n) => n.id !== id) })),
  setNodes: (nodes) => set({ nodes }),
}));
