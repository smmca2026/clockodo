import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search,
  ChevronLeft,
  ChevronRight, 
  Plus, 
  Star, 
  Globe, 
  Lock, 
  ChevronDown, 
  Check, 
  CheckCircle2, 
  X, 
  RotateCcw
} from 'lucide-react';
import { INITIAL_PROJECTS } from '../data/mockData';

// Standard baseline estimated budgets for key projects (in hours)
const PROJECT_BUDGET_MAP = {
  'A2z4r.com': 160,
  'JRKS Logistics': 80,
  'Selva Chit App': 100,
  'DigiPlus Operations': 50,
  'CRM Enterprise Integration': 40,
  'Mobile Delivery App Revamp': 80,
  'Fleet Tracker IoT': 30,
  'Billing & Ledger Automation': 40,
  'greenyy': 40,
  'clockify': 40
};

function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
  return 0;
}

export default function ProjectsPage({ 
  projects = INITIAL_PROJECTS, 
  onCreateProject,
  searchQuery = '',
  currentUser = null,
  activities = [],
  timesheetRows = []
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_fav_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjAccess, setNewProjAccess] = useState('Public');
  const [newProjBillable, setNewProjBillable] = useState(true);
  const [newProjRate, setNewProjRate] = useState(85);
  const [newProjBudget, setNewProjBudget] = useState(50);
  const [newProjColor, setNewProjColor] = useState('#00cc00');

  // Active Dropdown state: 'status' | 'client' | 'access' | 'billing' | null
  const [openDropdown, setOpenDropdown] = useState(null);
  const filterBarRef = useRef(null);

  // Client search inside client dropdown
  const [clientSearchQuery, setClientSearchQuery] = useState('');

  // Staged Filter States
  const [selectedStatus, setSelectedStatus] = useState('Active'); // 'Active' | 'All' | 'Archived'
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedAccess, setSelectedAccess] = useState([]);

  // Applied Filter States
  const [appliedStatus, setAppliedStatus] = useState('Active');
  const [appliedClients, setAppliedClients] = useState([]);
  const [appliedAccess, setAppliedAccess] = useState([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_projects_per_page');
      if (saved) return Number(saved);
    } catch (e) {}
    return 50;
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');

    // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedStatus, appliedClients, appliedAccess, localSearchQuery, searchQuery]);

  const totalFilteredCount = computedFilteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / itemsPerPage));

  const startIndex = totalFilteredCount === 0 ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFilteredCount);
  const displayedRange = totalFilteredCount === 0 ? '0-0 of 0' : `${startIndex + 1}-${endIndex} of ${totalFilteredCount}`;

  const paginatedProjects = useMemo(() => {
    return computedFilteredProjects.slice(startIndex, endIndex);
  }, [computedFilteredProjects, startIndex, endIndex]);

  const isAdmin = currentUser?.role === 'admin' || 
                  currentUser?.role === 'owner' || 
                  (currentUser?.name && currentUser.name.toLowerCase().includes('owner')) ||
                  (currentUser?.name && currentUser.name.toLowerCase().includes('bharath'));

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('clockodo_fav_projects', JSON.stringify(favoriteIds));
    } catch (e) {}
  }, [favoriteIds]);

  const toggleFavorite = (id) => {
    setFavoriteIds(prev => {
      const next = { ...prev };
      next[id] = !next[id];
      return next;
    });
  };

  // Extract distinct client names dynamically
  const distinctClients = useMemo(() => {
    const set = new Set();
    (projects || []).forEach(p => {
      if (p.client && p.client !== '—' && p.client.trim()) {
        set.add(p.client.trim());
      }
    });
    return Array.from(set).sort();
  }, [projects]);

  // Filtered clients inside the Client dropdown based on client search
  const filteredDistinctClients = useMemo(() => {
    const q = clientSearchQuery.toLowerCase().trim();
    if (!q) return distinctClients;
    return distinctClients.filter(c => c.toLowerCase().includes(q));
  }, [distinctClients, clientSearchQuery]);

  // Handle Apply Filter Click
  const handleApplyFilter = () => {
    setAppliedStatus(selectedStatus);
    setAppliedClients(selectedClients);
    setAppliedAccess(selectedAccess);
    setOpenDropdown(null);
    setToastMessage('Filters applied successfully!');
    setTimeout(() => setToastMessage(''), 2500);
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSelectedStatus('Active');
    setAppliedStatus('Active');
    setSelectedClients([]);
    setAppliedClients([]);
    setSelectedAccess([]);
    setAppliedAccess([]);
    setLocalSearchQuery('');
    setOpenDropdown(null);
    setToastMessage('All filters have been reset.');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const hasActiveFilters = appliedStatus !== 'Active' || 
                           appliedClients.length > 0 || 
                           appliedAccess.length > 0 || 
                           localSearchQuery.trim() !== '';

  // Filter projects by all active criteria & compute live tracked & progress metrics
  const computedFilteredProjects = useMemo(() => {
    return (projects || []).filter(proj => {
      // 1. Text Search (Matches project name or client)
      const q = (localSearchQuery || searchQuery || '').toLowerCase().trim();
      if (q) {
        const matchesName = (proj.name || '').toLowerCase().includes(q);
        const matchesClient = (proj.client || '').toLowerCase().includes(q);
        if (!matchesName && !matchesClient) return false;
      }

      // 2. Status Filter
      if (appliedStatus === 'Active' && proj.archived === true) return false;
      if (appliedStatus === 'Archived' && proj.archived !== true) return false;

      // 3. Client Filter
      if (appliedClients && appliedClients.length > 0) {
        const hasWithout = appliedClients.includes('without-client');
        const matchesClient = appliedClients.includes(proj.client);
        const matchesWithout = hasWithout && (!proj.client || proj.client === '—' || proj.client === 'No Client');
        if (!matchesClient && !matchesWithout) return false;
      }

      // 4. Access Filter
      if (appliedAccess && appliedAccess.length > 0) {
        const pAccess = proj.access || 'Public';
        if (!appliedAccess.includes(pAccess)) return false;
      }

      return true;
    }).map(proj => {
      // Calculate live tracked seconds from activities
      const pActs = (activities || []).filter(a => a.project === proj.name || (!a.project && proj.name === 'Internal'));
      const actSeconds = pActs.reduce((acc, a) => acc + (a.durationSeconds || parseTimeToSeconds(a.durationFormatted) || 0), 0);
      const actHours = actSeconds / 3600;

      // Base tracked hours from project definition (e.g. '140.58h' -> 140.58)
      const rawTracked = String(proj.tracked || '0').replace('h', '').trim();
      const baseHours = parseFloat(rawTracked) || 0;

      const totalTrackedHours = baseHours > 0 ? (baseHours + actHours) : actHours;

      // Budget Hours estimate
      const budgetHours = proj.budgetHours || PROJECT_BUDGET_MAP[proj.name] || 50;

      // Progress Percentage
      const progressPercent = budgetHours > 0 ? Math.min(100, (totalTrackedHours / budgetHours) * 100) : 0;

      return {
        ...proj,
        calculatedTrackedHours: totalTrackedHours,
        calculatedTrackedFormatted: `${totalTrackedHours.toFixed(2)}h`,
        budgetHours,
        progressPercent
      };
    });
  }, [projects, activities, localSearchQuery, searchQuery, appliedStatus, appliedClients, appliedAccess]);

  // Handle Create Project Submit
  const handleCreateProject = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newProjName.trim()) return;

    const newProjObj = {
      id: `proj-${Date.now()}`,
      name: newProjName.trim(),
      client: newProjClient.trim() || '—',
      color: newProjColor,
      tracked: '0.00h',
      progress: '—',
      budgetHours: Number(newProjBudget) || 50,
      access: newProjAccess,
      billable: newProjBillable,
      billableRate: newProjRate,
      isFavorite: false,
      archived: false
    };

    if (onCreateProject) {
      onCreateProject(newProjObj);
    }
    setShowAddModal(false);
    setNewProjName('');
    setNewProjClient('');
    setNewProjAccess('Public');
    setNewProjBudget(50);
    setNewProjColor('#00cc00');
    setToastMessage(`Project "${newProjObj.name}" created successfully!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="page-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderLeft: '4px solid #00cc00',
          animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={16} color="#00cc00" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="projects-view">
        {/* Interactive Filter Toolbar */}
        <div className="projects-filter-bar" ref={filterBarRef} style={{ position: 'relative', zIndex: 30 }}>
          {/* Left: 4 Filter Dropdown Pill Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* 1. STATUS DROPDOWN (FILTER: Active) */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className={`filter-pill-btn ${appliedStatus !== 'Active' || openDropdown === 'status' ? 'active' : ''}`}
                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                style={{
                  border: openDropdown === 'status' ? '1px solid #00cc00' : undefined,
                  background: openDropdown === 'status' ? '#f0fdf4' : undefined
                }}
              >
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 700 }}>FILTER:</span>
                <strong style={{ color: '#0f172a' }}>{selectedStatus}</strong>
                <ChevronDown size={11} style={{ transform: openDropdown === 'status' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {openDropdown === 'status' && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '180px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  padding: '6px',
                  zIndex: 100
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', padding: '6px 10px', textTransform: 'uppercase' }}>
                    Project Status
                  </div>
                  {[
                    { id: 'Active', label: 'Active Projects', desc: 'Show active projects' },
                    { id: 'All', label: 'All Projects', desc: 'Active & Archived' },
                    { id: 'Archived', label: 'Archived Projects', desc: 'Hidden from tracker' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(st.id);
                        setAppliedStatus(st.id);
                        setOpenDropdown(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: selectedStatus === st.id ? '#f0fdf4' : 'transparent',
                        color: selectedStatus === st.id ? '#008a00' : '#334155',
                        fontWeight: selectedStatus === st.id ? 700 : 500,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <span>{st.label}</span>
                      {selectedStatus === st.id && <Check size={13} color="#00cc00" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. CLIENT DROPDOWN */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className={`filter-pill-btn ${selectedClients.length > 0 || openDropdown === 'client' ? 'active' : ''}`}
                onClick={() => setOpenDropdown(openDropdown === 'client' ? null : 'client')}
                style={{
                  border: selectedClients.length > 0 ? '1px solid #00cc00' : (openDropdown === 'client' ? '1px solid #00cc00' : undefined),
                  background: selectedClients.length > 0 ? '#f0fdf4' : (openDropdown === 'client' ? '#f0fdf4' : undefined)
                }}
              >
                <span style={{ fontWeight: selectedClients.length > 0 ? 700 : 600 }}>
                  Client {selectedClients.length > 0 ? `(${selectedClients.length})` : ''}
                </span>
                <ChevronDown size={11} style={{ transform: openDropdown === 'client' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {openDropdown === 'client' && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '240px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  padding: '8px',
                  zIndex: 100
                }}>
                  {/* Search inside clients */}
                  <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', marginBottom: '8px' }}>
                    <Search size={12} color="#94a3b8" style={{ marginRight: '6px' }} />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '100%' }}
                      autoFocus
                    />
                    {clientSearchQuery && (
                      <X size={12} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setClientSearchQuery('')} />
                    )}
                  </div>

                  {/* Quick Select All / Deselect All */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedClients([...distinctClients, 'without-client'])}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedClients([])}
                      style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  </div>

                  {/* Clients List */}
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {/* Option: Without Client */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#475569' }}>
                      <input
                        type="checkbox"
                        checked={selectedClients.includes('without-client')}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedClients(prev => [...prev, 'without-client']);
                          else setSelectedClients(prev => prev.filter(c => c !== 'without-client'));
                        }}
                        style={{ accentColor: '#00cc00' }}
                      />
                      <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Without Client</span>
                    </label>

                    {filteredDistinctClients.map(cName => (
                      <label key={cName} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', color: '#0f172a' }}>
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(cName)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedClients(prev => [...prev, cName]);
                            else setSelectedClients(prev => prev.filter(c => c !== cName));
                          }}
                          style={{ accentColor: '#00cc00' }}
                        />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cName}</span>
                      </label>
                    ))}
                  </div>

                  {/* Done Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedClients(selectedClients);
                      setOpenDropdown(null);
                    }}
                    style={{ width: '100%', marginTop: '8px', padding: '6px', background: '#00cc00', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Apply Client Filter
                  </button>
                </div>
              )}
            </div>

            {/* 3. ACCESS DROPDOWN (Public / Private) */}
            <div style={{ position: 'relative' }}>
              <button 
                type="button"
                className={`filter-pill-btn ${selectedAccess.length > 0 || openDropdown === 'access' ? 'active' : ''}`}
                onClick={() => setOpenDropdown(openDropdown === 'access' ? null : 'access')}
                style={{
                  border: selectedAccess.length > 0 ? '1px solid #00cc00' : (openDropdown === 'access' ? '1px solid #00cc00' : undefined),
                  background: selectedAccess.length > 0 ? '#f0fdf4' : (openDropdown === 'access' ? '#f0fdf4' : undefined)
                }}
              >
                <span style={{ fontWeight: selectedAccess.length > 0 ? 700 : 600 }}>
                  Access {selectedAccess.length > 0 ? `(${selectedAccess.length})` : ''}
                </span>
                <ChevronDown size={11} style={{ transform: openDropdown === 'access' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
              </button>

              {openDropdown === 'access' && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  width: '180px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  padding: '8px',
                  zIndex: 100
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', padding: '4px 6px 8px', textTransform: 'uppercase' }}>
                    Access Permission
                  </div>
                  {[
                    { id: 'Public', label: 'Public', icon: <Globe size={13} color="#10b981" />, desc: 'Visible to all team' },
                    { id: 'Private', label: 'Private', icon: <Lock size={13} color="#f59e0b" />, desc: 'Assigned members only' }
                  ].map(acc => (
                    <label key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedAccess.includes(acc.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAccess(prev => [...prev, acc.id]);
                          else setSelectedAccess(prev => prev.filter(a => a !== acc.id));
                        }}
                        style={{ accentColor: '#00cc00' }}
                      />
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#0f172a', fontWeight: 600 }}>
                        {acc.icon} {acc.label}
                      </span>
                    </label>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setAppliedAccess(selectedAccess);
                      setOpenDropdown(null);
                    }}
                    style={{ width: '100%', marginTop: '8px', padding: '6px', background: '#00cc00', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Apply Access Filter
                  </button>
                </div>
              )}
            </div>

            {/* Clear All Reset Filter Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset all filters"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Right: Search Input + Apply Filter + Create Project Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="projects-search-input"
                placeholder="Find by name..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                style={{ paddingRight: localSearchQuery ? '28px' : '12px' }}
              />
              {localSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLocalSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button 
              type="button"
              className="btn-apply-filter"
              onClick={handleApplyFilter}
              title="Apply all selected filters"
            >
              APPLY FILTER
            </button>

            {isAdmin && (
              <button 
                type="button"
                className="btn-primary-gradient" 
                style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  if (!currentUser || currentUser.role === 'guest') {
                    onCreateProject?.(null);
                    return;
                  }
                  setShowAddModal(true);
                }}
              >
                <Plus size={14} />
                <span>CREATE PROJECT</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Summary Bar & Top Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '16px 4px 12px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Showing <strong style={{ color: '#0f172a' }}>{totalFilteredCount === 0 ? 0 : startIndex + 1}-{endIndex}</strong> of <strong style={{ color: '#0f172a' }}>{totalFilteredCount}</strong> Projects {totalFilteredCount !== projects.length && <span style={{ color: '#94a3b8' }}>(filtered from {projects.length})</span>}
          </div>

          {/* Clockify-Style Pagination Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* < 1-50 of 460 > */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              overflow: 'hidden',
              height: '32px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
            }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{
                  width: '32px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                  border: 'none',
                  borderRight: '1px solid #cbd5e1',
                  cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                  color: currentPage <= 1 ? '#cbd5e1' : '#334155'
                }}
                title="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div style={{
                padding: '0 12px',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#1e293b',
                minWidth: '100px',
                textAlign: 'center',
                userSelect: 'none'
              }}>
                {displayedRange}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{
                  width: '32px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                  border: 'none',
                  borderLeft: '1px solid #cbd5e1',
                  cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage >= totalPages ? '#cbd5e1' : '#334155'
                }}
                title="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Items Per Page Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setItemsPerPage(val);
                    setCurrentPage(1);
                    try {
                      localStorage.setItem('clockodo_projects_per_page', val);
                    } catch (err) {}
                  }}
                  style={{
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 26px 4px 10px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#1e293b',
                    height: '32px',
                    cursor: 'pointer',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <ChevronDown size={13} color="#64748b" style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Items per page</span>
            </div>
          </div>
        </div>

        {/* Projects Matrix Table */}
        <div className="projects-table-card">
          <table className="projects-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>NAME</th>
                <th style={{ width: '20%' }}>CLIENT</th>
                <th style={{ width: '15%' }}>TRACKED</th>
                <th style={{ width: '20%' }}>PROGRESS</th>
                <th style={{ width: '10%' }}>ACCESS</th>
                <th style={{ width: '5%', textAlign: 'center' }}></th>
              </tr>
            </thead>
            <tbody>
              {computedFilteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                      No projects match your active filters
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        color: '#0284c7',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginTop: '6px'
                      }}
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((proj) => {
                  const isFav = favoriteIds[proj.id] !== undefined ? favoriteIds[proj.id] : proj.isFavorite;
                  const pct = proj.progressPercent;
                  const isHighProgress = pct >= 80;

                  return (
                    <tr key={proj.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span 
                            className="project-bullet" 
                            style={{ backgroundColor: proj.color || '#00cc00' }} 
                          />
                          <span style={{ color: 'var(--text-dark)', fontWeight: 700 }}>{proj.name}</span>
                        </div>
                      </td>
                      <td style={{ color: proj.client && proj.client !== '—' ? '#00cc00' : '#64748b', fontWeight: 600 }}>
                        {proj.client || '—'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dark)', fontWeight: 700 }}>
                        {proj.calculatedTrackedFormatted}
                      </td>
                      
                      {/* DYNAMIC VISUAL PROGRESS BAR */}
                      <td style={{ minWidth: '150px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
                            <span style={{ fontWeight: 800, color: isHighProgress ? '#008a00' : (pct >= 50 ? '#0d9488' : '#334155'), fontFamily: 'var(--font-mono)' }}>
                              {pct.toFixed(0)}%
                            </span>
                            <span style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                              {proj.calculatedTrackedHours.toFixed(1)} / {proj.budgetHours}h
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                width: `${pct}%`, 
                                height: '100%', 
                                background: isHighProgress ? '#00cc00' : (pct >= 50 ? '#10b981' : '#3b82f6'), 
                                borderRadius: '3px',
                                transition: 'width 0.4s ease'
                              }} 
                              title={`${proj.name}: ${pct.toFixed(1)}% (${proj.calculatedTrackedHours.toFixed(1)}h of ${proj.budgetHours}h budget)`}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: proj.access === 'Private' ? '#f59e0b' : '#10b981', fontSize: '12px', fontWeight: 600 }}>
                          {proj.access === 'Private' ? <Lock size={12} /> : <Globe size={12} />}
                          {proj.access || 'Public'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          type="button"
                          className={`star-btn ${isFav ? 'starred' : ''}`}
                          onClick={() => toggleFavorite(proj.id)}
                          title={isFav ? "Unstar project" : "Favorite project"}
                        >
                          <Star size={15} fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar */}
        {totalFilteredCount > itemsPerPage && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', padding: '10px 4px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: '#64748b' }}>
              Showing <strong>{startIndex + 1}-{endIndex}</strong> of <strong>{totalFilteredCount}</strong> Projects
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                overflow: 'hidden',
                height: '32px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
              }}>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage(p => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    width: '32px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
                    border: 'none',
                    borderRight: '1px solid #cbd5e1',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                    color: currentPage <= 1 ? '#cbd5e1' : '#334155'
                  }}
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div style={{
                  padding: '0 12px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: '#1e293b',
                  minWidth: '100px',
                  textAlign: 'center',
                  userSelect: 'none'
                }}>
                  {displayedRange}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setCurrentPage(p => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    width: '32px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
                    border: 'none',
                    borderLeft: '1px solid #cbd5e1',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                    color: currentPage >= totalPages ? '#cbd5e1' : '#334155'
                  }}
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setItemsPerPage(val);
                      setCurrentPage(1);
                      try {
                        localStorage.setItem('clockodo_projects_per_page', val);
                      } catch (err) {}
                    }}
                    style={{
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 26px 4px 10px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#1e293b',
                      height: '32px',
                      cursor: 'pointer',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <ChevronDown size={13} color="#64748b" style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Items per page</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showAddModal && (
        <div className="day-drawer-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="settings-card" style={{ margin: 'auto', width: '440px', maxWidth: '92%' }} onClick={e => e.stopPropagation()}>
            <div className="notif-header" style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <span className="notif-title" style={{ fontSize: '16px', fontWeight: 700 }}>Create New Project</span>
              <button type="button" className="btn-delete-row" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProject} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="settings-field">
                <label className="settings-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Project Name *</label>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="e.g. DigiPlus Client Portal" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  required 
                  autoFocus
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Client Name</label>
                <input 
                  type="text" 
                  className="settings-input" 
                  placeholder="e.g. DigiPlus Logistics (or select existing)" 
                  value={newProjClient}
                  onChange={(e) => setNewProjClient(e.target.value)}
                  list="client-suggestions"
                />
                <datalist id="client-suggestions">
                  {distinctClients.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="settings-field">
                  <label className="settings-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Access Type</label>
                  <select 
                    value={newProjAccess} 
                    onChange={(e) => setNewProjAccess(e.target.value)}
                    className="settings-input"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="Public">🌐 Public (All)</option>
                    <option value="Private">🔒 Private (Restricted)</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label className="settings-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Estimated Budget (Hours)</label>
                  <input 
                    type="number" 
                    className="settings-input" 
                    value={newProjBudget}
                    onChange={(e) => setNewProjBudget(Number(e.target.value))}
                    min="1"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="settings-field">
                  <label className="settings-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Hourly Rate ($/hr)</label>
                  <input 
                    type="number" 
                    className="settings-input" 
                    value={newProjRate}
                    onChange={(e) => setNewProjRate(Number(e.target.value))}
                    min="0"
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Billable</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    <input 
                      type="checkbox" 
                      checked={newProjBillable} 
                      onChange={(e) => setNewProjBillable(e.target.checked)} 
                      style={{ width: '16px', height: '16px', accentColor: '#00cc00' }}
                    />
                    <span>Yes (Chargeable)</span>
                  </label>
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Color Accent</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {['#00cc00', '#10b981', '#059669', '#0284c7', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4'].map((col) => (
                    <div 
                      key={col}
                      onClick={() => setNewProjColor(col)}
                      style={{ 
                        width: 26, 
                        height: 26, 
                        borderRadius: '50%', 
                        background: col, 
                        cursor: 'pointer',
                        boxShadow: newProjColor === col ? '0 0 0 2px #ffffff, 0 0 0 4px #00cc00' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-settings" style={{ background: '#00cc00', color: '#ffffff', fontWeight: 700, border: 'none' }}>
                  <Check size={16} /> Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
