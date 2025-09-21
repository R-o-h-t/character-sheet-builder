import { nanoid } from 'nanoid';
import { Node, NodeDefinition, NodeProperties, getNodeDefinition, addNode } from '../../components/builder/node-registry';
import { SimulatedNode, simulateInternalGraph } from '../composite/simulation';

export type NodeTestCase<T extends NodeProperties = NodeProperties, U = unknown> = {
  description: string;
  nodeType: string;
  inputs?: Record<string, unknown>;
  expectedOutput?: U;
  expectedError?: string | boolean;
  setup?: (node: Node<T, U>) => Node<T, U>;
};

export type CompositeNodeTestCase = {
  description: string;
  testInputs: Record<string, unknown>;
  expectedOutputs: Record<string, unknown>;
  timeout?: number;
};

/**
 * Creates a test node with specified inputs
 */
export function createTestNode<T extends NodeProperties = NodeProperties, U = unknown>(
  type: string,
  inputs: Record<string, unknown> = {},
  customData: Partial<Node<T, U>['data']> = {}
): Node<T, U> | null {
  const node = addNode({ type, position: { x: 0, y: 0 } });
  if (!node) return null;

  // Apply inputs as entries
  const entries: Record<string, any> = {};
  Object.entries(inputs).forEach(([key, value]) => {
    entries[key] = {
      value,
      handleId: key,
      sourceNodeId: 'test-source',
      sourceHandleId: `test-source-${key}`,
      sourceRef: 'test-ref',
    };
  });

  return {
    ...node,
    data: {
      ...node.data,
      ...customData,
      entries,
    },
  } as Node<T, U>;
}

/**
 * Simulates a node's computation and returns the result
 */
export async function simulateNode<T extends NodeProperties = NodeProperties, U = unknown>(
  node: Node<T, U>
): Promise<{ value: U | unknown; error?: string }> {
  const nodeDef = getNodeDefinition(node.type);
  if (!nodeDef) {
    throw new Error(`Node definition not found for type: ${node.type}`);
  }

  // For composite nodes, use the simulation engine
  if (node.type === 'composite') {
    try {
      const internalNodes = (node.data as any).internalNodes || (node.data as any)._internalNodes || [];
      const internalEdges = (node.data as any).internalEdges || (node.data as any)._internalEdges || [];

      const inputs = Object.entries(node.data.entries).reduce((acc, [key, entry]) => {
        acc[key] = (entry as any).value;
        return acc;
      }, {} as Record<string, any>);

      const result = simulateInternalGraph(internalNodes, internalEdges, inputs);
      return { value: result as U };
    } catch (error) {
      return {
        value: { error: error instanceof Error ? error.message : 'Simulation failed' } as U,
        error: error instanceof Error ? error.message : 'Simulation failed'
      };
    }
  }

  // For other nodes, we'll need to simulate their logic
  // This is a simplified simulation - in practice, you'd need to implement
  // the actual node logic or extract it from the node components

  return { value: node.data.value as U };
}

/**
 * Tests a single node with given inputs and expected outputs
 */
export async function testNode<T extends NodeProperties = NodeProperties, U = unknown>(
  testCase: NodeTestCase<T, U>
): Promise<{ passed: boolean; actualOutput?: U | unknown; error?: string; details?: string }> {
  try {
    let node = createTestNode<T, U>(testCase.nodeType, testCase.inputs);
    if (!node) {
      return { passed: false, error: `Failed to create node of type: ${testCase.nodeType}` };
    }

    if (testCase.setup) {
      node = testCase.setup(node);
    }

    const result = await simulateNode(node);

    if (testCase.expectedError) {
      if (result.error) {
        return { passed: true, details: `Expected error occurred: ${result.error}` };
      }
      if (typeof testCase.expectedError === 'string' && result.error === testCase.expectedError) {
        return { passed: true, details: `Expected specific error occurred: ${result.error}` };
      }
      return {
        passed: false,
        actualOutput: result.value,
        error: `Expected error but got successful result`,
        details: `Expected error: ${testCase.expectedError}, but got value: ${JSON.stringify(result.value)}`
      };
    }

    if (testCase.expectedOutput !== undefined) {
      const passed = JSON.stringify(result.value) === JSON.stringify(testCase.expectedOutput);
      return {
        passed,
        actualOutput: result.value,
        details: passed
          ? `Output matches expected value`
          : `Expected: ${JSON.stringify(testCase.expectedOutput)}, Got: ${JSON.stringify(result.value)}`
      };
    }

    return { passed: true, actualOutput: result.value, details: 'Test completed without assertions' };

  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: `Test execution failed: ${error}`
    };
  }
}

/**
 * Tests a composite node with multiple input/output scenarios
 */
export async function testCompositeNode(
  node: Node,
  testCases: CompositeNodeTestCase[]
): Promise<Array<{
  testCase: CompositeNodeTestCase;
  passed: boolean;
  actualOutputs?: Record<string, unknown>;
  error?: string;
  details?: string;
}>> {
  const results = [];

  for (const testCase of testCases) {
    try {
      // Create entries for test inputs
      const entries: Record<string, any> = {};
      Object.entries(testCase.testInputs).forEach(([key, value]) => {
        entries[key] = {
          value,
          handleId: key,
          sourceNodeId: 'test-source',
          sourceHandleId: `test-source-${key}`,
          sourceRef: 'test-ref',
        };
      });

      const testNode = {
        ...node,
        data: {
          ...node.data,
          entries,
        },
      };

      const result = await simulateNode(testNode);

      if (result.error) {
        results.push({
          testCase,
          passed: false,
          error: result.error,
          details: `Simulation failed: ${result.error}`
        });
        continue;
      }

      // Check if result has outputs property for composite nodes
      let actualOutputs: Record<string, unknown> = {};
      if (result.value && typeof result.value === 'object' && 'outputs' in result.value) {
        actualOutputs = (result.value as any).outputs || {};
      } else {
        actualOutputs = { result: result.value };
      }

      // Compare expected vs actual outputs
      const allMatched = Object.entries(testCase.expectedOutputs).every(([key, expectedValue]) => {
        const actualValue = actualOutputs[key];
        return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
      });

      results.push({
        testCase,
        passed: allMatched,
        actualOutputs,
        details: allMatched
          ? 'All outputs match expected values'
          : `Output mismatch. Expected: ${JSON.stringify(testCase.expectedOutputs)}, Got: ${JSON.stringify(actualOutputs)}`
      });

    } catch (error) {
      results.push({
        testCase,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: `Test execution failed: ${error}`
      });
    }
  }

  return results;
}

/**
 * Runs all test cases for a given node type
 */
export async function runNodeTests<T extends NodeProperties = NodeProperties, U = unknown>(
  nodeType: string,
  testCases: NodeTestCase<T, U>[]
): Promise<{
  nodeType: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: Array<{ testCase: NodeTestCase<T, U>; result: any }>;
}> {
  const results = [];
  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    const result = await testNode(testCase);
    results.push({ testCase, result });

    if (result.passed) {
      passedTests++;
    } else {
      failedTests++;
    }
  }

  return {
    nodeType,
    totalTests: testCases.length,
    passedTests,
    failedTests,
    results,
  };
}
