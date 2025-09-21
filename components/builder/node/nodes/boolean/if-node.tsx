import { memo, useEffect, useMemo } from 'react';
import { GitMerge } from 'lucide-react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { ConnectionField } from '../../base/connection-field';
import {
  formatValue,
  getEntryByHandle,
  isErrorValue,
  parseBoolean,
  resolveBoolean,
} from '../../utils/value';

const properties = {
  conditionValue: {
    label: 'Condition',
    type: 'boolean' as const,
    value: 'false',
  },
  trueValue: {
    label: 'On True',
    type: 'text' as const,
    value: '',
  },
  falseValue: {
    label: 'On False',
    type: 'text' as const,
    value: '',
  },
};

type IfNodeProperties = typeof properties;

const HANDLE_CONDITION = 'conditionValue';
const HANDLE_TRUE = 'trueValue';
const HANDLE_FALSE = 'falseValue';

function IfNode({ id, data, selected }: NodeProps<Node<IfNodeProperties, unknown>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const conditionEntry = useMemo(() => getEntryByHandle(data.entries, HANDLE_CONDITION), [data.entries]);
  const trueEntry = useMemo(() => getEntryByHandle(data.entries, HANDLE_TRUE), [data.entries]);
  const falseEntry = useMemo(() => getEntryByHandle(data.entries, HANDLE_FALSE), [data.entries]);

  const result = useMemo(() => {
    const fallbackCondition = parseBoolean(data.conditionValue);
    const conditionValue = resolveBoolean(conditionEntry, 'Condition', fallbackCondition);
    if (typeof conditionValue !== 'boolean') {
      return conditionValue;
    }

    const chosenEntry = conditionValue ? trueEntry : falseEntry;
    const fallback = conditionValue ? data.trueValue : data.falseValue;

    if (!chosenEntry) {
      return fallback ?? null;
    }

    if (isErrorValue(chosenEntry.value)) {
      return chosenEntry.value;
    }

    return chosenEntry.value ?? fallback ?? null;
  }, [conditionEntry, data.conditionValue, data.falseValue, data.trueValue, falseEntry, trueEntry]);

  useEffect(() => {
    updateNodeData(id, { value: result });
  }, [id, result, updateNodeData]);

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
      <div className="flex flex-col gap-2 p-3 text-xs">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>IF</span>
          <span className="text-xs text-muted-foreground">returns selected branch</span>
        </header>
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_CONDITION}
          label="Condition"
          type="boolean"
          value={data.conditionValue}
          entry={conditionEntry}
          onChange={(value) => updateNodeData(id, { conditionValue: value })}
        />
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_TRUE}
          label="On True"
          type="text"
          value={data.trueValue}
          entry={trueEntry}
          onChange={(value) => updateNodeData(id, { trueValue: value })}
        />
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_FALSE}
          label="On False"
          type="text"
          value={data.falseValue}
          entry={falseEntry}
          onChange={(value) => updateNodeData(id, { falseValue: value })}
        />
        <div className="mt-2 text-[10px] text-muted-foreground">
          Current: {formatValue(result)}
        </div>
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<IfNodeProperties> = {
  type: 'boolean-if',
  icon: GitMerge,
  label: 'IF',
  properties,
  component: memo(IfNode),
  isResizable: true,
  isModifiable: true,
  category: 'Boolean',
};

export default definition;
