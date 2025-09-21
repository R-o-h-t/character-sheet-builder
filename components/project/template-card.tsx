import * as React from "react";
import { Plus, FileText, Calculator, Zap } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ProjectTemplate } from "@/lib/projects/types";

interface TemplateCardProps {
  template: ProjectTemplate;
  onSelect: (template: ProjectTemplate) => void;
  className?: string;
}

const TEMPLATE_ICONS = {
  blank: FileText,
  calculator: Calculator,
  'boolean-logic': Zap,
} as const;

export function TemplateCard({ template, onSelect, className }: TemplateCardProps) {
  const IconComponent = TEMPLATE_ICONS[template.id as keyof typeof TEMPLATE_ICONS] || FileText;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <IconComponent className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{template.name}</CardTitle>
            {template.category && (
              <CardDescription className="text-xs">{template.category}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {template.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          )}

          {template.thumbnail && (
            <div className="aspect-video bg-muted rounded-md overflow-hidden">
              <img
                src={template.thumbnail}
                alt={`${template.name} preview`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          <Button
            onClick={() => onSelect(template)}
            className="w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface NewProjectCardProps {
  onCreateBlank: () => void;
  className?: string;
}

export function NewProjectCard({ onCreateBlank, className }: NewProjectCardProps) {
  return (
    <Card className={`${className} border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer`}>
      <CardContent className="flex flex-col items-center justify-center py-8 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg mb-2">Create New Project</CardTitle>
        <CardDescription className="text-center mb-4">
          Start with a blank canvas or choose from templates below
        </CardDescription>
        <Button onClick={onCreateBlank} size="sm">
          Create Blank Project
        </Button>
      </CardContent>
    </Card>
  );
}
