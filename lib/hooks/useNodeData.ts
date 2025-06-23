import { useCallback } from 'react';
import { useSheetStore } from '@/lib/stores/sheetStore';

export const useNodeData = (id: string) => {
  const node = useSheetStore((state) => state.nodes.find((n) => n.id === id));
  const updateNode = useSheetStore((state) => state.updateNode);

  if (!node) {
    throw new Error(`Node with id "${id}" not found`);
  }

  const update = useCallback(
    (partialData: Partial<typeof node.data>) => {
      updateNode(id, {
        data: { ...node.data, ...partialData },
      });
    },
    [id, node.data, updateNode]
  );

  return {
    data: node.data,
    update,
  };
};
