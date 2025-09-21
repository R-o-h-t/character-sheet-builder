import { NodeProps, Position, useReactFlow } from '@xyflow/react';
import { Blocks, TestTube } from 'lucide-react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

import type { CompositeIO, OutputHandlerSpec } from '@/lib/composite/graph';
import { deriveCompositeInputs, deriveCompositeOutputs } from '@/lib/composite/graph';
import { simulateInternalGraph, SimulatedNode } from '@/lib/composite/simulation';
import { Node, NodeDefinition } from '../../node-registry';
import { Resizable } from '../base/node-resizer';
import { createError, formatValue, getEntryByHandle, isErrorValue } from '../utils/value';
import { CompositeTestSuite } from '@/lib/testing/composite-test-types';
import { Button } from '@/components/ui/button';
import { CompositeTestingPanel } from '@/components/testing/composite-testing-panel';

const defaultSize = { width: 260, height: 180 };

const compositeNodeProperties = {
  name: {
    label: "Name",
    type: "string" as const,
    value: "Composite",
  },
  testInputs: {
    label: "Test Input Parameters",
    type: "string" as const,
    value: "{}",
    hidden: true,
  },
  testOutputs: {
    label: "Expected Test Outputs",
    type: "string" as const,
    value: "{}",
    hidden: true,
  },
  enableTesting: {
    label: "Enable Testing",
    type: "boolean" as const,
    value: false,
  },
};

type CompositeNodeProperties = typeof compositeNodeProperties;

type CompositeNodeValue =
  | { outputs: Record<string, unknown>; inputs: CompositeIO[]; outputsMeta: CompositeIO[] }
  | { error: string };

function CompositeNode({ id, data, selected }: NodeProps<Node<CompositeNodeProperties, CompositeNodeValue>>) {
  const { updateNodeData } = useReactFlow<Node>();
  const [showTesting, setShowTesting] = useState(data.enableTesting);

  // Sync showTesting with enableTesting property
  useEffect(() => {
    setShowTesting(data.enableTesting);
  }, [data.enableTesting]);

  const inputs = useMemo(() => readIo(data, 'inputs'), [data]);
  const outputs = useMemo(() => readIo(data, 'outputs'), [data]);

  // If inputs/outputs metadata is not set yet, derive them from internal graph
  const internalNodesAny = useMemo(() => ((data as any).internalNodes as any[]) || ((data as any)._internalNodes as any[]) || [], [data]);
  const internalEdgesAny = useMemo(() => ((data as any).internalEdges as any[]) || ((data as any)._internalEdges as any[]) || [], [data]);

  const effectiveInputs = useMemo<CompositeIO[]>(() => {
    return inputs.length > 0 ? inputs : deriveCompositeInputs(internalNodesAny as any);
  }, [inputs, internalNodesAny]);

  const effectiveOutputs = useMemo<CompositeIO[]>(() => {
    return outputs.length > 0 ? outputs : deriveCompositeOutputs(internalNodesAny as any, internalEdgesAny as any);
  }, [outputs, internalNodesAny, internalEdgesAny]);

  const inputHandles = useMemo(
    () =>
      effectiveInputs.map((io) => ({
        id: io.handleId,
        maxConnections: 1,
      })),
    [effectiveInputs]
  );

  const outputHandles = useMemo(
    () =>
      effectiveOutputs.map((io) => ({
        id: io.handleId,
        maxConnections: 1,
      })),
    [effectiveOutputs]
  );

  const resolved = useMemo<CompositeNodeValue>(() => {
    if (!effectiveOutputs.length) {
      return createError('Configure outputs inside the composite editor');
    }

    // Get the internal graph structure from node data
    const internalNodes = (internalNodesAny as SimulatedNode[]) || [];
    const internalEdges = (internalEdgesAny as any[]) || [];

    if (!internalNodes.length) {
      return createError('No internal graph defined for this composite node');
    }

    // Build external inputs from connected data
    const externalInputs: Record<string, any> = {};

    if (inputs.length > 0) {
      // Preferred path: use declared inputs
      for (const input of effectiveInputs) {
        const entry = getEntryByHandle(data.entries, input.handleId);
        if (entry && !isErrorValue(entry.value)) {
          externalInputs[input.handleId] = entry.value;
        } else {
          externalInputs[input.handleId] = null;
        }
      }

      // Robustness: also merge any additional connected entries by handleId
      // This tolerates stale/partial metadata by including unknown-but-connected inputs.
      for (const [handleId, entry] of Object.entries((data as any).entries || {})) {
        if (!(handleId in externalInputs)) {
          const safe = entry as { value: unknown } | undefined;
          if (safe && !isErrorValue(safe.value)) {
            externalInputs[handleId] = safe.value;
          }
        }
      }
    } else {
      // Fallback: no inputs metadata yet — use all current entries by handleId
      for (const [handleId, entry] of Object.entries((data as any).entries || {})) {
        const safe = entry as { value: unknown } | undefined;
        if (safe && !isErrorValue(safe.value)) {
          externalInputs[handleId] = safe.value;
        }
      }
    }

    try {
      const handlers = (((data as any).outputHandlers as OutputHandlerSpec[]) || []).filter(Boolean);

      // Simulate internal graph once (efficient even if multiple outputs)
      const simulatedOutputs = simulateInternalGraph(internalNodes, internalEdges, externalInputs);

      const result: Record<string, unknown> = {};

      if (handlers.length > 0) {
        // Use handler list as truth for which outputs to compute/persist
        for (const h of handlers) {
          const key = h.handleId;
          result[key] = simulatedOutputs[key] ?? null;
        }
        // Ensure any declared outputs also appear (for UI alignment)
        for (const io of effectiveOutputs) {
          if (!(io.handleId in result)) {
            result[io.handleId] = simulatedOutputs[io.handleId] ?? null;
          }
        }
      } else {
        // Fallback to declared outputs
        for (const io of effectiveOutputs) {
          const key = io.handleId;
          result[key] = simulatedOutputs[key] ?? null;
        }
      }

      return { outputs: result, inputs: effectiveInputs, outputsMeta: effectiveOutputs };
    } catch (error) {
      return createError(error instanceof Error ? error.message : 'Internal graph simulation failed');
    }
  }, [data.entries, (data as any)._entriesTick, internalNodesAny, internalEdgesAny, effectiveInputs, effectiveOutputs]);

  // Create a stable key for comparison based on the resolved content
  const resolvedKey = useMemo(() => {
    if ('error' in resolved) {
      return `error:${resolved.error}`;
    }

    const outputKeys = Object.keys(resolved.outputs).sort();
    const outputValues = outputKeys.map(key => `${key}:${JSON.stringify(resolved.outputs[key])}`).join('|');
    return `success:${outputValues}:inputs:${resolved.inputs.length}:outputs:${resolved.outputsMeta.length}`;
  }, [resolved]);

  // Create handleValues for per-handle output access
  const handleValues = useMemo(() => {
    if ('error' in resolved) {
      // If there's an error, all handles get the error
      const map: Record<string, any> = {};
      outputHandles.forEach((handle) => {
        map[handle.id] = resolved;
      });
      return map;
    }

    // Map each output handle to its specific value
    const map: Record<string, any> = {};
    outputHandles.forEach((handle) => {
      const outputKey = handle.id;
      map[handle.id] = resolved.outputs[outputKey] ?? null;
    });
    return map;
  }, [resolved, outputHandles]);

  // Track the last update key to prevent infinite loops
  const lastUpdateKeyRef = useRef<string>('');

  useEffect(() => {
    if (lastUpdateKeyRef.current !== resolvedKey) {
      lastUpdateKeyRef.current = resolvedKey;
      // For single output, use the specific value; for multiple outputs, use handleValues system
      const payload = outputHandles.length === 1 ? (
        'error' in resolved ? resolved : resolved.outputs[outputHandles[0].id]
      ) : resolved;

      updateNodeData(id, {
        value: payload,
        handleValues,
        _valueTick: Date.now()
      });
    }
  }, [id, resolved, resolvedKey, updateNodeData, outputHandles, handleValues]);

  // Test suite management
  const testSuite = useMemo(() => {
    try {
      // First try to get existing test suite from data
      const existingTestSuite = (data as any).testSuite as CompositeTestSuite | undefined;

      // Try to parse test parameters from node properties
      const testInputsStr = data.testInputs || '{}';
      const testOutputsStr = data.testOutputs || '{}';

      const testInputs = JSON.parse(testInputsStr);
      const testOutputs = JSON.parse(testOutputsStr);

      // If we have test parameters, create a default test
      const hasTestData = Object.keys(testInputs).length > 0 || Object.keys(testOutputs).length > 0;

      if (hasTestData && data.enableTesting) {
        const propertyTest = {
          id: `${id}-property-test`,
          name: 'Property Test',
          enabled: true,
          inputs: testInputs,
          expectedOutputs: testOutputs,
        };

        // Merge with existing tests, replacing property test if it exists
        const existingTests = existingTestSuite?.tests || [];
        const otherTests = existingTests.filter(test => test.id !== `${id}-property-test`);

        return {
          tests: [propertyTest, ...otherTests],
          results: existingTestSuite?.results || [],
        };
      }

      return existingTestSuite || { tests: [], results: [] };
    } catch (error) {
      console.warn('Failed to parse test parameters:', error);
      return (data as any).testSuite as CompositeTestSuite | undefined || { tests: [], results: [] };
    }
  }, [data, id]);

  const handleTestSuiteChange = (newTestSuite: CompositeTestSuite) => {
    updateNodeData(id, { testSuite: newTestSuite });
  };

  const hasHandles = inputHandles.length > 0 || outputHandles.length > 0;

  return (
    <Resizable
      id={id}
      selected={selected}
      options={{
        handles: {
          target: inputHandles.length
            ? {
              position: Position.Left,
              definitions: inputHandles,
            }
            : null,
          source: outputHandles.length
            ? {
              position: Position.Right,
              definitions: outputHandles,
            }
            : null,
        },
      }}
    >
      <div className="flex h-full w-full flex-col gap-2 p-3">
        <header className="flex items-center justify-between text-sm font-semibold">
          <span>{data.name || 'Composite'}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTesting(!showTesting)}
              className={`h-6 w-6 p-0 ${showTesting ? 'bg-blue-100 text-blue-600' : ''}`}
              title="Toggle Testing Mode"
            >
              <TestTube className="h-3 w-3" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {effectiveInputs.length} in · {effectiveOutputs.length} out
            </span>
          </div>
        </header>
        {showTesting ? (
          <CompositeTestingPanel
            node={{ id, data, position: { x: 0, y: 0 }, type: 'composite' }}
            testSuite={testSuite}
            onTestSuiteChange={handleTestSuiteChange}
          />
        ) : (
          <>
            {!hasHandles && (
              <p className="text-xs text-muted-foreground">
                Double click to open the internal editor and add inputs/outputs.
              </p>
            )}
            {!isErrorValue(resolved) ? (
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                {Object.entries(resolved.outputs).map(([key, value]) => (
                  <div key={key} className="flex justify-between gap-2">
                    <span>{key}</span>
                    <span>{formatValue(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
                {resolved.error}
              </div>
            )}
            <div className="mt-auto rounded border border-border bg-background p-2 text-xs">
              <span className="font-semibold">Status: </span>
              <span>{isErrorValue(resolved) ? 'Error' : 'Ready'}</span>
              {testSuite.tests.length > 0 && (
                <span className="ml-2 text-muted-foreground">
                  • {testSuite.tests.filter(t => t.enabled).length} tests
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </Resizable>
  );
}

function readIo(data: Node['data'], key: 'inputs' | 'outputs'): CompositeIO[] {
  const raw = (data as Record<string, unknown>)[key];
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const value = item as Record<string, unknown>;
      const handleId = getString(value.handleId) ?? getString(value.id);
      if (!handleId) {
        return null;
      }

      const label = getString(value.label) ?? handleId;

      const sourceValue = value.source;
      let source: CompositeIO['source'];
      if (sourceValue && typeof sourceValue === 'object') {
        const sourceRecord = sourceValue as Record<string, unknown>;
        const nodeId = getString(sourceRecord.nodeId);
        if (nodeId) {
          const handle = getString(sourceRecord.handleId);
          source = {
            nodeId,
            handleId: handle ?? undefined,
          };
        }
      }

      return {
        id: handleId,
        label,
        handleId,
        source,
      } as CompositeIO;
    })
    .filter((item): item is CompositeIO => item !== null);
}

function getString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

export const definition: NodeDefinition<CompositeNodeProperties, CompositeNodeValue> = {
  type: 'composite-node',
  icon: Blocks,
  label: 'Composite',
  properties: compositeNodeProperties,
  component: memo(CompositeNode),
  defaultSize,
  isResizable: true,
  isModifiable: true,
  category: 'Components',
};

export default definition;
