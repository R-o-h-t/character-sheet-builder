import { Node } from '../components/builder/node-registry';

export interface ExportableNode {
  id: string;
  type: string;
  name?: string;
  internalNodes?: any[];
  internalEdges?: any[];
  inputs?: any[];
  outputs?: any[];
  outputHandlers?: any[];
  testInputs?: string;
  testOutputs?: string;
  enableTesting?: boolean;
  data: any;
}

/**
 * Export a node to a JSON format suitable for CLI testing
 */
export function exportNodeForCLI(node: Node): ExportableNode {
  const nodeData = node.data as any;

  return {
    id: node.id,
    type: node.type,
    name: nodeData.name || `${node.type}-${node.id}`,
    internalNodes: nodeData.internalNodes || [],
    internalEdges: nodeData.internalEdges || [],
    inputs: nodeData.inputs || [],
    outputs: nodeData.outputs || [],
    outputHandlers: nodeData.outputHandlers || [],
    testInputs: nodeData.testInputs || '{}',
    testOutputs: nodeData.testOutputs || '{}',
    enableTesting: nodeData.enableTesting || false,
    data: nodeData,
  };
}

/**
 * Export multiple nodes to CLI format
 */
export function exportNodesToCLI(nodes: Node[]): ExportableNode[] {
  return nodes.map(exportNodeForCLI);
}

/**
 * Create a downloadable JSON file for a node
 */
export function downloadNodeAsJSON(node: Node, filename?: string) {
  const exportedNode = exportNodeForCLI(node);
  const jsonContent = JSON.stringify(exportedNode, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${exportedNode.name || 'node'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Create example test parameters file for a node
 */
export function createTestParametersFile(node: Node): Record<string, any> {
  const nodeData = node.data as any;
  const inputs = nodeData.inputs || [];

  const testParams: Record<string, any> = {};

  // Create example values for each input
  for (const input of inputs) {
    const handleId = input.handleId || input.id;
    // Generate reasonable test values based on input name/type
    if (input.label) {
      const label = input.label.toLowerCase();
      if (label.includes('number') || label.includes('value') || label.includes('count')) {
        testParams[handleId] = 42;
      } else if (label.includes('text') || label.includes('string') || label.includes('name')) {
        testParams[handleId] = "test value";
      } else if (label.includes('bool') || label.includes('flag')) {
        testParams[handleId] = true;
      } else {
        testParams[handleId] = null;
      }
    } else {
      testParams[handleId] = null;
    }
  }

  return testParams;
}

/**
 * Download test parameters template for a node
 */
export function downloadTestParametersTemplate(node: Node, filename?: string) {
  const testParams = createTestParametersFile(node);
  const jsonContent = JSON.stringify(testParams, null, 2);

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `test-parameters-${node.id}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
