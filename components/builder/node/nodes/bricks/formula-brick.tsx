import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Calculator } from 'lucide-react';
import { memo, useEffect, useMemo } from 'react';
import * as math from 'mathjs';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { createError, isErrorValue } from '../../utils/value';

const defaultSize = { width: 200, height: 120 };

const properties = {
  expression: {
    label: 'Expression',
    type: 'string' as const,
    value: 'A + B',
  },
};

type FormulaBrickProperties = typeof properties;

function FormulaBrick({ id, data, selected }: NodeProps<Node<FormulaBrickProperties, number | { error: string }>>) {
  const { updateNodeData } = useReactFlow<Node>();

  // Extract variables from the expression (e.g., A, B, C)
  const variables = useMemo(() => {
    const TOKEN_REGEX = /([A-Z_][A-Z0-9_]*)/gi;
    const matches = new Set<string>();
    let match;
    const regex = new RegExp(TOKEN_REGEX);
    while ((match = regex.exec(data.expression || '')) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches).sort();
  }, [data.expression]);

  // Evaluate the formula with connected inputs
  const result = useMemo(() => {
    if (!data.expression?.trim()) {
      return createError('Expression is empty');
    }

    try {
      // Build scope from connected inputs
      const scope: Record<string, number> = {};

      for (const variable of variables) {
        const entry = data.entries?.[variable];
        if (!entry) {
          return createError(`Variable ${variable} not connected`);
        }

        if (isErrorValue(entry.value)) {
          return entry.value;
        }

        const numericValue = typeof entry.value === 'number' ? entry.value : Number(entry.value);
        if (!Number.isFinite(numericValue)) {
          return createError(`Variable ${variable} is not a valid number`);
        }

        scope[variable] = numericValue;
      }

      const result = math.evaluate(data.expression, scope);

      if (typeof result === 'number' && Number.isFinite(result)) {
        return result;
      }

      return createError('Expression did not resolve to a valid number');
    } catch (error) {
      return createError(error instanceof Error ? error.message : 'Expression evaluation failed');
    }
  }, [data.expression, data.entries, variables]);

  useEffect(() => {
    updateNodeData(id, { value: result });
  }, [id, result, updateNodeData]);

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: variables.length > 0 ? {
            position: Position.Left,
            separateHandles: true,
            definitions: variables.map(variable => ({
              id: variable,
              maxConnections: 1,
            })),
          } : null,
          source: {
            position: Position.Right,
            separateHandles: false,
          },
        },
      }}
    >
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>Formula</span>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </header>

        <div className="flex-1 min-h-0">
          <textarea
            value={data.expression}
            onChange={(e) => updateNodeData(id, { expression: e.target.value })}
            placeholder="e.g. A + B, A * B, sqrt(A)"
            className="w-full h-full resize-none rounded border border-border bg-background p-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {variables.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Inputs: {variables.join(', ')}
          </div>
        )}

        {!isErrorValue(result) && (
          <div className="text-xs">
            <span className="text-muted-foreground">Result: </span>
            <span className="font-mono">{typeof result === 'number' ? result.toFixed(3) : 'N/A'}</span>
          </div>
        )}

        {isErrorValue(result) && (
          <div className="text-xs text-destructive">
            Error: {result.error}
          </div>
        )}
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<FormulaBrickProperties, number | { error: string }> = {
  type: 'brick-formula',
  icon: Calculator,
  label: 'Formula Brick',
  properties,
  component: memo(FormulaBrick),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Bricks',
};

export default definition;
