'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowUpRight, Download, Star, Users } from 'lucide-react';

interface DeveloperStats {
  totalModules: number;
  approvedModules: number;
  pendingModules: number;
  totalDownloads: number;
  totalRevenue: number;
  averageRating: number;
}

interface Module {
  id: string;
  name: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected';
  downloads: number;
  revenue: number;
  rating: number;
  lastUpdated: string;
}

export default function DeveloperDashboard() {
  const [stats, setStats] = useState<DeveloperStats>({
    totalModules: 0,
    approvedModules: 0,
    pendingModules: 0,
    totalDownloads: 0,
    totalRevenue: 0,
    averageRating: 0,
  });
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, modulesResponse] = await Promise.all([
          fetch('/api/developer/stats'),
          fetch('/api/developer/modules'),
        ]);
        
        const statsData = await statsResponse.json();
        const modulesData = await modulesResponse.json();
        
        setStats(statsData);
        setModules(modulesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Developer Dashboard</h1>
        <Button onClick={() => window.location.href = '/developer/submit'}>
          Submit New Module
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalModules}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Progress value={(stats.approvedModules / stats.totalModules) * 100} className="w-full" />
              <span className="ml-2">{stats.approvedModules} approved</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12.5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Based on all reviews</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>{module.name}</TableCell>
                  <TableCell>
                    <Badge variant={
                      module.status === 'approved' ? 'success' :
                      module.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {module.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{module.downloads.toLocaleString()}</TableCell>
                  <TableCell>${module.revenue.toLocaleString()}</TableCell>
                  <TableCell>{module.rating.toFixed(1)}</TableCell>
                  <TableCell>{new Date(module.lastUpdated).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/developer/modules/${module.id}`, '_blank')}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/developer/modules/${module.id}/analytics`, '_blank')}
                      >
                        Analytics
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 