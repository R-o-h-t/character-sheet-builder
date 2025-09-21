import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Handle, NodeProps, Position, useReactFlow } from '@xyflow/react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { nanoid } from 'nanoid';
import { memo, useEffect, useMemo, ReactNode } from 'react';

import { Node } from '../../node-registry';
import { Resizable } from './node-resizer';
import { createError, getEntryByHandle, isErrorValue } from '../utils/value';

export type NodeField = {
  id: string;
  key: string;
  handleId: string;
  value?: unknown;
  label?: string;
};

export type BaseFieldNodeData = {
  fields?: NodeField[];
  entries?: Record<string, { value: unknown; handleId: string; sourceNodeId?: string; sourceHandleId?: string; sourceRef?: string }>;
  [key: string]: unknown;
};

export type BaseFieldNodeProps = {
  id: string;
  data: any; // Use any to work with the complex Node type system
  selected: boolean;
  title: string;
  handlePrefix?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: ReactNode;
  processFields?: (fields: NodeField[], entries: Record<string, { value: unknown; handleId: string; sourceNodeId?: string; sourceHandleId?: string; sourceRef?: string }>) => unknown;
  allowAddField?: boolean;
  allowRemoveField?: boolean;
  fieldKeyPlaceholder?: string;
  customFieldRenderer?: (field: NodeField, entry: { value: unknown; handleId: string } | undefined, onKeyChange: (value: string) => void, onRemove: () => void) => ReactNode;
};

const HANDLE_PREFIX = 'field-';

export function BaseFieldNode({
  id,
  data,
  selected,
  title,
  handlePrefix = HANDLE_PREFIX,
  icon: Icon = PlusCircle,
  children,
  processFields,
  allowAddField = true,
  allowRemoveField = true,
  fieldKeyPlaceholder = 'key',
  customFieldRenderer,
}: BaseFieldNodeProps) {
  const { updateNodeData } = useReactFlow<Node>();
  const fields = useMemo(() => data.fields ?? [], [data.fields]);

  useEffect(() => {
    if (!data.fields) {
      updateNodeData(id, { fields: [createField(handlePrefix)] });
    }
  }, [data.fields, id, updateNodeData, handlePrefix]);

  const output = useMemo(() => {
    if (!fields.length) {
      return processFields ? processFields([], data.entries || {}) : {};
    }

    if (processFields) {
      return processFields(fields, data.entries || {});
    }

    // Default object processing
    const result: Record<string, unknown> = {};
    const seen = new Set<string>();

    for (const field of fields) {
      const key = field.key.trim();
      if (!key) {
        return createError('All entries require a key');
      }
      if (seen.has(key)) {
        return createError(`Duplicate key "${key}"`);
      }
      seen.add(key);

      const entry = getEntryByHandle(data.entries || {}, field.handleId);
      if (!entry) {
        continue;
      }
      if (isErrorValue(entry.value)) {
        return entry.value;
      }
      result[key] = entry.value;
    }

    return result;
  }, [fields, data.entries, processFields]);

  useEffect(() => {
    updateNodeData(id, { value: output });
  }, [id, output, updateNodeData]);

  const canAddField = !allowAddField ? false : (fields.length === 0 || fields[fields.length - 1].key.trim().length > 0);

  const handleKeyChange = (fieldId: string, value: string) => {
    const nextFields = fields.map((field: NodeField) =>
      field.id === fieldId ? { ...field, key: value } : field
    );
    updateNodeData(id, { fields: nextFields });
  };

  const handleRemoveField = (fieldId: string) => {
    if (!allowRemoveField) return;
    const nextFields = fields.filter((field: NodeField) => field.id !== fieldId);
    updateNodeData(id, { fields: nextFields.length ? nextFields : [createField(handlePrefix)] });
  };

  const handleAddField = () => {
    if (!canAddField) {
      return;
    }
    updateNodeData(id, { fields: [...fields, createField(handlePrefix)] });
  };

  const renderField = (field: NodeField) => {
    const entry = getEntryByHandle(data.entries || {}, field.handleId);
    const isConnected = Boolean(entry);
    const hasError = isErrorValue(entry?.value);

    if (customFieldRenderer) {
      return customFieldRenderer(
        field,
        entry,
        (value: string) => handleKeyChange(field.id, value),
        () => handleRemoveField(field.id)
      );
    }

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
          placeholder={fieldKeyPlaceholder}
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
        {allowRemoveField && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveField(field.id)}
            className="text-muted-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
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
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span>{title}</span>
          </div>
          {allowAddField && (
            <Button variant="ghost" size="icon" onClick={handleAddField} disabled={!canAddField}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          )}
        </header>
        <div className="flex flex-col gap-2 text-xs">
          {fields.map(renderField)}
        </div>
        {children}
      </div>
    </Resizable>
  );
}

function createField(handlePrefix: string = HANDLE_PREFIX): NodeField {
  const id = nanoid(6);
  return {
    id,
    key: '',
    handleId: `${handlePrefix}${id}`,
  };
}

export { createField };
