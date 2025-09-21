import { Handle, Position } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import type { EntryValue } from '../utils/value';
import { formatValue, isErrorValue } from '../utils/value';

export type ConnectionFieldProps = {
  nodeId: string;
  handleId: string;
  label: string;
  type: 'number' | 'boolean' | 'text';
  value: unknown;
  entry?: EntryValue;
  onChange: (value: string) => void;
};

export function ConnectionField({ nodeId, handleId, label, type, value, entry, onChange }: ConnectionFieldProps) {
  const isConnected = Boolean(entry);
  const error = entry ? isErrorValue(entry.value) : false;
  const handleDomId = `${nodeId}-target-${handleId}`;

  return (
    <div className="relative flex items-center text-xs">
      <Handle
        type="target"
        position={Position.Left}
        id={handleDomId}
        isConnectable={!isConnected}
        className="!h-2.5 !w-2.5 !bg-border"
        style={{ left: 0, top: '50%', transform: 'translate(-50%, -50%)' }}
      />
      <div className="ml-4 flex w-full items-center gap-2">
        <span className="font-medium text-muted-foreground">{label}</span>
        <div className="ml-auto flex min-w-[120px] flex-1 items-center justify-end gap-2">
          {isConnected && entry ? (
            <div className="flex flex-col items-end text-right">
              <span className={error ? 'font-medium text-destructive' : 'text-foreground'}>
                {formatValue(entry.value)}
              </span>
              {entry.sourceRef && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {entry.sourceRef}
                </span>
              )}
            </div>
          ) : type === 'boolean' ? (
            <select
              className="h-7 min-w-[72px] rounded border border-border bg-background px-2 text-xs"
              value={normalizeBoolean(value)}
              onChange={(event) => onChange(event.target.value)}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <Input
              value={value === undefined || value === null ? '' : String(value)}
              onChange={(event) => onChange(event.target.value)}
              className="h-7 w-full max-w-[120px] text-xs"
              type={type === 'number' ? 'number' : 'text'}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeBoolean(value: unknown): 'true' | 'false' {
  if (typeof value === 'string') {
    return value === 'true' ? 'true' : 'false';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return 'false';
}
