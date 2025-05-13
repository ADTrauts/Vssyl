'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, X, Check } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  version: string;
  price: string;
  moduleFile: File | null;
  manifestFile: File | null;
  permissions: string[];
  dependencies: Record<string, string>;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  version?: string;
  price?: string;
  moduleFile?: string;
  manifestFile?: string;
  permissions?: string;
  dependencies?: string;
}

export default function ModuleSubmissionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    version: '',
    price: '',
    moduleFile: null,
    manifestFile: null,
    permissions: [],
    dependencies: {},
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState('');
  const [newDependency, setNewDependency] = useState({ name: '', version: '' });

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Module name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.version.trim()) {
      newErrors.version = 'Version is required';
    } else if (!/^\d+\.\d+\.\d+$/.test(formData.version)) {
      newErrors.version = 'Version must be in format x.y.z';
    }

    if (formData.price && !/^\d+(\.\d{1,2})?$/.test(formData.price)) {
      newErrors.price = 'Price must be a valid number';
    }

    if (!formData.moduleFile) {
      newErrors.moduleFile = 'Module file is required';
    } else if (formData.moduleFile.size > 10 * 1024 * 1024) {
      newErrors.moduleFile = 'Module file must be less than 10MB';
    }

    if (!formData.manifestFile) {
      newErrors.manifestFile = 'Manifest file is required';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'At least one permission is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('version', formData.version);
      if (formData.price) formDataToSend.append('price', formData.price);
      if (formData.moduleFile) formDataToSend.append('moduleFile', formData.moduleFile);
      if (formData.manifestFile) formDataToSend.append('manifestFile', formData.manifestFile);
      formDataToSend.append('permissions', JSON.stringify(formData.permissions));
      formDataToSend.append('dependencies', JSON.stringify(formData.dependencies));

      const response = await fetch('/api/marketplace/modules/submit', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to submit module');
      }

      const data = await response.json();
      setSuccess(true);
      setTimeout(() => {
        router.push(`/modules/${data.id}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'moduleFile' | 'manifestFile') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const addPermission = () => {
    if (newPermission.trim() && !formData.permissions.includes(newPermission.trim())) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, newPermission.trim()]
      }));
      setNewPermission('');
    }
  };

  const removePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter(p => p !== permission)
    }));
  };

  const addDependency = () => {
    if (newDependency.name.trim() && newDependency.version.trim()) {
      setFormData(prev => ({
        ...prev,
        dependencies: {
          ...prev.dependencies,
          [newDependency.name.trim()]: newDependency.version.trim()
        }
      }));
      setNewDependency({ name: '', version: '' });
    }
  };

  const removeDependency = (name: string) => {
    const newDependencies = { ...formData.dependencies };
    delete newDependencies[name];
    setFormData(prev => ({
      ...prev,
      dependencies: newDependencies
    }));
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Submit New Module</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert>
                <AlertDescription className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Module submitted successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Module Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter module name"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="1.0.0"
                />
                {errors.version && <p className="text-sm text-red-500">{errors.version}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your module"
                rows={4}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
              {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="moduleFile">Module File</Label>
                <Input
                  id="moduleFile"
                  type="file"
                  accept=".js,.ts"
                  onChange={(e) => handleFileChange(e, 'moduleFile')}
                />
                {errors.moduleFile && <p className="text-sm text-red-500">{errors.moduleFile}</p>}
                {formData.moduleFile && (
                  <p className="text-sm text-gray-500">
                    Selected: {formData.moduleFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="manifestFile">Manifest File</Label>
                <Input
                  id="manifestFile"
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileChange(e, 'manifestFile')}
                />
                {errors.manifestFile && <p className="text-sm text-red-500">{errors.manifestFile}</p>}
                {formData.manifestFile && (
                  <p className="text-sm text-gray-500">
                    Selected: {formData.manifestFile.name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Required Permissions</Label>
                <div className="flex gap-2">
                  <Input
                    value={newPermission}
                    onChange={(e) => setNewPermission(e.target.value)}
                    placeholder="Enter permission"
                  />
                  <Button type="button" onClick={addPermission}>
                    Add
                  </Button>
                </div>
                {errors.permissions && <p className="text-sm text-red-500">{errors.permissions}</p>}
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary">
                      {permission}
                      <button
                        type="button"
                        onClick={() => removePermission(permission)}
                        className="ml-2 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dependencies</Label>
                <div className="flex gap-2">
                  <Input
                    value={newDependency.name}
                    onChange={(e) => setNewDependency(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Package name"
                  />
                  <Input
                    value={newDependency.version}
                    onChange={(e) => setNewDependency(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="Version"
                  />
                  <Button type="button" onClick={addDependency}>
                    Add
                  </Button>
                </div>
                {errors.dependencies && <p className="text-sm text-red-500">{errors.dependencies}</p>}
                <div className="space-y-2">
                  {Object.entries(formData.dependencies).map(([name, version]) => (
                    <div key={name} className="flex items-center justify-between p-2 border rounded">
                      <span>{name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{version}</span>
                        <button
                          type="button"
                          onClick={() => removeDependency(name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Module'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 