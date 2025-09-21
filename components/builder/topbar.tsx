import { Button } from '@/components/ui/button';
import { TestTube } from 'lucide-react';
import React from 'react';

type TopbarProps = {
  title: string;
  subtitle?: string;
  onSave?: () => void;
  onCancel?: () => void;
  onTest?: () => void;
  showSave?: boolean;
  showCancel?: boolean;
  showTest?: boolean;
  rightSlot?: React.ReactNode;
};

export function Topbar({
  title,
  subtitle,
  onSave,
  onCancel,
  onTest,
  showSave = true,
  showCancel = true,
  showTest = true,
  rightSlot,
}: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="min-w-0">
        <h2 className="text-sm sm:text-base font-semibold truncate">{title}</h2>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {rightSlot}
        {showTest && (
          <Button variant="outline" size="sm" onClick={onTest} className="hidden sm:inline-flex">
            <TestTube className="h-4 w-4 mr-2" /> Test
          </Button>
        )}
        {showCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {showSave && (
          <Button size="sm" onClick={onSave}>
            Save
          </Button>
        )}
      </div>
    </header>
  );
}

export default Topbar;
