'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { DataProvider, ProjectService } from '../projects/types';
import { LocalStorageProjectService } from '../projects/localStorage.service';

interface ProjectManagerContextValue {
  currentProvider: DataProvider;
  projectService: ProjectService;
  availableProviders: DataProvider[];
  switchProvider: (providerId: string) => void;
  addProvider: (provider: DataProvider) => void;
  removeProvider: (providerId: string) => void;
}

const ProjectManagerContext = createContext<ProjectManagerContextValue | undefined>(undefined);

const DEFAULT_PROVIDERS: DataProvider[] = [
  {
    id: 'localStorage',
    name: 'Local Storage',
    type: 'localStorage',
  },
];

const PROVIDER_STORAGE_KEY = 'visual-editor-providers';
const CURRENT_PROVIDER_KEY = 'visual-editor-current-provider';

export function ProjectManagerProvider({ children }: { children: React.ReactNode }) {
  const [availableProviders, setAvailableProviders] = useState<DataProvider[]>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_PROVIDERS;
    }

    try {
      const stored = window.localStorage.getItem(PROVIDER_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DataProvider[];
        return Array.isArray(parsed) ? parsed : DEFAULT_PROVIDERS;
      }
    } catch (error) {
      console.error('Failed to load providers from localStorage', error);
    }

    return DEFAULT_PROVIDERS;
  });

  const [currentProviderId, setCurrentProviderId] = useState<string>(() => {
    if (typeof window === 'undefined') {
      return 'localStorage';
    }

    try {
      const stored = window.localStorage.getItem(CURRENT_PROVIDER_KEY);
      return stored || 'localStorage';
    } catch (error) {
      console.error('Failed to load current provider from localStorage', error);
      return 'localStorage';
    }
  });

  const currentProvider = availableProviders.find(p => p.id === currentProviderId) || availableProviders[0];

  const [projectService, setProjectService] = useState<ProjectService>(() => {
    return createProjectService(currentProvider);
  });

  // Save providers to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(PROVIDER_STORAGE_KEY, JSON.stringify(availableProviders));
      } catch (error) {
        console.error('Failed to save providers to localStorage', error);
      }
    }
  }, [availableProviders]);

  // Save current provider to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CURRENT_PROVIDER_KEY, currentProviderId);
      } catch (error) {
        console.error('Failed to save current provider to localStorage', error);
      }
    }
  }, [currentProviderId]);

  // Update project service when provider changes
  useEffect(() => {
    setProjectService(createProjectService(currentProvider));
  }, [currentProvider]);

  const switchProvider = useCallback((providerId: string) => {
    const provider = availableProviders.find(p => p.id === providerId);
    if (provider) {
      setCurrentProviderId(providerId);
    }
  }, [availableProviders]);

  const addProvider = useCallback((provider: DataProvider) => {
    setAvailableProviders(prev => {
      const exists = prev.some(p => p.id === provider.id);
      if (exists) {
        return prev.map(p => p.id === provider.id ? provider : p);
      }
      return [...prev, provider];
    });
  }, []);

  const removeProvider = useCallback((providerId: string) => {
    if (providerId === 'localStorage') {
      // Don't allow removing the default localStorage provider
      return;
    }

    setAvailableProviders(prev => prev.filter(p => p.id !== providerId));

    // Switch to localStorage if current provider is being removed
    if (currentProviderId === providerId) {
      setCurrentProviderId('localStorage');
    }
  }, [currentProviderId]);

  const contextValue: ProjectManagerContextValue = {
    currentProvider,
    projectService,
    availableProviders,
    switchProvider,
    addProvider,
    removeProvider,
  };

  return (
    <ProjectManagerContext.Provider value={contextValue}>
      {children}
    </ProjectManagerContext.Provider>
  );
}

export function useProjectManager() {
  const context = useContext(ProjectManagerContext);
  if (!context) {
    throw new Error('useProjectManager must be used within a ProjectManagerProvider');
  }
  return context;
}

function createProjectService(provider: DataProvider): ProjectService {
  switch (provider.type) {
    case 'localStorage':
      return new LocalStorageProjectService();
    case 'remote':
      // TODO: Implement remote provider service
      throw new Error('Remote provider not implemented yet');
    case 'file':
      // TODO: Implement file provider service
      throw new Error('File provider not implemented yet');
    default:
      throw new Error(`Unknown provider type: ${provider.type}`);
  }
}
