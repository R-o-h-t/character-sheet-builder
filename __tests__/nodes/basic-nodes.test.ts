import { NodeTestCase, testNode, runNodeTests } from '../../lib/testing/node-test-framework';

describe('Basic Node Tests', () => {

  describe('Number Node', () => {
    const numberNodeTests: NodeTestCase[] = [
      {
        description: 'should output its configured value',
        nodeType: 'number',
        expectedOutput: 0, // default value
      },
      {
        description: 'should output custom value when set',
        nodeType: 'number',
        expectedOutput: 42,
        setup: (node) => ({
          ...node,
          data: { ...node.data, value: 42 }
        })
      },
      {
        description: 'should handle negative numbers',
        nodeType: 'number',
        expectedOutput: -15,
        setup: (node) => ({
          ...node,
          data: { ...node.data, value: -15 }
        })
      },
      {
        description: 'should handle decimal numbers',
        nodeType: 'number',
        expectedOutput: 3.14159,
        setup: (node) => ({
          ...node,
          data: { ...node.data, value: 3.14159 }
        })
      }
    ];

    test('should pass all number node tests', async () => {
      const results = await runNodeTests('number', numberNodeTests);

      expect(results.totalTests).toBe(numberNodeTests.length);
      expect(results.passedTests).toBe(numberNodeTests.length);
      expect(results.failedTests).toBe(0);

      results.results.forEach(({ testCase, result }) => {
        expect(result.passed).toBe(true);
      });
    });
  });

  describe('Text Node', () => {
    const textNodeTests: NodeTestCase[] = [
      {
        description: 'should output default text value',
        nodeType: 'string',
        expectedOutput: 'New Text', // default value
      },
      {
        description: 'should output custom text when set',
        nodeType: 'string',
        expectedOutput: 'Hello World',
        setup: (node) => ({
          ...node,
          data: { ...node.data, value: 'Hello World' }
        })
      },
      {
        description: 'should handle empty string',
        nodeType: 'string',
        expectedOutput: '',
        setup: (node) => ({
          ...node,
          data: { ...node.data, value: '' }
        })
      },
      {
        description: 'should handle special characters',
        nodeType: 'string',
        expectedOutput: '!@#$%^&*()_+-=[]{}|;:,.<>?',
        setup: (node) => ({
          ...node,
          data: { ...node.data, value: '!@#$%^&*()_+-=[]{}|;:,.<>?' }
        })
      },
      {
        description: 'should handle unicode characters',
        nodeType: 'string',
        expectedOutput: '🚀 Hello 世界 🌍',
        setup: (node) => ({
          ...node,
          data: { ...node.data, value: '🚀 Hello 世界 🌍' }
        })
      }
    ];

    test('should pass all text node tests', async () => {
      const results = await runNodeTests('string', textNodeTests);

      expect(results.totalTests).toBe(textNodeTests.length);
      expect(results.passedTests).toBe(textNodeTests.length);
      expect(results.failedTests).toBe(0);

      results.results.forEach(({ testCase, result }) => {
        expect(result.passed).toBe(true);
      });
    });
  });

  describe('ID Node', () => {
    const idNodeTests: NodeTestCase[] = [
      {
        description: 'should generate a valid ID',
        nodeType: 'id',
        setup: (node) => node, // Use default generated ID
      }
    ];

    test('should pass all ID node tests', async () => {
      const results = await runNodeTests('id', idNodeTests);

      expect(results.totalTests).toBe(idNodeTests.length);

      results.results.forEach(({ testCase, result }) => {
        // For ID nodes, we just check that they produce some output
        expect(result.actualOutput).toBeDefined();
        expect(typeof result.actualOutput === 'string' || typeof result.actualOutput === 'number').toBe(true);
      });
    });
  });
});
