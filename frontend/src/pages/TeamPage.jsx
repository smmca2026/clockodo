import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  ShieldCheck, 
  ChevronDown, 
  Check, 
  UserPlus, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  UserCheck, 
  Edit2, 
  Building2, 
  Sparkles 
} from 'lucide-react';

const DEFAULT_DEPARTMENTS = [
  'Full Stack',
  'Frontend Dev',
  'Backend Engineering',
  'Mobile Apps',
  'Quality Assurance',
  'Design & UI',
  'DevOps & Cloud',
  'Marketing & Sales',
  'Accounts & Finance',
  'HR & Operations',
  'Project Management',
  'Customer Support',
  'Management / Executive'
];

export default function TeamPage({ 
  searchQuery: headerSearchQuery = '',
  currentUser = null,
  usersList = [],
  onToggleUserAccess,
  onAddTeamMember,
  onUpdateMemberDepartment
}) {
  const [activeSubtab, setActiveSubtab] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'PENDING'
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Add Member Modal State
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addDepartment, setAddDepartment] = useState('Full Stack');
  const [addRole, setAddRole] = useState('employee');
  const [addPassword, setAddPassword] = useState('Digi@2024');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);

  // Inline table department edit state
  const [editingDeptUserId, setEditingDeptUserId] = useState(null);
  const [editingDeptValue, setEditingDeptValue] = useState('');

  // Close department dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(event.target)) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2800);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.name?.toLowerCase().includes('bharath');
  const effectiveSearchQuery = (headerSearchQuery || localSearchQuery).trim().toLowerCase();

  // Combine default preset departments with any custom departments already in usersList
  const availableDepartments = Array.from(
    new Set([
      ...DEFAULT_DEPARTMENTS,
      ...usersList.map(u => u.department || u.group).filter(Boolean)
    ])
  );

  // Filter department suggestions based on input
  const filteredSuggestions = availableDepartments.filter(d => 
    d.toLowerCase().includes(addDepartment.trim().toLowerCase())
  );

  // Filter members by Search Query AND Subtab (ALL | ACTIVE | PENDING)
  const filteredMembers = usersList.filter(u => {
    const isGranted = Boolean(u.active) || u.role === 'admin' || u.accessGranted === true;

    // Subtab filter
    if (activeSubtab === 'ACTIVE' && !isGranted) return false;
    if (activeSubtab === 'PENDING' && isGranted) return false;

    // Search filter
    if (!effectiveSearchQuery) return true;
    return (
      (u.name && u.name.toLowerCase().includes(effectiveSearchQuery)) ||
      (u.email && u.email.toLowerCase().includes(effectiveSearchQuery)) ||
      (u.department && u.department.toLowerCase().includes(effectiveSearchQuery)) ||
      (u.group && u.group.toLowerCase().includes(effectiveSearchQuery))
    );
  });

  const totalCount = usersList.length;
  const activeCount = usersList.filter(u => Boolean(u.active) || u.role === 'admin' || u.accessGranted === true).length;
  const pendingCount = usersList.filter(u => !Boolean(u.active) && u.role !== 'admin' && u.accessGranted !== true).length;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!addName.trim() || !addEmail.trim()) {
      showToast('Please provide name and email');
      return;
    }
    const finalDepartment = addDepartment.trim() || 'Full Stack';
    if (onAddTeamMember) {
      onAddTeamMember({
        name: addName.trim(),
        email: addEmail.trim().toLowerCase(),
        department: finalDepartment,
        role: addRole,
        password: addPassword.trim() || 'Digi@2024'
      });
      showToast(`Team member ${addName} added in ${finalDepartment} with password (${addPassword.trim() || 'Digi@2024'})!`);
      setAddName('');
      setAddEmail('');
      setAddDepartment('Full Stack');
      setAddPassword('Digi@2024');
      setIsDeptDropdownOpen(false);
      setShowAddModal(false);
    }
  };

  const handleStartEditDept = (member) => {
    setEditingDeptUserId(member.id || member.email);
    setEditingDeptValue(member.department || member.group || 'Full Stack');
  };

  const handleSaveDept = (memberIdOrEmail, memberName) => {
    if (!editingDeptValue.trim()) {
      showToast('Department name cannot be empty');
      return;
    }
    const cleanDept = editingDeptValue.trim();
    if (onUpdateMemberDepartment) {
      onUpdateMemberDepartment(memberIdOrEmail, cleanDept);
      showToast(`Department updated to "${cleanDept}" for ${memberName || 'employee'}`);
    }
    setEditingDeptUserId(null);
  };

  const handleCancelDept = () => {
    setEditingDeptUserId(null);
    setEditingDeptValue('');
  };

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <CheckCircle2 size={16} color="#00cc00" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="reports-summary-banner" style={{ marginBottom: '20px', borderRadius: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
            Team Members & Access Control
          </h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            MySQL Live Workspace Access • {activeCount} Active • {pendingCount} Pending Approval
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (!currentUser || currentUser.role === 'guest') {
                  onAddTeamMember?.(null);
                  return;
                }
                setShowAddModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#00cc00',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={15} />
              <span>Add Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="clockify-filter-bar" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        {/* Status Subtabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className={`team-subtab-btn ${activeSubtab === 'ALL' ? 'active' : ''}`}
            onClick={() => setActiveSubtab('ALL')}
          >
            <span>All Members</span>
            <span style={{ background: activeSubtab === 'ALL' ? 'rgba(255,255,255,0.2)' : '#e2e8f0', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            className={`team-subtab-btn ${activeSubtab === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => setActiveSubtab('ACTIVE')}
          >
            <span style={{ color: activeSubtab === 'ACTIVE' ? '#4ade80' : '#008a00' }}>●</span>
            <span>Active</span>
            <span style={{ background: activeSubtab === 'ACTIVE' ? 'rgba(255,255,255,0.2)' : '#dcfce7', color: activeSubtab === 'ACTIVE' ? '#ffffff' : '#15803d', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
              {activeCount}
            </span>
          </button>

          <button
            type="button"
            className={`team-subtab-btn ${activeSubtab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveSubtab('PENDING')}
          >
            <span style={{ color: activeSubtab === 'PENDING' ? '#fde047' : '#d97706' }}>●</span>
            <span>Pending Approval</span>
            <span style={{ background: activeSubtab === 'PENDING' ? 'rgba(255,255,255,0.2)' : '#fef3c7', color: activeSubtab === 'PENDING' ? '#ffffff' : '#b45309', padding: '1px 6px', borderRadius: '10px', fontSize: '11px' }}>
              {pendingCount}
            </span>
          </button>
        </div>

        {/* Clean Search Box */}
        <div className="filter-search-wrapper">
          <Search size={14} className="filter-search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by name, email, department, role..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Team Table */}
      <div className="clockodo-detailed-table-wrapper" style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
        <table className="clockodo-detailed-table">
          <thead>
            <tr>
              <th style={{ width: '220px' }}>EMPLOYEE</th>
              <th style={{ width: '250px' }}>WORK EMAIL</th>
              <th style={{ width: '130px' }}>ROLE</th>
              <th style={{ width: '210px' }}>DEPARTMENT / GROUP</th>
              <th style={{ width: '220px', textAlign: 'center' }}>LOGIN ACCESS & ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <Users size={32} color="#cbd5e1" style={{ marginBottom: '8px', display: 'inline-block' }} />
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                    No members found matching "{effectiveSearchQuery || activeSubtab}"
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    New employees can request access from the login screen or admin can add directly.
                  </div>
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const memberIdKey = member.id || member.email;
                const isMemberAdmin = member.role === 'admin';
                const isGranted = Boolean(member.active) || isMemberAdmin || member.accessGranted === true;
                const isEditingThisDept = editingDeptUserId === memberIdKey;

                return (
                  <tr key={memberIdKey}>
                    <td>
                      <div className="detailed-user-cell">
                        <div 
                          className="detailed-user-avatar" 
                          style={{ background: isMemberAdmin ? 'var(--grad-primary)' : (member.avatarColor || '#3b82f6'), color: isMemberAdmin ? '#04261b' : '#ffffff', fontWeight: 700 }}
                        >
                          {member.avatarInitials || (member.name ? member.name.substring(0, 2).toUpperCase() : 'U')}
                        </div>
                        <div>
                          <div className="detailed-user-name" style={{ fontWeight: 700 }}>
                            {member.name}
                          </div>
                          {member.username && (
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>@{member.username}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ color: '#475569', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} color="#94a3b8" />
                        <span>{member.email}</span>
                      </div>
                    </td>

                    <td>
                      {isMemberAdmin ? (
                        <span style={{
                          background: '#04261b',
                          color: '#00cc00',
                          border: '1px solid #00cc00',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          Admin (Owner)
                        </span>
                      ) : (
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          border: '1px solid rgba(59, 130, 246, 0.25)',
                          padding: '3px 9px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          Employee
                        </span>
                      )}
                    </td>

                    {/* Department Cell - Editable for Admin */}
                    <td>
                      {isEditingThisDept ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="text"
                            value={editingDeptValue}
                            onChange={(e) => setEditingDeptValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveDept(memberIdKey, member.name);
                              } else if (e.key === 'Escape') {
                                handleCancelDept();
                              }
                            }}
                            autoFocus
                            placeholder="Type department..."
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px',
                              borderRadius: '6px',
                              border: '1.5px solid #00cc00',
                              outline: 'none',
                              width: '135px',
                              background: '#ffffff',
                              color: '#1e293b',
                              fontWeight: 600
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveDept(memberIdKey, member.name)}
                            title="Save Department"
                            style={{
                              background: '#00cc00',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Check size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelDept}
                            title="Cancel"
                            style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                              borderRadius: '5px',
                              padding: '4px 6px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => isAdmin && handleStartEditDept(member)}
                          title={isAdmin ? "Click to edit department" : undefined}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            cursor: isAdmin ? 'pointer' : 'default',
                            transition: 'all 0.15s ease',
                            maxWidth: '190px'
                          }}
                          onMouseEnter={(e) => {
                            if (isAdmin) {
                              e.currentTarget.style.borderColor = '#00cc00';
                              e.currentTarget.style.background = '#f0fdf4';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isAdmin) {
                              e.currentTarget.style.borderColor = '#e2e8f0';
                              e.currentTarget.style.background = '#f8fafc';
                            }
                          }}
                        >
                          <Building2 size={12} color="#64748b" />
                          <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {member.department || member.group || 'Full Stack'}
                          </span>
                          {isAdmin && (
                            <Edit2 size={11} color="#94a3b8" style={{ marginLeft: '2px', flexShrink: 0 }} />
                          )}
                        </div>
                      )}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {isMemberAdmin ? (
                        <span style={{ color: '#008a00', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={15} />
                          <span>Full Access (Owner)</span>
                        </span>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                          {isGranted ? (
                            <span style={{
                              background: 'rgba(0, 204, 0, 0.1)',
                              color: '#008a00',
                              border: '1px solid rgba(0, 204, 0, 0.25)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={13} />
                              <span>Active (Approved)</span>
                            </span>
                          ) : (
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#d97706',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock size={13} />
                              <span>Pending Approval</span>
                            </span>
                          )}

                          {/* Admin Grant/Revoke Button */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onToggleUserAccess) {
                                  onToggleUserAccess(member.id || member.email);
                                  showToast(`Access ${isGranted ? 'Revoked (Pending)' : 'Granted (Active)'} for ${member.name}`);
                                }
                              }}
                              style={{
                                padding: '5px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                borderRadius: '6px',
                                border: isGranted ? '1px solid #cbd5e1' : 'none',
                                background: isGranted ? '#f8fafc' : '#00cc00',
                                color: isGranted ? '#475569' : '#ffffff',
                                cursor: 'pointer',
                                boxShadow: isGranted ? 'none' : '0 2px 6px rgba(0,204,0,0.25)'
                              }}
                            >
                              {isGranted ? 'Revoke' : 'Grant Access'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            overflow: 'visible',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ padding: '18px 22px', backgroundColor: '#1e293b', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="#00cc00" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Add Team Member</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setIsDeptDropdownOpen(false);
                }}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ padding: '22px' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sridhar Raman"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                  WORK EMAIL
                </label>
                <input
                  type="email"
                  placeholder="sridhar@digiplusagency.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              {/* Clean Single Searchable & Editable Department Input (Dropdown Opens Downwards) */}
              <div style={{ marginBottom: '16px', position: 'relative' }} ref={deptDropdownRef}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                  DEPARTMENT / GROUP
                </label>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Type or select department..."
                    value={addDepartment}
                    onChange={(e) => {
                      setAddDepartment(e.target.value);
                      setIsDeptDropdownOpen(true);
                    }}
                    onFocus={() => setIsDeptDropdownOpen(true)}
                    style={{
                      width: '100%',
                      padding: '9px 34px 9px 12px',
                      borderRadius: '6px',
                      border: isDeptDropdownOpen ? '1.5px solid #00cc00' : '1px solid #cbd5e1',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      background: '#ffffff',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setIsDeptDropdownOpen(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                  >
                    <ChevronDown size={15} style={{ transform: isDeptDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                  </button>
                </div>

                {/* Custom Downwards Floating Dropdown Menu */}
                {isDeptDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    zIndex: 999999,
                    padding: '4px'
                  }}>
                    {/* If user types a custom department not in presets */}
                    {addDepartment.trim() && !availableDepartments.some(d => d.toLowerCase() === addDepartment.trim().toLowerCase()) && (
                      <div
                        onClick={() => {
                          setIsDeptDropdownOpen(false);
                        }}
                        style={{
                          padding: '7px 10px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#008a00',
                          background: '#f0fdf4',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Sparkles size={13} color="#00cc00" />
                        <span>Use custom: <strong>"{addDepartment.trim()}"</strong></span>
                      </div>
                    )}

                    {/* Department Suggestions List */}
                    {(filteredSuggestions.length > 0 ? filteredSuggestions : availableDepartments).map((dept) => {
                      const isSelected = addDepartment.trim().toLowerCase() === dept.toLowerCase();
                      return (
                        <div
                          key={dept}
                          onClick={() => {
                            setAddDepartment(dept);
                            setIsDeptDropdownOpen(false);
                          }}
                          style={{
                            padding: '7px 10px',
                            fontSize: '12.5px',
                            color: isSelected ? '#008a00' : '#334155',
                            fontWeight: isSelected ? 700 : 500,
                            backgroundColor: isSelected ? 'rgba(0, 204, 0, 0.08)' : 'transparent',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span>{dept}</span>
                          {isSelected && <Check size={13} color="#00cc00" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '5px' }}>
                  STANDARD LOGIN PASSWORD (ADMIN ASSIGNED)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Digi@2024"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  💡 Standard company password is <strong>Digi@2024</strong>. Admin can share this password with the employee.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsDeptDropdownOpen(false);
                  }}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#00cc00', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Member & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
