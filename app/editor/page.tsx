import BuilderView from "@/components/builder/builder-view";
import { ErrorTestComponent } from "@/components/error-boundary/error-test-component";

interface EditorPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const params = await searchParams;
  const projectId = params.project;

  return (
    <main className="w-full h-full flex flex-col items-center justify-center">
      <BuilderView projectId={projectId} />
      <ErrorTestComponent level="graph" />
    </main>
  );
}
