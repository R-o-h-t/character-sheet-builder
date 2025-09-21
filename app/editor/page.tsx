import BuilderView from "@/components/builder/builder-view";
import { ErrorTestComponent } from "@/components/error-boundary/error-test-component";

interface EditorPageProps {
  searchParams: { project?: string };
}

export default function EditorPage({ searchParams }: EditorPageProps) {
  const projectId = searchParams.project;

  return (
    <main className="w-full h-full flex flex-col items-center justify-center">
      <BuilderView projectId={projectId} />
      <ErrorTestComponent level="graph" />
    </main>
  );
}
