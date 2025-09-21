export type CompositeNodeTest = {
  id: string;
  name: string;
  description?: string;
  inputs: Record<string, unknown>;
  expectedOutputs: Record<string, unknown>;
  tolerance?: number; // For floating point comparisons
  enabled: boolean;
};

export type CompositeTestResult = {
  testId: string;
  passed: boolean;
  actualOutputs: Record<string, unknown>;
  expectedOutputs: Record<string, unknown>;
  error?: string;
  details?: string;
  executionTime?: number;
};

export type CompositeTestSuite = {
  tests: CompositeNodeTest[];
  lastRun?: Date;
  results?: CompositeTestResult[];
};
