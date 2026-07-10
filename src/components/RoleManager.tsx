import React, { useState } from 'react';
import { Plus, Trash2, Settings, X, RefreshCw } from 'lucide-react';
import { DEFAULT_ROLES } from '../types';

interface RoleManagerProps {
  roles: string[];
  onAddRole: (role: string) => void;
  onRemoveRole: (role: string) => void;
  onResetRoles: () => void;
}

export default function RoleManager({
  roles,
  onAddRole,
  onRemoveRole,
  onResetRoles,
}: RoleManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRole.trim();
    if (!trimmed) return;

    if (roles.map(r => r.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError('This role already exists.');
      return;
    }

    onAddRole(trimmed);
    setNewRole('');
    setError('');
  };

  return (
    <div id="role-manager-container" className="bg-white rounded-xl shadow-xs border border-gray-100 p-4 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings id="settings-icon" className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Configure Roles List</h3>
        </div>
        <button
          id="toggle-role-manager-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          {isOpen ? 'Collapse Settings' : 'Manage Roles'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Customize the roles dropdown list. Added roles will be available for selection on any stakeholder row.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1">
              <input
                id="new-role-input"
                type="text"
                placeholder="e.g. Lead Consultant"
                value={newRole}
                onChange={(e) => {
                  setNewRole(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 text-gray-800"
              />
              {error && <span className="text-[10px] text-red-500 mt-1 block">{error}</span>}
            </div>
            <button
              id="add-role-btn"
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center self-start"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {roles.map((role) => (
              <div
                key={role}
                id={`role-item-${role.replace(/\s+/g, '-').toLowerCase()}`}
                className="flex items-center justify-between bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100"
              >
                <span className="text-xs text-gray-700 font-medium">{role}</span>
                <button
                  id={`delete-role-btn-${role.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => onRemoveRole(role)}
                  className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                  title={`Delete ${role}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              id="reset-roles-btn"
              type="button"
              onClick={onResetRoles}
              className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset to Defaults
            </button>
            <span className="text-[10px] text-gray-400">{roles.length} roles total</span>
          </div>
        </div>
      )}
    </div>
  );
}
