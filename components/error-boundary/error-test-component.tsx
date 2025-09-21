'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { errorReporter } from '@/lib/error-reporting';

interface ErrorTestComponentProps {
  level?: 'node' | 'graph' | 'app';
  nodeId?: string;
  nodeType?: string;
}

export function ErrorTestComponent({
  level = 'app',
  nodeId,
  nodeType
}: ErrorTestComponentProps) {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error(`Test error at ${level} level`);
  }

  const triggerReportedError = () => {
    errorReporter.report(
      level,
      new Error(`Manual test error reported at ${level} level`),
      { nodeId, nodeType }
    );
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setShouldError(true)}
      >
        Trigger {level} Error
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={triggerReportedError}
      >
        Report {level} Error
      </Button>
    </div>
  );
}
