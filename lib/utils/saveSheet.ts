import { useSheetStore } from '@/lib/stores/sheetStore';

export const exportSheet = () => {
  const nodes = useSheetStore.getState().nodes;
  return JSON.stringify(nodes, null, 2);
};

export const importSheet = (json: string) => {
  const parsed = JSON.parse(json);
  useSheetStore.getState().setNodes(parsed);
};
