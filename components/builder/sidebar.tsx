import { Button } from '@/components/ui/button';
import { useDnd } from '../../lib/context/dnd.context';
import { ErrorBoundary } from '../error-boundary/error-boundary';
import nodeRegistry from './node/nodes';

export default function DndSidebar() {
  const { setType } = useDnd();

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <ErrorBoundary
      level="app"
      fallback={
        <aside className="bg-card opacity-80 border-2 p-4 w-64 h-full absolute top-0 left-0 flex flex-col gap-2 z-[9999]">
          <h2 className="text-lg font-semibold mb-4">Nodes</h2>
          <div className="text-sm text-muted-foreground">
            Error loading sidebar
          </div>
        </aside>
      }
    >
      <aside className="bg-card opacity-80 border-2 p-4 w-64 h-full absolute top-0 left-0 flex flex-col gap-2 z-[9999]">
        <h2 className="text-lg font-semibold mb-4">Nodes</h2>

        {nodeRegistry
          .map((node) => (
            <ErrorBoundary
              key={node.type}
              level="node"
              fallback={
                <Button className="flex justify-start gap-2 p-2 cursor-not-allowed px-4 opacity-50">
                  <span className="ml-2">Error loading {node.label}</span>
                </Button>
              }
            >
              <Button
                onDragStart={(event) => onDragStart(event, node.type)}
                draggable
                className="flex justify-start gap-2 p-2 cursor-pointer px-4"
              >
                <node.icon className="h-5 w-5" />
                <span className="ml-2">{node.label}</span>
              </Button>
            </ErrorBoundary>
          ))}
      </aside>
    </ErrorBoundary>
  );
}
