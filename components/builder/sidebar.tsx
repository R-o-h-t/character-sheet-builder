import { useDnd } from "../../lib/context/dnd.context";
import { nodeRegistry } from "./node-registry";




export default function DndSidebar() {

  const { type, setType } = useDnd();

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="bg-gray-100 p-4 w-64 h-full absolute top-0 left-0">
      {nodeRegistry.map((node) => (
        <div
          key={node.type}
          onDragStart={(event) => onDragStart(event, node.type)}
          draggable
        >
          {node.label}
        </div>
      ))}
    </aside>
  );
}

