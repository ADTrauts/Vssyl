import React from 'react';

type Module = {
  id: string;
  name: string;
  description: string;
  icon?: React.ReactNode;
  installed?: boolean;
};

type ModuleListProps = {
  modules: Module[];
  onSelect?: (module: Module) => void;
  renderActions?: (module: Module) => React.ReactNode;
};

export const ModuleList: React.FC<ModuleListProps> = ({ modules, onSelect, renderActions }) => (
  <div className="flex flex-col gap-4">
    {modules.map((mod) => (
      <div key={mod.id} className="flex items-center bg-white rounded shadow p-4 gap-4">
        <div className="text-3xl">{mod.icon || '🧩'}</div>
        <div className="flex-1">
          <div className="font-bold text-lg">{mod.name}</div>
          <div className="text-gray-600 text-sm">{mod.description}</div>
        </div>
        {renderActions ? renderActions(mod) : (
          <button
            className={`px-3 py-1 rounded ${mod.installed ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            disabled={mod.installed}
            onClick={() => onSelect?.(mod)}
          >
            {mod.installed ? 'Installed' : 'Install'}
          </button>
        )}
      </div>
    ))}
  </div>
); 