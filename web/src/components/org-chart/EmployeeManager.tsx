'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, Button, Input, Spinner, Badge, Avatar } from 'shared/components';
import { 
  getBusinessEmployees,
  getVacantPositions,
  assignEmployeeToPosition,
  removeEmployeeFromPosition,
  transferEmployee,
  type EmployeePosition,
  type Position,
  type OrganizationalTier,
  type Department
} from '@/api/orgChart';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  UserPlus,
  UserMinus,
  ArrowRight,
  Building2,
  UserCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface OrgChartData {
  tiers: OrganizationalTier[];
  departments: Department[];
  positions: Position[];
}

interface EmployeeManagerProps {
  orgChartData: OrgChartData;
  businessId: string;
  onUpdate: () => void;
}

type EditMode = 'none' | 'assign' | 'transfer';
type EditAction = 'create' | 'edit';

type EditingItem = EmployeePosition | null;

export function EmployeeManager({ orgChartData, businessId, onUpdate }: EmployeeManagerProps) {
  const { data: session } = useSession();
  const [employees, setEmployees] = useState<EmployeePosition[]>([]);
  const [vacantPositions, setVacantPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [editAction, setEditAction] = useState<EditAction>('create');
  const [editingItem, setEditingItem] = useState<EditingItem>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['employees', 'vacant-positions']));

  // Form states
  const [assignForm, setAssignForm] = useState({
    userId: '',
    positionId: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });
  const [transferForm, setTransferForm] = useState({
    userId: '',
    fromPositionId: '',
    toPositionId: '',
    effectiveDate: new Date().toISOString().split('T')[0]
  });

  // Mock user data - in a real app, this would come from an API
  const [availableUsers, setAvailableUsers] = useState([
    { id: 'user1', name: 'John Doe', email: 'john@example.com', avatar: null },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', avatar: null },
    { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', avatar: null },
    { id: 'user4', name: 'Alice Brown', email: 'alice@example.com', avatar: null },
    { id: 'user5', name: 'Charlie Wilson', email: 'charlie@example.com', avatar: null }
  ]);

  useEffect(() => {
    if (businessId && session?.accessToken) {
      loadEmployeeData();
    }
  }, [businessId, session?.accessToken]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      if (!session?.accessToken) return;
      
      const [employeesRes, vacantRes] = await Promise.all([
        getBusinessEmployees(businessId, session.accessToken),
        getVacantPositions(businessId, session.accessToken)
      ]);

      if (employeesRes.success) {
        setEmployees(employeesRes.data);
      }
      if (vacantRes.success) {
        setVacantPositions(vacantRes.data);
      }
    } catch (error) {
      console.error('Error loading employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const startEdit = (mode: EditMode, action: EditAction, item?: EditingItem) => {
    setEditMode(mode);
    setEditAction(action);
    setEditingItem(item || null);
    
    if (action === 'edit' && item) {
      if (mode === 'assign') {
        setAssignForm({
          userId: item.userId || '',
          positionId: item.positionId || '',
          effectiveDate: item.effectiveDate ? new Date(item.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
      } else if (mode === 'transfer') {
        setTransferForm({
          userId: item.userId || '',
          fromPositionId: item.positionId || '',
          toPositionId: '',
          effectiveDate: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      // Reset forms for create mode
      setAssignForm({
        userId: '',
        positionId: '',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
      setTransferForm({
        userId: '',
        fromPositionId: '',
        toPositionId: '',
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
  };

  const cancelEdit = () => {
    setEditMode('none');
    setEditAction('create');
    setEditingItem(null);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      await assignEmployeeToPosition({
        businessId,
        userId: assignForm.userId,
        positionId: assignForm.positionId,
        assignedById: session.user?.id || '',
        effectiveDate: assignForm.effectiveDate
      }, session.accessToken);
      
      onUpdate();
      cancelEdit();
    } catch (error) {
      console.error('Error assigning employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    setLoading(true);
    try {
      await transferEmployee(
        transferForm.userId,
        transferForm.fromPositionId,
        transferForm.toPositionId,
        businessId,
        session.user?.id || '',
        session.accessToken,
        transferForm.effectiveDate
      );
      
      onUpdate();
      cancelEdit();
    } catch (error) {
      console.error('Error transferring employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmployee = async (userId: string, positionId: string) => {
    if (!session?.accessToken || !confirm('Are you sure you want to remove this employee from this position?')) return;

    setLoading(true);
    try {
      await removeEmployeeFromPosition(userId, positionId, businessId, session.accessToken);
      onUpdate();
    } catch (error) {
      console.error('Error removing employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPositionName = (positionId: string) => {
    const position = orgChartData?.positions?.find((p: Position) => p.id === positionId);
    return position?.name || 'Unknown Position';
  };

  const getDepartmentName = (positionId: string) => {
    const position = orgChartData?.positions?.find((p: Position) => p.id === positionId);
    if (!position?.departmentId) return 'No Department';
    const dept = orgChartData?.departments?.find((d: Department) => d.id === position.departmentId);
    return dept?.name || 'Unknown Department';
  };

  const getTierName = (positionId: string) => {
    const position = orgChartData?.positions?.find((p: Position) => p.id === positionId);
    if (!position?.tierId) return 'No Tier';
    const tier = orgChartData?.tiers?.find((t: OrganizationalTier) => t.id === position.tierId);
    return tier?.name || 'Unknown Tier';
  };

  const getAvailableUsersForPosition = (positionId: string) => {
    const position = orgChartData?.positions?.find((p: Position) => p.id === positionId);
    if (!position) return [];
    
    // Filter out users already assigned to this position
    const assignedUserIds = employees
      .filter(emp => emp.positionId === positionId && emp.isActive)
      .map(emp => emp.userId);
    
    return availableUsers.filter(user => !assignedUserIds.includes(user.id));
  };

  const getPositionCapacity = (positionId: string) => {
    const position = orgChartData?.positions?.find((p: Position) => p.id === positionId);
    if (!position) return { current: 0, total: 0 };
    
    const currentEmployees = employees.filter(emp => emp.positionId === positionId && emp.isActive).length;
    return { current: currentEmployees, total: position.capacity };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Assign and manage team members across positions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            onClick={() => startEdit('assign', 'create')}
            className="flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Employee</span>
          </Button>
        </div>
      </div>

      {/* Current Employees */}
      <Card>
        <div className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('employees')}
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900">Current Employees</h3>
              <Badge color="blue">{employees.filter(emp => emp.isActive).length}</Badge>
            </div>
            {expandedSections.has('employees') ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.has('employees') && (
            <div className="mt-4 space-y-4">
              {employees.filter(emp => emp.isActive).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No employees assigned yet</p>
                  <Button
                    variant="secondary"
                    onClick={() => startEdit('assign', 'create')}
                    className="mt-2"
                  >
                    Assign First Employee
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {employees.filter(emp => emp.isActive).map((employee) => (
                    <div key={employee.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar
                            nameOrEmail={availableUsers.find(u => u.id === employee.userId)?.name || 'Unknown User'}
                            size={40}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {availableUsers.find(u => u.id === employee.userId)?.name || 'Unknown User'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {availableUsers.find(u => u.id === employee.userId)?.email || 'Unknown Email'}
                            </p>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span className="flex items-center">
                                <UserCheck className="w-3 h-3 mr-1" />
                                {getPositionName(employee.positionId)}
                              </span>
                              <span className="flex items-center">
                                <Building2 className="w-3 h-3 mr-1" />
                                {getDepartmentName(employee.positionId)}
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {getTierName(employee.positionId)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEdit('transfer', 'edit', employee)}
                            className="flex items-center space-x-2"
                          >
                            <ArrowRight className="w-4 h-4" />
                            <span>Transfer</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveEmployee(employee.userId, employee.positionId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Assignment Details */}
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>Assigned: {new Date(employee.effectiveDate).toLocaleDateString()}</span>
                          <span>Status: {employee.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Vacant Positions */}
      <Card>
        <div className="p-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('vacant-positions')}
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-medium text-gray-900">Vacant Positions</h3>
              <Badge color="yellow">{vacantPositions.length}</Badge>
            </div>
            {expandedSections.has('vacant-positions') ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {expandedSections.has('vacant-positions') && (
            <div className="mt-4 space-y-4">
              {vacantPositions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>All positions are filled</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {vacantPositions.map((position) => {
                    const capacity = getPositionCapacity(position.id);
                    return (
                      <div key={position.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <UserCheck className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{position.name}</h4>
                              {position.description && (
                                <p className="text-sm text-gray-600">{position.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                <span className="flex items-center">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  {getDepartmentName(position.id)}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {getTierName(position.id)}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {capacity.current}/{capacity.total} filled
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setAssignForm(prev => ({ ...prev, positionId: position.id }));
                                startEdit('assign', 'create');
                              }}
                              className="flex items-center space-x-2"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>Assign</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Assign Employee Modal */}
      {editMode === 'assign' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Employee to Position</h3>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={assignForm.userId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssignForm({ ...assignForm, userId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an employee</option>
                  {assignForm.positionId ? 
                    getAvailableUsersForPosition(assignForm.positionId).map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    )) :
                    availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email})
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  value={assignForm.positionId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAssignForm({ ...assignForm, positionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a position</option>
                  {orgChartData?.positions?.map((position: Position) => {
                    const capacity = getPositionCapacity(position.id);
                    return (
                      <option key={position.id} value={position.id} disabled={capacity.current >= capacity.total}>
                        {position.name} - {getDepartmentName(position.id)} ({capacity.current}/{capacity.total})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <Input
                  type="date"
                  value={assignForm.effectiveDate}
                  onChange={(e) => setAssignForm({ ...assignForm, effectiveDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={cancelEdit} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <Spinner size={16} /> : 'Assign Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Employee Modal */}
      {editMode === 'transfer' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transfer Employee</h3>
            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employee
                </label>
                <select
                  value={transferForm.userId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTransferForm({ ...transferForm, userId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an employee</option>
                  {employees.filter(emp => emp.isActive).map(emp => {
                    const user = availableUsers.find(u => u.id === emp.userId);
                    return (
                      <option key={emp.id} value={emp.userId}>
                        {user?.name || 'Unknown User'} - {getPositionName(emp.positionId)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Position
                </label>
                <select
                  value={transferForm.fromPositionId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTransferForm({ ...transferForm, fromPositionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select current position</option>
                  {employees
                    .filter(emp => emp.isActive && emp.userId === transferForm.userId)
                    .map(emp => (
                      <option key={emp.id} value={emp.positionId}>
                        {getPositionName(emp.positionId)} - {getDepartmentName(emp.positionId)}
                      </option>
                    ))
                  }
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Position
                </label>
                <select
                  value={transferForm.toPositionId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTransferForm({ ...transferForm, toPositionId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select new position</option>
                  {orgChartData?.positions?.map((position: Position) => {
                    const capacity = getPositionCapacity(position.id);
                    return (
                      <option key={position.id} value={position.id} disabled={capacity.current >= capacity.total}>
                        {position.name} - {getDepartmentName(position.id)} ({capacity.current}/{capacity.total})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <Input
                  type="date"
                  value={transferForm.effectiveDate}
                  onChange={(e) => setTransferForm({ ...transferForm, effectiveDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={cancelEdit} disabled={loading}>
                  Cancel
 </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? <Spinner size={16} /> : 'Transfer Employee'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
