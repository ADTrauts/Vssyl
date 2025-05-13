'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code } from '@/components/ui/code';

interface Module {
  id: string;
  name: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected';
  developer: string;
  submittedAt: string;
  lastUpdated: string;
  description: string;
  manifest: {
    permissions: string[];
    dependencies: Record<string, string>;
  };
  code: string;
  securityReport: {
    score: number;
    issues: Array<{
      severity: 'high' | 'medium' | 'low';
      description: string;
      location: string;
    }>;
  };
}

export default function ModuleReviewPage({ params }: { params: { id: string } }) {
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const response = await fetch(`/api/admin/modules/${params.id}`);
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

  const handleApprove = async () => {
    try {
      const response = await fetch(`/api/admin/modules/${params.id}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        setModule(prev => prev ? { ...prev, status: 'approved' } : null);
      }
    } catch (error) {
      console.error('Error approving module:', error);
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`/api/admin/modules/${params.id}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        setModule(prev => prev ? { ...prev, status: 'rejected' } : null);
      }
    } catch (error) {
      console.error('Error rejecting module:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!module) {
    return <div>Module not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{module.name}</h1>
          <p className="text-muted-foreground">Version {module.version}</p>
        </div>
        <div className="flex gap-4">
          <Badge variant={
            module.status === 'approved' ? 'success' :
            module.status === 'rejected' ? 'destructive' :
            'secondary'
          }>
            {module.status}
          </Badge>
          {module.status === 'pending' && (
            <>
              <Button variant="success" onClick={handleApprove}>
                Approve
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="code">Code Review</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Module Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Description</h3>
                  <p>{module.description}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Developer</h3>
                  <p>{module.developer}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Submitted</h3>
                  <p>{new Date(module.submittedAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Last Updated</h3>
                  <p>{new Date(module.lastUpdated).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code">
          <Card>
            <CardHeader>
              <CardTitle>Code Review</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Code>{module.code}</Code>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Security Score</h3>
                  <p>{module.securityReport.score}/100</p>
                </div>
                <div>
                  <h3 className="font-semibold">Issues</h3>
                  <div className="space-y-2">
                    {module.securityReport.issues.map((issue, index) => (
                      <div key={index} className="p-2 border rounded">
                        <Badge variant={
                          issue.severity === 'high' ? 'destructive' :
                          issue.severity === 'medium' ? 'warning' :
                          'secondary'
                        }>
                          {issue.severity}
                        </Badge>
                        <p className="mt-1">{issue.description}</p>
                        <p className="text-sm text-muted-foreground">{issue.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                <div>
                  <h3 className="font-semibold">Dependencies</h3>
                  <div className="space-y-2 mt-2">
                    {Object.entries(module.manifest.dependencies).map(([name, version]) => (
                      <div key={name} className="flex justify-between items-center p-2 border rounded">
                        <span>{name}</span>
                        <span className="text-muted-foreground">{version}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 