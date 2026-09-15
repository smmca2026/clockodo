import { 
  Clock, 
  FileSpreadsheet, 
  Calendar, 
  LayoutDashboard, 
  BarChart3, 
  FolderKanban, 
  Users, 
  ChevronDown, 
  X,
  LogOut,
  ShieldCheck,
  User
} from 'lucide-react';

export default function Sidebar({ 
  activePage, 
  setActivePage, 
  mobileOpen, 
  setMobileOpen,
  workspace = "DigiPlus",
  currentUser = null,
  onLogout,
  projectCount = 0,
  teamCount = 0
}) {
  const isAdmin = currentUser?.role === 'admin';

  const trackingNav = [
    { id: 'timesheet', label: 'Timesheet', icon: FileSpreadsheet, badge: null },
    { id: 'time-tracker', label: 'Time Tracker', icon: Clock, badge: 'Live' },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: null },
  ];

  const analyzeNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'reports', label: 'Reports', icon: BarChart3, badge: null },
  ];

  const manageNav = [
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: projectCount ? String(projectCount) : null },
    { id: 'team', label: 'Team', icon: Users, badge: teamCount ? String(teamCount) : null },
  ];

  const handleNavClick = (pageId) => {
    setActivePage(pageId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="tracko-brand" onClick={() => handleNavClick('time-tracker')} style={{ cursor: 'pointer' }}>
            <div className="tracko-mark">
              <Clock size={17} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div className="tracko-brand-title">
              <span>CLOCK</span><span style={{ color: 'var(--digi-neon)' }}>ODO</span>
            </div>
          </div>

          {mobileOpen && (
            <button 
              className="btn-delete-row" 
              onClick={() => setMobileOpen(false)}
              style={{ color: '#94a3b8' }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Workspace Pill */}
        <div className="workspace-selector" title="Active Workspace">
          <div className="workspace-info">
            <div className="workspace-avatar" style={{ background: isAdmin ? 'var(--grad-primary)' : '#16202c', color: isAdmin ? '#04261b' : '#34d399' }}>
              {currentUser?.avatarInitials || 'DP'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div className="workspace-name" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || workspace}
              </div>
              <div style={{ fontSize: '10.5px', color: isAdmin ? '#00cc00' : '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isAdmin ? <ShieldCheck size={11} /> : <User size={11} />}
                <span>{isAdmin ? 'Admin (Owner)' : 'Employee'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav">
          {/* TRACKING */}
          {trackingNav.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                role="button"
                tabIndex={0}
              >
                <div className="nav-item-left">
                  <Icon size={17} className="nav-icon" />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="nav-item-badge">{item.badge}</span>}
              </div>
            );
          })}

          {/* ANALYZE */}
          <div className="nav-section-label">ANALYZE</div>
          {analyzeNav.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                role="button"
                tabIndex={0}
              >
                <div className="nav-item-left">
                  <Icon size={17} className="nav-icon" />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="nav-item-badge">{item.badge}</span>}
              </div>
            );
          })}

          {/* MANAGE */}
          <div className="nav-section-label">MANAGE</div>
          {manageNav.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                role="button"
                tabIndex={0}
              >
                <div className="nav-item-left">
                  <Icon size={17} className="nav-icon" />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className="nav-item-badge">{item.badge}</span>}
              </div>
            );
          })}
        </div>

        {/* Bottom User Controls & Logout */}
        {onLogout && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={onLogout}
              title="Log out of Clockodo"
            >
              <LogOut size={15} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
