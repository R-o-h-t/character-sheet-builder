'use client';

import { useState, useEffect } from 'react';
import { ErrorMonitor } from './error-monitor';

export function GlobalErrorMonitor() {
  const [showErrorMonitor, setShowErrorMonitor] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Shift + E to toggle error monitor (dev only)
      if (
        process.env.NODE_ENV === 'development' &&
        event.ctrlKey &&
        event.shiftKey &&
        event.key === 'E'
      ) {
        event.preventDefault();
        setShowErrorMonitor(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorMonitor
      isVisible={showErrorMonitor}
      onClose={() => setShowErrorMonitor(false)}
    />
  );
}
