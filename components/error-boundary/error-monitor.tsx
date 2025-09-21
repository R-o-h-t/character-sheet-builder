'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge-new';
import { errorReporter, type ErrorReport } from '@/lib/error-reporting';

interface ErrorMonitorProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export function ErrorMonitor({ isVisible = false, onClose }: ErrorMonitorProps) {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [stats, setStats] = useState({ total: 0, node: 0, graph: 0, app: 0, lastHour: 0 });

  useEffect(() => {
    if (!isVisible) return;

    const updateErrors = () => {
      setErrors(errorReporter.getErrors());
      setStats(errorReporter.getErrorStats());
    };

    updateErrors();
    const interval = setInterval(updateErrors, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  const handleExport = () => {
    const data = errorReporter.exportErrors();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    errorReporter.clear();
    setErrors([]);
    setStats({ total: 0, node: 0, graph: 0, app: 0, lastHour: 0 });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'node': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'graph': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'app': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-4 z-50 bg-black/50 flex items-center justify-center">
      <Card className="w-full max-w-4xl h-full max-h-[80vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Monitor
              </CardTitle>
              <CardDescription>
                Application error tracking and debugging
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.node}</div>
              <div className="text-xs text-muted-foreground">Node</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.graph}</div>
              <div className="text-xs text-muted-foreground">Graph</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.app}</div>
              <div className="text-xs text-muted-foreground">App</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.lastHour}</div>
              <div className="text-xs text-muted-foreground">Last Hour</div>
            </div>
          </div>

          {/* Error List */}
          <div className="flex-1 overflow-auto space-y-2">
            {errors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No errors recorded
              </div>
            ) : (
              errors.map((error, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(error.level)}>
                        {error.level.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{error.error.name}</span>
                      {error.context?.nodeId && (
                        <Badge variant="outline">
                          {error.context.nodeType || 'Node'}: {error.context.nodeId}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {error.error.message}
                  </div>

                  {process.env.NODE_ENV === 'development' && error.error.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">
                        Stack Trace
                      </summary>
                      <pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">
                        {error.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
