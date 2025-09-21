'use client';

import { useState } from 'react';
import { Settings, Database, Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectManager } from '@/lib/context/project-manager.context';
import type { DataProvider } from '@/lib/projects/types';

export function DataProviderSettings() {
  const {
    currentProvider,
    availableProviders,
    switchProvider,
    addProvider,
    removeProvider
  } = useProjectManager();

  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderType, setNewProviderType] = useState<DataProvider['type']>('localStorage');

  const handleAddProvider = () => {
    if (!newProviderName.trim()) return;

    const newProvider: DataProvider = {
      id: newProviderName.toLowerCase().replace(/\s+/g, '-'),
      name: newProviderName.trim(),
      type: newProviderType,
      config: {},
    };

    addProvider(newProvider);
    setNewProviderName('');
    setIsAddingProvider(false);
  };

  const getProviderIcon = (type: DataProvider['type']) => {
    switch (type) {
      case 'localStorage':
        return '💾';
      case 'remote':
        return '🌐';
      case 'file':
        return '📁';
      default:
        return '❓';
    }
  };

  const getProviderDescription = (type: DataProvider['type']) => {
    switch (type) {
      case 'localStorage':
        return 'Store projects locally in your browser';
      case 'remote':
        return 'Connect to a remote server or cloud service';
      case 'file':
        return 'Save projects to local files';
      default:
        return 'Unknown provider type';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Data Provider Settings</h1>
          <p className="text-muted-foreground">
            Manage how and where your projects are stored
          </p>
        </div>
      </div>

      {/* Current Provider */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Active Provider
          </CardTitle>
          <CardDescription>
            Currently using {currentProvider.name} for project storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-2xl">{getProviderIcon(currentProvider.type)}</span>
            <div className="flex-1">
              <h3 className="font-semibold">{currentProvider.name}</h3>
              <p className="text-sm text-muted-foreground">
                {getProviderDescription(currentProvider.type)}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Type: {currentProvider.type}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Providers */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Providers</CardTitle>
              <CardDescription>
                Switch between different data storage methods
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingProvider(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Provider
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableProviders.map((provider) => (
              <div
                key={provider.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${provider.id === currentProvider.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/50'
                  }`}
              >
                <span className="text-2xl">{getProviderIcon(provider.type)}</span>
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    {provider.name}
                    {provider.id === currentProvider.id && (
                      <span className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">
                        Active
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getProviderDescription(provider.type)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {provider.id !== currentProvider.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => switchProvider(provider.id)}
                    >
                      Switch
                    </Button>
                  )}
                  {provider.id !== 'localStorage' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeProvider(provider.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Provider Modal */}
      {isAddingProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Provider</CardTitle>
            <CardDescription>
              Configure a new data storage provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Provider Name</label>
                <Input
                  placeholder="Enter provider name"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Provider Type</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {getProviderIcon(newProviderType)} {newProviderType}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Select Provider Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setNewProviderType('localStorage')}>
                      💾 localStorage
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewProviderType('remote')}>
                      🌐 Remote (Coming Soon)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setNewProviderType('file')}>
                      📁 File (Coming Soon)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddProvider}
                  disabled={!newProviderName.trim()}
                >
                  Add Provider
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingProvider(false);
                    setNewProviderName('');
                    setNewProviderType('localStorage');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            About Data Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              <strong>Local Storage:</strong> Projects are stored in your browser's local storage.
              Data persists between sessions but is limited to this browser and device.
            </p>
            <p>
              <strong>Remote Providers:</strong> Connect to external services like databases,
              cloud storage, or APIs. Requires additional configuration. (Coming Soon)
            </p>
            <p>
              <strong>File System:</strong> Save projects as files on your local device.
              Useful for version control and backup. (Coming Soon)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
