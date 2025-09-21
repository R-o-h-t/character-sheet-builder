import type { Edge, Node as FlowNode } from '@xyflow/react';

export type ProjectMetadata = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

export type ProjectData = {
  metadata: ProjectMetadata;
  nodes: FlowNode[];
  edges: Edge[];
  settings?: Record<string, any>;
};

export type DataProvider = {
  id: string;
  name: string;
  type: 'localStorage' | 'remote' | 'file';
  config?: Record<string, any>;
};

export type ProjectTemplate = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  thumbnail?: string;
  initialNodes: FlowNode[];
  initialEdges: Edge[];
  settings?: Record<string, any>;
};

export interface ProjectService {
  // Project CRUD operations
  loadProjects(): Promise<ProjectMetadata[]>;
  loadProject(id: string): Promise<ProjectData | null>;
  saveProject(project: ProjectData): Promise<void>;
  deleteProject(id: string): Promise<void>;
  createProject(template?: ProjectTemplate): Promise<ProjectData>;

  // Provider info
  getProviderId(): string;
  getProviderName(): string;

  // Provider-specific operations
  exportProject?(id: string): Promise<string>;
  importProject?(data: string): Promise<ProjectData>;
  sync?(): Promise<void>;
}
