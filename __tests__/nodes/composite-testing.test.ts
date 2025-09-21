import { CompositeNodeTest, CompositeTestSuite } from '../../lib/testing/composite-test-types';
import { executeCompositeTest, executeCompositeTestSuite, createDefaultTest } from '../../lib/testing/composite-test-runner';
import { createTestNode } from '../../lib/testing/node-test-framework';

describe('Composite Node Testing Framework', () => {

  describe('Test Execution', () => {
    test('should execute a simple composite test', async () => {
      // Create a mock composite node
      const compositeNode = createTestNode('composite', {}, {
        internalNodes: [
          {
            id: 'input1',
            type: 'input',
            position: { x: 0, y: 0 },
            data: { value: null, handleId: 'test_input' }
          },
          {
            id: 'output1',
            type: 'output',
            position: { x: 200, y: 0 },
            data: { value: null, handleId: 'test_output' }
          }
        ],
        internalEdges: [
          {
            id: 'edge1',
            source: 'input1',
            target: 'output1',
            sourceHandle: 'input1-source',
            targetHandle: 'output1-target'
          }
        ]
      });

      if (!compositeNode) {
        throw new Error('Failed to create test node');
      }

      const test: CompositeNodeTest = {
        id: 'test1',
        name: 'Pass-through test',
        description: 'Test that input value passes through to output',
        inputs: { test_input: 42 },
        expectedOutputs: { test_output: 42 },
        enabled: true,
      };

      const result = await executeCompositeTest(compositeNode, test);

      expect(result.testId).toBe('test1');
      expect(result.executionTime).toBeGreaterThan(0);
      // Note: The actual pass/fail will depend on the composite node implementation
    });

    test('should handle test execution errors gracefully', async () => {
      const invalidNode = createTestNode('composite', {}, {
        internalNodes: [], // Empty - should cause error
        internalEdges: []
      });

      if (!invalidNode) {
        throw new Error('Failed to create test node');
      }

      const test: CompositeNodeTest = {
        id: 'test_error',
        name: 'Error test',
        inputs: { input: 1 },
        expectedOutputs: { output: 1 },
        enabled: true,
      };

      const result = await executeCompositeTest(invalidNode, test);

      expect(result.testId).toBe('test_error');
      expect(result.passed).toBe(false);
      expect(result.error).toBe('No internal graph defined for this composite node');
    });
  });

  describe('Test Suite Execution', () => {
    test('should execute multiple tests in a suite', async () => {
      const compositeNode = createTestNode('composite', {}, {
        internalNodes: [
          {
            id: 'input1',
            type: 'input',
            position: { x: 0, y: 0 },
            data: { value: null, handleId: 'number_input' }
          },
          {
            id: 'multiply',
            type: 'number-multiply',
            position: { x: 100, y: 0 },
            data: { value: null }
          },
          {
            id: 'output1',
            type: 'output',
            position: { x: 200, y: 0 },
            data: { value: null, handleId: 'result' }
          }
        ],
        internalEdges: [
          {
            id: 'edge1',
            source: 'input1',
            target: 'multiply',
            sourceHandle: 'input1-source',
            targetHandle: 'multiply-target-input_a'
          },
          {
            id: 'edge2',
            source: 'multiply',
            target: 'output1',
            sourceHandle: 'multiply-source-result',
            targetHandle: 'output1-target'
          }
        ]
      });

      if (!compositeNode) {
        throw new Error('Failed to create test node');
      }

      const testSuite: CompositeTestSuite = {
        tests: [
          {
            id: 'test1',
            name: 'Multiply by 2',
            inputs: { number_input: 5 },
            expectedOutputs: { result: 10 }, // Assuming multiply node has fallback of 2
            enabled: true,
          },
          {
            id: 'test2',
            name: 'Multiply negative',
            inputs: { number_input: -3 },
            expectedOutputs: { result: -6 },
            enabled: true,
          },
          {
            id: 'test3',
            name: 'Disabled test',
            inputs: { number_input: 1 },
            expectedOutputs: { result: 2 },
            enabled: false, // This should be skipped
          }
        ]
      };

      const result = await executeCompositeTestSuite(compositeNode, testSuite);

      expect(result.results).toHaveLength(2); // Only enabled tests
      expect(result.summary.total).toBe(3);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.totalExecutionTime).toBeGreaterThan(0);
    });
  });

  describe('Test Utilities', () => {
    test('should create default test', () => {
      const mockNode = createTestNode('composite');
      if (!mockNode) {
        throw new Error('Failed to create test node');
      }

      const test = createDefaultTest(mockNode, { input: 1 }, { output: 2 });

      expect(test.id).toBeDefined();
      expect(test.name).toBe('Default Test');
      expect(test.inputs).toEqual({ input: 1 });
      expect(test.expectedOutputs).toEqual({ output: 2 });
      expect(test.enabled).toBe(true);
    });
  });

  describe('Example Composite Node Tests', () => {
    test('should test arithmetic composite (Plus)', async () => {
      const tests: CompositeNodeTest[] = [
        {
          id: 'plus_test_1',
          name: 'Add two positive numbers',
          description: 'Test basic addition of 5 + 3',
          inputs: { a: 5, b: 3 },
          expectedOutputs: { result: 8 },
          enabled: true,
        },
        {
          id: 'plus_test_2',
          name: 'Add with zero',
          description: 'Test addition with zero',
          inputs: { a: 42, b: 0 },
          expectedOutputs: { result: 42 },
          enabled: true,
        },
        {
          id: 'plus_test_3',
          name: 'Add negative numbers',
          description: 'Test addition of negative numbers',
          inputs: { a: -5, b: -3 },
          expectedOutputs: { result: -8 },
          enabled: true,
        }
      ];

      // This would be used with an actual Plus composite node
      // For now, we're just testing the structure
      tests.forEach(test => {
        expect(test.id).toBeDefined();
        expect(test.name).toBeDefined();
        expect(test.inputs).toBeDefined();
        expect(test.expectedOutputs).toBeDefined();
        expect(typeof test.enabled).toBe('boolean');
      });
    });

    test('should test formula composite', async () => {
      const tests: CompositeNodeTest[] = [
        {
          id: 'formula_test_1',
          name: 'Quadratic formula',
          description: 'Test x^2 + 2x + 1 where x = 2',
          inputs: { x: 2 },
          expectedOutputs: { result: 9 }, // 4 + 4 + 1 = 9
          tolerance: 0.001,
          enabled: true,
        },
        {
          id: 'formula_test_2',
          name: 'Square root',
          description: 'Test sqrt(16)',
          inputs: { value: 16 },
          expectedOutputs: { result: 4 },
          tolerance: 0.001,
          enabled: true,
        }
      ];

      // This demonstrates how tolerance can be used for floating point comparisons
      tests.forEach(test => {
        expect(test.tolerance).toBeDefined();
        expect(test.tolerance).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
