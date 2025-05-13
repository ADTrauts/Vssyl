'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Module {
  id: string;
  name: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected';
  developer: string;
  submittedAt: string;
  lastUpdated: string;
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    // TODO: Fetch modules from API
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/admin/modules');
        const data = await response.json();
        setModules(data);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };

    fetchModules();
  }, []);

  const filteredModules = modules.filter(module => {
    const matchesFilter = filter === 'all' || module.status === filter;
    const matchesSearch = module.name.toLowerCase().includes(search.toLowerCase()) ||
                         module.developer.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        setModules(modules.map(module => 
          module.id === moduleId ? { ...module, status: 'approved' } : module
        ));
      }
    } catch (error) {
      console.error('Error approving module:', error);
    }
  };

  const handleReject = async (moduleId: string) => {
    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        setModules(modules.map(module => 
          module.id === moduleId ? { ...module, status: 'rejected' } : module
        ));
      }
    } catch (error) {
      console.error('Error rejecting module:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Module Management</h1>
        <div className="flex gap-4">
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.map((module) => (
                <TableRow key={module.id}>
                  <TableCell>{module.name}</TableCell>
                  <TableCell>{module.version}</TableCell>
                  <TableCell>{module.developer}</TableCell>
                  <TableCell>
                    <Badge variant={
                      module.status === 'approved' ? 'success' :
                      module.status === 'rejected' ? 'destructive' :
                      'secondary'
                    }>
                      {module.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(module.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/modules/${module.id}`, '_blank')}
                      >
                        Review
                      </Button>
                      {module.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprove(module.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(module.id)}
                          >
                            Reject
                          </Button>
                        </>
                      )}
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