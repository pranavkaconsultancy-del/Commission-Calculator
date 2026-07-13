import React, { useState } from 'react';
import { Project } from '../types';
import { Plus, Trash2, Edit3, Save, X, Building2, Layers, Settings } from 'lucide-react';

interface ProjectManagerProps {
  projects: Project[];
  projectTypes: string[];
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddProjectType: (type: string) => void;
  onDeleteProjectType: (type: string) => void;
}

export default function ProjectManager({
  projects,
  projectTypes,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddProjectType,
  onDeleteProjectType,
}: ProjectManagerProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState(projectTypes[0] || 'Residential');
  const [newTypeName, setNewTypeName] = useState('');
  const [showTypeSettings, setShowTypeSettings] = useState(false);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState('');

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddProject({
      name: name.trim(),
      type,
    });
    setName('');
    if (projectTypes.length > 0) {
      setType(projectTypes[0]);
    }
  };

  const handleAddType = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanType = newTypeName.trim();
    if (!cleanType) return;
    if (projectTypes.includes(cleanType)) {
      alert('This project type already exists!');
      return;
    }
    onAddProjectType(cleanType);
    setNewTypeName('');
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setEditingName(p.name);
    setEditingType(p.type);
  };

  const saveEdit = (id: string) => {
    if (!editingName.trim()) return;
    onUpdateProject({
      id,
      name: editingName.trim(),
      type: editingType,
    });
    setEditingId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* LEFT: Add Project Form & Type Settings */}
      <div className="space-y-6">
        {/* Project Form */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Create Project Profile
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Setup name and classifications. Linked with unit numbers and bookings.
            </p>
          </div>

          <form onSubmit={handleAddProject} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Project Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Skyline Heights"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Project Classification / Type
                </label>
                <button
                  type="button"
                  onClick={() => setShowTypeSettings(!showTypeSettings)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  {showTypeSettings ? 'Hide customizer' : 'Customize options'}
                </button>
              </div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-gray-50 text-gray-800 font-medium cursor-pointer"
              >
                {projectTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Project
            </button>
          </form>
        </div>

        {/* Editable Project Types Customized panel */}
        {showTypeSettings && (
          <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
            <div>
              <h4 className="font-extrabold text-gray-900 text-xs flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Customize Project Types List
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Add or delete classifications from the dropdown. Residential, Commercial, Mixed are defaults.
              </p>
            </div>

            <form onSubmit={handleAddType} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Row Houses"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-hidden bg-gray-50 text-gray-800 font-medium"
              />
              <button
                type="submit"
                className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Current Active Classifications
              </span>
              <div className="flex flex-wrap gap-1.5">
                {projectTypes.map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md text-[10px] font-bold text-gray-600 border border-gray-100"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (projectTypes.length <= 1) {
                          alert('At least one classification must remain.');
                          return;
                        }
                        if (confirm(`Remove "${t}"? Existing projects with this type will keep it.`)) {
                          onDeleteProjectType(t);
                          // reset active select if it was deleted
                          if (type === t) {
                            const remain = projectTypes.filter((x) => x !== t);
                            setType(remain[0]);
                          }
                        }
                      }}
                      className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Projects List Viewer */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-gray-100 p-5 space-y-4">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm">Active Projects Profiles</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Overview of registered development properties. Click edit to modify records.
          </p>
        </div>

        {projects.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
            <p className="text-xs text-gray-500 font-bold">No registered projects profile found</p>
            <p className="text-[11px] text-gray-400">
              Setup your property portfolio using the creation panel to begin links with bookings.
            </p>
          </div>
        ) : (
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Project Name</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Classification</th>
                  <th className="p-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map((proj) => {
                  const isEditing = editingId === proj.id;

                  return (
                    <tr key={proj.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3.5 text-xs text-gray-800 font-bold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-md bg-white font-medium focus:outline-hidden"
                          />
                        ) : (
                          proj.name
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-gray-500 font-bold">
                        {isEditing ? (
                          <select
                            value={editingType}
                            onChange={(e) => setEditingType(e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded-md bg-white font-medium focus:outline-hidden cursor-pointer"
                          >
                            {projectTypes.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] border border-blue-100">
                            {proj.type}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-xs text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => saveEdit(proj.id)}
                              className="p-1 text-blue-600 hover:text-blue-700"
                              title="Save Changes"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEdit(proj)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete ${proj.name}? Bookings linked to this project profile will refer to a missing profile but won't be deleted.`
                                  )
                                ) {
                                  onDeleteProject(proj.id);
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
