import { Node } from '../../components/builder/node-registry';
import { simulateInternalGraph, SimulatedNode } from '../composite/simulation';
import { CompositeNodeTest, CompositeTestResult, CompositeTestSuite } from './composite-test-types';

/**
 * Executes a single test on a composite node
 */
export async function executeCompositeTest(
  node: Node,
  test: CompositeNodeTest
): Promise<CompositeTestResult> {
  const startTime = performance.now();

  try {
    // Get the internal graph structure from node data
    const internalNodes = (node.data.internalNodes as SimulatedNode[]) ||
      (node.data._internalNodes as SimulatedNode[]) || [];
    const internalEdges = (node.data.internalEdges || node.data._internalEdges || []) as any[];

    if (!internalNodes.length) {
      return {
        testId: test.id,
        passed: false,
        actualOutputs: {},
        expectedOutputs: test.expectedOutputs,
        error: 'No internal graph defined for this composite node',
        executionTime: performance.now() - startTime,
      };
    }

    // Execute the simulation with test inputs
    const simulationResult = simulateInternalGraph(internalNodes, internalEdges, test.inputs);
    const executionTime = performance.now() - startTime;

    // Extract outputs from simulation result
    const actualOutputs = simulationResult || {};

    // Compare expected vs actual outputs
    const tolerance = test.tolerance || 0.0001; // Default tolerance for floating point
    let passed = true;
    let details = '';

    for (const [outputKey, expectedValue] of Object.entries(test.expectedOutputs)) {
      const actualValue = actualOutputs[outputKey];

      if (actualValue === undefined) {
        passed = false;
        details += `Missing output '${outputKey}'. `;
        continue;
      }

      // Handle different value types
      if (typeof expectedValue === 'number' && typeof actualValue === 'number') {
        if (Math.abs(expectedValue - actualValue) > tolerance) {
          passed = false;
          details += `Output '${outputKey}': expected ${expectedValue}, got ${actualValue} (tolerance: ${tolerance}). `;
        }
      } else if (JSON.stringify(expectedValue) !== JSON.stringify(actualValue)) {
        passed = false;
        details += `Output '${outputKey}': expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}. `;
      }
    }

    // Check for unexpected outputs
    for (const outputKey of Object.keys(actualOutputs)) {
      if (!(outputKey in test.expectedOutputs)) {
        details += `Unexpected output '${outputKey}': ${JSON.stringify(actualOutputs[outputKey])}. `;
      }
    }

    return {
      testId: test.id,
      passed,
      actualOutputs,
      expectedOutputs: test.expectedOutputs,
      details: details || (passed ? 'All outputs match expected values' : 'Test failed'),
      executionTime,
    };

  } catch (error) {
    return {
      testId: test.id,
      passed: false,
      actualOutputs: {},
      expectedOutputs: test.expectedOutputs,
      error: error instanceof Error ? error.message : 'Unknown execution error',
      details: `Test execution failed: ${error}`,
      executionTime: performance.now() - startTime,
    };
  }
}

/**
 * Executes all tests in a test suite for a composite node
 */
export async function executeCompositeTestSuite(
  node: Node,
  testSuite: CompositeTestSuite
): Promise<{
  results: CompositeTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    totalExecutionTime: number;
  };
}> {
  const results: CompositeTestResult[] = [];
  let totalExecutionTime = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of testSuite.tests) {
    if (!test.enabled) {
      skipped++;
      continue;
    }

    const result = await executeCompositeTest(node, test);
    results.push(result);
    totalExecutionTime += result.executionTime || 0;

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  }

  return {
    results,
    summary: {
      total: testSuite.tests.length,
      passed,
      failed,
      skipped,
      totalExecutionTime,
    },
  };
}

/**
 * Creates a default test for a composite node based on its inputs/outputs
 */
export function createDefaultTest(
  node: Node,
  inputs: Record<string, unknown> = {},
  expectedOutputs: Record<string, unknown> = {}
): CompositeNodeTest {
  return {
    id: `test-${Date.now()}`,
    name: 'Default Test',
    description: 'Auto-generated test case',
    inputs,
    expectedOutputs,
    enabled: true,
  };
}

/**
 * Validates a test case to ensure it's properly configured
 */
export function validateTest(test: CompositeNodeTest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!test.id) {
    errors.push('Test ID is required');
  }

  if (!test.name) {
    errors.push('Test name is required');
  }

  if (!test.inputs || typeof test.inputs !== 'object') {
    errors.push('Test inputs must be an object');
  }

  if (!test.expectedOutputs || typeof test.expectedOutputs !== 'object') {
    errors.push('Test expected outputs must be an object');
  }

  if (test.tolerance !== undefined && (typeof test.tolerance !== 'number' || test.tolerance < 0)) {
    errors.push('Test tolerance must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
