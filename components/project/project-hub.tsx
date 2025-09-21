'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Settings, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';
import { ProjectCard } from '@/components/project/project-card';
import { TemplateCard, NewProjectCard } from '@/components/project/template-card';
import { useProjectManager } from '@/lib/context/project-manager.context';
import { DEFAULT_TEMPLATES } from '@/lib/projects/templates';
import type { ProjectMetadata, ProjectTemplate } from '@/lib/projects/types';

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'recent' | 'category';

export function ProjectHub() {
  const router = useRouter();
  const { projectService } = useProjectManager();

  const [projects, setProjects] = useState<ProjectMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [projectService]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const loadedProjects = await projectService.loadProjects();
      setProjects(loadedProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlank = async () => {
    try {
      const project = await projectService.createProject();
      router.push(`/editor?project=${project.metadata.id}`);
    } catch (error) {
      console.error('Failed to create blank project:', error);
    }
  };

  const handleSelectTemplate = async (template: ProjectTemplate) => {
    try {
      const project = await projectService.createProject(template);
      router.push(`/editor?project=${project.metadata.id}`);
    } catch (error) {
      console.error('Failed to create project from template:', error);
    }
  };

  const handleEditProject = (project: ProjectMetadata) => {
    router.push(`/editor?project=${project.id}`);
  };

  const handlePreviewProject = (project: ProjectMetadata) => {
    router.push(`/preview?project=${project.id}`);
  };

  const handleDeleteProject = async (project: ProjectMetadata) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await projectService.deleteProject(project.id);
        await loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  // Filter and search projects
  const filteredProjects = projects.filter((project) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.category?.toLowerCase().includes(query) ||
        project.tags?.some(tag => tag.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // Category filter
    if (filterMode === 'category' && selectedCategory) {
      return project.category === selectedCategory;
    }

    // Recent filter (last 7 days)
    if (filterMode === 'recent') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(project.updatedAt) > weekAgo;
    }

    return true;
  });

  // Get unique categories
  const categories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Visual Editor</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage your visual programming projects
            </p>
          </div>
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterMode('all')}>
                  All Projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterMode('recent')}>
                  Recent (7 days)
                </DropdownMenuItem>
                {categories.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Categories</DropdownMenuLabel>
                    {categories.map((category) => (
                      <DropdownMenuItem
                        key={category}
                        onClick={() => {
                          setFilterMode('category');
                          setSelectedCategory(category!);
                        }}
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center border rounded-md">
              <Toggle
                pressed={viewMode === 'grid'}
                onPressedChange={() => setViewMode('grid')}
                size="sm"
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Toggle>
              <Toggle
                pressed={viewMode === 'list'}
                onPressedChange={() => setViewMode('list')}
                size="sm"
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Toggle>
            </div>
          </div>
        </div>
      </div>

      {/* New Project Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NewProjectCard onCreateBlank={handleCreateBlank} />
          {DEFAULT_TEMPLATES.slice(1).map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleSelectTemplate}
            />
          ))}
        </div>
      </div>

      {/* Projects Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Your Projects {filteredProjects.length > 0 && `(${filteredProjects.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {projects.length === 0
                ? "No projects yet. Create your first project above!"
                : "No projects match your search criteria."
              }
            </p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-4"
          }>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEditProject}
                onPreview={handlePreviewProject}
                onDelete={handleDeleteProject}
                className={viewMode === 'list' ? 'w-full' : ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
