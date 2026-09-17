import { api } from './services/api';
import { ShieldAlert, Ban, X as CloseIcon, LogIn } from 'lucide-react';
import React, { useState, useEffect } from 'react';
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
} catch (e) {}

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

  // Registered users state with localStorage persistence
  const [usersList, setUsersList] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_registered_users_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_USERS;
  });

  // Fetch live workspace data from MySQL backend on startup
  useEffect(() => {
    // 1. Live Users
    api.getUsers().then(res => {
      if (res && res.success && Array.isArray(res.data)) {
        setUsersList(res.data);
      }
    }).catch(err => console.warn('Could not fetch MySQL users on start:', err));

    // 2. Live Activities with strict deduplication
    api.getActivities().then(res => {
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const seen = new Set();
        const unique = [];
        res.data.forEach(a => {
          const key = `${(a.project || '').trim().toLowerCase()}__${(a.date || '').trim()}__${(a.userEmail || a.user || '').trim().toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(a);
          }
        });
        setActivities(unique);
      }
    }).catch(err => console.warn('Could not fetch MySQL activities on start:', err));

    // 3. Live Timesheets
    api.getTimesheets().then(res => {
      if (res && res.success && Array.isArray(res.data)) {
        setTimesheetRows(res.data);
      }
    }).catch(err => console.warn('Could not fetch MySQL timesheets on start:', err));

    // 4. Live Projects with deduplication
    api.getProjects().then(res => {
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const seen = new Set();
        const unique = [];
        [...res.data, ...INITIAL_PROJECTS].forEach(p => {
          const nameKey = (p.name || '').trim().toLowerCase();
          if (nameKey && !seen.has(nameKey)) {
            seen.add(nameKey);
            unique.push(p);
          }
        });
        setProjects(unique);
      }
    }).catch(err => console.warn('Could not fetch MySQL projects on start:', err));
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
    } catch (e) {}
    return null;
  });

  // Dynamically compute effective user based on guest session
  const effectiveUser = isGuestSession 
    ? { id: 'guest-1', name: 'Shared Guest', role: 'guest', email: 'guest@client.com', avatarInitials: 'SG' }
    : (currentUser || { name: 'Bharath (Owner)', role: 'admin', email: 'bharath.owner@digiplusagency.com', avatarInitials: 'BO' });

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
    } catch (e) {}
    return INITIAL_PROJECTS;
  });

  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_activities_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_RECENT_ACTIVITIES;
  });

  const [timesheetRows, setTimesheetRows] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_timesheet_rows_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_TIMESHEET_ROWS;
  });

  const [todayTotalHours, setTodayTotalHours] = useState(0);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Persist registered users and auth state
  useEffect(() => {
    try {
      localStorage.setItem('clockodo_registered_users_v2', JSON.stringify(usersList));
    } catch (e) {}
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
    } catch (e) {}
  }, [currentUser]);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('clockodo_projects', JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      if (Array.isArray(activities) && activities.length > 0) {
        localStorage.setItem('clockodo_activities_v2', JSON.stringify(activities));
      }
    } catch (e) {}
  }, [activities]);

  useEffect(() => {
    try {
      localStorage.setItem('clockodo_timesheet_rows_v2', JSON.stringify(timesheetRows));
    } catch (e) {}
  }, [timesheetRows]);

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
    } catch (e) {}
    setActivePage('dashboard');
  };

  const handleRegister = (newUser) => {
    setUsersList(prev => [...prev, newUser]);
    try {
      localStorage.setItem('clockodo_registered_users_v3', JSON.stringify([...usersList, newUser]));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('clockodo_session_user');
      localStorage.removeItem('clockodo_auth_user_v3');
      localStorage.removeItem('clockodo_auth_user_v2');
      localStorage.removeItem('clockodo_auth_user_v1');
    } catch (e) {}
    setActivePage('dashboard');
  };

  const handleUpdateCurrentUser = (updatedUser) => {
    if (!updatedUser) return;
    setCurrentUser(prev => {
      const merged = { ...prev, ...updatedUser };
      try {
        localStorage.setItem('clockodo_session_user', JSON.stringify(merged));
        localStorage.setItem('clockodo_auth_user_v3', JSON.stringify(merged));
      } catch (e) {}
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
        localStorage.setItem('clockodo_registered_users_v3', JSON.stringify(next));
      } catch (e) {}
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

  // Real-time stopwatch ticker
  useEffect(() => {
    let interval = null;
    if (activeTimer.isRunning) {
      interval = setInterval(() => {
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
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayObj = new Date(y, m - 1, d);
      const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      return keys[dayObj.getDay()];
    }
    if (!group) return 'tue';
    const g = group.toLowerCase();
    if (g.includes('today') || g.includes('sep 1')) return 'tue';
    if (g.includes('yesterday') || g.includes('aug 31')) return 'mon';
    if (g.includes('mon')) return 'mon';
    if (g.includes('tue')) return 'tue';
    if (g.includes('wed')) return 'wed';
    if (g.includes('thu')) return 'thu';
    if (g.includes('fri')) return 'fri';
    if (g.includes('sat')) return 'sat';
    if (g.includes('sun')) return 'sun';
    return 'tue';
  };

  // State for Calendar Schedule
  const [calendarSchedule, setCalendarSchedule] = useState(CALENDAR_WEEK_SCHEDULE);

  const getActivityDate = (act) => {
    if (!act) return '';
    if (act.date && typeof act.date === 'string') {
      const trimmed = act.date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      if (trimmed.includes('T')) return trimmed.split('T')[0];
    }
    const g = (((act.group || '') + ' ' + (act.date || '')).toLowerCase());
    if (g.includes('today') || g.includes('sep 8') || g.includes('sep 08') || g.includes('tue')) return '2026-09-08';
    if (g.includes('yesterday') || g.includes('sep 7') || g.includes('sep 07') || g.includes('mon')) return '2026-09-07';
    if (g.includes('sep 13')) return '2026-09-13';
    if (g.includes('sep 12')) return '2026-09-12';
    if (g.includes('sep 11') || g.includes('fri')) return '2026-09-11';
    if (g.includes('sep 10') || g.includes('thu')) return '2026-09-10';
    if (g.includes('sep 9') || g.includes('sep 09') || g.includes('wed')) return '2026-09-09';
    if (g.includes('sep 4') || g.includes('sep 04')) return '2026-09-04';
    if (g.includes('sep 3') || g.includes('sep 03')) return '2026-09-03';
    if (g.includes('sep 2') || g.includes('sep 02')) return '2026-09-02';
    if (g.includes('sep 1') || g.includes('sep 01')) return '2026-09-01';
    if (g.includes('aug 31') || g.includes('31')) return '2026-08-31';
    if (/aug(ust)?\s*28|\b28\b/i.test(g)) return '2026-08-28';
    if (/aug(ust)?\s*27|\b27\b/i.test(g)) return '2026-08-27';
    if (/aug(ust)?\s*26|\b26\b/i.test(g)) return '2026-08-26';
    if (/aug(ust)?\s*25|\b25\b/i.test(g)) return '2026-08-25';
    if (/aug(ust)?\s*24|\b24\b/i.test(g)) return '2026-08-24';
    if (/aug(ust)?\s*17|\b17\b/i.test(g)) return '2026-08-17';
    return '2026-09-08';
  };

  const getWeekISODates = (weekOffset = 0) => {
    const baseDate = new Date(2026, 8, 8); // Active anchor date: Tue, Sep 8, 2026 (Today)
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
      computedISO = getActivityDate({ group: entry.group, date: entry.date }) || '2026-09-08';
    }

    const dayKey = getDayKeyFromGroup(entry.group, computedISO);

    const newAct = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      project: entry.project || 'General Task',
      projectColor: entry.projectColor || '#10b981',
      description: entry.description || 'Tracked session',
      group: entry.group || 'Today',
      date: computedISO,
      startTime: entry.startTime || '09:00 AM',
      endTime: entry.endTime || '05:00 PM',
      durationSeconds: durSec,
      durationFormatted: formattedDuration,
      billable: entry.billable !== undefined ? entry.billable : true,
      status: 'Completed',
      userEmail: currentUser?.email,
      userName: currentUser?.name || 'Bharath (Owner)',
      userId: currentUser?.id,
    };

    // 1. Update Time Tracker Activities & MySQL
    setActivities((prev) => [newAct, ...(prev || [])]);
    api.addActivity(newAct).catch(() => {});

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
        api.syncTimesheets(updated).catch(() => {});
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
        api.syncTimesheets(updated).catch(() => {});
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
    setActivities((prev) => prev.filter((a) => a.id !== actId));
    api.deleteActivity(actId).catch(e => console.warn('Backend sync failed:', e));
  };

  const handleUpdateActivity = (actId, updates) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode. Adding new time entries, creating projects, starting timers, and making workspace changes are restricted to authorized accounts. Please sign in as an Admin or Staff member.'
      });
      return;
    }
    if (!actId || !updates) return;

    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === actId) {
          return {
            ...a,
            ...updates,
          };
        }
        return a;
      })
    );

    api.updateActivity(actId, updates).catch((e) => console.warn('Backend sync failed for updateActivity:', e));
  };

  const handleUpdateActivityDate = (actId, newISODate, newGroupLabel) => {
    if (isGuestSession || !currentUser || currentUser.role === 'guest') {
      setGuestDeniedModal({
        title: 'Action Restricted: Sign In Required',
        subtitle: 'Read-Only Guest Mode Active',
        message: 'You are currently viewing in Read-Only Guest Mode.'
      });
      return;
    }
    if (!actId) return;

    setActivities((prev) =>
      prev.map((a) => {
        if (a.id === actId) {
          return {
            ...a,
            date: newISODate,
            group: newGroupLabel,
          };
        }
        return a;
      })
    );

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
        if (a.id) api.deleteActivity(a.id).catch(() => {});
      });

      return prev.filter((a) => !toDelete.some((d) => d.id === a.id));
    });

    // 2. Also remove or clear from timesheetRows
    setTimesheetRows((prev) => {
      const updated = prev.filter(
        (r) => (r.projectName || '').trim().toLowerCase() !== cleanProjName
      );
      api.syncTimesheets(updated).catch(() => {});
      return updated;
    });

    // 3. Delete from backend database
    api.deleteProjectActivities(projectName).catch(() => {});
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
              }).catch(() => {});
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
      const existingActs = prev.filter((a) => {
        const matchProj = (a.project || '').trim().toLowerCase() === projectName.trim().toLowerCase();
        const matchDate = a.date ? a.date === targetISO : false;
        return matchProj && matchDate;
      });

      if (isCleared) {
        // Delete activities for this project and date
        existingActs.forEach((a) => {
          if (a.id) api.deleteActivity(a.id).catch(() => {});
        });
        return prev.filter((a) => !existingActs.some((e) => e.id === a.id));
      }

      if (existingActs.length > 0) {
        const primaryId = existingActs[0].id;
        const extraIds = existingActs.slice(1).map((e) => e.id);
        extraIds.forEach((id) => api.deleteActivity(id).catch(() => {}));

        api.updateActivity(primaryId, {
          durationFormatted: formattedDuration,
          durationSeconds: durSec,
        }).catch(() => {});

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
          userEmail: userEmail || currentUser?.email,
          userName: userName || currentUser?.name,
          userId: userId || currentUser?.id,
        };

        api.addActivity(newAct).catch(() => {});
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
        api.syncTimesheets(updated).catch(() => {});
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
    const duplicated = {
      ...act,
      id: `act-${Date.now()}`,
      group: 'Today',
      startTime: getCurrentTimeFormatted(),
      endTime: getCurrentTimeFormatted(),
    };
    setActivities((prev) => [duplicated, ...prev]);
  };

  const handleStopTimer = () => {
    const duration = activeTimer.elapsedSeconds;
    if (duration > 0) {
      const formatted = formatSecondsToHMS(duration);
      handleAddManualEntry({
        project: activeTimer.projectName || 'General Task',
        projectColor: activeTimer.projectColor || '#10b981',
        description: activeTimer.taskDescription || 'Working session',
        group: 'Today',
        date: '2026-09-08',
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
          activities={activities}
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
              activities={activities}
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
              activities={activities}
              onAddManualEntry={handleAddManualEntry}
              onCreateProject={handleCreateProject}
              searchQuery={globalSearchQuery}
              activeTimer={activeTimer}
              onStartTimer={handleStartTimer}
              onStopTimer={handleStopTimer}
              onDeleteActivity={handleDeleteActivity}
              onDuplicateActivity={handleDuplicateActivity}
              onUpdateActivityDate={handleUpdateActivityDate}
            />
          )}

          {!sharedToken && activePage === 'calendar' && (
            <CalendarPage
              calendarSchedule={calendarSchedule}
              onUpdateCalendarSchedule={setCalendarSchedule}
              activeTimer={activeTimer}
              activities={activities}
              timesheetRows={timesheetRows}
              projects={projects}
              onAddManualEntry={handleAddManualEntry}
              onDeleteCalendarEntry={handleDeleteCalendarEntry}
            />
          )}

          {!sharedToken && activePage === 'dashboard' && (
            <DashboardPage
              timesheetRows={timesheetRows}
              activities={activities}
              projects={projects}
              usersList={usersList}
              currentUser={effectiveUser}
            />
          )}

          {!sharedToken && activePage === 'reports' && (
            <ReportsPage
              timesheetRows={timesheetRows}
              activities={activities}
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
              activities={activities}
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
    </div>
  );
}

export default App;