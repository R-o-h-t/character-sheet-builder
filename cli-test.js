#!/usr/bin/env node
/**
 * CLI Tool for testing composite nodes
 *
 * Usage:
 *   node cli-test.js <node-json-file> [test-parameters.json]
 *
 * Example:
 *   node cli-test.js exported-node.json test-params.json
 */

const fs = require('fs');
const path = require('path');

// Helper function to simulate a composite node execution
function simulateCompositeNode(nodeData, testInputs = {}) {
  try {
    // Extract internal nodes and edges from the composite node
    const internalNodes = nodeData.internalNodes || [];
    const internalEdges = nodeData.internalEdges || [];
    const inputs = nodeData.inputs || [];
    const outputs = nodeData.outputs || [];

    console.log(`Simulating composite node: ${nodeData.name || 'Unnamed'}`);
    console.log(`Inputs: ${inputs.length}, Outputs: ${outputs.length}`);
    console.log(`Internal nodes: ${internalNodes.length}, Internal edges: ${internalEdges.length}`);

    // Create a simulation context
    const context = {};

    // Initialize input nodes with test values
    for (const node of internalNodes) {
      if (node.type === 'internal-input') {
        const handleId = node.data.handleId;
        const inputValue = testInputs[handleId];

        if (inputValue !== undefined) {
          context[node.id] = { value: inputValue };
          console.log(`Input ${handleId}: ${JSON.stringify(inputValue)}`);
        } else {
          console.warn(`No test value provided for input: ${handleId}`);
          context[node.id] = { value: null };
        }
      }
    }

    // Process nodes in dependency order (simplified simulation)
    const processed = new Set();
    let iterations = 0;
    const maxIterations = 100;

    while (processed.size < internalNodes.length && iterations < maxIterations) {
      iterations++;

      for (const node of internalNodes) {
        if (processed.has(node.id)) continue;

        // Check if all dependencies are satisfied
        const dependencies = internalEdges.filter(edge => edge.target === node.id);
        const dependenciesMet = dependencies.every(edge => processed.has(edge.source));

        if (!dependenciesMet && node.type !== 'internal-input') continue;

        // Process the node
        switch (node.type) {
          case 'internal-input':
            // Already processed above
            break;

          case 'brick-formula':
            const expression = node.data.expression || '';
            console.log(`Processing formula: ${expression}`);

            // Simple expression evaluation (very basic)
            let result;
            try {
              // Get input values from connected nodes
              const inputValues = {};
              for (const edge of dependencies) {
                const sourceValue = context[edge.source]?.value;
                inputValues[edge.targetHandle] = sourceValue;
              }

              // Replace variables in expression with actual values
              let evalExpression = expression;
              for (const [variable, value] of Object.entries(inputValues)) {
                const regex = new RegExp(`\\b${variable}\\b`, 'g');
                evalExpression = evalExpression.replace(regex, JSON.stringify(value));
              }

              console.log(`Evaluating: ${evalExpression}`);

              // Basic mathematical expression evaluation
              if (/^[\d\s+\-*/.()]+$/.test(evalExpression)) {
                result = eval(evalExpression);
              } else {
                result = evalExpression; // Return as string if not pure math
              }

              context[node.id] = { value: result };
              console.log(`Formula result: ${JSON.stringify(result)}`);
            } catch (error) {
              console.error(`Formula evaluation error: ${error.message}`);
              context[node.id] = { value: null, error: error.message };
            }
            break;

          case 'internal-output':
            // Copy value from source
            const sourceEdge = dependencies[0];
            if (sourceEdge && context[sourceEdge.source]) {
              context[node.id] = context[sourceEdge.source];
            }
            break;

          default:
            console.log(`Skipping unsupported node type: ${node.type}`);
            context[node.id] = { value: null };
        }

        processed.add(node.id);
      }
    }

    if (iterations >= maxIterations) {
      console.warn('Maximum iterations reached - possible circular dependency');
    }

    // Extract output values
    const resultOutputs = {};
    for (const output of outputs) {
      const outputNode = internalNodes.find(node =>
        node.type === 'internal-output' && node.data.handleId === output.handleId
      );

      if (outputNode && context[outputNode.id]) {
        resultOutputs[output.handleId] = context[outputNode.id].value;
      }
    }

    return {
      success: true,
      outputs: resultOutputs,
      context: context
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      outputs: {}
    };
  }
}

function runCLITest() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node cli-test.js <node-json-file> [test-parameters.json]');
    console.log('');
    console.log('Examples:');
    console.log('  node cli-test.js exported-node.json');
    console.log('  node cli-test.js exported-node.json test-params.json');
    console.log('');
    console.log('Node JSON should contain: name, internalNodes, internalEdges, inputs, outputs');
    console.log('Test parameters JSON should map input handleIds to test values');
    return;
  }

  const nodeFile = args[0];
  const testFile = args[1];

  // Load node data
  if (!fs.existsSync(nodeFile)) {
    console.error(`Error: Node file not found: ${nodeFile}`);
    return;
  }

  let nodeData;
  try {
    const nodeContent = fs.readFileSync(nodeFile, 'utf8');
    nodeData = JSON.parse(nodeContent);
  } catch (error) {
    console.error(`Error reading node file: ${error.message}`);
    return;
  }

  // Load test parameters
  let testInputs = {};
  if (testFile) {
    if (!fs.existsSync(testFile)) {
      console.error(`Error: Test file not found: ${testFile}`);
      return;
    }

    try {
      const testContent = fs.readFileSync(testFile, 'utf8');
      testInputs = JSON.parse(testContent);
    } catch (error) {
      console.error(`Error reading test file: ${error.message}`);
      return;
    }
  }

  // Check if node has test parameters in properties
  if (nodeData.testInputs && Object.keys(testInputs).length === 0) {
    try {
      testInputs = JSON.parse(nodeData.testInputs);
      console.log('Using test inputs from node properties');
    } catch (error) {
      console.warn('Failed to parse testInputs from node properties');
    }
  }

  console.log('='.repeat(60));
  console.log('COMPOSITE NODE CLI TESTER');
  console.log('='.repeat(60));
  console.log(`Node file: ${nodeFile}`);
  console.log(`Test inputs: ${JSON.stringify(testInputs, null, 2)}`);
  console.log('');

  // Run the simulation
  const result = simulateCompositeNode(nodeData, testInputs);

  console.log('='.repeat(60));
  console.log('RESULTS');
  console.log('='.repeat(60));

  if (result.success) {
    console.log('✅ Simulation completed successfully');
    console.log('');
    console.log('Outputs:');
    for (const [key, value] of Object.entries(result.outputs)) {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    }

    // Check against expected outputs if available
    if (nodeData.testOutputs || nodeData.expectedOutputs) {
      let expectedOutputs;
      try {
        expectedOutputs = nodeData.testOutputs ?
          JSON.parse(nodeData.testOutputs) :
          nodeData.expectedOutputs;

        console.log('');
        console.log('Expected vs Actual:');
        let allMatch = true;

        for (const [key, expectedValue] of Object.entries(expectedOutputs)) {
          const actualValue = result.outputs[key];
          const matches = JSON.stringify(actualValue) === JSON.stringify(expectedValue);
          allMatch = allMatch && matches;

          const status = matches ? '✅' : '❌';
          console.log(`  ${key}: ${status} expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
        }

        console.log('');
        console.log(`Overall test result: ${allMatch ? '✅ PASS' : '❌ FAIL'}`);

      } catch (error) {
        console.warn('Failed to parse expected outputs for comparison');
      }
    }

  } else {
    console.log('❌ Simulation failed');
    console.log(`Error: ${result.error}`);
  }

  console.log('');
}

// Run the CLI test if this script is executed directly
if (require.main === module) {
  runCLITest();
}

module.exports = { simulateCompositeNode, runCLITest };
