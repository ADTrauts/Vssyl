'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Download, Code, Shield, Package, User } from 'lucide-react';

interface Module {
  id: string;
  name: string;
  description: string;
  version: string;
  rating: number;
  downloads: number;
  isFree: boolean;
  price?: number;
  developer: {
    name: string;
    id: string;
  };
  lastUpdated: string;
  manifest: {
    permissions: string[];
    dependencies: Record<string, string>;
  };
  securityReport: {
    score: number;
    issues: Array<{
      severity: 'high' | 'medium' | 'low';
      description: string;
      location: string;
    }>;
  };
  reviews: Array<{
    id: string;
    user: {
      name: string;
      id: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

export default function ModuleDetailsPage({ params }: { params: { id: string } }) {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const response = await fetch(`/api/marketplace/modules/${params.id}`);
        const data = await response.json();
        setModule(data);
      } catch (error) {
        console.error('Error fetching module:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading module details...</div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Module not found</div>
      </div>
    );
  }

  const handleInstall = async () => {
    try {
      const response = await fetch(`/api/marketplace/modules/${module.id}/install`, {
        method: 'POST',
      });
      if (response.ok) {
        // TODO: Show success message and update UI
      }
    } catch (error) {
      console.error('Error installing module:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">{module.name}</h1>
          <p className="text-gray-600 mt-2">{module.description}</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{module.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>{module.downloads.toLocaleString()} downloads</span>
            </div>
            <Badge variant="outline">v{module.version}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            size="lg"
            onClick={handleInstall}
          >
            {module.isFree ? 'Install' : `Buy for $${module.price}`}
          </Button>
          <Button variant="outline" size="lg">
            Add to Wishlist
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  <span>Module Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Developer</h3>
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {module.developer.name}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Last Updated</h3>
                    <p>{new Date(module.lastUpdated).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Required Permissions</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {module.manifest.permissions.map((permission, index) => (
                        <Badge key={index} variant="outline">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  <span>Dependencies</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(module.manifest.dependencies).map(([name, version]) => (
                    <div key={name} className="flex justify-between items-center p-2 border rounded">
                      <span>{name}</span>
                      <span className="text-gray-500">{version}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Security Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Security Score</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-xl font-bold">
                      {module.securityReport.score}
                    </div>
                    <span>/100</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Issues</h3>
                  <div className="space-y-2">
                    {module.securityReport.issues.map((issue, index) => (
                      <div key={index} className="p-3 border rounded">
                        <Badge variant={
                          issue.severity === 'high' ? 'destructive' :
                          issue.severity === 'medium' ? 'warning' :
                          'secondary'
                        }>
                          {issue.severity}
                        </Badge>
                        <p className="mt-1">{issue.description}</p>
                        <p className="text-sm text-gray-500">{issue.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {module.reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{review.user.name}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2">{review.comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 