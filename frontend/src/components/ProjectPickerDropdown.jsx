import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Star, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  FolderPlus,
  ExternalLink,
  Tag
} from 'lucide-react';
import { INITIAL_PROJECTS } from '../data/mockData';

export default function ProjectPickerDropdown({
  projects = [],
  selectedProjectId,
  selectedProjectName,
  onSelectProject,
  onCreateProject,
  disabled = false,
  isOpen: isOpenProp,
  onOpenChange,
  defaultOpen = false,
  onClose
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = typeof isOpenProp === 'boolean';
  const open = isControlled ? isOpenProp : internalOpen;

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('DigiPlus Clients');
  const [newProjColor, setNewProjColor] = useState('#00cc00');

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Guarantee list is NEVER empty
  const allProjects = (Array.isArray(projects) && projects.length > 0) ? projects : INITIAL_PROJECTS;

  // Match selected project from projects list or name
  const selectedProject = (() => {
    if (selectedProjectId) {
      const byId = allProjects.find(p => String(p.id).toLowerCase() === String(selectedProjectId).toLowerCase());
      if (byId) return byId;
      const byName = allProjects.find(p => p.name.toLowerCase() === String(selectedProjectId).toLowerCase());
      if (byName) return byName;
    }
    if (selectedProjectName) {
      const byName = allProjects.find(p => p.name.toLowerCase() === String(selectedProjectName).toLowerCase());
      if (byName) return byName;
      return { id: selectedProjectName, name: selectedProjectName, color: '#00cc00', client: 'General' };
    }
    return null;
  })();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (!isControlled) setInternalOpen(false);
        setShowCreateForm(false);
        if (onOpenChange) onOpenChange(false);
        if (onClose) onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, isControlled, onOpenChange, onClose]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter projects by search
  const filteredProjects = allProjects.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.client && p.client.toLowerCase().includes(q))
    );
  });

  // Group by client
  const clientGroups = filteredProjects.reduce((acc, proj) => {
    const clientName = (!proj.client || proj.client === '—') ? 'NO CLIENT' : proj.client.toUpperCase();
    if (!acc[clientName]) acc[clientName] = [];
    acc[clientName].push(proj);
    return acc;
  }, {});

  const handleToggle = (e) => {
    e.stopPropagation();
    if (disabled) return;
    const next = !open;
    if (!isControlled) setInternalOpen(next);
    if (onOpenChange) onOpenChange(next);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const newProject = {
      id: `proj-${Date.now()}`,
      name: newProjName.trim(),
      client: newProjClient.trim() || '—',
      color: newProjColor,
      tracked: '0.00h',
      billableRate: 75,
      isFavorite: false,
      tasksCount: 1
    };

    if (onCreateProject) {
      onCreateProject(newProject);
    }
    onSelectProject(newProject.id);
    setNewProjName('');
    setShowCreateForm(false);
    if (!isControlled) setInternalOpen(false);
    if (onOpenChange) onOpenChange(false);
  };

  const presetColors = [
    '#00cc00', '#0fed05', '#3b82f6', '#06b6d4', 
    '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'
  ];

  return (
    <div className="project-picker-container" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`project-picker-trigger ${selectedProject ? 'has-project' : 'is-empty'} ${open ? 'active' : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        title={selectedProject ? `Project: ${selectedProject.name}` : "Select project"}
      >
        {selectedProject ? (
          <div className="project-trigger-content">
            <span 
              className="project-trigger-bullet" 
              style={{ backgroundColor: selectedProject.color || '#00cc00' }} 
            />
            <span className="project-trigger-name" title={selectedProject.name}>{selectedProject.name}</span>
            <span 
              className="project-trigger-clear" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectProject(null);
              }}
              title="Clear project from row"
            >
              ×
            </span>
          </div>
        ) : (
          <div className="project-trigger-content placeholder">
            <Plus size={15} className="project-trigger-plus" />
            <span>Project</span>
            <ChevronDown size={14} className="project-trigger-chevron" />
          </div>
        )}
      </button>

      {/* Floating Popover Dropdown */}
      {open && (
        <div 
          className="project-picker-popover"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Box */}
          <div className="project-search-box">
            <Search size={15} className="project-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="project-search-input"
              placeholder="Search Project or Client"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Project List Grouped by Client */}
          <div className="project-picker-list">
            {Object.keys(clientGroups).length === 0 ? (
              <div className="project-picker-empty">
                No projects matching "{searchQuery}"
              </div>
            ) : (
              Object.entries(clientGroups).map(([client, projs]) => (
                <div key={client} className="project-client-group">
                  <div className="project-client-header">
                    <span className="client-header-title">{client}</span>
                    <span className="client-header-count">{projs.length} Project{projs.length > 1 ? 's' : ''}</span>
                  </div>

                  <div className="project-items-list">
                    {projs.map((proj) => {
                      const isSelected = selectedProject && (
                        proj.id === selectedProject.id || 
                        proj.name.toLowerCase() === selectedProject.name.toLowerCase()
                      );
                      return (
                        <div
                          key={proj.id}
                          className={`project-picker-item ${isSelected ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectProject(proj.id);
                            if (!isControlled) setInternalOpen(false);
                            if (onOpenChange) onOpenChange(false);
                            setShowCreateForm(false);
                          }}
                        >
                          <div className="project-item-left">
                            <span 
                              className="project-item-bullet" 
                              style={{ backgroundColor: proj.color || '#00cc00' }}
                            />
                            <span className="project-item-name">{proj.name}</span>
                          </div>

                          <div className="project-item-right">
                            <span className="project-item-tasks">
                              {proj.tasksCount || 3} Tasks
                            </span>
                            <button
                              type="button"
                              className={`project-item-star ${proj.isFavorite ? 'starred' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                proj.isFavorite = !proj.isFavorite;
                              }}
                              title="Favorite"
                            >
                              <Star size={13} fill={proj.isFavorite ? "#f59e0b" : "none"} />
                            </button>
                            {isSelected && (
                              <Check size={14} className="project-item-check" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create New Project Section */}
          <div className="project-picker-footer">
            {!showCreateForm ? (
              <button
                type="button"
                className="btn-create-project-trigger"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus size={15} />
                <span>Create new Project</span>
              </button>
            ) : (
              <form onSubmit={handleCreateSubmit} className="project-create-form">
                <div className="create-form-title">Create New Project</div>
                <input
                  type="text"
                  className="create-form-input"
                  placeholder="Project name..."
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  className="create-form-input"
                  placeholder="Client name (optional)..."
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                />

                <div className="color-palette-picker">
                  <span className="color-label">Color:</span>
                  <div className="color-dots-row">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-dot-btn ${newProjColor === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewProjColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="create-form-actions">
                  <button
                    type="button"
                    className="btn-cancel-create"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-confirm-create"
                    disabled={!newProjName.trim()}
                  >
                    Create
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
