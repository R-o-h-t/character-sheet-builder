#!/usr/bin/env node

/**
 * Demo script for the Composite Node Testing Framework
 *
 * This script demonstrates how to:
 * 1. Create composite node tests
 * 2. Execute individual tests
 * 3. Run test suites
 * 4. Handle test results
 */

import { CompositeNodeTest, CompositeTestSuite } from '../lib/testing/composite-test-types';
import { executeCompositeTest, executeCompositeTestSuite, createDefaultTest } from '../lib/testing/composite-test-runner';

// Example: Creating test cases for an arithmetic composite node
const arithmeticTests: CompositeNodeTest[] = [
  {
    id: 'add_positive',
    name: 'Add two positive numbers',
    description: 'Tests that 5 + 3 = 8',
    inputs: { a: 5, b: 3 },
    expectedOutputs: { result: 8 },
    enabled: true,
  },
  {
    id: 'add_negative',
    name: 'Add negative numbers',
    description: 'Tests that -2 + -3 = -5',
    inputs: { a: -2, b: -3 },
    expectedOutputs: { result: -5 },
    enabled: true,
  },
  {
    id: 'add_mixed',
    name: 'Add positive and negative',
    description: 'Tests that 10 + (-4) = 6',
    inputs: { a: 10, b: -4 },
    expectedOutputs: { result: 6 },
    enabled: true,
  },
  {
    id: 'add_zero',
    name: 'Add with zero',
    description: 'Tests that 42 + 0 = 42',
    inputs: { a: 42, b: 0 },
    expectedOutputs: { result: 42 },
    enabled: true,
  }
];

// Example: Creating test cases for a formula composite node
const formulaTests: CompositeNodeTest[] = [
  {
    id: 'quadratic_1',
    name: 'Quadratic formula (x=1)',
    description: 'Tests x² + 2x + 1 where x = 1, should equal 4',
    inputs: { x: 1 },
    expectedOutputs: { result: 4 },
    tolerance: 0.001,
    enabled: true,
  },
  {
    id: 'quadratic_2',
    name: 'Quadratic formula (x=2)',
    description: 'Tests x² + 2x + 1 where x = 2, should equal 9',
    inputs: { x: 2 },
    expectedOutputs: { result: 9 },
    tolerance: 0.001,
    enabled: true,
  },
  {
    id: 'quadratic_negative',
    name: 'Quadratic formula (x=-1)',
    description: 'Tests x² + 2x + 1 where x = -1, should equal 0',
    inputs: { x: -1 },
    expectedOutputs: { result: 0 },
    tolerance: 0.001,
    enabled: true,
  }
];

// Example: Creating test cases for data processing composite
const dataProcessingTests: CompositeNodeTest[] = [
  {
    id: 'filter_positive',
    name: 'Filter positive numbers',
    description: 'Filters array to keep only positive numbers',
    inputs: {
      numbers: [1, -2, 3, -4, 5],
      threshold: 0
    },
    expectedOutputs: {
      filtered: [1, 3, 5],
      count: 3
    },
    enabled: true,
  },
  {
    id: 'calculate_average',
    name: 'Calculate average',
    description: 'Calculates average of input numbers',
    inputs: { numbers: [2, 4, 6, 8, 10] },
    expectedOutputs: {
      average: 6,
      sum: 30,
      count: 5
    },
    tolerance: 0.001,
    enabled: true,
  }
];

// Example: Testing edge cases
const edgeCaseTests: CompositeNodeTest[] = [
  {
    id: 'empty_input',
    name: 'Handle empty input',
    description: 'Tests behavior with empty or null inputs',
    inputs: { value: null },
    expectedOutputs: { result: 0 }, // Assuming default behavior
    enabled: true,
  },
  {
    id: 'very_large_number',
    name: 'Handle large numbers',
    description: 'Tests with very large numbers',
    inputs: { value: 1e10 },
    expectedOutputs: { result: 1e10 },
    tolerance: 1e6, // Larger tolerance for big numbers
    enabled: true,
  },
  {
    id: 'floating_precision',
    name: 'Floating point precision',
    description: 'Tests floating point arithmetic precision',
    inputs: { a: 0.1, b: 0.2 },
    expectedOutputs: { result: 0.3 },
    tolerance: 0.0001, // Important for floating point
    enabled: true,
  }
];

// Example: Creating a complete test suite
const exampleTestSuite: CompositeTestSuite = {
  tests: [
    ...arithmeticTests,
    ...formulaTests,
    ...dataProcessingTests,
    ...edgeCaseTests
  ],
  lastRun: undefined,
  results: []
};

console.log('=== Composite Node Testing Framework Demo ===\\n');

console.log('📋 Example Test Suite:');
console.log(`   • Total tests: ${exampleTestSuite.tests.length}`);
console.log(`   • Enabled tests: ${exampleTestSuite.tests.filter(t => t.enabled).length}`);
console.log(`   • Test categories: Arithmetic, Formula, Data Processing, Edge Cases\\n`);

console.log('🧪 Sample Test Cases:\\n');

// Display sample tests
arithmeticTests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  console.log(`   Description: ${test.description}`);
  console.log(`   Inputs: ${JSON.stringify(test.inputs)}`);
  console.log(`   Expected: ${JSON.stringify(test.expectedOutputs)}`);
  console.log(`   Enabled: ${test.enabled ? '✅' : '❌'}\\n`);
});

console.log('💡 Usage Examples:\\n');

console.log('1. To add testing to a composite node:');
console.log('   • Click the test tube icon in the composite node header');
console.log('   • Click "Add Test" to create a new test case');
console.log('   • Fill in test inputs and expected outputs');
console.log('   • Click "Run All Tests" to execute\\n');

console.log('2. Test case structure:');
console.log(`   {
     id: 'unique_test_id',
     name: 'Human readable test name',
     description: 'What this test validates',
     inputs: { inputHandle1: value1, inputHandle2: value2 },
     expectedOutputs: { outputHandle1: expectedValue1 },
     tolerance: 0.001, // For floating point comparisons
     enabled: true
   }\\n`);

console.log('3. Test execution results:');
console.log(`   {
     testId: 'unique_test_id',
     passed: true/false,
     actualOutputs: { outputHandle1: actualValue1 },
     expectedOutputs: { outputHandle1: expectedValue1 },
     error: 'Error message if failed',
     details: 'Detailed comparison results',
     executionTime: 42.5 // milliseconds
   }\\n`);

console.log('🎯 Best Practices:\\n');
console.log('   • Test edge cases (empty inputs, large numbers, zero values)');
console.log('   • Use appropriate tolerance for floating point comparisons');
console.log('   • Give tests descriptive names and descriptions');
console.log('   • Group related tests logically');
console.log('   • Test both success and failure scenarios');
console.log('   • Regularly run tests when modifying composite logic\\n');

console.log('⚡ Features:\\n');
console.log('   • Individual test execution');
console.log('   • Batch test suite execution');
console.log('   • Visual pass/fail indicators');
console.log('   • Execution time measurement');
console.log('   • Detailed error reporting');
console.log('   • Test enable/disable toggles');
console.log('   • Floating point tolerance handling\\n');

export {
  arithmeticTests,
  formulaTests,
  dataProcessingTests,
  edgeCaseTests,
  exampleTestSuite
};
