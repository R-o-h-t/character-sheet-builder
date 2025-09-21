# Node Testing Framework

This documentation covers the comprehensive testing system for all nodes in the visual editor, with special focus on composite node testing.

## Overview

The testing framework provides:

1. **Unit tests for all node types** - Validates individual node functionality
2. **Composite node testing interface** - Interactive testing for composite nodes with expected inputs/outputs
3. **Test automation** - Automated test execution and result reporting

## Basic Node Testing

### Test Structure

All nodes can be tested using the `NodeTestCase` interface:

```typescript
type NodeTestCase = {
  description: string;
  nodeType: string;
  inputs?: Record<string, unknown>;
  expectedOutput?: unknown;
  expectedError?: string | boolean;
  setup?: (node: Node) => Node;
};
```

### Example: Testing Arithmetic Nodes

```typescript
const plusNodeTests: NodeTestCase[] = [
  {
    description: 'should add two positive numbers',
    nodeType: 'number-plus',
    inputs: { input_a: 5, input_b: 3 },
    expectedOutput: 8,
  },
  {
    description: 'should handle division by zero',
    nodeType: 'number-divide',
    inputs: { input_a: 10, input_b: 0 },
    expectedError: true,
  }
];
```

### Running Basic Node Tests

```typescript
import { runNodeTests } from './lib/testing/node-test-framework';

const results = await runNodeTests('number-plus', plusNodeTests);
console.log(`${results.passedTests}/${results.totalTests} tests passed`);
```

## Composite Node Testing

### Interactive Testing Interface

Composite nodes include a built-in testing interface accessible by clicking the test tube icon (🧪) in the node header.

### Test Case Structure

```typescript
type CompositeNodeTest = {
  id: string;                              // Unique identifier
  name: string;                           // Display name
  description?: string;                   // Optional description
  inputs: Record<string, unknown>;        // Input values by handle ID
  expectedOutputs: Record<string, unknown>; // Expected output values
  tolerance?: number;                     // Floating point tolerance
  enabled: boolean;                       // Whether test is active
};
```

### Example: Testing an Arithmetic Composite

```typescript
const arithmeticTests: CompositeNodeTest[] = [
  {
    id: 'add_basic',
    name: 'Basic Addition',
    description: 'Tests that 5 + 3 equals 8',
    inputs: { a: 5, b: 3 },
    expectedOutputs: { result: 8 },
    enabled: true,
  },
  {
    id: 'add_floating',
    name: 'Floating Point Addition',
    description: 'Tests floating point precision',
    inputs: { a: 0.1, b: 0.2 },
    expectedOutputs: { result: 0.3 },
    tolerance: 0.0001,  // Important for floating point comparisons
    enabled: true,
  }
];
```

### Test Execution Results

```typescript
type CompositeTestResult = {
  testId: string;
  passed: boolean;
  actualOutputs: Record<string, unknown>;
  expectedOutputs: Record<string, unknown>;
  error?: string;
  details?: string;
  executionTime?: number;  // In milliseconds
};
```

## Using the Testing Interface

### Adding Tests to Composite Nodes

1. **Access Testing Mode**: Click the test tube icon (🧪) in the composite node header
2. **Add New Test**: Click "Add Test" button
3. **Configure Test**:
   - Set test name and description
   - Define input values for each input handle
   - Specify expected output values for each output handle
   - Set tolerance for floating point comparisons (optional)
4. **Enable/Disable**: Use the checkbox to enable/disable individual tests
5. **Run Tests**: Click "Run All Tests" or the play button for individual tests

### Test Results Display

- ✅ **Green checkmark**: Test passed
- ❌ **Red X**: Test failed
- ⏱️ **Clock icon**: Execution time display
- **Details panel**: Shows actual vs expected outputs when tests fail

## Test Categories

### 1. Basic Input/Output Nodes

- **Number Node**: Tests numeric value output
- **Text Node**: Tests string value output
- **ID Node**: Tests unique identifier generation

### 2. Arithmetic Nodes

- **Plus Node**: Addition operations
- **Minus Node**: Subtraction operations
- **Multiply Node**: Multiplication operations
- **Divide Node**: Division operations (including error cases)

### 3. Composite Nodes

- **User-defined logic**: Custom internal graph testing
- **Input/Output mapping**: Validates data flow through composite
- **Error handling**: Tests error propagation and handling

## Best Practices

### Test Design

1. **Test Edge Cases**:
   ```typescript
   {
     id: 'edge_zero',
     name: 'Division by Zero',
     inputs: { dividend: 10, divisor: 0 },
     expectedOutputs: { error: true },
     enabled: true,
   }
   ```

2. **Use Appropriate Tolerance**:
   ```typescript
   {
     tolerance: 0.0001,  // For floating point comparisons
     // or
     tolerance: 1e-6,    // For high precision requirements
   }
   ```

3. **Descriptive Names**:
   ```typescript
   {
     name: 'Quadratic Formula (x=2)',
     description: 'Tests x² + 2x + 1 where x = 2, should equal 9',
   }
   ```

### Test Organization

1. **Group Related Tests**: Create logical test groups
2. **Progressive Complexity**: Start with simple cases, add complexity
3. **Error Scenarios**: Include both success and failure cases
4. **Performance**: Monitor execution times for complex composites

### Example Test Suites

#### Formula Composite
```typescript
const formulaTests = [
  {
    id: 'linear',
    name: 'Linear equation',
    inputs: { x: 5 },
    expectedOutputs: { result: 15 }, // 3x = 15
    enabled: true,
  },
  {
    id: 'quadratic',
    name: 'Quadratic equation',
    inputs: { x: 3 },
    expectedOutputs: { result: 18 }, // x² + 2x + 3 = 18
    tolerance: 0.001,
    enabled: true,
  }
];
```

#### Data Processing Composite
```typescript
const dataTests = [
  {
    id: 'filter_array',
    name: 'Filter positive numbers',
    inputs: {
      array: [1, -2, 3, -4, 5],
      threshold: 0
    },
    expectedOutputs: {
      filtered: [1, 3, 5],
      count: 3
    },
    enabled: true,
  }
];
```

## API Reference

### Core Functions

- `runNodeTests(nodeType, testCases)` - Execute tests for a node type
- `executeCompositeTest(node, test)` - Run single composite test
- `executeCompositeTestSuite(node, testSuite)` - Run multiple tests
- `createDefaultTest(node, inputs, outputs)` - Generate default test
- `validateTest(test)` - Validate test configuration

### Testing Components

- `CompositeTestingPanel` - Interactive testing UI for composite nodes
- `NodeTestCase` - Individual node test configuration
- `CompositeTestSuite` - Collection of tests for a composite node

## Running Tests

### Development
```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run with coverage report
```

### Programmatic
```typescript
import { runNodeTests } from './lib/testing/node-test-framework';

// Test specific node types
const results = await runNodeTests('number-plus', testCases);

// Test composite nodes
import { executeCompositeTestSuite } from './lib/testing/composite-test-runner';
const compositeResults = await executeCompositeTestSuite(node, testSuite);
```

## File Structure

```
lib/testing/
├── node-test-framework.ts      # Core testing framework
├── composite-test-types.ts     # Type definitions
└── composite-test-runner.ts    # Composite test execution

components/testing/
└── composite-testing-panel.tsx # UI component for testing

__tests__/
├── nodes/
│   ├── basic-nodes.test.ts     # Tests for basic nodes
│   ├── arithmetic-nodes.test.ts # Tests for arithmetic nodes
│   └── composite-testing.test.ts # Composite testing framework tests
└── ...

examples/
└── composite-testing-demo.ts   # Usage examples and demos
```

This testing framework ensures reliable functionality across all node types and provides powerful tools for validating complex composite node behavior.
