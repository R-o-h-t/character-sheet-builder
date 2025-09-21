'use client';

import { Handle, Position } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
  ConnectionValue,
  formatValue,
  isErrorValue,
  formatValueAsJson
} from '../utils/connection-system';

export type ConnectionInputProps = {
  nodeId: string;
  handleId: string;
  label: string;
  type: 'number' | 'boolean' | 'text' | 'any';
  connection?: ConnectionValue;
  fallbackValue?: unknown;
  onChange?: (value: unknown) => void;
  showJsonPreview?: boolean;
};

export function ConnectionInput({
  nodeId,
  handleId,
  label,
  type,
  connection,
  fallbackValue,
  onChange,
  showJsonPreview = false
}: ConnectionInputProps) {
  const [localValue, setLocalValue] = useState(fallbackValue);
  const isConnected = connection?.isConnected ?? false;
  const hasError = connection?.error !== undefined;
  const handleDomId = `${nodeId}-target-${handleId}`;

  // Update local value when fallback changes
  useEffect(() => {
    if (!isConnected) {
      setLocalValue(fallbackValue);
    }
  }, [fallbackValue, isConnected]);

  const handleInputChange = (newValue: string) => {
    let processedValue: unknown = newValue;

    if (type === 'number') {
      const num = parseFloat(newValue);
      processedValue = isNaN(num) ? 0 : num;
    } else if (type === 'boolean') {
      processedValue = newValue === 'true';
    }

    setLocalValue(processedValue);
    onChange?.(processedValue);
  };

  const displayValue = isConnected ? connection?.value : localValue;

  return (
    <div className="relative flex flex-col gap-1">
      <div className="flex items-center text-xs">
        <Handle
          type="target"
          position={Position.Left}
          id={handleDomId}
          isConnectable={!isConnected} // Only allow 1 connection per input
          className="!h-2.5 !w-2.5 !bg-border"
          style={{ left: 0, top: '50%', transform: 'translate(-50%, -50%)' }}
        />

        <div className="ml-4 flex w-full items-center gap-2">
          <span className="font-medium text-muted-foreground min-w-[40px]">{label}</span>

          <div className="ml-auto flex min-w-[120px] flex-1 items-center justify-end gap-2">
            {isConnected ? (
              <div className="flex flex-col items-end text-right">
                <span className={hasError ? 'font-medium text-destructive' : 'text-foreground'}>
                  {formatValue(displayValue)}
                </span>
                {connection?.sourceNodeId && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    from {connection.sourceNodeId}
                  </span>
                )}
              </div>
            ) : (
              // Show input field when not connected
              <div className="flex flex-col items-end gap-1">
                {type === 'boolean' ? (
                  <select
                    className="h-7 min-w-[72px] rounded border border-border bg-background px-2 text-xs"
                    value={localValue === true ? 'true' : 'false'}
                    onChange={(e) => handleInputChange(e.target.value)}
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <Input
                    value={localValue === undefined || localValue === null ? '' : String(localValue)}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="h-7 w-full max-w-[120px] text-xs"
                    type={type === 'number' ? 'number' : 'text'}
                    placeholder={`Enter ${type}...`}
                  />
                )}
                <span className="text-[10px] text-muted-foreground">not connected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showJsonPreview && displayValue !== undefined && (
        <div className="ml-4 text-[10px] text-muted-foreground bg-muted/30 rounded p-1 font-mono">
          {formatValueAsJson(displayValue)}
        </div>
      )}
    </div>
  );
}

export type ConnectionOutputProps = {
  nodeId: string;
  handleId: string;
  label: string;
  value: unknown;
  showJsonPreview?: boolean;
};

export function ConnectionOutput({
  nodeId,
  handleId,
  label,
  value,
  showJsonPreview = false
}: ConnectionOutputProps) {
  const handleDomId = `${nodeId}-source-${handleId}`;
  const hasError = isErrorValue(value);

  return (
    <div className="relative flex flex-col gap-1">
      <div className="flex items-center text-xs">
        <div className="flex w-full items-center gap-2">
          <span className="font-medium text-muted-foreground min-w-[40px]">{label}</span>

          <div className="ml-auto flex min-w-[120px] flex-1 items-center justify-end gap-2">
            <div className="flex flex-col items-end text-right">
              <span className={hasError ? 'font-medium text-destructive' : 'text-foreground'}>
                {formatValue(value)}
              </span>
              <span className="text-[10px] text-muted-foreground">output</span>
            </div>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id={handleDomId}
          isConnectable={true} // Unlimited connections for outputs
          className="!h-2.5 !w-2.5 !bg-border"
          style={{ right: 0, top: '50%', transform: 'translate(50%, -50%)' }}
        />
      </div>

      {showJsonPreview && value !== undefined && (
        <div className="mr-4 text-[10px] text-muted-foreground bg-muted/30 rounded p-1 font-mono">
          {formatValueAsJson(value)}
        </div>
      )}
    </div>
  );
}
