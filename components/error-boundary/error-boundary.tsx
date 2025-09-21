'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { errorReporter } from '@/lib/error-reporting';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'node' | 'graph' | 'app';
  identifier?: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Report error to error tracking system
    errorReporter.report(this.props.level || 'app', error, {
      nodeId: this.props.identifier,
      nodeType: this.props.level === 'node' ? this.props.identifier : undefined,
      componentStack: errorInfo.componentStack || undefined,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Level-specific error displays
      switch (this.props.level) {
        case 'node':
          return (
            <div className="min-w-[200px] min-h-[100px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                Node Error
              </p>
              {this.props.identifier && (
                <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                  {this.props.identifier}
                </p>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={this.handleRetry}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          );

        case 'graph':
          return (
            <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-950/20">
              <Card className="max-w-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-5 w-5" />
                    Graph Error
                  </CardTitle>
                  <CardDescription>
                    An error occurred while rendering the flow graph
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {this.state.error && (
                      <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-sm">
                        <p className="font-medium text-red-800 dark:text-red-200">
                          {this.state.error.message}
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={this.handleRetry} size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                      <Button
                        variant="outline"
                        onClick={this.handleGoHome}
                        size="sm"
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Go Home
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );

        case 'app':
        default:
          return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950/20 p-4">
              <Card className="max-w-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-6 w-6" />
                    Application Error
                  </CardTitle>
                  <CardDescription>
                    Something went wrong in the visual editor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {this.state.error && (
                      <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded">
                        <p className="font-medium text-red-800 dark:text-red-200 mb-2">
                          Error Details:
                        </p>
                        <code className="text-sm text-red-700 dark:text-red-300 break-all">
                          {this.state.error.message}
                        </code>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button onClick={this.handleRetry}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                      <Button
                        variant="outline"
                        onClick={this.handleGoHome}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Return to Home
                      </Button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-muted-foreground">
                          Stack Trace (Development)
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
      }
    }

    return this.props.children;
  }
}

// Convenience wrapper for node-level error boundaries
export function NodeErrorBoundary({
  children,
  nodeId,
  nodeType
}: {
  children: ReactNode;
  nodeId?: string;
  nodeType?: string;
}) {
  return (
    <ErrorBoundary
      level="node"
      identifier={nodeId ? `${nodeType || 'Node'} (${nodeId})` : nodeType}
      onError={(error, errorInfo) => {
        console.error(`Node error in ${nodeType || 'unknown'} (${nodeId || 'unknown'}):`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Convenience wrapper for graph-level error boundaries
export function GraphErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="graph"
      onError={(error, errorInfo) => {
        console.error('Graph error:', error);
        // Could send to error reporting service here
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Convenience wrapper for app-level error boundaries
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="app"
      onError={(error, errorInfo) => {
        console.error('Application error:', error);
        // Could send to error reporting service here
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
