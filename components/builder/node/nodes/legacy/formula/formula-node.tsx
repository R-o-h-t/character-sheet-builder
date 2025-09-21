import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import assert from 'assert';
import { Radical } from 'lucide-react';
import * as math from 'mathjs';
import { ChangeEvent, memo, useEffect, useMemo } from 'react';
import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import {
  EntryValue,
  createError,
  isErrorValue,
  toNumber,
} from '../../utils/value';

const formulaNodeData = {
  formula: {
    label: 'Formula',
    type: 'formula' as const,
    value: '',
  },
  outputs: {
    label: 'Outputs (comma separated)',
    type: 'string' as const,
    value: 'result',
  },
};



type FormulaNodeProperties = typeof formulaNodeData

const defaultSize = { width: 240, height: 160 };

function FormulaNode({ id, data, selected }: NodeProps<Node<FormulaNodeProperties, number | { error: string } | Record<string, number | { error: string }>>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const outputHandles = useMemo(() => deriveOutputHandles(data.outputs), [data.outputs]);

  const evaluation = useMemo(() => {
    return evaluateFormula({
      formula: data.formula,
      entries: data.entries,
      selfRef: data.ref,
    });
  }, [data.formula, data.entries, data.ref]);

  const handleValues = useMemo(() => {
    const map: Record<string, number | { error: string }> = {};
    outputHandles.forEach((handle) => {
      map[handle] = evaluation;
    });
    return map;
  }, [outputHandles, evaluation]);

  useEffect(() => {
    const payload = outputHandles.length === 1 ? evaluation : handleValues;
    updateNodeData(id, {
      value: payload,
      handleValues,
    });
  }, [id, evaluation, handleValues, outputHandles, updateNodeData]);

  const tokens = useMemo(() => Array.from(extractTokens(data.formula)), [data.formula]);

  const handleFormulaChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    updateNodeData(id, { formula: event.target.value });
  };

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        isResizable: true,
        minWidth: defaultSize.width,
        minHeight: defaultSize.height,
        handles: {
          target: {
            position: Position.Left,
            separateHandles: true,
            maxConnections: Math.max(tokens.length, 1),
          },
          source:
            outputHandles.length > 1
              ? {
                  position: Position.Right,
                  separateHandles: true,
                  definitions: outputHandles.map((handle) => ({
                    id: handle,
                  })),
                }
              : {
                  position: Position.Right,
                  separateHandles: false,
                },
        },
      }}
    >
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>Formula</span>
          <span className="text-xs text-muted-foreground">mathjs expression</span>
        </header>
        <textarea
          value={data.formula}
          onChange={handleFormulaChange}
          placeholder="e.g. (A + B) / 2"
          className="h-24 resize-none rounded border border-border bg-background p-2 text-xs font-mono focus:outline-none focus:ring-1"
        />
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<FormulaNodeProperties> = {
  type: 'number-formula',
  icon: Radical,
  label: 'Formula',
  properties: formulaNodeData,
  component: memo(FormulaNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Number',
};

export default definition;

type EvaluateArgs = {
  formula: string;
  entries: Record<string, EntryValue>;
  selfRef?: string;
};

const TOKEN_REGEX = /([A-Z_][A-Z0-9_]*(?:\.[A-Z_][A-Z0-9_]*)*)/gi;

function extractTokens(formula: string): Set<string> {
  const tokens = new Set<string>();
  if (!formula) {
    return tokens;
  }
  let match: RegExpExecArray | null;
  const regex = new RegExp(TOKEN_REGEX);
  while ((match = regex.exec(formula)) !== null) {
    tokens.add(match[1]);
  }
  return tokens;
}

export function evaluateFormula({ formula, entries, selfRef }: EvaluateArgs): number | { error: string } {
  if (!formula.trim()) {
    return createError('Formula is empty');
  }

  try {
    const replaced = formula.replace(TOKEN_REGEX, (match) => {
      const parts = match.split('.');
      const nodeRef = parts[0];

      if (selfRef) {
        assert(nodeRef !== selfRef, 'Cannot reference self in formula');
      }

      const nodeEntry = entries[nodeRef];
      if (!nodeEntry) {
        throw new Error(`Unknown reference ${nodeRef}`);
      }

      if (isErrorValue(nodeEntry.value)) {
        throw new Error(nodeEntry.value.error);
      }

      let current: unknown = nodeEntry.value;
      for (let i = 1; i < parts.length; i++) {
        const property = parts[i];
        if (current && typeof current === 'object' && property in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[property];
        } else {
          throw new Error(`Property ${property} not found on ${nodeRef}`);
        }
      }

      const numeric = toNumber(current);
      if (numeric === null) {
        throw new Error(`Reference ${match} is not numeric`);
      }

      return String(numeric);
    });

    const result = math.evaluate(replaced);
    if (typeof result === 'number' && Number.isFinite(result)) {
      return result;
    }
    throw new Error('Formula did not resolve to a number');
  } catch (error) {
    if (error instanceof Error) {
      return createError(error.message);
    }
    return createError('Formula evaluation failed');
  }
}

function deriveOutputHandles(raw?: string): string[] {
  if (!raw) {
    return ['result'];
  }

  const handles = raw
    .split(',')
    .map((segment) => segment.trim())
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, '_'))
    .filter((segment) => segment.length > 0);

  return handles.length ? handles : ['result'];
}
