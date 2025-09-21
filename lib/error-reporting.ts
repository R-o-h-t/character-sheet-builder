/**
 * Error reporting utility for the visual editor
 */

export interface ErrorReport {
  timestamp: string;
  level: 'node' | 'graph' | 'app';
  error: Error;
  context?: {
    nodeId?: string;
    nodeType?: string;
    userAgent?: string;
    url?: string;
    componentStack?: string;
  };
}

class ErrorReporter {
  private errors: ErrorReport[] = [];
  private maxErrors = 100; // Keep last 100 errors

  report(
    level: 'node' | 'graph' | 'app',
    error: Error,
    context?: ErrorReport['context']
  ) {
    const report: ErrorReport = {
      timestamp: new Date().toISOString(),
      level,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error,
      context: {
        ...context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    };

    this.errors.unshift(report);

    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${level.toUpperCase()} Error Report`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Full Report:', report);
      console.groupEnd();
    }

    // In production, you could send to an error tracking service
    // e.g., Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorService(report);
    }
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getErrorsByLevel(level: 'node' | 'graph' | 'app'): ErrorReport[] {
    return this.errors.filter(error => error.level === level);
  }

  clear() {
    this.errors = [];
  }

  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2);
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      node: 0,
      graph: 0,
      app: 0,
      lastHour: 0,
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    this.errors.forEach(error => {
      stats[error.level]++;
      if (new Date(error.timestamp) > oneHourAgo) {
        stats.lastHour++;
      }
    });

    return stats;
  }
}

// Global error reporter instance
export const errorReporter = new ErrorReporter();

// Global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    errorReporter.report('app', event.error || new Error(event.message), {
      url: event.filename,
      componentStack: `Line ${event.lineno}:${event.colno}`,
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorReporter.report('app', new Error(event.reason), {
      componentStack: 'Unhandled Promise Rejection',
    });
  });
}
