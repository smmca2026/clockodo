import { api } from './services/api';
import { ShieldAlert, Ban, X as CloseIcon, LogIn } from 'lucide-react';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import TimeTrackerPage from './pages/TimeTrackerPage';
import TimesheetPage from './pages/TimesheetPage';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ProjectsPage from './pages/ProjectsPage';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettingsPage';
import SharedPublicReportPage from './pages/SharedPublicReportPage';
import { applyTheme } from './utils/theme';

import {
  INITIAL_PROJECTS,
  INITIAL_TIMESHEET_ROWS,
  INITIAL_RECENT_ACTIVITIES,
  CALENDAR_WEEK_SCHEDULE,
  USER_PROFILE,
  DEFAULT_REGISTERED_USERS,
  INITIAL_USERS
} from './data/mockData';

function App() {

  // Clean up only old legacy v1 keys if present, preserving active session and data
  try {
    ['clockodo_registered_users_v1', 'clockodo_auth_user_v1', 'clockodo_activities_v1', 'clockodo_timesheet_rows_v1'].forEach(k => localStorage.removeItem(k));
  } catch (e) { }

  // Shared Guest Access Denied Modal State
  const [guestDeniedModal, setGuestDeniedModal] = useState(false);

  // Shared Public Link routing detection & persistent guest session
  const [sharedToken, setSharedToken] = useState(() => {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/shared/')) {
      return hash.replace('#/shared/', '');
    }
    const path = window.location.pathname || '';
    if (path.startsWith('/shared/')) {
      return path.replace('/shared/', '');
    }
    return null;
  });

  const [isGuestSession, setIsGuestSession] = useState(() => {
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    return hash.startsWith('#/shared/') || path.startsWith('/shared/') || sessionStorage.getItem('clockodo_guest_session') === 'true';
  });

  useEffect(() => {
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    if (hash.startsWith('#/shared/') || path.startsWith('/shared/')) {
      setIsGuestSession(true);
      sessionStorage.setItem('clockodo_guest_session', 'true');
    }
  }, []);

  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/shared/')) {
        setSharedToken(hash.replace('#/shared/', ''));
        setIsGuestSession(true);
        sessionStorage.setItem('clockodo_guest_session', 'true');
      } else {
        const path = window.location.pathname || '';
        if (path.startsWith('/shared/')) {
          setSharedToken(path.replace('/shared/', ''));
          setIsGuestSession(true);
          sessionStorage.setItem('clockodo_guest_session', 'true');
        } else {
          setSharedToken(null);
        }
      }
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);
  // Navigation State: 'time-tracker' | 'timesheet' | 'calendar' | 'dashboard' | 'reports' | 'projects' | 'team' | 'settings'
  const [activePage, setActivePage] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState('profile');

  const [mobileOpen, setMobileOpen] = useState(false);

  // Initialize and listen to system theme (Default is System Theme)
  useEffect(() => {
    applyTheme();
    const media = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const currentChoice = localStorage.getItem('clockodo_appearance_theme') || 'system';
      if (currentChoice === 'system') {
        applyTheme('system');
      }
    };
    if (media && media.addEventListener) {
      media.addEventListener('change', handleSystemChange);
      return () => media.removeEventListener('change', handleSystemChange);
    }
  }, []);

  // Registered users state with localStorage persistence
  // Clean legacy test storage on startup so existing browsers start 100% fresh
  useEffect(() => {
    try {
      localStorage.removeItem('clockodo_activities_v2');
      localStorage.removeItem('clockodo_activities');
      localStorage.removeItem('clockodo_timesheet_rows_v2');
      localStorage.removeItem('clockodo_activities_v4');
      localStorage.removeItem('clockodo_timesheet_rows_v4');
      localStorage.removeItem('clockodo_shared_reports_v2');
    } catch (e) { }
  }, []);

  // Current Logged-in User (Persistent session across all reloads & browser restarts)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_session_user') || localStorage.getItem('clockodo_auth_user_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id || parsed.email || parsed.name)) {
          return parsed;
        }
      }
    } catch (e) { }
    return null;
  });

  // Dynamically compute effective user based on guest session
  const effectiveUser = isGuestSession
    ? { id: 'guest-1', name: 'Shared Guest', role: 'guest', email: 'guest@client.com', avatarInitials: 'SG' }
    : (currentUser || { name: 'Bharath', role: 'admin', email: 'bharath@digiplusagency.com', avatarInitials: 'B' });

  // Global Active Timer State
  const [activeTimer, setActiveTimer] = useState({
    isRunning: false,
    isPaused: false,
    elapsedSeconds: 0,
    projectId: '',
    projectName: '',
    projectColor: '#10b981',
    taskDescription: '',
    isBillable: true,
    startedAt: null,
  });

  // State for Projects with catalog merge
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seen = new Set();
          const merged = [];
          [...parsed, ...INITIAL_PROJECTS].forEach(p => {
            const k = (p.name || '').trim().toLowerCase();
            if (k && !seen.has(k)) {
              seen.add(k);
              merged.push(p);
            }
          });
          return merged;
        }
      }
    } catch (e) { }
    return INITIAL_PROJECTS;
  });

  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_registered_users_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return INITIAL_USERS;
  });

  // Auto-clean stale transaction test cache on boot
  const [activities, setActivities] = useState(() => {
    try {
      if (!localStorage.getItem('clockodo_clean_wipe_v10')) {
        localStorage.removeItem('clockodo_activities_v4');
        localStorage.removeItem('clockodo_activities_v3');
        localStorage.removeItem('clockodo_activities_v2');
        localStorage.removeItem('clockodo_activities');
        localStorage.removeItem('clockodo_timesheet_rows_v4');
        localStorage.removeItem('clockodo_timesheet_rows_v3');
        localStorage.removeItem('clockodo_timesheet_rows');
        localStorage.setItem('clockodo_clean_wipe_v10', 'true');
        return [];
      }
      const saved = localStorage.getItem('clockodo_activities_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });

  const [timesheetRows, setTimesheetRows] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_timesheet_rows_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });

  const [todayTotalHours, setTodayTotalHours] = useState(0);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Persist registered users and auth state
  useEffect(() => {
    try {
      localStorage.setItem('clockodo_registered_users_v4', JSON.stringify(usersList));
    } catch (e) { }
  }, [usersList]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('clockodo_session_user', JSON.stringify(currentUser));
        localStorage.setItem('clockodo_auth_user_v3', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('clockodo_session_user');
        localStorage.removeItem('clockodo_auth_user_v3');
      }
    } catch (e) { }
  }, [currentUser]);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('clockodo_projects', JSON.stringify(projects));
    } catch (e) { }
  }, [projects]);

  useEffect(() => {
    try {
      if (Array.isArray(activities)) {
        localStorage.setItem('clockodo_activities_v4', JSON.stringify(activities));
      }
    } catch (e) { }
  }, [activities]);

  useEffect(() => {
    try {
      if (Array.isArray(timesheetRows)) {
        localStorage.setItem('clockodo_timesheet_rows_v4', JSON.stringify(timesheetRows));
      }
    } catch (e) { }
  }, [timesheetRows]);

  // Initial load from MySQL Backend API on application mount
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        const [usersRes, actRes, timeRes, projRes] = await Promise.all([
          api.getUsers().catch(() => null),
          api.getActivities().catch(() => null),
          api.getTimesheets().catch(() => null),
          api.getProjects().catch(() => null)
        ]);

        if (!isMounted) return;

        if (usersRes && usersRes.success && Array.isArray(usersRes.data) && usersRes.data.length > 0) {
          setUsersList(usersRes.data);
          try { localStorage.setItem('clockodo_registered_users_v4', JSON.stringify(usersRes.data)); } catch (e) { }
        }

        if (actRes && actRes.success && Array.isArray(actRes.data)) {
          setActivities(actRes.data);
          try { localStorage.setItem('clockodo_activities_v4', JSON.stringify(actRes.data)); } catch (e) { }
        }

        if (timeRes && timeRes.success && Array.isArray(timeRes.data)) {
          setTimesheetRows(timeRes.data);
          try { localStorage.setItem('clockodo_timesheet_rows_v4', JSON.stringify(timeRes.data)); } catch (e) { }
        }

        if (projRes && projRes.success && Array.isArray(projRes.data) && projRes.data.length > 0) {
          setProjects(projRes.data);
          try { localStorage.setItem('clockodo_projects', JSON.stringify(projRes.data)); } catch (e) { }
        }
      } catch (err) {
        console.warn('Initial data load error from API:', err);
      }
    }
    loadBackendData();
    return () => { isMounted = false; };
  }, []);

  // Scoped activities based on user role:
  // - Admin (role === 'admin'): sees ALL activities across the entire team
  // - Employee (role !== 'admin'): sees ONLY their own activities
  const effectiveActivities = useMemo(() => {
    const activeUser = currentUser || effectiveUser;
    if (!activeUser) return [];
    if (activeUser.role === 'admin') return activities;

    const myName = (activeUser.name || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();
    const myEmail = (activeUser.email || '').trim().toLowerCase();
    const myId = activeUser.id ? String(activeUser.id) : '';

    return (activities || []).filter((act) => {
      const actUser = (act.user || act.userName || act.user_name || act.member || act.assignedTo || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();
      const actEmail = (act.userEmail || act.email || '').trim().toLowerCase();
      const actId = (act.userId || act.user_id) ? String(act.userId || act.user_id) : '';

      if (myId && actId && myId === actId) return true;
      if (myEmail && actEmail && myEmail === actEmail) return true;
      if (myName && actUser && (actUser === myName || actUser.includes(myName) || myName.includes(actUser))) return true;
      return false;
    });
  }, [activities, currentUser]);

  // Permission helper: Admin can edit/delete anything; Employees can only edit/delete their own entries
  const canEditActivity = (act) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    if (!act) return false;

    const myName = (currentUser.name || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();
    const myEmail = (currentUser.email || '').trim().toLowerCase();
    const myId = currentUser.id ? String(currentUser.id) : '';

    const actUser = (act.user || act.userName || act.user_name || act.member || act.assignedTo || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();
    const actEmail = (act.userEmail || act.email || '').trim().toLowerCase();
    const actId = (act.userId || act.user_id) ? String(act.userId || act.user_id) : '';

    if (myId && actId && myId === actId) return true;
    if (myEmail && actEmail && myEmail === actEmail) return true;
    if (myName && actUser && (actUser === myName || actUser.includes(myName) || myName.includes(actUser))) return true;
    return false;
  };

  const handlePageChange = (newPage) => {
    setActivePage(newPage);
    setGlobalSearchQuery('');
  };

  const handleCreateProject = (newProj) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    if (!newProj) return;
    setProjects((prev) => [newProj, ...prev]);
    api.createProject(newProj).catch(e => console.warn('Backend sync failed:', e));
  };

  const handleExitGuestAndLogin = () => {
    setIsGuestSession(false);
    sessionStorage.removeItem('clockodo_guest_session');
    window.location.hash = '';
    setSharedToken(null);
    setCurrentUser(null);
  };

  const handleLogin = (user) => {
    setIsGuestSession(false);
    sessionStorage.removeItem('clockodo_guest_session');
    setCurrentUser(user);
    try {
      localStorage.setItem('clockodo_session_user', JSON.stringify(user));
      localStorage.setItem('clockodo_auth_user_v3', JSON.stringify(user));
    } catch (e) { }
    setActivePage('dashboard');
  };

  const handleRegister = (newUser) => {
    setUsersList(prev => [...prev, newUser]);
    try {
      localStorage.setItem('clockodo_registered_users_v3', JSON.stringify([...usersList, newUser]));
    } catch (e) { }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('clockodo_session_user');
      localStorage.removeItem('clockodo_auth_user_v3');
      localStorage.removeItem('clockodo_auth_user_v2');
      localStorage.removeItem('clockodo_auth_user_v1');
    } catch (e) { }
    setActivePage('dashboard');
  };

  const handleUpdateCurrentUser = (updatedUser) => {
    if (!updatedUser) return;
    setCurrentUser(prev => {
      const merged = { ...prev, ...updatedUser };
      try {
        localStorage.setItem('clockodo_session_user', JSON.stringify(merged));
        localStorage.setItem('clockodo_auth_user_v3', JSON.stringify(merged));
      } catch (e) { }
      return merged;
    });
    setUsersList(prev => {
      let found = false;
      const next = prev.map(u => {
        if (u.id === updatedUser.id || (u.email && updatedUser.email && u.email.toLowerCase() === updatedUser.email.toLowerCase()) || (u.role === 'admin' && updatedUser.role === 'admin')) {
          found = true;
          return { ...u, ...updatedUser };
        }
        return u;
      });
      if (!found && updatedUser.role === 'admin') {
        next.unshift(updatedUser);
      }
      try {
        localStorage.setItem('clockodo_registered_users_v4', JSON.stringify(next));
        localStorage.setItem('clockodo_registered_users_v3', JSON.stringify(next));
      } catch (e) { }
      return next;
    });
  };

  const handleToggleUserAccess = async (idOrEmail) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    if (!idOrEmail) return;
    try {
      const res = await api.toggleUserAccess(idOrEmail);
      if (res && res.success) {
        setUsersList(prev => prev.map(u => {
          if (u.id === idOrEmail || u.email.toLowerCase() === String(idOrEmail).toLowerCase()) {
            return { ...u, active: res.active, accessGranted: res.active };
          }
          return u;
        }));
      }
    } catch (err) {
      console.warn('Error toggling access:', err);
      // Local fallback
      setUsersList(prev => prev.map(u => {
        if (u.id === idOrEmail || u.email.toLowerCase() === String(idOrEmail).toLowerCase()) {
          const newStatus = !u.active;
          return { ...u, active: newStatus, accessGranted: newStatus };
        }
        return u;
      }));
    }
  };

  const handleDeleteTeamMember = async (idOrEmail) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Managing workspace members is restricted to Admin.'
      });
      return;
    }
    if (!idOrEmail) return;
    try {
      await api.deleteUser(idOrEmail);
    } catch (err) {
      console.warn('Error deleting user from API:', err);
    }
    setUsersList(prev => prev.filter(u => u.id !== idOrEmail && (u.email || '').toLowerCase() !== String(idOrEmail).toLowerCase()));
  };

  const handleAddTeamMember = async (newMember) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    if (!newMember) return;

    const assignedPassword = (newMember.password || 'Digi@2024').trim();
    const memberPayload = {
      ...newMember,
      password: assignedPassword,
      active: true,
      accessGranted: true,
      workspace: 'DigiPlus'
    };

    try {
      const res = await api.addUser(memberPayload);
      if (res && res.success && res.user) {
        setUsersList(prev => [res.user, ...prev]);
        return;
      }
    } catch (err) {
      console.warn('Backend add user error:', err);
    }

    // Local fallback
    const id = `usr-${Date.now()}`;
    const initials = newMember.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const fallbackUser = {
      id,
      name: newMember.name,
      username: newMember.email.split('@')[0],
      email: newMember.email,
      password: assignedPassword,
      role: newMember.role || 'employee',
      department: newMember.department || 'Full Stack',
      active: true,
      accessGranted: true,
      avatarInitials: initials,
      avatarColor: '#3b82f6',
      workspace: 'DigiPlus'
    };
    setUsersList(prev => [fallbackUser, ...prev]);
  };

  const handleUpdateMemberDepartment = async (idOrEmail, newDepartment) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts.'
      });
      return;
    }
    if (!idOrEmail || !newDepartment) return;
    const cleanDept = newDepartment.trim();

    // Optimistically update local usersList state
    setUsersList((prev) => {
      const updated = prev.map((u) => {
        if (u.id === idOrEmail || (u.email && u.email.toLowerCase() === String(idOrEmail).toLowerCase())) {
          return { ...u, department: cleanDept, group: cleanDept };
        }
        return u;
      });
      try {
        localStorage.setItem('clockodo_registered_users_v2', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    // If current logged-in user, update session as well
    if (
      effectiveUser &&
      (effectiveUser.id === idOrEmail || (effectiveUser.email && effectiveUser.email.toLowerCase() === String(idOrEmail).toLowerCase()))
    ) {
      setCurrentUser((prev) => {
        const merged = { ...prev, department: cleanDept };
        try {
          localStorage.setItem('clockodo_session_user', JSON.stringify(merged));
        } catch (e) { }
        return merged;
      });
    }

    // Backend MySQL Sync
    try {
      await api.updateProfile(idOrEmail, { department: cleanDept });
    } catch (err) {
      console.warn('Backend update department error:', err);
    }
  };

  // Real-time stopwatch ticker & Idle Auto-Pause Tracker
  const lastUserActivityRef = useRef(Date.now());
  const [idleAlertToast, setIdleAlertToast] = useState(null);

  useEffect(() => {
    const markActive = () => {
      lastUserActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', markActive, { passive: true });
    window.addEventListener('keydown', markActive, { passive: true });
    window.addEventListener('mousedown', markActive, { passive: true });
    window.addEventListener('touchstart', markActive, { passive: true });
    window.addEventListener('scroll', markActive, { passive: true });

    return () => {
      window.removeEventListener('mousemove', markActive);
      window.removeEventListener('keydown', markActive);
      window.removeEventListener('mousedown', markActive);
      window.removeEventListener('touchstart', markActive);
      window.removeEventListener('scroll', markActive);
    };
  }, []);

  useEffect(() => {
    let interval = null;
    if (activeTimer.isRunning) {
      lastUserActivityRef.current = Date.now();

      interval = setInterval(() => {
        // Real-time check: Auto-pause on 10 minutes system idle inactivity
        try {
          const rawPref = localStorage.getItem('clockodo_preference_toggles');
          const pref = rawPref ? JSON.parse(rawPref) : { autoPauseOnIdle: true };
          if (pref.autoPauseOnIdle !== false) {
            const idleMs = Date.now() - lastUserActivityRef.current;
            // 10 minutes = 600,000 milliseconds
            if (idleMs >= 600000) {
              setActiveTimer((prev) => ({
                ...prev,
                isRunning: false,
                isPaused: true,
              }));
              setIdleAlertToast('⏸️ Live timer auto-paused due to 10 minutes of system inactivity.');
              setTimeout(() => setIdleAlertToast(null), 8000);
              return;
            }
          }
        } catch (e) { }

        setActiveTimer((prev) => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
        }));
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeTimer.isRunning]);

  const getCurrentTimeFormatted = () => {
    const now = new Date();
    let hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    return `${String(h12).padStart(2, '0')}:${mins} ${period}`;
  };

  const formatSecondsToHMS = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Timer Handlers
  const handleStartTimer = (config = {}) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    setActiveTimer({
      isRunning: true,
      isPaused: false,
      elapsedSeconds: 0,
      projectId: config.projectId || `proj-${Date.now()}`,
      projectName: config.projectName || 'General Task',
      projectColor: config.projectColor || '#00cc00',
      taskDescription: config.taskDescription || 'Working session',
      isBillable: config.isBillable !== false,
      startedAt: getCurrentTimeFormatted(),
    });
  };

  const handlePauseTimer = () => {
    setActiveTimer((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }));
  };

  const handleResumeTimer = () => {
    setActiveTimer((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
    }));
  };

  const timeToSeconds = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const parts = timeStr.trim().split(':').map(Number);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
    return 0;
  };

  const secondsToHMS = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const addHMS = (t1, t2) => {
    return secondsToHMS(timeToSeconds(t1) + timeToSeconds(t2));
  };

  const getDayKeyFromGroup = (group, dateStr) => {
    if (dateStr) {
      const match = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        const [, y, m, d] = match;
        const dayObj = new Date(Number(y), Number(m) - 1, Number(d));
        const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        return keys[dayObj.getDay()];
      }
    }
    const now = new Date();
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    if (!group) return keys[now.getDay()];
    const g = String(group).toLowerCase().trim();
    if (g.includes('today')) return keys[now.getDay()];
    if (g.includes('yesterday')) {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return keys[yest.getDay()];
    }
    if (g.includes('mon')) return 'mon';
    if (g.includes('tue')) return 'tue';
    if (g.includes('wed')) return 'wed';
    if (g.includes('thu')) return 'thu';
    if (g.includes('fri')) return 'fri';
    if (g.includes('sat')) return 'sat';
    if (g.includes('sun')) return 'sun';
    return keys[now.getDay()];
  };

  // State for Calendar Schedule
  const [calendarSchedule, setCalendarSchedule] = useState(CALENDAR_WEEK_SCHEDULE);

  const getActivityDate = (act) => {
    if (!act) return '';
    const raw = act.date || act.group || act.createdAt || act.timestamp || '';

    // Dynamic Today / Yesterday resolution
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayISO = `${y}-${m}-${d}`;

    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yy = yest.getFullYear();
    const ym = String(yest.getMonth() + 1).padStart(2, '0');
    const yd = String(yest.getDate()).padStart(2, '0');
    const yestISO = `${yy}-${ym}-${yd}`;

    if (!raw) return todayISO;

    if (typeof raw === 'string') {
      const trimmed = raw.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (trimmed.includes('T')) {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          const yr = parsed.getFullYear();
          const mo = String(parsed.getMonth() + 1).padStart(2, '0');
          const da = String(parsed.getDate()).padStart(2, '0');
          return `${yr}-${mo}-${da}`;
        }
        return trimmed.split('T')[0];
      }
    }

    const str = String(raw).trim().toLowerCase();
    if (str.includes('today')) return todayISO;
    if (str.includes('yesterday')) return yestISO;

    const monthMap = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };

    const monthDayMatch = str.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:[,\s]+(\d{4}))?/i);
    if (monthDayMatch) {
      const mm = monthMap[monthDayMatch[1].toLowerCase().slice(0, 3)];
      const dd = String(monthDayMatch[2]).padStart(2, '0');
      const yr = monthDayMatch[3] || String(now.getFullYear());
      return `${yr}-${mm}-${dd}`;
    }

    const dayMonthMatch = str.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:[,\s]+(\d{4}))?/i);
    if (dayMonthMatch) {
      const dd = String(dayMonthMatch[1]).padStart(2, '0');
      const mm = monthMap[dayMonthMatch[2].toLowerCase().slice(0, 3)];
      const yr = dayMonthMatch[3] || String(now.getFullYear());
      return `${yr}-${mm}-${dd}`;
    }

    try {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) {
        const yr = parsed.getFullYear();
        const mo = String(parsed.getMonth() + 1).padStart(2, '0');
        const da = String(parsed.getDate()).padStart(2, '0');
        return `${yr}-${mo}-${da}`;
      }
    } catch (e) { }

    return todayISO;
  };

  const getDisplayLabelForDate = (isoDate) => {
    if (!isoDate) return 'Today';
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const todayISO = `${y}-${m}-${d}`;

    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const yestISO = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

    if (isoDate === todayISO) return 'Today';
    if (isoDate === yestISO) return 'Yesterday';

    const parts = isoDate.split('-').map(Number);
    if (parts.length === 3) {
      const [yr, mo, da] = parts;
      const dateObj = new Date(yr, mo - 1, da);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${dayNames[dateObj.getDay()]}, ${monthNames[mo - 1]} ${String(da).padStart(2, '0')}`;
    }
    return isoDate;
  };

  const getWeekISODates = (weekOffset = 0) => {
    const baseDate = new Date(); // Real-time live date
    const dayOfWeek = (baseDate.getDay() + 6) % 7; // 0 for Mon ... 6 for Sun
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - dayOfWeek + (weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    return [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    });
  };

  const handleAddManualEntry = (entry) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    if (!entry) return;
    const durSec = timeToSeconds(entry.durationFormatted);
    const durHours = durSec > 0 ? (durSec / 3600) : 1;
    const formattedDuration = entry.durationFormatted || secondsToHMS(durSec);

    let computedISO = entry.date;
    if (!computedISO || !computedISO.includes('-')) {
      computedISO = getActivityDate({ group: entry.group, date: entry.date });
    }

    const dayKey = getDayKeyFromGroup(entry.group, computedISO);
    const dynamicGroup = getDisplayLabelForDate(computedISO);

    const userName = currentUser?.name || 'Bharath (Owner)';
    const userEmail = currentUser?.email || '';
    const userId = currentUser?.id || '';

    const newAct = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      project: entry.project || 'General Task',
      projectColor: entry.projectColor || '#10b981',
      description: entry.description || 'Tracked session',
      group: dynamicGroup,
      date: computedISO,
      startTime: entry.startTime || '09:00 AM',
      endTime: entry.endTime || '05:00 PM',
      durationSeconds: durSec,
      durationFormatted: formattedDuration,
      billable: entry.billable !== undefined ? entry.billable : true,
      status: 'Completed',
      user: userName,
      userName: userName,
      user_name: userName,
      userEmail: userEmail,
      email: userEmail,
      userId: userId,
    };

    // 1. Update Time Tracker Activities & MySQL
    setActivities((prev) => [newAct, ...(prev || [])]);
    api.addActivity(newAct).catch(() => { });

    // 2. Automatically sync to Timesheet Rows
    setTimesheetRows((prevRows) => {
      const safePrev = Array.isArray(prevRows) ? prevRows : [];
      const existingIdx = safePrev.findIndex(
        (r) => (r.projectName || '').toLowerCase() === newAct.project.toLowerCase()
      );

      if (existingIdx >= 0) {
        const updated = [...safePrev];
        const row = { ...updated[existingIdx] };
        const safeHours = row.hours || {};
        const currentVal = safeHours[dayKey] || '';
        row.hours = {
          ...safeHours,
          [dayKey]: currentVal ? addHMS(currentVal, formattedDuration) : formattedDuration,
        };

        let totalSec = 0;
        Object.values(row.hours).forEach((val) => {
          totalSec += timeToSeconds(val);
        });
        row.total = secondsToHMS(totalSec);
        updated[existingIdx] = row;
        api.syncTimesheets(updated).catch(() => { });
        return updated;
      } else {
        const newRow = {
          id: `ts-${Date.now()}`,
          projectId: entry.projectId || `proj-${Date.now()}`,
          projectName: newAct.project,
          taskDescription: newAct.description,
          color: newAct.projectColor,
          hours: {
            mon: '',
            tue: '',
            wed: '',
            thu: '',
            fri: '',
            sat: '',
            sun: '',
            [dayKey]: formattedDuration,
          },
          total: formattedDuration,
          billable: newAct.billable,
        };
        const updated = [newRow, ...safePrev];
        api.syncTimesheets(updated).catch(() => { });
        return updated;
      }
    });

    // 3. Automatically sync to Calendar Schedule
    const dayIndices = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
    const dayIdx = dayIndices[dayKey] ?? 2;

    const [startH, startM] = (entry.startTime || '09:00').split(':').map(Number);
    const topHour = (isNaN(startH) ? 9 : startH) + ((isNaN(startM) ? 0 : startM) / 60);

    const newCalendarBlock = {
      id: `b-${Date.now()}`,
      title: newAct.description,
      subtitle: `${newAct.startTime} - ${newAct.endTime}`,
      project: newAct.project,
      duration: formattedDuration,
      topHour: Math.max(7, Math.min(18.5, topHour)),
      durationHours: Math.max(0.5, durHours),
      color: newAct.projectColor,
    };

    setCalendarSchedule((prev) => {
      const safeDays = (prev && Array.isArray(prev.days)) ? prev.days : (CALENDAR_WEEK_SCHEDULE.days || []);
      const updatedDays = safeDays.map((day, idx) => {
        if (idx === dayIdx) {
          const safeBlocks = Array.isArray(day.blocks) ? day.blocks : [];
          const newBlocks = [...safeBlocks, newCalendarBlock];
          const newTotalSec = timeToSeconds(day.totalStr) + durSec;
          return {
            ...day,
            blocks: newBlocks,
            totalStr: secondsToHMS(newTotalSec),
          };
        }
        return day;
      });
      return { ...prev, days: updatedDays };
    });

    // 4. Automatically sync to Projects tracked hours
    setProjects((prevProjects) => {
      const safeProjs = Array.isArray(prevProjects) ? prevProjects : [];
      return safeProjs.map((p) => {
        if ((p.name || '').toLowerCase() === newAct.project.toLowerCase()) {
          const currHours = parseFloat(p.tracked) || 0;
          const updatedHours = (currHours + durHours).toFixed(2);
          return {
            ...p,
            tracked: `${updatedHours}h`,
          };
        }
        return p;
      });
    });

    // 5. Update Today Total Hours
    setTodayTotalHours((prev) => (prev || 0) + durSec);
  };

  const handleDeleteActivity = (actId) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    if (!actId) return;

    const targetAct = (activities || []).find(a => String(a.id) === String(actId));
    if (targetAct && !canEditActivity(targetAct)) {
      alert('Access Restricted: You can only delete your own time entries.');
      return;
    }

    setActivities((prev) => prev.filter((a) => a.id !== actId));
    api.deleteActivity(actId).catch(e => console.warn('Backend sync failed:', e));
  };

  const handleUpdateActivity = (actId, updates) => {
    if (isGuestSession && (!effectiveUser || effectiveUser.role === 'guest')) {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts.'
      });
      return;
    }
    if (!actId || !updates) return;

    const targetAct = (activities || []).find(a => String(a.id) === String(actId));
    if (targetAct && !canEditActivity(targetAct)) {
      alert('Access Restricted: You can only edit your own time entries.');
      return;
    }

    setActivities((prev) => {
      const updated = (prev || []).map((a) => {
        if (String(a.id) === String(actId)) {
          return {
            ...a,
            ...updates,
          };
        }
        return a;
      });
      try {
        localStorage.setItem('clockodo_activities_v2', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    api.updateActivity(actId, updates).catch((e) => console.warn('Backend sync failed for updateActivity:', e));
  };

  const handleUpdateActivityDate = (actId, newISODate, newGroupLabel) => {
    if (isGuestSession && (!effectiveUser || effectiveUser.role === 'guest')) {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode.'
      });
      return;
    }
    if (!actId) return;

    const targetAct = (activities || []).find(a => String(a.id) === String(actId));
    if (targetAct && !canEditActivity(targetAct)) {
      alert('Access Restricted: You can only change dates for your own time entries.');
      return;
    }

    setActivities((prev) => {
      const updated = (prev || []).map((a) => {
        if (String(a.id) === String(actId)) {
          return {
            ...a,
            date: newISODate,
            group: newGroupLabel,
          };
        }
        return a;
      });
      try {
        localStorage.setItem('clockodo_activities_v2', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    api.updateActivity(actId, { date: newISODate, group: newGroupLabel }).catch(e => console.warn('Backend sync failed:', e));
  };

  const handleDeleteProjectActivities = (projectName, weekOffset = 0) => {
    if (!projectName) return;
    const cleanProjName = projectName.trim().toLowerCase();
    const weekISODates = getWeekISODates(weekOffset);

    // 1. Delete matching activities for this week
    setActivities((prev) => {
      const toDelete = prev.filter((a) => {
        const actProj = (a.project || '').trim().toLowerCase();
        if (actProj === cleanProjName) {
          const actDate = getActivityDate(a);
          if (actDate && weekISODates.includes(actDate)) return true;
          if (a.date && weekISODates.includes(a.date)) return true;
          if (!a.date && weekOffset === 0) return true;
        }
        return false;
      });

      toDelete.forEach((a) => {
        if (a.id) api.deleteActivity(a.id).catch(() => { });
      });

      return prev.filter((a) => !toDelete.some((d) => d.id === a.id));
    });

    // 2. Also remove or clear from timesheetRows
    setTimesheetRows((prev) => {
      const updated = prev.filter(
        (r) => (r.projectName || '').trim().toLowerCase() !== cleanProjName
      );
      api.syncTimesheets(updated).catch(() => { });
      return updated;
    });

    // 3. Delete from backend database
    api.deleteProjectActivities(projectName).catch(() => { });
  };

  const handleUpdateProjectName = (oldProjectName, newProject, weekOffset = 0) => {
    if (!oldProjectName || !newProject) return;
    const cleanOldName = oldProjectName.trim().toLowerCase();
    const weekISODates = getWeekISODates(weekOffset);

    setActivities((prev) =>
      prev.map((a) => {
        if ((a.project || '').trim().toLowerCase() === cleanOldName) {
          const actDate = getActivityDate(a);
          if ((actDate && weekISODates.includes(actDate)) || (a.date && weekISODates.includes(a.date)) || (!a.date && weekOffset === 0)) {
            const updated = {
              ...a,
              project: newProject.name,
              projectColor: newProject.color || '#10b981',
            };
            if (a.id) {
              api.updateActivity(a.id, {
                project: newProject.name,
                projectColor: newProject.color || '#10b981',
              }).catch(() => { });
            }
            return updated;
          }
        }
        return a;
      })
    );
  };

  const handleUpdateTimesheetCell = ({
    projectName,
    projectColor,
    taskDescription,
    dayKey,
    targetISO,
    formattedDuration,
    weekOffset = 0,
    userEmail,
    userName,
    userId
  }) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    if (!projectName) return;
    if (!currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Cannot Edit Timesheet',
        message: 'You are currently in Read-Only Guest Mode. Editing timesheets is restricted. Please sign in with an authorized account.'
      });
      return;
    }
    const durSec = timeToSeconds(formattedDuration);
    const isCleared = !formattedDuration || formattedDuration === '00:00:00' || durSec <= 0;

    // 1. Update activities state & MySQL backend
    setActivities((prev) => {
      const targetUser = (userName || currentUser?.name || '').trim().toLowerCase();
      const targetEmail = (userEmail || currentUser?.email || '').trim().toLowerCase();

      const existingActs = prev.filter((a) => {
        const matchProj = (a.project || '').trim().toLowerCase() === projectName.trim().toLowerCase();
        const matchDate = a.date ? a.date === targetISO : false;
        if (!matchProj || !matchDate) return false;

        // If employee (non-admin), or specific user targeted, match user ownership
        if (currentUser?.role !== 'admin' || targetUser) {
          const actUser = (a.user || a.userName || a.user_name || '').trim().toLowerCase();
          const actEmail = (a.userEmail || a.email || '').trim().toLowerCase();
          if (targetEmail && actEmail && targetEmail === actEmail) return true;
          if (targetUser && actUser && (targetUser === actUser || actUser.includes(targetUser) || targetUser.includes(actUser))) return true;
          return false;
        }
        return true;
      });

      if (isCleared) {
        // Delete activities for this project and date
        existingActs.forEach((a) => {
          if (a.id) api.deleteActivity(a.id).catch(() => { });
        });
        return prev.filter((a) => !existingActs.some((e) => e.id === a.id));
      }

      if (existingActs.length > 0) {
        const primaryId = existingActs[0].id;
        const extraIds = existingActs.slice(1).map((e) => e.id);
        extraIds.forEach((id) => api.deleteActivity(id).catch(() => { }));

        api.updateActivity(primaryId, {
          durationFormatted: formattedDuration,
          durationSeconds: durSec,
        }).catch(() => { });

        return prev.filter((a) => !extraIds.includes(a.id)).map((a) => {
          if (a.id === primaryId) {
            return {
              ...a,
              durationFormatted: formattedDuration,
              durationSeconds: durSec,
            };
          }
          return a;
        });
      } else {
        const newAct = {
          id: `ts-act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          project: projectName,
          projectColor: projectColor || '#00cc00',
          description: taskDescription || `${projectName} session`,
          date: targetISO,
          group: dayKey ? `${dayKey.toUpperCase()}` : 'Today',
          startTime: '09:00',
          endTime: '17:00',
          durationFormatted: formattedDuration,
          durationSeconds: durSec,
          billable: true,
          status: 'Completed',
          user: userName || currentUser?.name || 'Bharath (Owner)',
          userName: userName || currentUser?.name || 'Bharath (Owner)',
          user_name: userName || currentUser?.name || 'Bharath (Owner)',
          userEmail: userEmail || currentUser?.email || '',
          email: userEmail || currentUser?.email || '',
          userId: userId || currentUser?.id || '',
        };

        api.addActivity(newAct).catch(() => { });
        return [newAct, ...prev];
      }
    });

    // 2. Also update timesheetRows state
    setTimesheetRows((prevRows) => {
      const updated = [...prevRows];
      const existingIdx = updated.findIndex((r) => (r.projectName || '').toLowerCase() === projectName.toLowerCase());
      if (existingIdx >= 0) {
        const row = { ...updated[existingIdx] };
        row.hours = { ...(row.hours || {}), [dayKey]: isCleared ? '' : formattedDuration };
        let totalSec = 0;
        Object.values(row.hours || {}).forEach((v) => {
          totalSec += timeToSeconds(v);
        });
        row.total = secondsToHMS(totalSec);
        updated[existingIdx] = row;
        api.syncTimesheets(updated).catch(() => { });
        return updated;
      }
      return prevRows;
    });
  };

  const handleDeleteCalendarEntry = (dayNum, blockId, blockInfo = {}) => {
    // 1. Synchronously remove from activities (Time Tracker list)
    setActivities((prev) => {
      return prev.filter((act) => {
        if (act.id === blockId) return false;
        if (blockInfo.title && blockInfo.project) {
          const actDesc = (act.description || '').trim();
          const blockTitle = (blockInfo.title || '').trim();
          const actProj = (act.project || '').trim();
          const blockProj = (blockInfo.project || '').trim();
          if (actDesc === blockTitle && actProj === blockProj) return false;
        }
        return true;
      });
    });

    // 2. Synchronously remove from calendarSchedule
    setCalendarSchedule((prev) => {
      const updatedDays = prev.days.map((day) => {
        if (day.dayNum === dayNum) {
          const updatedBlocks = day.blocks.filter((b) => b.id !== blockId);
          let daySec = 0;
          updatedBlocks.forEach((b) => {
            const parts = (b.duration || '00:00:00').split(':').map(Number);
            daySec += (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
          });
          return {
            ...day,
            blocks: updatedBlocks,
            totalStr: secondsToHMS(daySec),
          };
        }
        return day;
      });
      return { ...prev, days: updatedDays };
    });
  };

  const handleDuplicateActivity = (act) => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const da = String(now.getDate()).padStart(2, '0');
    const todayISO = `${yr}-${mo}-${da}`;

    const duplicated = {
      ...act,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: act.date || todayISO,
      group: act.group || 'Today',
      startTime: getCurrentTimeFormatted(),
      endTime: getCurrentTimeFormatted(),
    };
    setActivities((prev) => [duplicated, ...(prev || [])]);
    api.addActivity(duplicated).catch(() => { });
  };

  const handleStopTimer = () => {
    const duration = activeTimer.elapsedSeconds;
    if (duration > 0) {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const da = String(now.getDate()).padStart(2, '0');
      const todayISO = `${yr}-${mo}-${da}`;

      const formatted = formatSecondsToHMS(duration);
      handleAddManualEntry({
        project: activeTimer.projectName || 'General Task',
        projectColor: activeTimer.projectColor || '#10b981',
        description: activeTimer.taskDescription || 'Working session',
        group: 'Today',
        date: todayISO,
        startTime: activeTimer.startedAt || getCurrentTimeFormatted(),
        endTime: getCurrentTimeFormatted(),
        durationFormatted: formatted,
        billable: activeTimer.isBillable,
      });
    }

    setActiveTimer({
      isRunning: false,
      isPaused: false,
      elapsedSeconds: 0,
      projectId: 'proj-2',
      projectName: 'JRKS Logistics',
      projectColor: '#10b981',
      taskDescription: '',
      isBillable: true,
      startedAt: null,
    });
  };



  // If user is not logged in and not on a shared link, render the Login Page
  if (!currentUser && !sharedToken) {
    return (
      <LoginPage
        usersList={usersList}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div className="tracko-app">
      {/* Left Sidebar */}
      <Sidebar
        projectCount={projects.length}
        teamCount={usersList.length}
        activePage={activePage}
        setActivePage={(page) => {
          if (sharedToken) {
            window.location.hash = '';
            setSharedToken(null);
          }
          handlePageChange(page);
        }}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        workspace={USER_PROFILE.workspace}
        currentUser={effectiveUser}
        onLogout={isGuestSession ? handleExitGuestAndLogin : handleLogout}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          usersList={usersList}
          activePage={activePage}
          onOpenMobileMenu={() => setMobileOpen(true)}
          activeTimer={activeTimer}
          onNavigateToTracker={() => {
            if (sharedToken) {
              window.location.hash = '';
              setSharedToken(null);
            }
            handlePageChange('time-tracker');
          }}
          setActivePage={(page) => {
            if (sharedToken) {
              window.location.hash = '';
              setSharedToken(null);
            }
            handlePageChange(page);
          }}
          setSettingsTab={setSettingsTab}
          projects={projects}
          activities={effectiveActivities}
          searchQuery={globalSearchQuery}
          setSearchQuery={setGlobalSearchQuery}
          currentUser={effectiveUser}
          onLogout={isGuestSession ? handleExitGuestAndLogin : handleLogout}
        />

        {/* Dynamic Pages */}
        <main>
          {sharedToken && (
            <SharedPublicReportPage
              token={sharedToken}
              currentUser={effectiveUser}
              activities={effectiveActivities}
              projects={projects}
              timesheetRows={timesheetRows}
              onBackToApp={() => {
                window.location.hash = '';
                setSharedToken(null);
                handlePageChange('reports');
              }}
              onGoToLogin={handleExitGuestAndLogin}
            />
          )}

          {!sharedToken && activePage === 'timesheet' && (
            <TimesheetPage
              timesheetRows={timesheetRows}
              onUpdateTimesheetRows={setTimesheetRows}
              projects={projects}
              onCreateProject={handleCreateProject}
              searchQuery={globalSearchQuery}
              activities={effectiveActivities}
              onAddManualEntry={handleAddManualEntry}
              onUpdateTimesheetCell={handleUpdateTimesheetCell}
              onDeleteProjectActivities={handleDeleteProjectActivities}
              onUpdateProjectName={handleUpdateProjectName}
              onDeleteActivity={handleDeleteActivity}
              currentUser={effectiveUser}
              usersList={usersList}
            />
          )}

          {!sharedToken && activePage === 'time-tracker' && (
            <TimeTrackerPage
              projects={projects}
              activities={effectiveActivities}
              onAddManualEntry={handleAddManualEntry}
              onCreateProject={handleCreateProject}
              searchQuery={globalSearchQuery}
              activeTimer={activeTimer}
              onStartTimer={handleStartTimer}
              onStopTimer={handleStopTimer}
              onDeleteActivity={handleDeleteActivity}
              onDuplicateActivity={handleDuplicateActivity}
              onUpdateActivityDate={handleUpdateActivityDate}
              onUpdateActivity={handleUpdateActivity}
              currentUser={effectiveUser}
            />
          )}

          {!sharedToken && activePage === 'calendar' && (
            <CalendarPage
              currentUser={effectiveUser}
              calendarSchedule={calendarSchedule}
              onUpdateCalendarSchedule={setCalendarSchedule}
              activeTimer={activeTimer}
              activities={effectiveActivities}
              timesheetRows={timesheetRows}
              projects={projects}
              onAddManualEntry={handleAddManualEntry}
              onDeleteCalendarEntry={handleDeleteCalendarEntry}
            />
          )}

          {!sharedToken && activePage === 'dashboard' && (
            <DashboardPage
              timesheetRows={timesheetRows}
              activities={effectiveActivities}
              projects={projects}
              usersList={usersList}
              currentUser={effectiveUser}
            />
          )}

          {!sharedToken && activePage === 'reports' && (
            <ReportsPage
              timesheetRows={timesheetRows}
              activities={effectiveActivities}
              projects={projects}
              searchQuery={globalSearchQuery}
              currentUser={effectiveUser}
              usersList={usersList}
            />
          )}

          {!sharedToken && activePage === 'projects' && (
            <ProjectsPage
              projects={projects}
              onCreateProject={handleCreateProject}
              searchQuery={globalSearchQuery}
              currentUser={effectiveUser}
              activities={effectiveActivities}
              timesheetRows={timesheetRows}
            />
          )}

          {!sharedToken && activePage === 'team' && (
            <TeamPage
              searchQuery={globalSearchQuery}
              currentUser={effectiveUser}
              usersList={usersList}
              onToggleUserAccess={handleToggleUserAccess}
              onAddTeamMember={handleAddTeamMember}
              onUpdateMemberDepartment={handleUpdateMemberDepartment}
              onDeleteTeamMember={handleDeleteTeamMember}
            />
          )}

          {!sharedToken && activePage === 'settings' && (
            <SettingsPage
              currentUser={effectiveUser}
              onUpdateCurrentUser={handleUpdateCurrentUser}
              usersList={usersList}
              setUsersList={setUsersList}
              initialTab={settingsTab}
            />
          )}
        </main>
      </div>

      {/* GLOBAL ACCESS DENIED MODAL FOR SHARED GUEST MODE */}
      {Boolean(guestDeniedModal) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
            border: '1px solid #fecaca',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-in-out'
          }}>
            {/* Modal Top Red Alert Bar */}
            <div style={{
              padding: '18px 24px',
              backgroundColor: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #ef4444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1.5px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={20} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                    {typeof guestDeniedModal === 'object' && guestDeniedModal.title ? guestDeniedModal.title : 'Action Restricted in Guest Mode'}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                    🚫 Sign In Required for Workspace Changes
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuestDeniedModal(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <Ban size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.5 }}>
                  <strong>{typeof guestDeniedModal === 'object' && guestDeniedModal.title ? guestDeniedModal.title : 'Action Restricted'}:</strong>
                  <div style={{ marginTop: '4px' }}>
                    {typeof guestDeniedModal === 'object' && guestDeniedModal.message ? guestDeniedModal.message : 'You are viewing a Shared Public Link in Read-Only mode. Adding new tasks, entries, or modifying workspace data is restricted to authorized users.'}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 22px 0' }}>
                To unlock full access, add entries, start timers, or manage projects, please sign in with an authorized <strong>Admin or Employee account</strong>.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setGuestDeniedModal(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Dismiss & Stay on Read-Only
                </button>

                <button
                  type="button"
                  onClick={() => { setGuestDeniedModal(null); handleExitGuestAndLogin(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <LogIn size={15} />
                  <span>Sign In as Admin / Staff</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Idle Auto-pause Toast */}
      {Boolean(idleAlertToast) && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          border: '1.5px solid #00cc00',
          borderRadius: '10px',
          padding: '14px 20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          <span>{idleAlertToast}</span>
          <button
            type="button"
            onClick={() => setIdleAlertToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;