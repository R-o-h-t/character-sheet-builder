import { memo, useEffect, useMemo } from 'react';
import { ShieldAlert } from 'lucide-react';
import { NodeProps, Position, useReactFlow } from '@xyflow/react';

import { Node, NodeDefinition } from '../../../node-registry';
import { Resizable } from '../../base/node-resizer';
import { ConnectionField } from '../../base/connection-field';
import { getEntryByHandle, resolveNumber, toNumber } from '../../utils/value';

const properties = {
  primaryValue: {
    label: 'Primary fallback',
    type: 'number' as const,
    value: '0',
  },
  fallbackValue: {
    label: 'Fallback value',
    type: 'number' as const,
    value: '0',
  },
};

type OnErrorNodeProperties = typeof properties;

const HANDLE_PRIMARY = 'primaryValue';
const HANDLE_FALLBACK = 'fallbackValue';

function OnErrorNode({ id, data, selected }: NodeProps<Node<OnErrorNodeProperties, number>>) {
  const { updateNodeData } = useReactFlow<Node>();

  const primaryEntry = useMemo(() => getEntryByHandle(data.entries, HANDLE_PRIMARY), [data.entries]);
  const fallbackEntry = useMemo(() => getEntryByHandle(data.entries, HANDLE_FALLBACK), [data.entries]);

  const output = useMemo(() => {
    const primaryFallback = toNumber(data.primaryValue);
    const fallbackFallback = toNumber(data.fallbackValue);

    const primary = resolveNumber(primaryEntry, 'Primary', primaryFallback);
    if (typeof primary === 'number') {
      return primary;
    }

    const fallback = resolveNumber(fallbackEntry, 'Fallback', fallbackFallback);
    if (typeof fallback === 'number') {
      return fallback;
    }

    // If fallback fails, bubble original error
    return primary;
  }, [data.fallbackValue, data.primaryValue, fallbackEntry, primaryEntry]);

  useEffect(() => {
    updateNodeData(id, { value: output });
  }, [id, output, updateNodeData]);

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
        <header className="text-sm font-semibold">On Error</header>
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_PRIMARY}
          label="Primary"
          type="number"
          value={data.primaryValue}
          entry={primaryEntry}
          onChange={(value) => updateNodeData(id, { primaryValue: value })}
        />
        <ConnectionField
          nodeId={id}
          handleId={HANDLE_FALLBACK}
          label="Fallback"
          type="number"
          value={data.fallbackValue}
          entry={fallbackEntry}
          onChange={(value) => updateNodeData(id, { fallbackValue: value })}
        />
      </div>
    </Resizable>
  );
}

export const definition: NodeDefinition<OnErrorNodeProperties> = {
  type: 'number-on-error',
  icon: ShieldAlert,
  label: 'OnError',
  properties,
  component: memo(OnErrorNode),
  isResizable: true,
  isModifiable: true,
  category: 'Number',
};

export default definition;
