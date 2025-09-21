import { NodeTestCase, runNodeTests } from '../../lib/testing/node-test-framework';

describe('Arithmetic Node Tests', () => {

  describe('Plus Node (Legacy)', () => {
    const plusNodeTests: NodeTestCase[] = [
      {
        description: 'should add two positive numbers',
        nodeType: 'number-plus',
        inputs: { input_a: 5, input_b: 3 },
        expectedOutput: 8,
      },
      {
        description: 'should add positive and negative numbers',
        nodeType: 'number-plus',
        inputs: { input_a: 10, input_b: -3 },
        expectedOutput: 7,
      },
      {
        description: 'should add two negative numbers',
        nodeType: 'number-plus',
        inputs: { input_a: -5, input_b: -2 },
        expectedOutput: -7,
      },
      {
        description: 'should handle decimal numbers',
        nodeType: 'number-plus',
        inputs: { input_a: 3.14, input_b: 2.86 },
        expectedOutput: 6.0,
      },
      {
        description: 'should handle zero',
        nodeType: 'number-plus',
        inputs: { input_a: 0, input_b: 42 },
        expectedOutput: 42,
      },
      {
        description: 'should use fallback values for unconnected inputs',
        nodeType: 'number-plus',
        inputs: {},
        expectedOutput: 0, // Both fallback to 0
      }
    ];

    test('should pass all plus node tests', async () => {
      const results = await runNodeTests('number-plus', plusNodeTests);

      expect(results.totalTests).toBe(plusNodeTests.length);
      expect(results.passedTests).toBe(plusNodeTests.length);
      expect(results.failedTests).toBe(0);

      results.results.forEach(({ testCase, result }) => {
        expect(result.passed).toBe(true);
      });
    });
  });

  describe('Minus Node (Legacy)', () => {
    const minusNodeTests: NodeTestCase[] = [
      {
        description: 'should subtract two positive numbers',
        nodeType: 'number-minus',
        inputs: { input_a: 10, input_b: 3 },
        expectedOutput: 7,
      },
      {
        description: 'should subtract negative from positive',
        nodeType: 'number-minus',
        inputs: { input_a: 5, input_b: -3 },
        expectedOutput: 8,
      },
      {
        description: 'should subtract positive from negative',
        nodeType: 'number-minus',
        inputs: { input_a: -5, input_b: 3 },
        expectedOutput: -8,
      },
      {
        description: 'should handle decimal numbers',
        nodeType: 'number-minus',
        inputs: { input_a: 10.5, input_b: 2.3 },
        expectedOutput: 8.2,
      },
      {
        description: 'should handle zero',
        nodeType: 'number-minus',
        inputs: { input_a: 42, input_b: 0 },
        expectedOutput: 42,
      }
    ];

    test('should pass all minus node tests', async () => {
      const results = await runNodeTests('number-minus', minusNodeTests);

      expect(results.totalTests).toBe(minusNodeTests.length);
      expect(results.passedTests).toBe(minusNodeTests.length);
      expect(results.failedTests).toBe(0);

      results.results.forEach(({ testCase, result }) => {
        expect(result.passed).toBe(true);
      });
    });
  });

  describe('Multiply Node (Legacy)', () => {
    const multiplyNodeTests: NodeTestCase[] = [
      {
        description: 'should multiply two positive numbers',
        nodeType: 'number-multiply',
        inputs: { input_a: 6, input_b: 7 },
        expectedOutput: 42,
      },
      {
        description: 'should multiply by negative number',
        nodeType: 'number-multiply',
        inputs: { input_a: 5, input_b: -3 },
        expectedOutput: -15,
      },
      {
        description: 'should multiply by zero',
        nodeType: 'number-multiply',
        inputs: { input_a: 42, input_b: 0 },
        expectedOutput: 0,
      },
      {
        description: 'should handle decimal numbers',
        nodeType: 'number-multiply',
        inputs: { input_a: 2.5, input_b: 4 },
        expectedOutput: 10,
      },
      {
        description: 'should handle very small numbers',
        nodeType: 'number-multiply',
        inputs: { input_a: 0.1, input_b: 0.1 },
        expectedOutput: 0.01,
      }
    ];

    test('should pass all multiply node tests', async () => {
      const results = await runNodeTests('number-multiply', multiplyNodeTests);

      expect(results.totalTests).toBe(multiplyNodeTests.length);
      expect(results.passedTests).toBe(multiplyNodeTests.length);
      expect(results.failedTests).toBe(0);

      results.results.forEach(({ testCase, result }) => {
        expect(result.passed).toBe(true);
      });
    });
  });

  describe('Divide Node (Legacy)', () => {
    const divideNodeTests: NodeTestCase[] = [
      {
        description: 'should divide two positive numbers',
        nodeType: 'number-divide',
        inputs: { input_a: 20, input_b: 4 },
        expectedOutput: 5,
      },
      {
        description: 'should divide by negative number',
        nodeType: 'number-divide',
        inputs: { input_a: 15, input_b: -3 },
        expectedOutput: -5,
      },
      {
        description: 'should handle decimal division',
        nodeType: 'number-divide',
        inputs: { input_a: 10, input_b: 3 },
        expectedOutput: 10 / 3, // ~3.333...
      },
      {
        description: 'should handle zero dividend',
        nodeType: 'number-divide',
        inputs: { input_a: 0, input_b: 5 },
        expectedOutput: 0,
      },
      {
        description: 'should handle division by zero',
        nodeType: 'number-divide',
        inputs: { input_a: 10, input_b: 0 },
        expectedError: true, // Should produce an error
      }
    ];

    test('should pass all divide node tests', async () => {
      const results = await runNodeTests('number-divide', divideNodeTests);

      expect(results.totalTests).toBe(divideNodeTests.length);

      // Most should pass, but division by zero should fail appropriately
      results.results.forEach(({ testCase, result }) => {
        if (testCase.expectedError) {
          expect(result.passed).toBe(true); // Error expected and occurred
        } else {
          expect(result.passed).toBe(true);
        }
      });
    });
  });
});
