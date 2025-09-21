# CLI Testing for Composite Nodes

This document explains how to test composite nodes from the command line using exported JSON files.

## Overview

The visual editor now supports exporting composite nodes to JSON format and testing them from the CLI without needing to run the full application. This is useful for:

- Automated testing in CI/CD pipelines
- Debugging node behavior in isolation
- Batch testing with different parameter sets
- Integration with external tools

## Exporting Nodes

### From the Visual Editor

1. **Right-click** on any composite node in the editor
2. Select **"Export for CLI"** to download the node as JSON
3. Optionally select **"Export Test Template"** to get a test parameters template

### Node Properties

You can also set test parameters directly in the node properties:

1. Select the composite node
2. In the data panel, set:
   - **Enable Testing**: `true`
   - **Test Input Parameters**: JSON object with input values
   - **Expected Test Outputs**: JSON object with expected results

Example:
```json
{
  "input_a": 5,
  "input_b": 3
}
```

## CLI Testing Tool

### Installation

The CLI tool is located at `cli-test.js` in the project root. Make sure you have Node.js installed.

### Usage

```bash
# Basic usage with exported node
node cli-test.js exported-node.json

# With separate test parameters file
node cli-test.js exported-node.json test-parameters.json

# The tool will automatically use test parameters from node properties if available
```

### File Formats

#### Node JSON Format
The exported node JSON contains:
```json
{
  "id": "node-123",
  "type": "composite-node",
  "name": "Plus Calculator",
  "internalNodes": [...],
  "internalEdges": [...],
  "inputs": [...],
  "outputs": [...],
  "testInputs": "{\"input_a\": 5, \"input_b\": 3}",
  "testOutputs": "{\"result\": 8}",
  "enableTesting": true
}
```

#### Test Parameters Format
```json
{
  "input_a": 5,
  "input_b": 3,
  "another_input": "test value"
}
```

## Example Workflow

### 1. Create and Configure Node

1. Create a composite node (e.g., Plus operation)
2. Add internal structure (input nodes, formula, output nodes)
3. Set test parameters in properties:
   - Test Input Parameters: `{"input_a": 5, "input_b": 3}`
   - Expected Test Outputs: `{"result": 8}`
   - Enable Testing: `true`

### 2. Export for Testing

1. Right-click the node → "Export for CLI"
2. Save as `plus-node.json`

### 3. Run CLI Test

```bash
node cli-test.js plus-node.json
```

Expected output:
```
============================================================
COMPOSITE NODE CLI TESTER
============================================================
Node file: plus-node.json
Test inputs: {
  "input_a": 5,
  "input_b": 3
}

Simulating composite node: Plus Calculator
Inputs: 2, Outputs: 1
Internal nodes: 4, Internal edges: 3
Input input_a: 5
Input input_b: 3
Processing formula: A + B
Evaluating: 5 + 3
Formula result: 8
============================================================
RESULTS
============================================================
✅ Simulation completed successfully

Outputs:
  result: 8

Expected vs Actual:
  result: ✅ expected 8, got 8

Overall test result: ✅ PASS
```

## Supported Node Types

The CLI simulator currently supports:

- **internal-input**: Input nodes that provide values to the composite
- **internal-output**: Output nodes that export values from the composite
- **brick-formula**: Formula nodes with mathematical expressions
- Basic mathematical operations: `+`, `-`, `*`, `/`, `()`, numbers

### Formula Expressions

The formula evaluator supports:
- Basic arithmetic: `A + B`, `(A - B) * C`, etc.
- Variable substitution from connected inputs
- Parentheses for operation precedence

## Advanced Usage

### Batch Testing

Create multiple test parameter files and run them:

```bash
# Test with different parameter sets
node cli-test.js node.json test-case-1.json
node cli-test.js node.json test-case-2.json
node cli-test.js node.json test-case-3.json
```

### CI/CD Integration

Add to your CI pipeline:

```yaml
# Example GitHub Actions step
- name: Test Composite Nodes
  run: |
    node cli-test.js exported-nodes/calculator.json
    node cli-test.js exported-nodes/converter.json
```

### Debugging

The CLI tool provides detailed execution logs:
- Input value assignments
- Formula evaluation steps
- Node processing order
- Error messages for failures

## Limitations

1. **Node Types**: Only basic node types are supported (input, output, formula)
2. **Expressions**: Formula evaluation is simplified (no complex functions)
3. **Dependencies**: Circular dependencies are detected but may not resolve perfectly
4. **State**: No persistent state between test runs

## Extending the CLI Tool

To add support for new node types, modify the `simulateCompositeNode` function in `cli-test.js`:

```javascript
case 'your-custom-node':
  // Add your node processing logic
  context[node.id] = { value: processYourNode(node, dependencies) };
  break;
```

## Troubleshooting

### Common Issues

1. **"Node file not found"**: Check file path and ensure JSON was exported correctly
2. **"Formula evaluation error"**: Verify formula syntax and input variable names
3. **"No test value provided"**: Ensure test parameters match input handle IDs
4. **"Maximum iterations reached"**: Check for circular dependencies in node graph

### Getting Help

- Check console output for detailed error messages
- Verify JSON file structure matches expected format
- Test with simple cases first (single input/output)
- Use the exported test template as a starting point
