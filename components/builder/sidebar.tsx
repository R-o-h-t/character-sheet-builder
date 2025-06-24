import { useDnd } from "../../lib/context/dnd.context";
import { nodeRegistry } from "./node-registry";
import { Button } from '@/components/ui/button';




export default function DndSidebar() {

  const { type, setType } = useDnd();

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="bg-card opacity-80 border-2 p-4 w-64 h-full absolute top-0 left-0 flex flex-col gap-2">
      <h2 className="text-lg font-semibold mb-4">Nodes</h2>

      {nodeRegistry.map((node) => (
        <Button
          key={node.type}
          onDragStart={(event) => onDragStart(event, node.type)}
          draggable
          className="flex justify-start gap-2 p-2 cursor-pointer px-4"
        >
          <node.icon className="h-5 w-5" />
          <span className="ml-2"> {node.label}</span>
        </Button>
      ))}
    </aside>
  );
}

