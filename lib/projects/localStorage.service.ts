import { nanoid } from 'nanoid';
import type { ProjectData, ProjectMetadata, ProjectService, ProjectTemplate } from './types';

const PROJECTS_STORAGE_KEY = 'visual-editor-projects';
const METADATA_STORAGE_KEY = 'visual-editor-projects-metadata';

export class LocalStorageProjectService implements ProjectService {
  getProviderId(): string {
    return 'localStorage';
  }

  getProviderName(): string {
    return 'Local Storage';
  }

  async loadProjects(): Promise<ProjectMetadata[]> {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(METADATA_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as ProjectMetadata[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load projects metadata from localStorage', error);
      return [];
    }
  }

  async loadProject(id: string): Promise<ProjectData | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(`${PROJECTS_STORAGE_KEY}-${id}`);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as ProjectData;
    } catch (error) {
      console.error(`Failed to load project ${id} from localStorage`, error);
      return null;
    }
  }

  async saveProject(project: ProjectData): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Save project data
      window.localStorage.setItem(
        `${PROJECTS_STORAGE_KEY}-${project.metadata.id}`,
        JSON.stringify(project)
      );

      // Update metadata list
      const projects = await this.loadProjects();
      const existingIndex = projects.findIndex(p => p.id === project.metadata.id);

      if (existingIndex >= 0) {
        projects[existingIndex] = project.metadata;
      } else {
        projects.push(project.metadata);
      }

      window.localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Failed to save project to localStorage', error);
      throw error;
    }
  }

  async deleteProject(id: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Remove project data
      window.localStorage.removeItem(`${PROJECTS_STORAGE_KEY}-${id}`);

      // Update metadata list
      const projects = await this.loadProjects();
      const filtered = projects.filter(p => p.id !== id);
      window.localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error(`Failed to delete project ${id} from localStorage`, error);
      throw error;
    }
  }

  async createProject(template?: ProjectTemplate): Promise<ProjectData> {
    const now = new Date().toISOString();
    const id = nanoid(8);

    const project: ProjectData = {
      metadata: {
        id,
        name: template?.name || 'Untitled Project',
        description: template?.description,
        category: template?.category,
        tags: [],
        thumbnail: template?.thumbnail,
        createdAt: now,
        updatedAt: now,
        version: 1,
      },
      nodes: template?.initialNodes || [],
      edges: template?.initialEdges || [],
      settings: template?.settings || {},
    };

    await this.saveProject(project);
    return project;
  }

  async exportProject(id: string): Promise<string> {
    const project = await this.loadProject(id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }
    return JSON.stringify(project, null, 2);
  }

  async importProject(data: string): Promise<ProjectData> {
    try {
      const project = JSON.parse(data) as ProjectData;

      // Generate new ID and update timestamps
      const now = new Date().toISOString();
      project.metadata.id = nanoid(8);
      project.metadata.createdAt = now;
      project.metadata.updatedAt = now;

      await this.saveProject(project);
      return project;
    } catch (error) {
      console.error('Failed to import project', error);
      throw new Error('Invalid project data');
    }
  }
}
