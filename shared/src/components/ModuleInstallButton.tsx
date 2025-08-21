import React from 'react';

type ModuleInstallButtonProps = {
  installed: boolean;
  onInstall: () => void;
  loading?: boolean;
};

export const ModuleInstallButton: React.FC<ModuleInstallButtonProps> = ({ installed, onInstall, loading }) => (
  <button
    className={`px-3 py-1 rounded ${installed ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'} ${loading ? 'opacity-50 cursor-wait' : ''}`}
    disabled={installed || loading}
    onClick={onInstall}
  >
    {installed ? 'Installed' : loading ? 'Installing...' : 'Install'}
  </button>
); 