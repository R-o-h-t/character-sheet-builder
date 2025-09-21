import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Play, Trash2, TestTube, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Node } from '../builder/node-registry';
import { CompositeNodeTest, CompositeTestResult, CompositeTestSuite } from '../../lib/testing/composite-test-types';
import { executeCompositeTest, executeCompositeTestSuite, createDefaultTest, validateTest } from '../../lib/testing/composite-test-runner';

interface CompositeTestingPanelProps {
  node: Node;
  onTestSuiteChange: (testSuite: CompositeTestSuite) => void;
  testSuite?: CompositeTestSuite;
}

export function CompositeTestingPanel({ node, onTestSuiteChange, testSuite }: CompositeTestingPanelProps) {
  const [tests, setTests] = useState<CompositeNodeTest[]>(testSuite?.tests || []);
  const [results, setResults] = useState<CompositeTestResult[]>(testSuite?.results || []);
  const [isRunning, setIsRunning] = useState(false);
  const [editingTest, setEditingTest] = useState<string | null>(null);

  // Update parent when tests change
  useEffect(() => {
    onTestSuiteChange({
      tests,
      lastRun: testSuite?.lastRun,
      results,
    });
  }, [tests, results, onTestSuiteChange, testSuite?.lastRun]);

  const addNewTest = () => {
    const newTest = createDefaultTest(node);
    setTests([...tests, newTest]);
    setEditingTest(newTest.id);
  };

  const updateTest = (testId: string, updates: Partial<CompositeNodeTest>) => {
    setTests(tests.map(test =>
      test.id === testId ? { ...test, ...updates } : test
    ));
  };

  const deleteTest = (testId: string) => {
    setTests(tests.filter(test => test.id !== testId));
    setResults(results.filter(result => result.testId !== testId));
  };

  const runSingleTest = async (test: CompositeNodeTest) => {
    if (!test.enabled) return;

    setIsRunning(true);
    try {
      const result = await executeCompositeTest(node, test);
      setResults(prevResults => [
        ...prevResults.filter(r => r.testId !== test.id),
        result
      ]);
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    try {
      const result = await executeCompositeTestSuite(node, { tests });
      setResults(result.results);
      onTestSuiteChange({
        tests,
        lastRun: new Date(),
        results: result.results,
      });
    } catch (error) {
      console.error('Error running test suite:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestResult = (testId: string) => results.find(r => r.testId === testId);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Composite Node Tests
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={addNewTest}
            size="sm"
            variant="outline"
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Test
          </Button>
          <Button
            onClick={runAllTests}
            disabled={isRunning || tests.length === 0}
            size="sm"
            className="flex items-center gap-1"
          >
            <Play className="h-4 w-4" />
            Run All Tests
          </Button>
        </div>
      </div>

      {tests.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tests configured for this composite node.</p>
          <p className="text-sm mt-2">Add a test to validate input/output behavior.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => {
            const result = getTestResult(test.id);
            const validation = validateTest(test);
            const isEditing = editingTest === test.id;

            return (
              <Card key={test.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={test.enabled}
                      onChange={(e) => updateTest(test.id, { enabled: e.target.checked })}
                      className="rounded"
                    />
                    {isEditing ? (
                      <Input
                        value={test.name}
                        onChange={(e) => updateTest(test.id, { name: e.target.value })}
                        onBlur={() => setEditingTest(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingTest(null)}
                        className="font-medium"
                        autoFocus
                      />
                    ) : (
                      <h4
                        className="font-medium cursor-pointer hover:text-blue-600"
                        onClick={() => setEditingTest(test.id)}
                      >
                        {test.name}
                      </h4>
                    )}
                    {result && (
                      <div className="flex items-center gap-1">
                        {result.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {result.executionTime && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.executionTime.toFixed(2)}ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => runSingleTest(test)}
                      disabled={isRunning || !test.enabled || !validation.valid}
                      size="sm"
                      variant="outline"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => deleteTest(test.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {test.description && (
                  <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-muted-foreground">Inputs:</label>
                    <div className="bg-muted/30 rounded p-2 mt-1 font-mono text-xs">
                      {JSON.stringify(test.inputs, null, 2)}
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground">Expected Outputs:</label>
                    <div className="bg-muted/30 rounded p-2 mt-1 font-mono text-xs">
                      {JSON.stringify(test.expectedOutputs, null, 2)}
                    </div>
                  </div>
                </div>

                {result && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Result:</span>
                      <span className={`text-sm px-2 py-1 rounded ${result.passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>

                    {!result.passed && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                        <div className="text-sm font-medium text-red-800 mb-1">Actual Outputs:</div>
                        <div className="font-mono text-xs text-red-700">
                          {JSON.stringify(result.actualOutputs, null, 2)}
                        </div>
                      </div>
                    )}

                    {result.details && (
                      <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
                        {result.details}
                      </div>
                    )}

                    {result.error && (
                      <div className="text-xs text-red-600 bg-red-50 rounded p-2 border border-red-200">
                        Error: {result.error}
                      </div>
                    )}
                  </div>
                )}

                {!validation.valid && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-sm text-red-600">
                      <div className="font-medium">Validation Errors:</div>
                      <ul className="text-xs list-disc list-inside mt-1">
                        {validation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {tests.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {tests.filter(t => t.enabled).length} enabled tests out of {tests.length} total
          {results.length > 0 && (
            <span className="ml-2">
              • {results.filter(r => r.passed).length} passed, {results.filter(r => !r.passed).length} failed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
