import { Edge, OnSelectionChangeFunc, useNodesData, useOnSelectionChange, useReactFlow } from "@xyflow/react";
import { Copy } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ErrorBoundary } from "../error-boundary/error-boundary";
import { getNodeDefinition, Node, NodeDefinition } from "./node-registry";
import { NodeDataFormulaUpdater } from "./node/formula/formula-data-updater";
import { formatValue, isErrorValue } from "./node/utils/value";


export default function NodeDataMenu() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { getNodes } = useReactFlow();

  // Force update selection on every render cycle
  useEffect(() => {
    const nodes = getNodes();
    const selectedNodes = nodes.filter(node => node.selected);

    const newSelectedId = selectedNodes.length === 1 ? selectedNodes[0].id : null;

    if (newSelectedId !== selectedNodeId) {
      setSelectedNodeId(newSelectedId);
    }
  }, [getNodes, selectedNodeId]);

  // Backup selection handler
  const onChange: OnSelectionChangeFunc<Node, Edge> = useCallback(({ nodes }) => {
    const newSelectedId = nodes.length === 1 ? nodes[0].id : null;
    setSelectedNodeId(newSelectedId);
  }, []);

  useOnSelectionChange({
    onChange,
  });

  return (
    <ErrorBoundary
      level="app"
      fallback={
        <aside className="bg-card opacity-80 border-2 p-4 w-84 h-full absolute top-14 right-0 flex flex-col gap-2">
          <div className="text-sm text-muted-foreground">
            Error loading data menu
          </div>
        </aside>
      }
    >
      <aside className="bg-card opacity-80 border-2 p-4 w-84 h-full absolute top-14 right-0 flex flex-col gap-2">
        {selectedNodeId && (
          <>
            <ErrorBoundary level="node" fallback={<div className="text-xs text-red-500">Error loading node info</div>}>
              <NodeInfoView key={`info-${selectedNodeId}`} id={selectedNodeId} />
            </ErrorBoundary>
            <ErrorBoundary level="node" fallback={<div className="text-xs text-red-500">Error loading error banner</div>}>
              <NodeErrorBanner key={`error-${selectedNodeId}`} id={selectedNodeId} />
            </ErrorBoundary>
            <ErrorBoundary level="node" fallback={<div className="text-xs text-red-500">Error loading JSON view</div>}>
              <NodeDataJsonView key={`json-${selectedNodeId}`} id={selectedNodeId} />
            </ErrorBoundary>
            <ErrorBoundary level="node" fallback={<div className="text-xs text-red-500">Error loading update form</div>}>
              <NodeDataUpdateForm key={`form-${selectedNodeId}`} id={selectedNodeId} />
            </ErrorBoundary>
            <ErrorBoundary level="node" fallback={<div className="text-xs text-red-500">Error loading entries view</div>}>
              <NodeEntriesView key={`entries-${selectedNodeId}`} id={selectedNodeId} />
            </ErrorBoundary>
          </>
        )}
      </aside>
    </ErrorBoundary>
  );
}

export function NodeEntriesView({ id }: { id: string }) {
  const node = useNodesData<Node>(id);


  if (!node) {
    return (
      <div className="text-red-500">
        Node not found or not selected.
      </div>
    );
  }
  // list the connected nodes
  return (
    <div className="bg-gray-100 p-4 rounded-md overflow-auto">
      <h3 className="text-lg font-semibold mb-2">Linked Nodes</h3>
      <div className="flex flex-col gap-2">
        {Object.keys(node.data.entries).length > 0 && (
          <div>
            <h4 className="font-semibold">Linked From:</h4>
            <ul className="list-disc pl-5">
              {Object.entries(node.data.entries).map(([key, entry]) => (
                <li key={key} className="flex items-center gap-2 space-x-2">
                  {/* Node Ref */}
                  <span className="text-blue-500 font-mono ml-2 cursor-pointer"
                    onClick={() => {
                      // copy the id to clipboard
                      navigator.clipboard.writeText(key);
                      toast.success("Handle ID copied to clipboard");
                    }}
                  >
                    {key}
                  </span>
                  {entry.sourceRef && (
                    <span
                      className="text-xs text-muted-foreground cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText(entry.sourceRef ?? '');
                        toast.success("Source ref copied to clipboard");
                      }}
                    >
                      source: {entry.sourceRef}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    Value: {formatValue(entry.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div >
  );
}

export function NodeDataJsonView({ id }: { id: string }) {
  const node = useNodesData<Node>(id);

  if (!node) {
    return (
      <div className="text-red-500">
        Node not found or not selected.
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
      <h3 className="text-lg font-semibold mb-2">Node Data JSON</h3>
      <pre className="whitespace-pre-wrap break-words">
        {JSON.stringify(node.data, null, 2)}
      </pre>
    </div>
  );
}

export function NodeInfoView({ id }: { id: string }) {
  const node = useNodesData<Node>(id);
  if (!node) {
    return (
      <div className="text-red-500">
        Node not found or not selected.
      </div>
    );
  }

  const definition = getNodeDefinition(node.type);

  if (!definition) {
    return (
      <div className="text-red-500">
        Node definition not found.
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-4 rounded-md overflow-auto">
      <h3 className="text-lg font-semibold mb-2">Node Info</h3>
      <p className="mb-2"><strong>Type:</strong> {definition.type}</p>
      <p className="mb-2"><strong>Label:</strong> {definition.label}</p>
      <p className="mb-2"><strong>Description:</strong> {definition.description || "No description available."}</p>
      <p className="mb-2"><strong>Category:</strong> {definition.category || "Uncategorized"}</p>
      <p className="mb-2"><strong>Info:</strong> {definition.info || "No additional info available."}</p>
    </div>
  );

}


export function NodeErrorBanner({ id }: { id: string }) {
  const node = useNodesData<Node>(id);
  if (!node) {
    return null;
  }

  const value = node.data?.value;
  if (!isErrorValue(value)) {
    return null;
  }

  return (
    <div className="rounded border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <span className="font-semibold">Error:</span> {value.error}
    </div>
  );
}





export function NodeDataUpdateForm({ id }: { id: string }) {

  const { updateNodeData } = useReactFlow<Node>();
  const node = useNodesData<Node>(id);

  const [definition, setDefinition] = useState<NodeDefinition | undefined>();

  useEffect(() => {
    if (node) {
      setDefinition(getNodeDefinition(node.type));
    }
  }, [node, id]);

  if (!node) {
    return (
      <div className="text-red-500">
        Node not found or not selected.
      </div>
    );
  }
  if (!definition || !definition.properties) {
    return (
      <div className="text-red-500">
        No editable properties available for this node type.
      </div>
    );
  }


  function _updateNodeData(propertyKey: string, value: unknown) {
    if (!node || !definition || !definition.properties) {
      return;
    }
    const updatedData = {
      ...node.data,
      [propertyKey]: value,
    };
    node.data = updatedData;
    updateNodeData(node.id, updatedData);
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">Edit Node Data</h3>
      {/* only allow update of the definition.properties */}
      {definition?.properties &&
        Object.entries(definition.properties).map(([key, prop]) => {
          switch (prop.type) {
            case "string":
              return (
                <NodeDataTextUpdater
                  key={key}
                  label={prop.label || key}
                  value={node.data[key] as string}
                  onChange={(value) => _updateNodeData(key, value)}
                />
              );
            case 'boolean':
              return (
                <NodeDataBooleanUpdater
                  key={key}
                  label={prop.label || key}
                  value={node.data[key] as boolean}
                  onChange={(value) => _updateNodeData(key, value)}
                />
              );
            case 'select':
              return (
                <NodeDataSelectUpdater
                  key={key}
                  label={prop.label || key}
                  value={node.data[key] as string}
                  options={(
                    prop.options || (node.data.options as string[]) || []).map((option) => ({
                      label: option,
                      value: option,
                    }))}
                  onChange={(value) => _updateNodeData(key, value)}
                />
              );
            case 'number':
              return (
                <NodeDataNumberUpdater
                  key={key}
                  label={prop.label || key}
                  value={node.data[key] as number}
                  min={
                    key === "value" ? (node.data.min as number | undefined) :
                      key === "max" ? (node.data.min as number | undefined) :
                        undefined
                  }
                  max={
                    key === "value" ? (node.data.max as number | undefined) :
                      key === "max" ? (node.data.max as number | undefined) :
                        undefined
                  }
                  onChange={(value) => _updateNodeData(key, value)}
                />
              );
            case 'formula':
              return (
                <NodeDataFormulaUpdater
                  key={key}
                  label={prop.label || key}
                  value={node.data[key] as string}
                  onChange={(value) => _updateNodeData(key, value)}
                />
              );
            case 'color':
              return (
                <NodeDataColorUpdater
                  key={key}
                  label={prop.label || key}
                  value={node.data[key] as string}
                  onChange={(value) => _updateNodeData(key, value)}
                />
              );
            case 'id':
              return (
                <NodeDataIdUpdater
                  key={key}
                  label={prop.label || key}
                  value={node.data[key] as string}
                  onChange={(value) => _updateNodeData(key, value)}
                />
              );

          }
        })}
    </div>
  );
}


// can only contain uppercase letters, and underscores
export function NodeDataIdUpdater({
  value,
  label,
  onChange
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase().replace(/[^A-Z_]/g, '');
    onChange(newValue);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{label}:</label>
      <input
        type="string"
        value={value}
        onChange={(e) => handleChange(e)}
        pattern="[A-Z_]+"
        title="ID must contain only uppercase letters and underscores"
        className="border p-1 rounded w-full"
      />
      <Button
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Text copied to clipboard");
        }}
        size="icon"
        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function NodeDataBooleanUpdater({
  value,
  label,
  onChange
}: {
  value: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{label}:</label>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="cursor-pointer"
      />

    </div>
  );
}


export function NodeDataSelectUpdater({
  value,
  label,
  options,
  onChange
}: {
  value: string | number;
  label: string;
  options: Array<{ label: string; value: string | number }>;
  onChange: (value: string | number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-1 rounded w-full"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function NodeDataNumberUpdater({
  value,
  label,
  min,
  max,
  onChange
}: {
  value: number;
  label: string;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {

  useEffect(() => {
    if (min !== undefined && value < min) {
      onChange(min || 0);
    }
    if (max !== undefined && value > max) {
      onChange(max || 0);
    }
  }, [value, min, max, onChange]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{label}:</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        className="border p-1 rounded w-full"
      />
    </div>
  );
}


export function NodeDataTextUpdater({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{label}:</label>
      <input
        type="string"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border p-1 rounded w-full"
      />

    </div>
  );
}

export function NodeDataColorUpdater({
  value,
  label,
  onChange
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  const [color, setColor] = useState(value);


  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">{label}:</label>
      <input
        type="color"
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
        }}
        className="cursor-pointer w-10 h-10 border rounded"
      />
      <button
        onClick={() => {
          onChange(color);
          toast.success("Color updated");
        }}
        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
      >
        Update Color
      </button>
    </div>
  );
}


export function toReadableValue(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return "Object{" + Object.keys(value).length + " keys}";
  }
  return String(value);
}
