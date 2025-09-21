import { Button } from "@/components/ui/button";
import { NodeProps, useReactFlow } from "@xyflow/react";
import { Hash, Minus, Plus } from "lucide-react";
import { memo } from "react";
import { Node, NodeDefinition } from "../../node-registry";
import { BaseFieldNode, NodeField } from "../base/base-field-node";


const numberNodeData = {
  value: {
    label: "Value",
    type: "number" as const,
    value: 0,
  },
  min: {
    label: "Minimum Value",
    type: "number" as const,
    value: 0,
  },
  max: {
    label: "Maximum Value",
    type: "number" as const,
    value: 20,
  },
};

type NumberNodeProperties = typeof numberNodeData

const defaultSize = { width: 220, height: 110 };

function NumberNode({ id, data, selected }: NodeProps<Node<NumberNodeProperties>>) {
  const { updateNodeData } = useReactFlow();

  // Cast data to access our custom fields property
  const nodeData = data as typeof data & { fields?: NodeField[] };

  const processFields = (fields: NodeField[], entries: Record<string, any>) => {
    const field = fields[0];
    const entry = field ? entries[field.handleId] : undefined;
    const connected = entry && entry.value !== undefined && entry.value !== null;
    const base = Number(data.value ?? 0);
    const val = connected ? Number(entry.value) : base;
    const clamped = Math.max(Math.min(val, Number(data.max ?? Infinity)), Number(data.min ?? -Infinity));
    return clamped;
  };

  return (
    <BaseFieldNode
      id={id}
      data={nodeData}
      selected={selected}
      title="Number"
      icon={Hash}
      allowAddField={false}
      allowRemoveField={false}
      processFields={processFields}
      customFieldRenderer={(field, _entry, onKeyChange) => (
        <div key={field.id} className="relative flex items-center gap-2 pl-6 w-full justify-center">
          {/* hidden key input to satisfy BaseFieldNode structure */}
          <input
            value={field.key}
            onChange={(e) => onKeyChange(e.target.value)}
            className="hidden"
          />
          {data.isModifiable ? (
            <>
              <Button
                className="w-8 h-8 flex items-center justify-center"
                disabled={data.value <= data.min}
                onClick={() => {
                  updateNodeData(id, { value: Math.max(Number(data.value) - 1, Number(data.min)) });
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <input
                type="number"
                value={data.value}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  updateNodeData(id, { value: isNaN(n) ? 0 : n });
                }}
                className="bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500 text-center w-[70px] mx-2"
              />
              <Button
                className="w-8 h-8 flex items-center justify-center"
                disabled={data.value >= data.max}
                onClick={() => {
                  updateNodeData(id, { value: Math.min(Number(data.value) + 1, Number(data.max)) });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <span>{String(data.value)}</span>
          )}
        </div>
      )}
    />
  );
}


export const definition: NodeDefinition<NumberNodeProperties> = {
  type: 'number',
  icon: Hash,
  label: 'Number Node',
  properties: numberNodeData,
  component: memo(NumberNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
};


export default definition;
