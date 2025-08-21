'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Input, Textarea, Spinner, Badge } from 'shared/components';
import { 
  getOrganizationalTiers,
  getDepartments,
  getPositions,
  createOrganizationalTier,
  createDepartment,
  createPosition,
  updateOrganizationalTier,
  updateDepartment,
  updatePosition,
  deleteOrganizationalTier,
  deleteDepartment,
  deletePosition,
  OrganizationalTier,
  Department,
  Position,
  CreateOrganizationalTierData,
  CreateDepartmentData,
  CreatePositionData
} from '@/api/orgChart';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building2, 
  UserCheck,
  ChevronDown,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

interface OrgChartBuilderProps {
  orgChartData: any;
  businessId: string;
  onUpdate: () => void;
}

type EditMode = 'none' | 'tier' | 'department' | 'position';
type EditAction = 'create' | 'edit';

export function OrgChartBuilder({ orgChartData, businessId, onUpdate }: OrgChartBuilderProps) {
  const { data: session } = useSession();
  const [tiers, setTiers] = useState<OrganizationalTier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [editAction, setEditAction] = useState<EditAction>('create');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['tiers', 'departments', 'positions']));

  // Form states
  const [tierForm, setTierForm] = useState({
    name: '',
    level: 1,
    description: ''
  });
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    parentDepartmentId: ''
  });
  const [positionForm, setPositionForm] = useState({
    name: '',
    description: '',
    tierId: '',
    departmentId: '',
    capacity: 1
  });

  useEffect(() => {
    if (orgChartData) {
      setTiers(orgChartData.tiers || []);
      setDepartments(orgChartData.departments || []);
      setPositions(orgChartData.positions || []);
    }
  }, [orgChartData]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const startEdit = (mode: EditMode, action: EditAction, item?: any) => {
    setEditMode(mode);
    setEditAction(action);
    setEditingItem(item);
    
    if (action === 'edit' && item) {
      if (mode === 'tier') {
        setTierForm({
          name: item.name,
          level: item.level,
          description: item.description || ''
        });
      } else if (mode === 'department') {
        setDepartmentForm({
          name: item.name,
          description: item.description || '',
          parentDepartmentId: item.parentDepartmentId || ''
        });
      } else if (mode === 'position') {
        setPositionForm({
          name: item.name,
          description: item.description || '',
          tierId: item.tierId,
          departmentId: item.departmentId || '',
          capacity: item.capacity
        });
      }
    } else {
      // Reset forms for create mode
      setTierForm({ name: '', level: 1, description: '' });
      setDepartmentForm({ name: '', description: '', parentDepartmentId: '' });
      setPositionForm({ name: '', description: '', tierId: '', departmentId: '', capacity: 1 });
    }
  };

  const cancelEdit = () => {
    setEditMode('none');
    setEditAction('create');
    setEditingItem(null);
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      if (editAction === 'create') {
        const data: CreateOrganizationalTierData = {
          businessId,
          ...tierForm
        };
        await createOrganizationalTier(data, session.accessToken);
      } else {
        await updateOrganizationalTier(editingItem.id, tierForm, session.accessToken);
      }
      
      onUpdate();
      cancelEdit();
    } catch (error) {
      console.error('Error saving tier:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      if (editAction === 'create') {
        const data: CreateDepartmentData = {
          businessId,
          ...departmentForm
        };
        await createDepartment(data, session.accessToken);
      } else {
        await updateDepartment(editingItem.id, departmentForm, session.accessToken);
      }
      
      onUpdate();
      cancelEdit();
    } catch (error) {
      console.error('Error saving department:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      if (editAction === 'create') {
        const data: CreatePositionData = {
          businessId,
          ...positionForm
        };
        await createPosition(data, session.accessToken);
      } else {
        await updatePosition(editingItem.id, positionForm, session.accessToken);
      }
      
      onUpdate();
      cancelEdit();
    } catch (error) {
      console.error('Error saving position:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mode: EditMode, id: string) => {
    if (!session?.accessToken || !confirm('Are you sure you want to delete this item?')) return;

    setLoading(true);
    try {
      if (mode === 'tier') {
        await deleteOrganizationalTier(id, session.accessToken);
      } else if (mode === 'department') {
        await deleteDepartment(id, session.accessToken);
      } else if (mode === 'position') {
        await deletePosition(id, session.accessToken);
      }
      
      onUpdate();
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierName = (tierId: string) => {
    return tiers.find(t => t.id === tierId)?.name || 'Unknown Tier';
  };

  const getDepartmentName = (departmentId: string) => {
    return departments.find(d => d.id === departmentId)?.name || 'No Department';
  };

  const getParentDepartmentName = (parentId: string) => {
    return departments.find(d => d.id === parentId)?.name || 'None';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Organization Structure</h2>
          <p className="text-gray-600">Build and manage your organizational hierarchy</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            onClick={() => startEdit('tier', 'create')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tier</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => startEdit('department', 'create')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => startEdit('position', 'create')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Position</span>
          </Button>
        </div>
      </div>

      {/* Organizational Tiers */}
      <Card>
        <div className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('tiers')}
          >
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Organizational Tiers</h3>
              <Badge color="blue">{tiers.length}</Badge>
            </div>
            {expandedSections.has('tiers') ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.has('tiers') && (
            <div className="mt-4 space-y-4">
              {tiers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No organizational tiers created yet</p>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('tier', 'create')}
                    className="mt-2"
                  >
                    Create First Tier
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">{tier.level}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{tier.name}</h4>
                          {tier.description && (
                            <p className="text-sm text-gray-600">{tier.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit('tier', 'edit', tier)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('tier', tier.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Departments */}
      <Card>
        <div className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('departments')}
          >
            <div className="flex items-center space-x-3">
              <Building2 className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Departments</h3>
              <Badge color="green">{departments.length}</Badge>
            </div>
            {expandedSections.has('departments') ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.has('departments') && (
            <div className="mt-4 space-y-4">
              {departments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No departments created yet</p>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('department', 'create')}
                    className="mt-2"
                  >
                    Create First Department
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{dept.name}</h4>
                          {dept.description && (
                            <p className="text-sm text-gray-600">{dept.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>Parent: {getParentDepartmentName(dept.parentDepartmentId || '')}</span>
                            <span>Positions: {positions.filter(p => p.departmentId === dept.id).length}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit('department', 'edit', dept)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('department', dept.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Positions */}
      <Card>
        <div className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('positions')}
          >
            <div className="flex items-center space-x-3">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900">Positions</h3>
              <Badge color="blue">{positions.length}</Badge>
            </div>
            {expandedSections.has('positions') ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.has('positions') && (
            <div className="mt-4 space-y-4">
              {positions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No positions created yet</p>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('position', 'create')}
                    className="mt-2"
                  >
                    Create First Position
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {positions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{position.name}</h4>
                          {position.description && (
                            <p className="text-sm text-gray-600">{position.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>Tier: {getTierName(position.tierId)}</span>
                            <span>Dept: {getDepartmentName(position.departmentId || '')}</span>
                            <span>Capacity: {position.currentEmployees}/{position.capacity}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit('position', 'edit', position)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete('position', position.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Edit Modals */}
      {editMode === 'tier' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editAction === 'create' ? 'Create New Tier' : 'Edit Tier'}
            </h3>
            <form onSubmit={handleTierSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier Name
                </label>
                <Input
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  placeholder="e.g., Executive, Management, Staff"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Level
                </label>
                <Input
                  type="number"
                  value={tierForm.level}
                  onChange={(e) => setTierForm({ ...tierForm, level: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={tierForm.description}
                  onChange={(e) => setTierForm({ ...tierForm, description: e.target.value })}
                  placeholder="Optional description of this tier's responsibilities"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <Spinner size={16} /> : (editAction === 'create' ? 'Create' : 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editMode === 'department' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editAction === 'create' ? 'Create New Department' : 'Edit Department'}
            </h3>
            <form onSubmit={handleDepartmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department Name
                </label>
                <Input
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  placeholder="e.g., Engineering, Marketing, Sales"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Department
                </label>
                <select
                  value={departmentForm.parentDepartmentId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDepartmentForm({ ...departmentForm, parentDepartmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Parent (Top Level)</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  placeholder="Optional description of this department's function"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <Spinner size={16} /> : (editAction === 'create' ? 'Create' : 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editMode === 'position' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editAction === 'create' ? 'Create New Position' : 'Edit Position'}
            </h3>
            <form onSubmit={handlePositionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Name
                </label>
                <Input
                  value={positionForm.name}
                  onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                  placeholder="e.g., Software Engineer, Marketing Manager"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organizational Tier
                </label>
                <select
                  value={positionForm.tierId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPositionForm({ ...positionForm, tierId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a tier</option>
                  {tiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} (Level {tier.level})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={positionForm.departmentId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPositionForm({ ...positionForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <Input
                  type="number"
                  value={positionForm.capacity}
                  onChange={(e) => setPositionForm({ ...positionForm, capacity: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={positionForm.description}
                  onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                  placeholder="Optional description of this position's responsibilities"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <Spinner size={16} /> : (editAction === 'create' ? 'Create' : 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
