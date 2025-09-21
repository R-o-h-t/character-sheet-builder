import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { memo, useEffect, useMemo } from 'react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { createError, getEntryByHandle, isErrorValue } from '../../utils/value';

const defaultSize = { width: 260, height: 180 };

type ObjectField = {
  id: string;
  key: string;
  handleId: string;
};

type ObjectNodeData = {
  fields?: ObjectField[];
};

const HANDLE_PREFIX = 'field-';

function ObjectNode({ id, data, selected }: NodeProps<Node<ObjectNodeData, Record<string, unknown> | { error: string }>>) {
  const { updateNodeData } = useReactFlow<Node>();
  const fields = useMemo(() => data.fields ?? [], [data.fields]);

  useEffect(() => {
    if (!data.fields) {
      updateNodeData(id, { fields: [createField()] });
    }
  }, [data.fields, id, updateNodeData]);

  const output = useMemo(() => {
    if (!fields.length) {
      return {} as Record<string, unknown>;
    }

    const result: Record<string, unknown> = {};
    const seen = new Set<string>();

    for (const field of fields) {
      const key = field.key.trim();
      if (!key) {
        return createError('All object entries require a key');
      }
      if (seen.has(key)) {
        return createError(`Duplicate key "${key}"`);
      }
      seen.add(key);

      const entry = getEntryByHandle(data.entries, field.handleId);
      if (!entry) {
        continue;
      }
      if (isErrorValue(entry.value)) {
        return entry.value;
      }
      result[key] = entry.value;
    }

    return result;
  }, [fields, data.entries]);

  useEffect(() => {
    updateNodeData(id, { value: output });
  }, [id, output, updateNodeData]);

  const canAddField = fields.length === 0 || fields[fields.length - 1].key.trim().length > 0;

  const handleKeyChange = (fieldId: string, value: string) => {
    const nextFields = fields.map((field) =>
      field.id === fieldId ? { ...field, key: value } : field
    );
    updateNodeData(id, { fields: nextFields });
  };

  const handleRemoveField = (fieldId: string) => {
    const nextFields = fields.filter((field) => field.id !== fieldId);
    updateNodeData(id, { fields: nextFields.length ? nextFields : [createField()] });
  };

  const handleAddField = () => {
    if (!canAddField) {
      return;
    }
    updateNodeData(id, { fields: [...fields, createField()] });
  };

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: null,
          source: {
            position: Position.Right,
            separateHandles: false,
          },
        },
      }}
    >
      <div className="flex h-full w-full flex-col gap-3 p-3">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>Object</span>
          <Button variant="ghost" size="icon" onClick={handleAddField} disabled={!canAddField}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex flex-col gap-2 text-xs">
          {fields.map((field) => {
            const entry = getEntryByHandle(data.entries, field.handleId);
            const isConnected = Boolean(entry);
            const hasError = isErrorValue(entry?.value);
            return (
              <div key={field.id} className="relative flex items-center gap-2 pl-6">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`${id}-target-${field.handleId}`}
                  className="!w-2 !h-2"
                  style={{ top: '50%', transform: 'translate(-50%, -50%)' }}
                  isConnectable={!isConnected}
                />
                <Input
                  value={field.key}
                  placeholder="key"
                  onChange={(event) => handleKeyChange(field.id, event.target.value)}
                  className="h-8 flex-1"
                />
                <span
                  className={
                    hasError
                      ? 'text-destructive text-[10px]'
                      : isConnected
                        ? 'text-emerald-500 text-[10px]'
                        : 'text-muted-foreground text-[10px]'
                  }
                >
                  {hasError ? 'error' : isConnected ? 'connected' : 'waiting'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveField(field.id)}
                  className="text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Resizable>
  );
}

function createField(): ObjectField {
  const id = nanoid(6);
  return {
    id,
    key: '',
    handleId: `${HANDLE_PREFIX}${id}`,
  };
}

export const definition: NodeDefinition<ObjectNodeData> = {
  type: 'internal-object',
  icon: PlusCircle,
  label: 'Object',
  component: memo(ObjectNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Internal',
};

export default definition;
