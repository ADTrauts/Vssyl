import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Settings, Plus, X, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Module {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'inactive';
  path: string;
  groupId?: string;
}

interface ModuleGroup {
  id: string;
  name: string;
  modules: Module[];
}

interface ModuleManagerProps {
  modules: Module[];
  groups: ModuleGroup[];
  onModulesChange: (modules: Module[]) => void;
  onGroupsChange: (groups: ModuleGroup[]) => void;
  onClose: () => void;
}

export const ModuleManager: React.FC<ModuleManagerProps> = ({
  modules,
  groups,
  onModulesChange,
  onGroupsChange,
  onClose,
}) => {
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onModulesChange(items);
  };

  const handleAddModule = () => {
    if (!newModuleName.trim()) return;

    const newModule: Module = {
      id: Date.now().toString(),
      name: newModuleName,
      icon: '📦',
      status: 'active',
      path: `/modules/${newModuleName.toLowerCase().replace(/\s+/g, '-')}`,
      groupId: selectedGroupId || undefined,
    };

    onModulesChange([...modules, newModule]);
    setNewModuleName('');
    setIsAddingModule(false);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: ModuleGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      modules: [],
    };

    onGroupsChange([...groups, newGroup]);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleRenameGroup = (groupId: string) => {
    if (!editingGroupName.trim()) return;

    onGroupsChange(
      groups.map(group =>
        group.id === groupId
          ? { ...group, name: editingGroupName }
          : group
      )
    );
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  const handleRemoveModule = (moduleId: string) => {
    onModulesChange(modules.filter(module => module.id !== moduleId));
  };

  const handleToggleStatus = (moduleId: string) => {
    onModulesChange(
      modules.map(module =>
        module.id === moduleId
          ? { ...module, status: module.status === 'active' ? 'inactive' : 'active' }
          : module
      )
    );
  };

  const handleMoveToGroup = (moduleId: string, groupId: string | null) => {
    onModulesChange(
      modules.map(module =>
        module.id === moduleId
          ? { ...module, groupId }
          : module
      )
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Manage Modules</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          {/* Groups Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Groups</h3>
              {!isAddingGroup && (
                <Button
                  onClick={() => setIsAddingGroup(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Group
                </Button>
              )}
            </div>

            {isAddingGroup && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleAddGroup}>Add</Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingGroup(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  {editingGroupId === group.id ? (
                    <input
                      type="text"
                      value={editingGroupName}
                      onChange={(e) => setEditingGroupName(e.target.value)}
                      onBlur={() => handleRenameGroup(group.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameGroup(group.id)}
                      className="flex-1 px-2 py-1 border rounded"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-gray-500" />
                      <span>{group.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setEditingGroupName(group.name);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Modules</h3>
              {!isAddingModule && (
                <Button
                  onClick={() => setIsAddingModule(true)}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              )}
            </div>

            {isAddingModule && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newModuleName}
                  onChange={(e) => setNewModuleName(e.target.value)}
                  placeholder="Enter module name"
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleAddModule}>Add</Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingModule(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="modules">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {modules.map((module, index) => (
                      <Draggable
                        key={module.id}
                        draggableId={module.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{module.icon}</span>
                              <span className="font-medium">{module.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={module.groupId || ''}
                                onChange={(e) => handleMoveToGroup(module.id, e.target.value || null)}
                                className="text-sm border rounded px-2 py-1"
                              >
                                <option value="">No Group</option>
                                {groups.map(group => (
                                  <option key={group.id} value={group.id}>
                                    {group.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleToggleStatus(module.id)}
                                className={`px-2 py-1 rounded text-xs ${
                                  module.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {module.status}
                              </button>
                              <button
                                onClick={() => handleRemoveModule(module.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
}; 