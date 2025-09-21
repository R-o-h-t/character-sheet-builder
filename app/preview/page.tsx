import BuilderView from "@/components/builder/builder-view";

interface PreviewPageProps {
  searchParams: { project?: string };
}

export default function PreviewPage({ searchParams }: PreviewPageProps) {
  const projectId = searchParams.project;

  if (!projectId) {
    return (
      <main className="w-full h-full flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">No Project Selected</h1>
          <p className="text-muted-foreground">
            Please select a project to preview from the home page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full h-full flex flex-col items-center justify-center">
      <BuilderView projectId={projectId} isPreviewMode />
    </main>
  );
}
