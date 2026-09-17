import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  Printer,
  ChevronRight, 
  Share2, 
  SlidersHorizontal, 
  Calendar, 
  ChevronDown, 
  Filter, 
  Download, 
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Clock,
  X,
  AlertCircle,
  Plus,
  Copy,
  ExternalLink,
  Globe,
  Lock,
  Trash2,
  Eye,
  Check
} from 'lucide-react';
import ReportsFilterDropdown from '../components/ReportsFilterDropdown';
import { REPORTS_DATA, INITIAL_PROJECTS, USER_PROFILE } from '../data/mockData';

const WEEK_DAYS_META = [
  { key: 'mon', label: 'Mon, Aug 31', dayNum: 31 },
  { key: 'tue', label: 'Tue, Sep 1', dayNum: 1 },
  { key: 'wed', label: 'Wed, Sep 2', dayNum: 2 },
  { key: 'thu', label: 'Thu, Sep 3', dayNum: 3 },
  { key: 'fri', label: 'Fri, Sep 4', dayNum: 4 },
  { key: 'sat', label: 'Sat, Sep 5', dayNum: 5 },
  { key: 'sun', label: 'Sun, Sep 6', dayNum: 6 },
];

const FILTER_TASKS = [
  'Development',
  'UI/UX Design',
  'Bug Fixing & QA',
  'API Integration',
  'Code Review',
  'Client Meetings',
  'Documentation'
];

const FILTER_TAGS = [
  '#Frontend',
  '#Backend',
  '#UI/UX',
  '#BugFix',
  '#Meetings',
  '#Urgent'
];

const FILTER_KIOSKS = [
  'Main Office HQ',
  'Remote Terminal',
  'Field Ops Kiosk',
  'Mobile Clock-In'
];

const FILTER_DESCRIPTIONS = [
  'Dashboard UI Fixes',
  'API Authentication',
  'Weekly Standup Meeting',
  'Bug Fixes & Refactoring',
  'Client Review'
];

function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
  return 0;
}

function formatSecondsToHMS(sec) {
  if (sec <= 0 || isNaN(sec)) return '00:00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function parse12hTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?/i);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const s = match[3] ? parseInt(match[3], 10) : 0;
  const ampm = match[4] ? match[4].toUpperCase() : null;

  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  
  return h * 3600 + m * 60 + s;
}

function formatSecondsTo12h(sec) {
  if (sec === null || sec === undefined || isNaN(sec)) return '-';
  let totalSec = Math.floor(sec) % (24 * 3600);
  if (totalSec < 0) totalSec += 24 * 3600;
  
  let hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  
  const hStr = String(h12).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  
  return `${hStr}:${mStr} ${ampm}`;
}

function formatClockInInput(val, prevVal = '') {
  if (!val) return '';
  if (prevVal && val.length < prevVal.length) return val;
  
  let clean = val.replace(/[^0-9a-zA-Z:]/g, '');
  const hasPM = /pm/i.test(clean);
  const hasAM = /am/i.test(clean);
  const digits = clean.replace(/[^0-9]/g, '');

  if (digits.length === 0) return '';
  
  if (digits.length === 1) {
    const d = parseInt(digits, 10);
    if (d >= 3) return `0${d}:`;
    return digits;
  }

  if (digits.length === 2) {
    let h = parseInt(digits, 10);
    if (h > 23) h = 23;
    const hStr = String(h).padStart(2, '0');
    return `${hStr}:`;
  }

  if (digits.length >= 3) {
    let h = parseInt(digits.substring(0, 2), 10);
    let m = digits.substring(2, 4);
    if (h > 23) h = 23;
    let mInt = parseInt(m, 10);
    if (m.length === 2 && mInt > 59) m = '59';

    let suffix = '';
    if (hasPM) suffix = ' PM';
    else if (hasAM) suffix = ' AM';
    else if (digits.length >= 4) {
      if (h >= 1 && h <= 7) suffix = ' PM';
      else if (h >= 8 && h <= 11) suffix = ' AM';
      else if (h === 12) suffix = ' PM';
      else if (h > 12) {
        h = h - 12;
        suffix = ' PM';
      } else {
        suffix = ' AM';
      }
    }

    const hStr = String(h).padStart(2, '0');
    if (digits.length >= 4) {
      return `${hStr}:${m}${suffix}`;
    }
    return `${hStr}:${m}`;
  }
  return clean;
}

function calcAutoClockOut(clockInStr, taskDurationStr = '07:45:00', breakStr = '00:45:00') {
  if (!clockInStr || clockInStr === '-' || clockInStr === '—') return '-';
  const inSec = parse12hTimeToSeconds(clockInStr);
  if (inSec === null) return '-';
  const taskSec = parseTimeToSeconds(taskDurationStr) || 27900;
  const breakSec = parseTimeToSeconds(breakStr) || 2700;
  const outSec = (inSec + taskSec + breakSec) % (24 * 3600);
  return formatSecondsTo12h(outSec);
}

function roundTo15Minutes(sec) {
  const mins = sec / 60;
  const roundedMins = Math.ceil(mins / 15) * 15;
  return roundedMins * 60;
}

function computeAttendanceStatus(clockIn, taskDurationStr = '00:00:00') {
  if (!clockIn || clockIn === '—' || clockIn === '-') return 'On Leave';
  const taskSec = parseTimeToSeconds(taskDurationStr);
  if (taskSec <= 0) return 'On Leave';
  
  // Rule 1: ≥ 5 hours of daily task work => Fully Present
  if (taskSec >= 5 * 3600) {
    return 'Present (On-Time)';
  }
  
  // Rule 2: 3 hours to < 5 hours => Half Leave
  if (taskSec >= 3 * 3600) {
    return 'Half Day';
  }
  
  // Rule 3: > 0 to < 3 hours => Active (Working)
  return 'Active (Working)';
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function normalizeDateToYMD(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{1,2})(?:[a-z]{2})?[\s,]+(\d{4})/i);
  if (m) {
    const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
    const mon = monthMap[m[1].toLowerCase().slice(0, 3)] || '09';
    const day = m[2].padStart(2, '0');
    const year = m[3];
    return `${year}-${mon}-${day}`;
  }
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  } catch (e) {}
  return s;
}

function parseReportDateRange(rangeStr) {
  if (!rangeStr) {
    return { start: '2026-08-31', end: '2026-09-06', label: rangeStr, type: 'week', isSingleDay: false };
  }
  const s = rangeStr.trim();

  // 1. Single day explicit: "Sep 7, 2026", "Sep 12, 2026", "August 31, 2026"
  const singleDateMatch = s.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s*(\d{4})?$/i);
  if (singleDateMatch) {
    const ymd = normalizeDateToYMD(s.includes('2026') ? s : `${s}, 2026`);
    return { start: ymd, end: ymd, label: s, type: 'day', isSingleDay: true };
  }

  // 2. "Today (Sat, Sep 12)" or "Yesterday (Fri, Sep 11)"
  if (/^today/i.test(s)) {
    const today = new Date();
    const ymd = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    return { start: ymd, end: ymd, label: s, type: 'day', isSingleDay: true };
  }
  if (/^yesterday/i.test(s)) {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const ymd = yest.getFullYear() + '-' + String(yest.getMonth() + 1).padStart(2, '0') + '-' + String(yest.getDate()).padStart(2, '0');
    return { start: ymd, end: ymd, label: s, type: 'day', isSingleDay: true };
  }

  // 3. Week range: "This week (Aug 31 - Sep 6)", "Last week (Aug 24 - Aug 30)", "Sep 7 - 13", "Aug 31 - Sep 6"
  const weekMatch = s.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})\s*-\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\s*(\d{1,2})/i);
  if (weekMatch) {
    const m1 = weekMatch[1];
    const d1 = weekMatch[2];
    const m2 = weekMatch[3] || m1;
    const d2 = weekMatch[4];
    const startYmd = normalizeDateToYMD(`${m1} ${d1}, 2026`);
    const endYmd = normalizeDateToYMD(`${m2} ${d2}, 2026`);
    return { start: startYmd, end: endYmd, label: s, type: 'week', isSingleDay: false };
  }

  // 4. Month range: "This month (September 2026)", "Last month (August 2026)", "September 2026"
  const monthMatch = s.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})?/i);
  if (monthMatch) {
    const mName = monthMatch[1];
    const year = parseInt(monthMatch[2] || '2026', 10);
    const mIndex = MONTH_NAMES_FULL.findIndex(m => m.toLowerCase() === mName.toLowerCase());
    if (mIndex >= 0) {
      const start = `${year}-${String(mIndex + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(year, mIndex + 1, 0).getDate();
      const end = `${year}-${String(mIndex + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      return { start, end, label: s, type: 'month', isSingleDay: false };
    }
  }

  return { start: '2026-08-31', end: '2026-09-06', label: rangeStr, type: 'week', isSingleDay: false };
}

function shiftDateRange(currentRangeStr, direction) {
  const parsed = parseReportDateRange(currentRangeStr);
  const startDt = new Date(parsed.start + 'T00:00:00');
  
  if (parsed.type === 'day') {
    startDt.setDate(startDt.getDate() + direction);
    const mShort = MONTH_NAMES_SHORT[startDt.getMonth()];
    const d = startDt.getDate();
    const y = startDt.getFullYear();
    return `${mShort} ${d}, ${y}`;
  }

  if (parsed.type === 'month') {
    startDt.setMonth(startDt.getMonth() + direction);
    const mFull = MONTH_NAMES_FULL[startDt.getMonth()];
    const y = startDt.getFullYear();
    return `${mFull} ${y}`;
  }

  // Week shift (7 days)
  startDt.setDate(startDt.getDate() + (direction * 7));
  const endDt = new Date(startDt);
  endDt.setDate(endDt.getDate() + 6);

  const m1 = MONTH_NAMES_SHORT[startDt.getMonth()];
  const d1 = startDt.getDate();
  const m2 = MONTH_NAMES_SHORT[endDt.getMonth()];
  const d2 = endDt.getDate();

  const rangeLabel = m1 === m2 ? `${m1} ${d1} - ${d2}` : `${m1} ${d1} - ${m2} ${d2}`;
  return rangeLabel;
}

function getWeekDaysFromStart(startDateStr) {
  const dt = new Date(startDateStr + 'T00:00:00');
  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(dt);
    cur.setDate(cur.getDate() + i);
    const dayName = DAY_NAMES_SHORT[cur.getDay()];
    const mShort = MONTH_NAMES_SHORT[cur.getMonth()];
    const d = cur.getDate();
    const ymd = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    days.push({
      key: keys[cur.getDay()],
      dayNum: d,
      dateStr: ymd,
      label: `${dayName}, ${mShort} ${d}`,
      shortLabel: `${dayName} ${d}`
    });
  }
  return days;
}

function getDayKeyFromDate(dateStr) {
  if (!dateStr) return 'mon';
  const ymd = normalizeDateToYMD(dateStr);
  if (ymd && /^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const dt = new Date(ymd + 'T00:00:00');
    if (!isNaN(dt.getTime())) {
      const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      return keys[dt.getDay()];
    }
  }
  return 'mon';
}

export default function ReportsPage({
  timesheetRows = [],
  activities = [],
  projects = INITIAL_PROJECTS,
  currentUser = null,
  usersList = []
}) {
  const [activeSubtab, setActiveSubtab] = useState('Summary');

  // Attendance Date Navigation State (defaults to Today e.g. 2026-09-11)
  const [attendanceDate, setAttendanceDate] = useState(() => {
    return '2026-09-11';
  });

  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return 'Today (Fri, Sep 11, 2026)';
    const parts = isoStr.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = days[d.getDay()] || 'Fri';
      const monthName = months[d.getMonth()] || 'Sep';
      const dayNum = parts[2];
      const year = parts[0];
      const isToday = isoStr === '2026-09-11';
      return `${isToday ? 'Today (' : ''}${dayName}, ${monthName} ${dayNum}, ${year}${isToday ? ')' : ''}`;
    }
    return isoStr;
  };

  const handlePrevDay = () => {
    setAttendanceDate(prev => {
      const parts = prev.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2] - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    });
  };

  const handleNextDay = () => {
    setAttendanceDate(prev => {
      const parts = prev.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2] + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    });
  };

  const handleTodayClick = () => {
    setAttendanceDate('2026-09-11');
  };
  const subtabs = ['Summary', 'Detailed', 'Weekly', 'Shared'];

  const [roundingEnabled, setRoundingEnabled] = useState(false);

  // Admin Editable Attendance Overrides state
  const [attendanceOverrides, setAttendanceOverrides] = useState(() => {
    try {
      localStorage.removeItem('clockodo_attendance_overrides');
      return {};
    } catch (e) {
      return {};
    }
  });

  const calcShiftDuration = (inStr, outStr, breakStr = '00:45:00') => {
    if (!inStr || !outStr || inStr === '-' || outStr === '-') return '00:00:00';
    const parseTime = (t) => {
      const m = t.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?/i);
      if (!m) return null;
      let h = parseInt(m[1], 10);
      const min = parseInt(m[2], 10);
      const ampm = m[3] ? m[3].toUpperCase() : null;
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 3600 + min * 60;
    };
    const inSec = parseTime(inStr);
    const outSec = parseTime(outStr);
    if (inSec === null || outSec === null) return '00:00:00';
    let diff = outSec - inSec;
    if (diff < 0) diff += 24 * 3600;
    const bSec = parseTimeToSeconds(breakStr) || 2700;
    const netSec = Math.max(0, diff - bSec);
    return formatSecondsToHMS(netSec);
  };

        const handleUpdateAttendance = (logId, field, value, defaultTaskDuration = '07:45:00', defaultBreak = '00:45:00') => {
    setAttendanceOverrides(prev => {
      const current = prev[logId] || {};
      const updatedItem = { ...current };

      if (field === 'clockIn') {
        const formattedIn = formatClockInInput(value, current.clockIn || '');
        updatedItem.clockIn = formattedIn;
      } else if (field === 'breakTime') {
        updatedItem.breakTime = value;
      }

      const newOverrides = { ...prev, [logId]: updatedItem };
      try {
        localStorage.setItem('clockodo_attendance_overrides', JSON.stringify(newOverrides));
      } catch (e) {}
      return newOverrides;
    });
  };

  // Date selection state
  const [selectedRange, setSelectedRange] = useState('This week (Aug 31 - Sep 6)');
  const [appliedRange, setAppliedRange] = useState('This week (Aug 31 - Sep 6)');
  
  // Exact Clockify Filter States (Multi-select arrays):
  // FILTER | Team | Client | Project | Task | Tag | Status | Description | Kiosk
  const ALL_FILTER_CATEGORIES = [
    { id: 'Client', name: 'Client' },
    { id: 'Description', name: 'Description' },
    { id: 'Kiosk', name: 'Kiosk' },
    { id: 'Project', name: 'Project' },
    { id: 'Status', name: 'Status' },
    { id: 'Tag', name: 'Tag' },
    { id: 'Task', name: 'Task' },
    { id: 'Team', name: 'Team' },
  ];

  const [visibleFilterPills, setVisibleFilterPills] = useState([
    'Team', 'Client', 'Project', 'Task', 'Tag', 'Status', 'Description', 'Kiosk'
  ]);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Selected filter states (pending until Apply is clicked)
  const [selectedTeamFilter, setSelectedTeamFilter] = useState([]);
  const [appliedTeam, setAppliedTeam] = useState([]);

  const [selectedClientFilter, setSelectedClientFilter] = useState([]);
  const [appliedClient, setAppliedClient] = useState([]);

  const [selectedProjectFilter, setSelectedProjectFilter] = useState([]);
  const [appliedProject, setAppliedProject] = useState([]);

  const [selectedTaskFilter, setSelectedTaskFilter] = useState([]);
  const [appliedTask, setAppliedTask] = useState([]);

  const [selectedTagFilter, setSelectedTagFilter] = useState([]);
  const [appliedTag, setAppliedTag] = useState([]);

  const [selectedStatusFilter, setSelectedStatusFilter] = useState([]);
  const [appliedStatus, setAppliedStatus] = useState([]);

  const [selectedDescFilter, setSelectedDescFilter] = useState([]);
  const [appliedDesc, setAppliedDesc] = useState([]);

  const [selectedKioskFilter, setSelectedKioskFilter] = useState([]);
  const [appliedKiosk, setAppliedKiosk] = useState([]);

  // Filter Categories data sources
  const teamFilterGroups = useMemo(() => {
    const defaultTeam = [
      { id: 'usr-1', name: 'Bharath (Owner)', role: 'Admin (Owner)', department: 'Management', active: true, avatarColor: '#10b981', avatarInitials: 'BO' },
      { id: 'usr-2', name: 'anbu', role: 'Full Stack', department: 'Full Stack', active: true, avatarColor: '#14b8a6', avatarInitials: 'AN' },
      { id: 'usr-3', name: 'Muthu', role: 'Frontend Dev', department: 'Frontend Dev', active: true, avatarColor: '#ec4899', avatarInitials: 'MU' },
      { id: 'usr-4', name: 'mani', role: 'Design & UI', department: 'Design & UI', active: true, avatarColor: '#3b82f6', avatarInitials: 'MA' },
      { id: 'usr-5', name: 'sivanparu', role: 'QA & Testing', department: 'QA & Testing', active: true, avatarColor: '#f59e0b', avatarInitials: 'SI' }
    ];

    const source = usersList && usersList.length > 0 ? usersList : defaultTeam;

    const activeUsers = source.filter(u => Boolean(u.active) || u.role === 'admin' || u.accessGranted === true).map(u => ({
      id: u.name || u.username || u.email,
      name: u.name || u.username || u.email,
      status: 'Active'
    }));

    const pendingUsers = source.filter(u => !Boolean(u.active) && u.role !== 'admin' && !u.accessGranted).map(u => ({
      id: u.name || u.username || u.email,
      name: u.name || u.username || u.email,
      status: 'Inactive'
    }));

    return [
      {
        title: 'GROUPS',
        items: [
          { id: 'active-only', name: 'All Active Employees', status: 'Active' },
          { id: 'pending-only', name: 'Pending Access Requests', status: 'Inactive' }
        ]
      },
      {
        title: 'ACTIVE TEAM MEMBERS',
        items: activeUsers
      },
      ...(pendingUsers.length > 0 ? [{
        title: 'PENDING APPROVAL',
        items: pendingUsers
      }] : [])
    ];
  }, [usersList]);

  const clientFilterItems = useMemo(() => [
    { id: 'A2z4r Ventures', name: 'A2z4r Ventures' },
    { id: 'JRKS Fleet Corp', name: 'JRKS Fleet Corp' },
    { id: 'Selva FinTech Ltd', name: 'Selva FinTech Ltd' },
    { id: 'DigiPlus Agency HQ', name: 'DigiPlus Agency HQ' },
    { id: 'Alpha Global Corp', name: 'Alpha Global Corp' },
    { id: 'Beta Logistics LLC', name: 'Beta Logistics LLC' },
    { id: 'Omni Telematics', name: 'Omni Telematics' },
    { id: 'Gamma Retail Group', name: 'Gamma Retail Group' },
    { id: 'Nexus Logistics Global', name: 'Nexus Logistics Global' }
  ], []);

  const projectFilterItems = useMemo(() => {
    return (projects || []).map(p => ({
      id: p.name,
      name: p.name,
      color: p.color || '#10b981'
    }));
  }, [projects]);

  const projectFilterGroups = useMemo(() => {
    return [
      {
        title: 'PROJECTS',
        items: (projects || []).map(p => ({
          id: p.name,
          name: p.name,
          color: p.color || '#10b981'
        }))
      }
    ];
  }, [projects]);

  // Dynamic Task Filter Groups: Real Tasks categorized under Time Tracker / Workspace Projects
  const taskFilterGroups = useMemo(() => {
    const projectMap = new Map();

    (projects || []).forEach(p => {
      if (p && p.name) {
        projectMap.set(p.name, {
          title: `PROJECT: ${p.name.toUpperCase()}`,
          tasks: new Set()
        });
      }
    });

    (activities || []).forEach(act => {
      const pName = act.project || 'General / No Project';
      const taskVal = (act.task || act.description || '').trim();

      if (taskVal) {
        if (!projectMap.has(pName)) {
          projectMap.set(pName, {
            title: pName === 'General / No Project' ? 'GENERAL TASKS' : `PROJECT: ${pName.toUpperCase()}`,
            tasks: new Set()
          });
        }
        projectMap.get(pName).tasks.add(taskVal);
      }
    });

    (timesheetRows || []).forEach(ts => {
      const pName = ts.projectName || ts.project || 'General / No Project';
      const taskVal = (ts.task || ts.description || ts.taskDescription || '').trim();
      if (taskVal) {
        if (!projectMap.has(pName)) {
          projectMap.set(pName, {
            title: pName === 'General / No Project' ? 'GENERAL TASKS' : `PROJECT: ${pName.toUpperCase()}`,
            tasks: new Set()
          });
        }
        projectMap.get(pName).tasks.add(taskVal);
      }
    });

    const result = [];
    projectMap.forEach((val, pName) => {
      const taskList = Array.from(val.tasks);
      const items = taskList.length > 0
        ? taskList.map(t => ({ id: t, name: t }))
        : [{ id: `${pName} - General Work`, name: 'General Work' }];

      result.push({
        title: val.title,
        items
      });
    });

    return result.length > 0 ? result : [
      {
        title: 'GENERAL TASKS',
        items: [{ id: 'General Work', name: 'General Work' }]
      }
    ];
  }, [projects, activities, timesheetRows]);

  const tagFilterItems = useMemo(() => [
    { id: '#Frontend', name: '#Frontend' },
    { id: '#Backend', name: '#Backend' },
    { id: '#UI/UX', name: '#UI/UX' },
    { id: '#BugFix', name: '#BugFix' },
    { id: '#Meetings', name: '#Meetings' },
    { id: '#Urgent', name: '#Urgent' },
  ], []);

  const statusFilterItems = useMemo(() => [
    { id: 'Billable', name: 'Billable' },
    { id: 'Non-Billable', name: 'Non-Billable' }
  ], []);

  const descFilterItems = useMemo(() => [
    { id: 'Dashboard UI Fixes', name: 'Dashboard UI Fixes' },
    { id: 'API Authentication', name: 'API Authentication' },
    { id: 'Weekly Standup Meeting', name: 'Weekly Standup Meeting' },
    { id: 'Bug Fixes & Refactoring', name: 'Bug Fixes & Refactoring' },
    { id: 'Client Review', name: 'Client Review' },
    { id: 'Testing invoice generator', name: 'Testing invoice generator' }
  ], []);

  const kioskFilterItems = useMemo(() => [
    { id: 'Main Office HQ', name: 'Main Office HQ' },
    { id: 'Remote Terminal', name: 'Remote Terminal' },
    { id: 'Field Ops Kiosk', name: 'Field Ops Kiosk' },
    { id: 'Mobile Clock-In', name: 'Mobile Clock-In' }
  ], []);

  // Group by controls: Group by: [Project ▾] [Date ▾]
  const [groupByPrimary, setGroupByPrimary] = useState('Project');
  const [groupBySecondary, setGroupBySecondary] = useState('Date');
  const [expandedGroupIds, setExpandedGroupIds] = useState({});

  const toggleExpandGroup = (groupId) => {
    setExpandedGroupIds(prev => ({
      ...prev,
      [groupId]: prev[groupId] === undefined ? false : !prev[groupId]
    }));
  };

  // Unique clients from projects
  const uniqueClients = useMemo(() => {
    const clients = new Set();
    (projects || []).forEach(p => {
      if (p.client && p.client !== '—') clients.add(p.client);
    });
    return Array.from(clients);
  }, [projects]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const datePickerRef = useRef(null);
  const exportMenuRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Apply and Reset handlers
  const handleApplyFilter = () => {
    setAppliedTeam(selectedTeamFilter);
    setAppliedClient(selectedClientFilter);
    setAppliedProject(selectedProjectFilter);
    setAppliedTask(selectedTaskFilter);
    setAppliedTag(selectedTagFilter);
    setAppliedStatus(selectedStatusFilter);
    setAppliedDesc(selectedDescFilter);
    setAppliedKiosk(selectedKioskFilter);
    setToastMessage('Filters applied successfully!');
    setTimeout(() => setToastMessage(''), 2500);
    setOpenDropdown(null);
  };

  const handleResetFilters = () => {
    setSelectedTeamFilter([]);
    setAppliedTeam([]);
    setSelectedClientFilter([]);
    setAppliedClient([]);
    setSelectedProjectFilter([]);
    setAppliedProject([]);
    setSelectedTaskFilter([]);
    setAppliedTask([]);
    setSelectedTagFilter([]);
    setAppliedTag([]);
    setSelectedStatusFilter([]);
    setAppliedStatus([]);
    setSelectedDescFilter([]);
    setAppliedDesc([]);
    setSelectedKioskFilter([]);
    setAppliedKiosk([]);
    setSelectedRange('This week (Aug 31 - Sep 6)');
    setAppliedRange('This week (Aug 31 - Sep 6)');
    setToastMessage('All filters have been reset.');
    setTimeout(() => setToastMessage(''), 2500);
  };

  // 1. Workspace Filtered Activities across all team members & date range
  const scopedActivities = useMemo(() => {
    let acts = activities || [];

    // Date Range Filter
    const parsedRange = parseReportDateRange(appliedRange);
    acts = acts.filter(a => {
      const ymd = normalizeDateToYMD(a.date);
      if (ymd) {
        return ymd >= parsedRange.start && ymd <= parsedRange.end;
      }
      return true;
    });

    if (appliedTeam && appliedTeam.length > 0) {
      acts = acts.filter(a => {
        const u = (a.user || a.userName || a.userEmail || '').toLowerCase();
        return appliedTeam.some(t => {
          const tLower = t.toLowerCase();
          if (tLower === 'active-only') return true;
          if (tLower === 'pending-only') return false;
          return u.includes(tLower) || tLower.includes(u);
        });
      });
    }

    return acts.filter(a => {
      // Project Filter
      if (appliedProject && appliedProject.length > 0) {
        const hasWithout = appliedProject.includes('without-project');
        const matchesProj = appliedProject.includes(a.project);
        const matchesWithout = hasWithout && (!a.project || a.project === 'No Project');
        if (!matchesProj && !matchesWithout) return false;
      }
      // Client Filter
      if (appliedClient && appliedClient.length > 0) {
        const pObj = (projects || []).find(p => p.name === a.project);
        const clientName = pObj?.client || a.client || '';
        const hasWithout = appliedClient.includes('without-client');
        const matchesClient = appliedClient.includes(clientName);
        const matchesWithout = hasWithout && (!clientName || clientName === '—' || clientName === 'No Client');
        if (!matchesClient && !matchesWithout) return false;
      }
      // Status Filter
      if (appliedStatus && appliedStatus.length > 0) {
        const isBill = a.billable !== false;
        const hasBillable = appliedStatus.includes('Billable');
        const hasNonBillable = appliedStatus.includes('Non-Billable');
        if (hasBillable && !hasNonBillable && !isBill) return false;
        if (hasNonBillable && !hasBillable && isBill) return false;
      }
      // Task Filter (matches description or task name)
      if (appliedTask && appliedTask.length > 0) {
        const descText = (a.description || '').toLowerCase();
        const taskText = (a.task || '').toLowerCase();
        const hasWithout = appliedTask.includes('without-task');
        const matchesTask = appliedTask.some(t => {
          const tLower = t.toLowerCase();
          return descText.includes(tLower) || taskText.includes(tLower) || tLower.includes('general work');
        });
        if (!matchesTask && !hasWithout) return false;
      }
      // Tag Filter
      if (appliedTag && appliedTag.length > 0) {
        const tagArr = Array.isArray(a.tags) ? a.tags : [a.tag || a.tags].filter(Boolean);
        const hasWithout = appliedTag.includes('without-tag');
        const matchesTag = appliedTag.some(t => tagArr.some(at => at.toLowerCase() === t.toLowerCase()));
        const matchesWithout = hasWithout && tagArr.length === 0;
        if (!matchesTag && !matchesWithout) return false;
      }
      // Description Filter
      if (appliedDesc && appliedDesc.length > 0) {
        const descText = (a.description || a.task || '').toLowerCase();
        const hasWithout = appliedDesc.includes('without-desc');
        const matchesDesc = appliedDesc.some(d => descText.includes(d.toLowerCase()));
        const matchesWithout = hasWithout && !descText;
        if (!matchesDesc && !matchesWithout) return false;
      }
      return true;
    });
  }, [activities, appliedRange, appliedTeam, appliedProject, appliedClient, appliedStatus, appliedTask, appliedTag, appliedDesc, projects]);

  // 2. Filter timesheetRows by all active filters
  const filteredRows = useMemo(() => {
    return (timesheetRows || []).filter(r => {
      // 1. Project
      if (appliedProject && appliedProject.length > 0) {
        const hasWithout = appliedProject.includes('without-project');
        const matchesProj = appliedProject.includes(r.projectName);
        const matchesWithout = hasWithout && (!r.projectName || r.projectName === 'No Project');
        if (!matchesProj && !matchesWithout) return false;
      }
      // 2. Client
      if (appliedClient && appliedClient.length > 0) {
        const pObj = (projects || []).find(p => p.name === r.projectName);
        const clientName = pObj?.client || r.client || '';
        const hasWithout = appliedClient.includes('without-client');
        const matchesClient = appliedClient.includes(clientName);
        const matchesWithout = hasWithout && (!clientName || clientName === '—');
        if (!matchesClient && !matchesWithout) return false;
      }
      // 3. Status
      if (appliedStatus && appliedStatus.length > 0) {
        const hasBillable = appliedStatus.includes('Billable');
        const hasNonBillable = appliedStatus.includes('Non-Billable');
        if (hasBillable && !hasNonBillable && r.billable === false) return false;
        if (hasNonBillable && !hasBillable && r.billable !== false) return false;
      }
      // 4. Task
      if (appliedTask && appliedTask.length > 0) {
        const taskText = (r.taskDescription || r.task || r.description || '').toLowerCase();
        const hasWithout = appliedTask.includes('without-task');
        const matchesTask = appliedTask.some(t => taskText.includes(t.toLowerCase()));
        const matchesWithout = hasWithout && !taskText;
        if (!matchesTask && !matchesWithout) return false;
      }
      // 5. Tag
      if (appliedTag && appliedTag.length > 0) {
        const tagArr = Array.isArray(r.tags) ? r.tags : [r.tag || r.tags].filter(Boolean);
        const hasWithout = appliedTag.includes('without-tag');
        const matchesTag = appliedTag.some(t => tagArr.some(at => at.toLowerCase() === t.toLowerCase()));
        const matchesWithout = hasWithout && tagArr.length === 0;
        if (!matchesTag && !matchesWithout) return false;
      }
      // 6. Description
      if (appliedDesc && appliedDesc.length > 0) {
        const descText = (r.taskDescription || r.description || '').toLowerCase();
        const hasWithout = appliedDesc.includes('without-desc');
        const matchesDesc = appliedDesc.some(d => descText.includes(d.toLowerCase()));
        const matchesWithout = hasWithout && !descText;
        if (!matchesDesc && !matchesWithout) return false;
      }
      return true;
    });
  }, [timesheetRows, appliedProject, appliedClient, appliedStatus, appliedTask, appliedTag, appliedDesc, projects]);

  // Dynamic 7-day week metadata based on current appliedRange
  const currentWeekDays = useMemo(() => {
    const parsed = parseReportDateRange(appliedRange);
    return getWeekDaysFromStart(parsed.start);
  }, [appliedRange]);

  // Check if user selected a single specific day
  const singleDayKey = useMemo(() => {
    const parsed = parseReportDateRange(appliedRange);
    if (!parsed.isSingleDay) return null;
    const dt = new Date(parsed.start + 'T00:00:00');
    if (!isNaN(dt.getTime())) {
      const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      return keys[dt.getDay()];
    }
    return null;
  }, [appliedRange]);

  // 3.A Project Breakdown
  const projectBreakdownList = useMemo(() => {
    const projMap = {};
    (projects || []).forEach(p => {
      projMap[p.name] = {
        name: p.name,
        client: p.client && p.client !== '—' ? p.client : 'Direct Client',
        color: p.color || '#10b981',
        totalSec: 0
      };
    });

    if (scopedActivities && scopedActivities.length > 0) {
      scopedActivities.forEach(act => {
        const sec = act.durationSeconds || parseTimeToSeconds(act.durationFormatted);
        const effectiveSec = roundingEnabled ? roundTo15Minutes(sec) : sec;
        const pName = act.project || 'Internal';
        if (!projMap[pName]) {
          projMap[pName] = {
            name: pName,
            client: act.client || 'Direct Client',
            color: act.projectColor || '#10b981',
            totalSec: 0
          };
        }
        projMap[pName].totalSec += effectiveSec;
      });
    } else {
      const parsed = parseReportDateRange(appliedRange);
      const isAug31Sep6Week = (parsed.start <= '2026-09-06' && parsed.end >= '2026-08-31');
      if (isAug31Sep6Week) {
        filteredRows.forEach(row => {
          const pName = row.projectName || 'Internal';
          if (!projMap[pName]) {
            projMap[pName] = {
              name: pName,
              client: row.client || 'Direct Client',
              color: '#10b981',
              totalSec: 0
            };
          }
          if (singleDayKey) {
            const daySec = parseTimeToSeconds(row[singleDayKey]);
            projMap[pName].totalSec += (roundingEnabled ? roundTo15Minutes(daySec) : daySec);
          } else {
            const rowSec = parseTimeToSeconds(row.total);
            projMap[pName].totalSec += (roundingEnabled ? roundTo15Minutes(rowSec) : rowSec);
          }
        });
      }
    }

    let totalSec = 0;
    Object.values(projMap).forEach(p => totalSec += p.totalSec);

    const list = Object.values(projMap).filter(p => p.totalSec > 0).map(p => ({
      id: `proj-${p.name}`,
      name: p.name,
      subtitle: p.client,
      color: p.color,
      totalSec: p.totalSec,
      duration: formatSecondsToHMS(p.totalSec),
      percentage: totalSec > 0 ? ((p.totalSec / totalSec) * 100).toFixed(1) : '0.0'
    }));

    list.sort((a, b) => b.totalSec - a.totalSec);
    return list;
  }, [scopedActivities, filteredRows, singleDayKey, roundingEnabled, projects]);

  const groupedProjectBreakdown = projectBreakdownList;

  // 3.B Dynamic Universal Summary Breakdown Engine (Supports 2-Level Multi-Grouping: Project, User, Date, Task, etc.)
  const getGroupInfo = (act, type) => {
    switch (type) {
      case 'Project': {
        const pName = act.project || 'No Project';
        const pObj = (projects || []).find(p => p.name === act.project);
        return {
          id: `proj-${pName}`,
          name: pName,
          subtitle: pObj?.client && pObj.client !== '—' ? pObj.client : (act.client || 'Internal Project'),
          color: pObj?.color || act.projectColor || '#10b981',
          type: 'project'
        };
      }
      case 'Client': {
        const pObj = (projects || []).find(p => p.name === act.project);
        const cName = pObj?.client && pObj.client !== '—' ? pObj.client : (act.client || 'Direct Client');
        return {
          id: `client-${cName}`,
          name: cName,
          subtitle: act.project ? `Project: ${act.project}` : 'Client Account',
          color: pObj?.color || act.projectColor || '#3b82f6',
          type: 'client'
        };
      }
      case 'User':
      case 'Team': {
        const rawUser = (act.user || act.userName || act.userEmail || act.member || '').trim();
        const matchedUser = (usersList || []).find(u => 
          (u.name && u.name.toLowerCase() === rawUser.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === rawUser.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === rawUser.toLowerCase())
        ) || (rawUser.toLowerCase().includes('bharath') ? { name: 'Bharath (Owner)', username: 'bharath_owner', role: 'admin', avatarColor: '#10b981', avatarInitials: 'BO' } : null);

        const uName = matchedUser?.name || rawUser || 'Team Member';
        const usernameStr = matchedUser?.username ? `@${matchedUser.username}` : '';
        const uRole = (matchedUser?.role === 'admin' || uName.toLowerCase().includes('owner') || uName.toLowerCase().includes('bharath')) ? 'Admin (Owner)' : (matchedUser?.department || 'Employee');
        const cleanName = uName.replace(/[()]/g, '').trim();
        const initials = matchedUser?.avatar_initials || matchedUser?.avatarInitials || (cleanName.split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase()) || 'TM';
        const avatarColor = matchedUser?.avatar_color || matchedUser?.avatarColor || (uRole.includes('Admin') ? '#10b981' : (uName.toLowerCase().includes('anbu') ? '#14b8a6' : (uName.toLowerCase().includes('muthu') ? '#ec4899' : '#3b82f6')));

        return {
          id: `user-${uName}`,
          name: uName,
          username: usernameStr,
          subtitle: usernameStr ? `${usernameStr} • ${uRole}` : uRole,
          initials,
          color: avatarColor,
          type: 'user'
        };
      }
      case 'Date': {
        const dStr = act.date || 'Unknown Date';
        let formattedDate = dStr;
        try {
          if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
            const parts = dStr.split('-');
            const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
            formattedDate = dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          }
        } catch (e) {}
        return {
          id: `date-${dStr}`,
          name: formattedDate,
          subtitle: dStr,
          color: '#6366f1',
          type: 'date'
        };
      }
      case 'Task': {
        const tName = act.task || 'General Work';
        return {
          id: `task-${tName}`,
          name: tName,
          subtitle: act.project ? `Project: ${act.project}` : 'Task Activity',
          color: '#8b5cf6',
          type: 'task'
        };
      }
      case 'Tag': {
        const tagStr = Array.isArray(act.tags) && act.tags.length > 0 ? act.tags.join(', ') : (act.tag || act.tags || 'General');
        return {
          id: `tag-${tagStr}`,
          name: tagStr,
          subtitle: 'Tag Classification',
          color: '#f59e0b',
          type: 'tag'
        };
      }
      case 'Description': {
        const desc = act.description || act.task || 'General Log';
        return {
          id: `desc-${desc}`,
          name: desc,
          subtitle: act.project ? `Project: ${act.project}` : 'Time Description',
          color: '#64748b',
          type: 'description'
        };
      }
      default: {
        const pName = act.project || 'Project';
        return {
          id: `group-${pName}`,
          name: pName,
          subtitle: 'Work Item',
          color: '#10b981',
          type: 'default'
        };
      }
    }
  };

  const summaryBreakdownList = useMemo(() => {
    let totalSec = 0;
    const primaryMap = {};

    const primaryType = groupByPrimary || 'Project';
    const secondaryType = (groupBySecondary && groupBySecondary !== 'None' && groupBySecondary !== primaryType) ? groupBySecondary : null;

    scopedActivities.forEach(act => {
      const sec = act.durationSeconds || parseTimeToSeconds(act.durationFormatted);
      const effectiveSec = roundingEnabled ? roundTo15Minutes(sec) : sec;
      if (effectiveSec <= 0) return;

      totalSec += effectiveSec;

      const pInfo = getGroupInfo(act, primaryType);
      const pKey = pInfo.name;

      if (!primaryMap[pKey]) {
        primaryMap[pKey] = {
          ...pInfo,
          totalSec: 0,
          childrenMap: {}
        };
      }
      primaryMap[pKey].totalSec += effectiveSec;

      if (secondaryType) {
        const sInfo = getGroupInfo(act, secondaryType);
        const sKey = sInfo.name;
        if (!primaryMap[pKey].childrenMap[sKey]) {
          primaryMap[pKey].childrenMap[sKey] = {
            ...sInfo,
            totalSec: 0
          };
        }
        primaryMap[pKey].childrenMap[sKey].totalSec += effectiveSec;
      }
    });

    const result = Object.values(primaryMap).map(p => {
      let children = [];
      if (secondaryType && p.childrenMap) {
        children = Object.values(p.childrenMap).map(c => ({
          ...c,
          duration: formatSecondsToHMS(c.totalSec),
          percentage: p.totalSec > 0 ? ((c.totalSec / p.totalSec) * 100).toFixed(1) : '0.0'
        }));
        children.sort((a, b) => b.totalSec - a.totalSec);
      }

      return {
        ...p,
        children,
        duration: formatSecondsToHMS(p.totalSec),
        percentage: totalSec > 0 ? ((p.totalSec / totalSec) * 100).toFixed(1) : '0.0'
      };
    });

    result.sort((a, b) => b.totalSec - a.totalSec);
    return result;
  }, [scopedActivities, roundingEnabled, groupByPrimary, groupBySecondary, usersList, projects]);

  // 4. Calculate Dynamic Total Seconds & Time String
  const dynamicTotalSec = useMemo(() => {
    let total = 0;
    projectBreakdownList.forEach(p => total += p.totalSec);
    return total;
  }, [projectBreakdownList]);

  const liveTotalTime = useMemo(() => {
    return formatSecondsToHMS(dynamicTotalSec);
  }, [dynamicTotalSec]);

  const singleDayTotalSeconds = useMemo(() => {
    if (!singleDayKey) return dynamicTotalSec;
    let total = 0;
    filteredRows.forEach(row => {
      const daySec = parseTimeToSeconds(row[singleDayKey]);
      total += (roundingEnabled ? roundTo15Minutes(daySec) : daySec);
    });
    return total;
  }, [filteredRows, singleDayKey, roundingEnabled, dynamicTotalSec]);

  const singleDayTotalFormatted = useMemo(() => {
    return formatSecondsToHMS(singleDayTotalSeconds);
  }, [singleDayTotalSeconds]);

  // 5. Daily Tracked Hours for Week Chart (7 Days)
  const dailyBarData = useMemo(() => {
    let highestSec = 0;

    const bars = currentWeekDays.map(({ key, label, dateStr }) => {
      let daySec = 0;

      if (scopedActivities && scopedActivities.length > 0) {
        scopedActivities.forEach(act => {
          if (normalizeDateToYMD(act.date) === dateStr) {
            const sec = act.durationSeconds || parseTimeToSeconds(act.durationFormatted);
            daySec += roundingEnabled ? roundTo15Minutes(sec) : sec;
          }
        });
      } else if (dateStr >= '2026-08-31' && dateStr <= '2026-09-06') {
        filteredRows.forEach(row => {
          const sec = parseTimeToSeconds(row[key]);
          if (sec > 0) {
            daySec += roundingEnabled ? roundTo15Minutes(sec) : sec;
          }
        });
      }

      if (daySec > highestSec) highestSec = daySec;

      return {
        key,
        day: label,
        dateStr,
        totalSec: daySec,
        time: formatSecondsToHMS(daySec),
        hours: daySec / 3600,
        isCurrentSelection: singleDayKey ? singleDayKey === key : true
      };
    });

    const maxSec = Math.max(highestSec, 3600 * 8);

    return bars.map(b => ({
      ...b,
      heightPercent: maxSec > 0 ? Math.min(100, Math.max(4, (b.totalSec / maxSec) * 100)) : 4
    }));
  }, [currentWeekDays, scopedActivities, filteredRows, singleDayKey, roundingEnabled]);

  // 6. Detailed Activity Logs Data
  const detailedLogsList = useMemo(() => {
    if (scopedActivities && scopedActivities.length > 0) {
      return scopedActivities.map((act, idx) => {
        const pObj = (projects || []).find(p => p.name === act.project);
        const rawUser = (act.user || act.userName || act.userEmail || act.member || '').trim();
        const matchedUser = (usersList || []).find(u => 
          (u.name && u.name.toLowerCase() === rawUser.toLowerCase()) ||
          (u.username && u.username.toLowerCase() === rawUser.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === rawUser.toLowerCase())
        ) || (rawUser.toLowerCase().includes('bharath') ? { name: 'Bharath (Owner)', role: 'Admin (Owner)', avatarColor: '#10b981', avatarInitials: 'BO' } : null);

        const uName = matchedUser?.name || rawUser || 'Team Member';
        const uRole = (matchedUser?.role === 'admin' || uName.toLowerCase().includes('owner') || uName.toLowerCase().includes('bharath')) ? 'Admin (Owner)' : (matchedUser?.department || 'Employee');
        const cleanName = uName.replace(/[()]/g, '').trim();
        const initials = matchedUser?.avatar_initials || matchedUser?.avatarInitials || (cleanName.split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase()) || 'TM';
        const avatarColor = matchedUser?.avatar_color || matchedUser?.avatarColor || (uRole.includes('Admin') ? '#10b981' : (uName.toLowerCase().includes('anbu') ? '#14b8a6' : (uName.toLowerCase().includes('muthu') ? '#ec4899' : '#3b82f6')));

        const sec = act.durationSeconds || parseTimeToSeconds(act.durationFormatted);
        const effectiveSec = roundingEnabled ? roundTo15Minutes(sec) : sec;

        return {
          id: act.id || `act-${idx}`,
          userName: uName,
          userRole: uRole,
          avatarInitials: initials,
          avatarColor: avatarColor,
          date: act.date || '2026-09-02',
          project: act.project || 'General Task',
          projectColor: pObj?.color || act.projectColor || '#10b981',
          description: act.description || act.task || 'General session',
          interval: (act.startTime && act.endTime) ? `${act.startTime} - ${act.endTime}` : '09:00 - 17:00',
          duration: formatSecondsToHMS(effectiveSec),
          billable: act.billable !== false
        };
      });
    }

    const rows = [];
    filteredRows.forEach((ts) => {
      const hours = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      if (singleDayKey) {
        const sec = parseTimeToSeconds(ts[singleDayKey]);
        if (sec > 0) {
          const effectiveSec = roundingEnabled ? roundTo15Minutes(sec) : sec;
          const dayMeta = WEEK_DAYS_META.find(d => d.key === singleDayKey);
          rows.push({
            id: `log-${ts.id}-${singleDayKey}`,
            userName: 'Bharath (Owner)',
            userRole: 'Admin (Owner)',
            avatarInitials: 'BO',
            avatarColor: '#10b981',
            date: dayMeta ? `2026-09-0${dayMeta.dayNum}` : '2026-09-02',
            project: ts.projectName || 'Internal',
            projectColor: '#10b981',
            description: ts.taskDescription || ts.description || 'Working session',
            interval: '09:00 - 17:00',
            duration: formatSecondsToHMS(effectiveSec),
            billable: ts.billable !== false
          });
        }
      } else {
        hours.forEach(day => {
          const sec = parseTimeToSeconds(ts[day]);
          if (sec > 0) {
            const effectiveSec = roundingEnabled ? roundTo15Minutes(sec) : sec;
            const dayMeta = WEEK_DAYS_META.find(d => d.key === day);
            rows.push({
              id: `log-${ts.id}-${day}`,
              userName: 'Bharath (Owner)',
              userRole: 'Admin (Owner)',
              avatarInitials: 'BO',
              avatarColor: '#10b981',
              date: dayMeta ? `2026-09-0${dayMeta.dayNum}` : '2026-09-02',
              project: ts.projectName || 'Internal',
              projectColor: '#10b981',
              description: ts.taskDescription || ts.description || 'Working session',
              interval: '09:00 - 17:00',
              duration: formatSecondsToHMS(effectiveSec),
              billable: ts.billable !== false
            });
          }
        });
      }
    });
    return rows;
  }, [scopedActivities, filteredRows, singleDayKey, roundingEnabled, usersList, projects]);

  // 7. Workspace Summary KPI Cards (3 Clean Cards without Subtitles & Revenue)
  const summaryKPIs = useMemo(() => {
    if (appliedTeam.length === 1 && appliedTeam[0] !== 'active-only' && appliedTeam[0] !== 'pending-only') {
      return {
        kpi1Label: 'Total Tracked Time',
        kpi1Val: liveTotalTime,
        kpi1Color: '#00cc00',

        kpi2Label: 'Top Assigned Project',
        kpi2Val: projectBreakdownList[0]?.name || 'Standard Deliverables',
        kpi2Color: '#f59e0b',

        kpi3Label: 'Current Shift Status',
        kpi3Val: 'Active (On-Time)',
        kpi3Color: '#10b981'
      };
    }

    const uniqueLoggedUsers = Array.from(new Set((activities || []).map(a => a.user || a.userName || a.userEmail).filter(Boolean))).length || 5;

    return {
      kpi1Label: 'Workspace Total Tracked',
      kpi1Val: liveTotalTime,
      kpi1Color: '#00cc00',

      kpi2Label: 'Active Workspace Projects',
      kpi2Val: `${(projects || []).length} Active Projects`,
      kpi2Color: '#f59e0b',

      kpi3Label: 'Team Active Logging',
      kpi3Val: `${uniqueLoggedUsers} / ${(usersList || []).length || 5} Members`,
      kpi3Color: '#10b981'
    };
  }, [appliedTeam, liveTotalTime, projectBreakdownList, activities, projects.length, usersList.length]);

  // Attendance & Shifts computation - Dynamically built for all workspace team members (Daily Date Only)
  const attendanceLogsList = useMemo(() => {
    const defaultTeam = [
      { id: 'usr-1', name: 'Bharath (Owner)', role: 'Admin (Owner)', department: 'Management', active: true, avatarColor: '#10b981', avatarInitials: 'BO' },
      { id: 'usr-2', name: 'anbu', role: 'Full Stack', department: 'Full Stack', active: true, avatarColor: '#14b8a6', avatarInitials: 'AN' },
      { id: 'usr-3', name: 'Muthu', role: 'Frontend Dev', department: 'Frontend Dev', active: true, avatarColor: '#ec4899', avatarInitials: 'MU' },
      { id: 'usr-4', name: 'mani', role: 'Design & UI', department: 'Design & UI', active: true, avatarColor: '#3b82f6', avatarInitials: 'MA' },
      { id: 'usr-5', name: 'sivanparu', role: 'QA & Testing', department: 'QA & Testing', active: true, avatarColor: '#f59e0b', avatarInitials: 'SI' }
    ];

    const list = usersList && usersList.length > 0 ? usersList : defaultTeam;

    let targetMembers = list.map((u, idx) => {
      const isApproved = Boolean(u.active) || u.role === 'admin' || u.accessGranted === true;
      const uName = u.name || 'Employee';
      const uRole = (u.role === 'admin' || uName.toLowerCase().includes('owner') || uName.toLowerCase().includes('bharath'))
        ? 'Admin (Owner)'
        : (u.department || (uName.toLowerCase().includes('anbu') ? 'Full Stack' : (uName.toLowerCase().includes('muthu') ? 'Frontend Dev' : (uName.toLowerCase().includes('mani') ? 'Design & UI' : (uName.toLowerCase().includes('sivanparu') ? 'QA & Testing' : 'Employee')))));
      
      const cleanName = uName.replace(/[()]/g, '').trim();
      const initials = u.avatar_initials || u.avatarInitials || (cleanName.split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase()) || 'EM';
      const avatarColor = u.avatar_color || u.avatarColor || (uRole.includes('Admin') ? '#10b981' : (uName.toLowerCase().includes('anbu') ? '#14b8a6' : (uName.toLowerCase().includes('muthu') ? '#ec4899' : (uName.toLowerCase().includes('sivanparu') ? '#f59e0b' : '#3b82f6'))));

      return {
        id: u.id || `usr-${idx}`,
        name: uName,
        filterKey: uName,
        role: uRole,
        avatarColor: avatarColor,
        avatarInitials: initials,
        active: isApproved
      };
    });

    if (appliedTeam && appliedTeam.length > 0) {
      if (appliedTeam.includes('active-only')) {
        targetMembers = targetMembers.filter(m => m.active);
      }
      if (appliedTeam.includes('pending-only')) {
        targetMembers = targetMembers.filter(m => !m.active);
      }
      const memberNames = appliedTeam.filter(t => t !== 'active-only' && t !== 'pending-only');
      if (memberNames.length > 0) {
        targetMembers = targetMembers.filter(m => 
          memberNames.some(t => m.name.toLowerCase().includes(t.toLowerCase()) || m.filterKey.toLowerCase().includes(t.toLowerCase()))
        );
      }
    }

    const allLogs = [];
    targetMembers.forEach((member, mIdx) => {
      let memberDailyTaskSec = 0;

      // 1. Strict Date-Wise Task Duration from activities (Never Weekly Total)
      (activities || []).forEach(act => {
        const actUser = (act.user || act.userName || act.user_name || act.userEmail || act.userId || '').toLowerCase();
        const memberName = (member.name || '').toLowerCase();
        const firstName = memberName.split(' ')[0].replace(/[()]/g, '');

        const isUserMatch = actUser && (
          actUser.includes(firstName) || 
          memberName.includes(actUser) || 
          (act.userId && act.userId === member.id) ||
          (act.userEmail && member.email && act.userEmail.toLowerCase() === member.email.toLowerCase())
        );

        if (isUserMatch) {
          const actDate = (act.date || act.createdAt || '').substring(0, 10);
          if (actDate === attendanceDate) {
            const sec = act.durationSeconds || act.duration_seconds || parseTimeToSeconds(act.durationFormatted) || parseTimeToSeconds(act.duration) || 0;
            memberDailyTaskSec += sec;
          }
        }
      });

      // 2. Historical single-day timesheet support (Only if date belongs to Sep 2 week & no direct activities)
      if (memberDailyTaskSec === 0 && timesheetRows && timesheetRows.length > 0) {
        if (attendanceDate === '2026-09-02' || attendanceDate === '2026-09-01' || attendanceDate === '2026-09-03' || attendanceDate === '2026-09-04' || attendanceDate === '2026-08-31') {
          const dayKey = getDayKeyFromDate(attendanceDate);
          const tsRow = timesheetRows.find(r => {
            const emp = (r.employee || r.user || r.userName || '').toLowerCase();
            const firstName = (member.name || '').toLowerCase().split(' ')[0].replace(/[()]/g, '');
            return emp && (emp.includes(firstName) || firstName.includes(emp));
          });
          if (tsRow && tsRow[dayKey]) {
            const daySec = parseTimeToSeconds(tsRow[dayKey]);
            if (daySec > 0) {
              memberDailyTaskSec = daySec;
            }
          }
        }
      }

      const logId = `att-${member.id}-${attendanceDate}-${mIdx}`;
      const override = attendanceOverrides[logId] || {};

      // Pure Single-Day Shift Duration String
      const shiftTaskDur = formatSecondsToHMS(memberDailyTaskSec);
      const effectiveTotalShift = shiftTaskDur;

      const hasWorked = memberDailyTaskSec > 0;
      const defaultClockIn = hasWorked ? (override.clockIn || (member.name.toLowerCase().includes('bharath') ? '09:35 AM' : '10:00 AM')) : '-';
      const effectiveClockIn = override.clockIn !== undefined ? override.clockIn : defaultClockIn;
      const effectiveBreak = override.breakTime !== undefined ? override.breakTime : (hasWorked ? '00:45:00' : '-');
      
      const autoCalcOut = hasWorked ? calcAutoClockOut(effectiveClockIn, effectiveTotalShift, effectiveBreak) : '-';
      const effectiveClockOut = autoCalcOut;
      
      // 100% Automatic 4-State Status based purely on that day's tracked hours
      const effectiveStatus = computeAttendanceStatus(effectiveClockIn, effectiveTotalShift);

      // Status filtering
      if (appliedStatus.length > 0) {
        const matchStatus = appliedStatus.some(st => effectiveStatus.toLowerCase().includes(st.toLowerCase()));
        if (!matchStatus) return;
      }

      allLogs.push({
        id: logId,
        userId: member.id,
        userName: member.name,
        userRole: member.role,
        avatarColor: member.avatarColor,
        avatarInitials: member.avatarInitials,
        date: formatDisplayDate(attendanceDate),
        clockIn: effectiveClockIn,
        clockOut: effectiveClockOut,
        breakTime: effectiveBreak,
        taskDuration: effectiveTotalShift,
        totalShift: effectiveTotalShift,
        status: effectiveStatus
      });
    });

    return allLogs.sort((a, b) => {
      if (a.userRole.includes('Admin') && !b.userRole.includes('Admin')) return -1;
      if (!a.userRole.includes('Admin') && b.userRole.includes('Admin')) return 1;
      return a.userName.localeCompare(b.userName);
    });
  }, [appliedTeam, appliedStatus, usersList, attendanceOverrides, activities, timesheetRows, attendanceDate]);

  // Dynamic KPI Metrics for Attendance Report (3 Cards: Present, Average Shift, Leaves - Punctuality Removed)
  const attendanceKPIs = useMemo(() => {
    const uniqueEmployees = Array.from(new Set(attendanceLogsList.map(l => l.userName))).length || 5;
    const presentTodayCount = attendanceLogsList.filter(l => l.status.includes('Present') || l.status.includes('Active') || l.status.includes('Half')).length;
    const leaveCount = attendanceLogsList.filter(l => l.status.includes('Leave')).length;

    let totalSec = 0;
    let workingEmployeesCount = 0;
    attendanceLogsList.forEach(l => {
      const sec = parseTimeToSeconds(l.totalShift);
      if (sec > 0) {
        totalSec += sec;
        workingEmployeesCount++;
      }
    });
    const avgSec = workingEmployeesCount > 0 ? Math.round(totalSec / workingEmployeesCount) : 0;
    const avgFormatted = avgSec > 0 ? `${Math.floor(avgSec / 3600)}h ${Math.floor((avgSec % 3600) / 60)}m` : '0h 00m';

    return {
      kpi1Label: 'Active Employees',
      kpi1Val: `${presentTodayCount} / ${uniqueEmployees} Active`,
      kpi1Sub: formatDisplayDate(attendanceDate),
      kpi1Color: '#00cc00',
      kpi2Label: 'Average Daily Shift',
      kpi2Val: `${avgFormatted} / Day`,
      kpi2Sub: 'Based on logged daily tasks',
      kpi4Label: 'Team Leaves',
      kpi4Val: `${leaveCount} On Leave`,
      kpi4Sub: '0 tasks logged today',
      kpi4Color: '#8b5cf6'
    };
  }, [attendanceLogsList, attendanceDate]);

  const quickRanges = useMemo(() => {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthShorts = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);

    const todayLabel = `Today (${dayNames[now.getDay()]}, ${monthShorts[now.getMonth()]} ${now.getDate()})`;
    const yestLabel = `Yesterday (${dayNames[yest.getDay()]}, ${monthShorts[yest.getMonth()]} ${yest.getDate()})`;

    return [
      todayLabel,
      yestLabel,
      'This week (Aug 31 - Sep 6)',
      'Last week (Aug 24 - Aug 30)',
      'This month (September 2026)',
      'Last month (August 2026)',
    ];
  }, []);

  const [selectedReportType, setSelectedReportType] = useState('TIME REPORT');
  const [showReportTypeMenu, setShowReportTypeMenu] = useState(false);
  const reportTypeRef = useRef(null);

  const REPORT_TYPES = [
    { id: 'TIME REPORT', label: 'TIME REPORT', desc: 'Standard time entries, projects and hourly breakdowns' },
    { id: 'ATTENDANCE REPORT', label: 'ATTENDANCE & LEAVES', desc: 'Employee presence, shift timings, and clock logs' },
  ];

  useEffect(() => {
    function handleClickOutsideReportType(e) {
      if (reportTypeRef.current && !reportTypeRef.current.contains(e.target)) {
        setShowReportTypeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideReportType);
    return () => document.removeEventListener('mousedown', handleClickOutsideReportType);
  }, []);

  // Check if any filter is active
  const hasActiveFilters = 
    appliedTeam.length > 0 || 
    appliedProject.length > 0 || 
    appliedClient.length > 0 || 
    appliedTask.length > 0 || 
    appliedTag.length > 0 || 
    appliedStatus.length > 0 || 
    appliedDesc.length > 0 || 
    appliedKiosk.length > 0 || 
    appliedRange !== 'This week (Aug 31 - Sep 6)';

  // Build rows for official print table
  const printTableRows = useMemo(() => {
    return (detailedLogsList || []).map(l => ({
      employee: l.userName,
      date: l.date,
      project: l.project,
      description: l.description,
      interval: l.interval,
      duration: l.duration,
      billable: l.billable
    }));
  }, [detailedLogsList]);

  // Export handlers
  const handleExportCSV = () => {
    let rows = [];
    if (selectedReportType === 'ATTENDANCE REPORT') {
      rows.push(['Employee', 'Role', 'Date', 'Clock In', 'Clock Out', 'Break Time', 'Shift Duration', 'Attendance Status']);
      attendanceLogsList.forEach(log => {
        rows.push([
          `"${log.userName}"`,
          `"${log.userRole}"`,
          `"${log.date}"`,
          `"${log.clockIn}"`,
          `"${log.clockOut}"`,
          `"${log.breakTime}"`,
          `"${log.totalShift}"`,
          `"${log.status}"`
        ]);
      });
    } else {
      rows.push(['Project', 'Description', 'Date', 'Start Time', 'End Time', 'Duration']);
      detailedLogsList.forEach(act => {
        rows.push([
          `"${act.project || ''}"`,
          `"${act.description || ''}"`,
          `"${act.date || ''}"`,
          `"${act.interval || ''}"`,
          `"${act.duration || ''}"`
        ]);
      });
    }

    const csvString = rows.map(e => e.join(',')).join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Clockodo_${selectedReportType.replace(/\s+/g, '_')}_${appliedRange.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage('CSV Export Downloaded Successfully!');
    setTimeout(() => setToastMessage(''), 3000);
    setShowExportMenu(false);
  };

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printOrientation, setPrintOrientation] = useState('Portrait');
  const [showPrintAmounts, setShowPrintAmounts] = useState(true);

  const handlePrintReport = () => {
    setShowPrintModal(true);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    handlePrintReport();
  };

  const executeBrowserPrint = () => {
    window.print();
  };

  // Shared Reports State & Handlers with LocalStorage Persistence
  const INITIAL_SHARED_REPORTS = [];

  const [sharedReportsList, setSharedReportsList] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_shared_reports_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_SHARED_REPORTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('clockodo_shared_reports_v2', JSON.stringify(sharedReportsList));
    } catch (e) {}
  }, [sharedReportsList]);

  const [showShareModal, setShowShareModal] = useState(false);
  const [newShareName, setNewShareName] = useState('Weekly Team Summary');
  const [newSharePublic, setNewSharePublic] = useState(true);
  const [newShareShowAmounts, setNewShareShowAmounts] = useState(true);
  const [newShareToken, setNewShareToken] = useState('rpt_jrks_9843a');
  const [copiedLinkToken, setCopiedLinkToken] = useState(null);
  const [previewSharedReport, setPreviewSharedReport] = useState(null);

  const handleOpenShareModal = () => {
    const randomToken = `rpt_${Math.random().toString(36).substring(2, 6)}_${Math.random().toString(36).substring(2, 6)}`;
    setNewShareToken(randomToken);
    setNewShareName(`Weekly Team Summary (${appliedRange})`);
    setNewSharePublic(true);
    setNewShareShowAmounts(true);
    setCopiedLinkToken(null);
    setShowShareModal(true);
    setShowExportMenu(false);
  };

  const handleShareReport = () => {
    handleOpenShareModal();
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      return new Promise((resolve, reject) => {
        const success = document.execCommand('copy');
        textArea.remove();
        success ? resolve() : reject(new Error('Copy failed'));
      });
    }
  };

  const handleCopyShareLink = (linkOrToken, explicitToken) => {
    if (!linkOrToken) return;
    const token = explicitToken || (linkOrToken.includes('/') ? linkOrToken.split('/').pop() : linkOrToken);
    const fullUrl = linkOrToken.startsWith('http') 
      ? linkOrToken 
      : `${window.location.origin}/#/shared/${linkOrToken}`;

    copyToClipboard(fullUrl).then(() => {
      setCopiedLinkToken(token);
      setToastMessage('Public Report URL copied to clipboard!');
      setTimeout(() => {
        setCopiedLinkToken(null);
        setToastMessage('');
      }, 3000);
    }).catch(() => {
      setCopiedLinkToken(token);
      setToastMessage('Report URL copied!');
      setTimeout(() => {
        setCopiedLinkToken(null);
        setToastMessage('');
      }, 3000);
    });
  };

  const handleCreateSharedReport = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const token = newShareToken || `rpt_${Math.random().toString(36).substring(2, 8)}`;
    const fullUrl = `${window.location.origin}/#/shared/${token}`;

    const newReport = {
      id: `shared-${Date.now()}`,
      name: newShareName || `Weekly Team Summary (${appliedRange})`,
      client: appliedClient.length > 0 ? appliedClient.join(', ') : 'All Clients',
      period: appliedRange,
      totalHours: liveTotalTime,
      isPublic: newSharePublic,
      showAmounts: newShareShowAmounts,
      viewsCount: 0,
      linkToken: token,
      link: fullUrl,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      entries: (filteredActivities && filteredActivities.length > 0) ? filteredActivities : activities
    };

    setSharedReportsList(prev => [newReport, ...prev]);
    handleCopyShareLink(fullUrl, token);
    setShowShareModal(false);
    setToastMessage(`Public Report "${newReport.name}" created and link copied!`);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleDeleteSharedReport = (id) => {
    setSharedReportsList(prev => prev.filter(r => r.id !== id));
    setToastMessage('Shared report deleted.');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const copyShareLink = (link, id) => {
    handleCopyShareLink(link, id);
  };

  const deleteReport = (id) => {
    handleDeleteSharedReport(id);
  };

  const hasRecords = dynamicTotalSec > 0 || (scopedActivities && scopedActivities.length > 0) || (timesheetRows && timesheetRows.length > 0);

  return (
    <div className="page-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0a0e14',
          border: '1.5px solid var(--digi-green)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontSize: '13px',
          fontWeight: 700
        }}>
          <CheckCircle2 size={16} color="var(--digi-neon)" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="reports-view">
        {/* Top Subtabs & Date Range */}
        <div className="clockify-reports-header">
          <div className="clockify-top-left">
            <div style={{ position: 'relative' }} ref={reportTypeRef}>
              <div 
                className="time-report-dropdown"
                onClick={() => setShowReportTypeMenu(!showReportTypeMenu)}
                title="Select Report Type"
              >
                <span>{selectedReportType}</span>
                <ChevronDown size={12} color="#64748b" />
              </div>

              {showReportTypeMenu && (
                <div className="reports-type-popover">
                  <div className="reports-type-header">Report Type</div>
                  {REPORT_TYPES.map((rt) => (
                    <div 
                      key={rt.id}
                      className={`reports-type-item ${selectedReportType === rt.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedReportType(rt.id);
                        setShowReportTypeMenu(false);
                        setToastMessage(`✓ Switched to ${rt.label}`);
                        setTimeout(() => setToastMessage(''), 2500);
                      }}
                    >
                      <div className="reports-type-title">{rt.label}</div>
                      <div className="reports-type-desc">{rt.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="clockify-tabs-group">
              {subtabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`clockify-tab-btn ${activeSubtab === tab ? 'active' : ''}`}
                  onClick={() => setActiveSubtab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {/* Date Range Selector with < > arrows */}
            <div style={{ position: 'relative' }} ref={datePickerRef}>
              <div className="clockify-date-selector">
                <button 
                  type="button"
                  className="clockify-date-btn" 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  title="Select date range"
                >
                  <Calendar size={13} color="#00cc00" />
                  <span>{selectedRange}</span>
                </button>
                <button 
                  type="button" 
                  className="clockify-nav-arrow"
                  title="Previous period"
                  onClick={() => {
                    const prev = shiftDateRange(appliedRange, -1);
                    setSelectedRange(prev);
                    setAppliedRange(prev);
                  }}
                >
                  ‹
                </button>
                <button 
                  type="button" 
                  className="clockify-nav-arrow"
                  title="Next period"
                  onClick={() => {
                    const next = shiftDateRange(appliedRange, 1);
                    setSelectedRange(next);
                    setAppliedRange(next);
                  }}
                >
                  ›
                </button>
              </div>

              {showDatePicker && (
                <div className="reports-date-popover">
                  <div className="popover-month-header">
                    <span > Date Range</span>
                    <button 
                      type="button" 
                      onClick={() => setShowDatePicker(false)} 
                      style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Quick Range Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    {quickRanges.map((range) => (
                      <button
                        key={range}
                        type="button"
                        className={`reports-range-option ${(selectedRange === range || appliedRange === range) ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedRange(range);
                          setAppliedRange(range);
                          setShowDatePicker(false);
                        }}
                      >
                        <span>{range}</span>
                        {selectedRange === range && <CheckCircle2 size={13} color="var(--digi-green)" />}
                      </button>
                    ))}
                  </div>

                  {/* Mini Calendar Grid */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px' }}>
                      SEPTEMBER 2026
                    </div>
                    <div className="popover-weekdays-row">
                      <span > Su</span><span > Mo</span><span > Tu</span><span > We</span><span > Th</span><span > Fr</span><span > Sa</span>
                    </div>
                    <div className="popover-days-grid">
                      {/* Sep 1, 2026 starts on Tuesday (blank for Su and Mo) */}
                      <div style={{ height: '26px' }} />
                      <div style={{ height: '26px' }} />
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                        const now = new Date();
                        const isToday = d === now.getDate() && now.getMonth() === 8 && now.getFullYear() === 2026;
                        return (
                          <button
                            key={d}
                            type="button"
                            className={`popover-day-btn ${isToday ? 'is-today' : ''} ${(selectedRange.includes(`Sep ${d}`) || appliedRange.includes(`Sep ${d}`)) ? 'is-selected' : ''}`}
                            onClick={() => {
                              const dStr = `Sep ${d}, 2026`;
                              setSelectedRange(dStr);
                              setAppliedRange(dStr);
                              setShowDatePicker(false);
                            }}
                            title={isToday ? "Today (Active)" : `Sep ${d}, 2026`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Clockify Cyan EXPORT Button & Dropdown Menu */}
            <div style={{ position: 'relative' }} ref={exportMenuRef}>
              <button 
                type="button"
                className="btn-clockify-export" 
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export report"
              >
                <span > EXPORT</span>
                <ChevronDown size={11} />
              </button>

              {showExportMenu && (
                <div className="reports-export-menu">
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', padding: '6px 10px', textTransform: 'uppercase' }}>
                    Export Options
                  </div>
                  <button 
                    type="button" 
                    className="export-menu-item"
                    onClick={() => handleExportCSV('CSV')}
                  >
                    <FileText size={15} />
                    <span > CSV (.csv)</span>
                  </button>
                  <button 
                    type="button" 
                    className="export-menu-item"
                    onClick={() => handleExportCSV('Excel')}
                  >
                    <FileSpreadsheet size={15} />
                    <span > Excel (.xlsx)</span>
                  </button>
                  <button 
                    type="button" 
                    className="export-menu-item"
                    onClick={handleExportPDF}
                  >
                    <Printer size={15} />
                    <span > PDF / Print</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EXACT CLOCKIFY FILTER BAR:
            FILTER ▾ | Team ▾ | Client ▾ | Project ▾ | Task ▾ | Tag ▾ | Status ▾ | Description ▾ | Kiosk ▾ | [APPLY FILTER] */}
        <div className="clockify-filter-bar">
          <div className="clockify-filter-items">
            {/* 1. FILTER ▾ (Toggles which filter buttons appear in the toolbar) */}
            <ReportsFilterDropdown
              label="FILTER"
              isFilterToggleDropdown={true}
              hasSearch={false}
              hasShowActive={false}
              isOpen={openDropdown === 'filter'}
              onToggle={() => setOpenDropdown(openDropdown === 'filter' ? null : 'filter')}
              onClose={() => setOpenDropdown(null)}
              items={ALL_FILTER_CATEGORIES}
              selectedValues={visibleFilterPills}
              onSelectionChange={(newVal) => setVisibleFilterPills(newVal)}
            />

            {/* 2. Team ▾ */}
            {visibleFilterPills.includes('Team') && (
              <ReportsFilterDropdown
                label="Team"
                searchPlaceholder="Search users or groups"
                hasSearch={true}
                hasShowActive={true}
                isOpen={openDropdown === 'team'}
                onToggle={() => setOpenDropdown(openDropdown === 'team' ? null : 'team')}
                onClose={() => setOpenDropdown(null)}
                withoutItemLabel="Without group"
                withoutItemValue="without-group"
                groups={teamFilterGroups}
                selectedValues={selectedTeamFilter}
                onSelectionChange={(vals) => setSelectedTeamFilter(vals)}
              />
            )}

            {/* 3. Client ▾ */}
            {visibleFilterPills.includes('Client') && (
              <ReportsFilterDropdown
                label="Client"
                searchPlaceholder="Search clients"
                hasSearch={true}
                hasShowActive={true}
                isOpen={openDropdown === 'client'}
                onToggle={() => setOpenDropdown(openDropdown === 'client' ? null : 'client')}
                onClose={() => setOpenDropdown(null)}
                withoutItemLabel="Without Client"
                withoutItemValue="without-client"
                items={clientFilterItems}
                selectedValues={selectedClientFilter}
                onSelectionChange={(vals) => setSelectedClientFilter(vals)}
              />
            )}

            {/* 4. Project ▾ */}
            {visibleFilterPills.includes('Project') && (
              <ReportsFilterDropdown
                label="Project"
                searchPlaceholder="Search Projects"
                hasSearch={true}
                hasShowActive={true}
                isOpen={openDropdown === 'project'}
                onToggle={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')}
                onClose={() => setOpenDropdown(null)}
                withoutItemLabel="Without Project"
                withoutItemValue="without-project"
                groups={projectFilterGroups}
                selectedValues={selectedProjectFilter}
                onSelectionChange={(vals) => setSelectedProjectFilter(vals)}
              />
            )}

            {/* 5. Task ▾ */}
            {visibleFilterPills.includes('Task') && (
              <ReportsFilterDropdown
                label="Task"
                searchPlaceholder="Search Tasks"
                hasSearch={true}
                hasShowActive={true}
                isOpen={openDropdown === 'task'}
                onToggle={() => setOpenDropdown(openDropdown === 'task' ? null : 'task')}
                onClose={() => setOpenDropdown(null)}
                withoutItemLabel="Without Task"
                withoutItemValue="without-task"
                groups={taskFilterGroups}
                selectedValues={selectedTaskFilter}
                onSelectionChange={(vals) => setSelectedTaskFilter(vals)}
              />
            )}

            {/* 6. Tag ▾ */}
            {visibleFilterPills.includes('Tag') && (
              <ReportsFilterDropdown
                label="Tag"
                searchPlaceholder="Search tags"
                hasSearch={true}
                hasShowActive={true}
                isOpen={openDropdown === 'tag'}
                onToggle={() => setOpenDropdown(openDropdown === 'tag' ? null : 'tag')}
                onClose={() => setOpenDropdown(null)}
                withoutItemLabel="Without Tag"
                withoutItemValue="without-tag"
                items={tagFilterItems}
                selectedValues={selectedTagFilter}
                onSelectionChange={(vals) => setSelectedTagFilter(vals)}
              />
            )}

            {/* 7. Status ▾ */}
            {visibleFilterPills.includes('Status') && (
              <ReportsFilterDropdown
                label="Status"
                searchPlaceholder="Search status"
                hasSearch={false}
                hasShowActive={true}
                isOpen={openDropdown === 'status'}
                onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                onClose={() => setOpenDropdown(null)}
                items={statusFilterItems}
                selectedValues={selectedStatusFilter}
                onSelectionChange={(vals) => setSelectedStatusFilter(vals)}
              />
            )}

            {/* 8. Description ▾ */}
            {visibleFilterPills.includes('Description') && (
              <ReportsFilterDropdown
                label="Description"
                searchPlaceholder="Search descriptions"
                hasSearch={true}
                hasShowActive={false}
                isOpen={openDropdown === 'description'}
                onToggle={() => setOpenDropdown(openDropdown === 'description' ? null : 'description')}
                onClose={() => setOpenDropdown(null)}
                withoutItemLabel="Without description"
                withoutItemValue="without-desc"
                items={descFilterItems}
                selectedValues={selectedDescFilter}
                onSelectionChange={(vals) => setSelectedDescFilter(vals)}
              />
            )}

            {/* 9. Kiosk ▾ */}
            {visibleFilterPills.includes('Kiosk') && (
              <ReportsFilterDropdown
                label="Kiosk"
                searchPlaceholder="Search kiosks"
                hasSearch={true}
                hasShowActive={false}
                isOpen={openDropdown === 'kiosk'}
                onToggle={() => setOpenDropdown(openDropdown === 'kiosk' ? null : 'kiosk')}
                onClose={() => setOpenDropdown(null)}
                withoutItemLabel="Without Kiosk"
                withoutItemValue="without-kiosk"
                items={kioskFilterItems}
                selectedValues={selectedKioskFilter}
                onSelectionChange={(vals) => setSelectedKioskFilter(vals)}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasActiveFilters && (
              <button 
                type="button" 
                className="clockify-reset-btn"
                onClick={handleResetFilters}
                title="Reset all active filters"
              >
                <X size={12} />
                <span > Reset</span>
              </button>
            )}

            <button 
              type="button"
              className="btn-clockify-apply"
              onClick={handleApplyFilter}
            >
              APPLY FILTER
            </button>
          </div>
        </div>

        {/* Total Banner with Print/Share/Rounding */}
        <div className="reports-summary-banner">
          <div className="reports-total-time">
            Total: <strong>{liveTotalTime}</strong>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginLeft: 10 }}>
              ({appliedRange})
            </span>
          </div>

          <div className="reports-actions-group">
            <button className="reports-icon-btn" title="Print Report" onClick={() => window.print()}>
              <Printer size={16} />
            </button>
            <button className="reports-icon-btn" title="Create / Share Public Link" onClick={handleOpenShareModal}>
              <Share2 size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
              <span style={{ fontSize: '12px', color: roundingEnabled ? 'var(--digi-green-dark)' : '#94a3b8', fontWeight: roundingEnabled ? 700 : 500 }}>
                Rounding {roundingEnabled && '(15m Active)'}
              </span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={roundingEnabled} 
                  onChange={() => {
                    const next = !roundingEnabled;
                    setRoundingEnabled(next);
                    setToastMessage(next ? '15-minute Rounding Activated!' : 'Rounding Disabled (Exact Time)');
                    setTimeout(() => setToastMessage(''), 2500);
                  }} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* CONDITIONAL SUBTAB & REPORT TYPE RENDERING */}
        {selectedReportType === 'ATTENDANCE REPORT' ? (
          <div className="reports-attendance-card">
            {/* KPI Summary Cards */}
            <div className="attendance-kpi-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="attendance-kpi-item">
                <span className="attendance-kpi-label">{attendanceKPIs.kpi1Label}</span>
                <div className="attendance-kpi-val" style={{ color: attendanceKPIs.kpi1Color }}>{attendanceKPIs.kpi1Val}</div>
                <span className="attendance-kpi-sub">{attendanceKPIs.kpi1Sub}</span>
              </div>
              <div className="attendance-kpi-item">
                <span className="attendance-kpi-label">{attendanceKPIs.kpi2Label}</span>
                <div className="attendance-kpi-val">{attendanceKPIs.kpi2Val}</div>
                <span className="attendance-kpi-sub">{attendanceKPIs.kpi2Sub}</span>
              </div>
              <div className="attendance-kpi-item">
                <span className="attendance-kpi-label">{attendanceKPIs.kpi4Label}</span>
                <div className="attendance-kpi-val" style={{ color: attendanceKPIs.kpi4Color }}>{attendanceKPIs.kpi4Val}</div>
                <span className="attendance-kpi-sub">{attendanceKPIs.kpi4Sub}</span>
              </div>
            </div>

            {/* Attendance Shifts Table Header with Date Navigation */}
            <div className="detailed-header-bar" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div className="detailed-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700 }}>Employee Daily Shift & Clock Logs</span>
                <span className="detailed-count-badge">{attendanceLogsList.length} Shifts</span>
              </div>

              {/* Dynamic Date Navigator (Back, Forward & Quick Today) */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '3px 6px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <button
                  type="button"
                  onClick={handlePrevDay}
                  title="Previous Day (Back)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  <ChevronLeft size={15} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
                  <Calendar size={14} color="#008a00" />
                  <span style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                    {formatDisplayDate(attendanceDate)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextDay}
                  title="Next Day (Forward)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    color: '#334155'
                  }}
                >
                  <ChevronRight size={15} />
                </button>

                {attendanceDate !== '2026-09-11' && (
                  <button
                    type="button"
                    onClick={handleTodayClick}
                    title="Jump to Today (Sep 11)"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      background: 'rgba(0, 204, 0, 0.12)',
                      color: '#008a00',
                      border: '1px solid rgba(0, 204, 0, 0.35)',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      marginLeft: '4px'
                    }}
                  >
                    Today
                  </button>
                )}
              </div>
            </div>

            <div className="clockodo-detailed-table-wrapper">
              <table className="clockodo-detailed-table">
                <thead>
                  <tr>
                    <th style={{ width: '220px' }}>EMPLOYEE</th>
                    <th style={{ width: '140px' }}>DATE</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>CLOCK-IN</th>
                    <th style={{ width: '130px', textAlign: 'center' }}>CLOCK-OUT</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>BREAK TIME</th>
                    <th style={{ width: '130px', textAlign: 'right' }}>SHIFT DURATION</th>
                    <th style={{ width: '180px', textAlign: 'center' }}>ATTENDANCE STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogsList.map((log) => {
                    const isAdmin = currentUser?.role === 'admin' || 
                                    currentUser?.role === 'owner' || 
                                    (currentUser?.name && currentUser.name.toLowerCase().includes('bharath')) || 
                                    (currentUser?.name && currentUser.name.toLowerCase().includes('owner'));

                    return (
                    <tr key={log.id}>
                      <td>
                        <div className="detailed-user-cell">
                          <div 
                            className="detailed-user-avatar" 
                            style={{ background: log.avatarColor || '#10b981', color: '#ffffff', fontWeight: 700 }}
                          >
                            {log.avatarInitials}
                          </div>
                          <div className="detailed-user-info">
                            <span className="detailed-user-name">{log.userName}</span>
                            <span className="detailed-user-role">{log.userRole}</span>
                          </div>
                        </div>
                      </td>
                      <td className="detailed-date-cell">{log.date}</td>
                      
                      {/* CLOCK-IN: Admin editable vs Employee read-only */}
                      <td style={{ textAlign: 'center' }}>
                        {isAdmin ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '3px 8px', gap: '5px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#00cc00', flexShrink: 0 }} />
                            <input
                              type="text"
                              value={log.clockIn === '-' ? '' : log.clockIn}
                              placeholder="09:00 AM"
                              title="Admin: Type Clock-In (e.g. 0930 automatically adds ':')"
                              onChange={(e) => handleUpdateAttendance(log.id, 'clockIn', e.target.value, log.taskDuration || log.totalShift, log.breakTime)}
                              style={{ width: '84px', border: 'none', background: 'transparent', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', color: '#008a00', outline: 'none', textAlign: 'center' }}
                            />
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', color: (!log.clockIn || log.clockIn === '—' || log.clockIn === '-') ? '#94a3b8' : '#008a00', fontWeight: 700 }}>
                            {log.clockIn && log.clockIn !== '—' && log.clockIn !== '-' && <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#00cc00', marginRight: '6px' }} />}
                            {log.clockIn}
                          </span>
                        )}
                      </td>

                      {/* CLOCK-OUT: Admin auto-calculated from Clock-In + Tasks + Break */}
                      <td style={{ textAlign: 'center' }}>
                        {isAdmin ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 8px', gap: '5px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                            <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
                            <span 
                              title="Auto-calculated: Clock-In + Logged Task Duration + Break Time"
                              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '12px', color: '#334155', minWidth: '66px', textAlign: 'center' }}
                            >
                              {log.clockOut}
                            </span>
                            <span style={{ fontSize: '9px', background: '#e0e7ff', color: '#4338ca', padding: '1px 4px', borderRadius: '3px', fontWeight: 700, letterSpacing: '0.4px' }}>AUTO</span>
                          </div>
                        ) : (
                          <span style={{ fontFamily: 'var(--font-mono)', color: (!log.clockOut || log.clockOut === '—' || log.clockOut === '-') ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                            {log.clockOut && log.clockOut !== '—' && log.clockOut !== '-' && <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', marginRight: '6px' }} />}
                            {log.clockOut}
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#94a3b8', fontSize: '12px' }}>
                        {log.breakTime}
                      </td>

                      <td className="detailed-duration-cell" style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {log.totalShift}
                      </td>

                      {/* ATTENDANCE STATUS: 100% Dynamic based on Day's Logged Hours */}
                      <td style={{ textAlign: 'center' }}>
                        <span 
                          className="detailed-billable-badge" 
                          title="Daily Status: ≥5h Fully Present | 3h-5h Half Leave | <3h Active (Working) | 0h On Leave"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: log.status.includes('Present') 
                              ? 'rgba(0, 204, 0, 0.1)' 
                              : (log.status.includes('Half') 
                                ? '#fef3c7' 
                                : (log.status.includes('Active') 
                                  ? 'rgba(14, 165, 233, 0.1)' 
                                  : '#ede9fe')),
                            color: log.status.includes('Present') 
                              ? '#008a00' 
                              : (log.status.includes('Half') 
                                ? '#b45309' 
                                : (log.status.includes('Active') 
                                  ? '#0284c7' 
                                  : '#6d28d9')),
                            border: log.status.includes('Present') 
                              ? '1px solid rgba(0, 204, 0, 0.25)' 
                              : (log.status.includes('Half') 
                                ? '1px solid #fde68a' 
                                : (log.status.includes('Active') 
                                  ? '1px solid rgba(14, 165, 233, 0.25)' 
                                  : '1px solid #ddd6fe'))
                          }}
                        >
                          {log.status.includes('Present') ? '✓ Fully Present' : (log.status.includes('Half') ? '⏱ Half Leave' : (log.status.includes('Active') ? '⚡ Active (Working)' : '🏖 On Leave'))}
                        </span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeSubtab === 'Detailed' ? (
          <div className="reports-detailed-card">
            <div className="detailed-header-bar">
              <div className="detailed-header-title">
                <span > Detailed Activity Logs</span>
                <span className="detailed-count-badge">
                  {detailedLogsList.length} Entr{detailedLogsList.length === 1 ? 'y' : 'ies'}
                </span>
              </div>
              <div className="detailed-header-total">
                Total: <strong>{liveTotalTime}</strong>
              </div>
            </div>

            {detailedLogsList.length === 0 ? (
              <div className="reports-empty-state" style={{ padding: '40px 20px' }}>
                <Clock size={32} color="#00cc00" />
                <h3 className="reports-empty-title">No Detailed Logs for {appliedRange}</h3>
                <p className="reports-empty-desc">
                  There are no work session entries recorded for this period. Track time or add a manual entry to view detailed logs.
                </p>
              </div>
            ) : (
              <div className="clockodo-detailed-table-wrapper">
                <table className="clockodo-detailed-table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>EMPLOYEE</th>
                      <th style={{ width: '120px' }}>DATE</th>
                      <th style={{ width: '220px' }}>PROJECT</th>
                      <th > DESCRIPTION / TASK</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>INTERVAL</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>DURATION</th>
                      
                    </tr>
                  </thead>
                  <tbody>
                    {detailedLogsList.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div className="detailed-user-cell">
                            <div className="detailed-user-avatar" style={{ backgroundColor: log.avatarColor || '#3b82f6', color: '#ffffff', fontWeight: 700 }}>
                              {log.avatarInitials}
                            </div>
                            <div className="detailed-user-info">
                              <span className="detailed-user-name">{log.userName}</span>
                              <span className="detailed-user-role">{log.userRole}</span>
                            </div>
                          </div>
                        </td>
                        <td className="detailed-date-cell">{log.date}</td>
                        <td>
                          <div className="detailed-project-cell">
                            <span className="project-bullet" style={{ backgroundColor: log.projectColor }} />
                            <span className="detailed-project-name">{log.project}</span>
                          </div>
                        </td>
                        <td className="detailed-desc-cell">{log.description}</td>
                        <td className="detailed-interval-cell">{log.interval}</td>
                        <td className="detailed-duration-cell">{log.duration}</td>
                        
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeSubtab === 'Weekly' ? (
          /* WEEKLY MATRIX VIEW */
          <div className="reports-detailed-card">
            <div className="detailed-header-bar">
              <div className="detailed-header-title">
                <span > Weekly Time Breakdown by Project</span>
                <span className="detailed-count-badge">{groupedProjectBreakdown.length} Projects</span>
              </div>
              <div className="detailed-header-total">
                Week Total: <strong>{liveTotalTime}</strong>
              </div>
            </div>

            <div className="clockodo-detailed-table-wrapper">
              <table className="clockodo-detailed-table">
                <thead>
                  <tr>
                    <th style={{ width: '220px' }}>PROJECT / CLIENT</th>
                    {currentWeekDays.map(day => (
                      <th key={day.dateStr} style={{ textAlign: 'center', width: '100px' }}>
                        {day.label}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', width: '120px' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedProjectBreakdown.map((proj, pIdx) => {
                    return (
                      <tr key={proj.id || pIdx}>
                        <td>
                          <div className="detailed-project-cell">
                            <span className="project-bullet" style={{ backgroundColor: proj.color || '#00cc00' }} />
                            <div>
                              <div className="detailed-project-name">{proj.name}</div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{proj.subtitle || proj.client}</div>
                            </div>
                          </div>
                        </td>
                        {currentWeekDays.map(day => {
                          let cellSec = 0;
                          if (scopedActivities && scopedActivities.length > 0) {
                            const matchedActs = scopedActivities.filter(a => 
                              (a.project === proj.name || (!a.project && proj.name === 'Internal')) && 
                              normalizeDateToYMD(a.date) === day.dateStr
                            );
                            cellSec = matchedActs.reduce((acc, a) => acc + (a.durationSeconds || parseTimeToSeconds(a.durationFormatted) || 0), 0);
                          } else if (day.dateStr >= '2026-08-31' && day.dateStr <= '2026-09-06') {
                            const tsRow = filteredRows.find(r => (r.projectName || 'Internal') === proj.name);
                            if (tsRow && tsRow[day.key]) {
                              cellSec = parseTimeToSeconds(tsRow[day.key]);
                            }
                          }
                          const effectiveSec = roundingEnabled ? roundTo15Minutes(cellSec) : cellSec;
                          return (
                            <td key={day.dateStr} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', color: effectiveSec > 0 ? '#0f172a' : '#cbd5e1', fontWeight: effectiveSec > 0 ? 600 : 400 }}>
                              {effectiveSec > 0 ? formatSecondsToHMS(effectiveSec) : '—'}
                            </td>
                          );
                        })}
                        <td className="detailed-duration-cell" style={{ textAlign: 'right', fontWeight: 800, color: '#008a00' }}>
                          {proj.duration}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td style={{ color: '#0f172a' }}>TOTAL WEEKLY SUMMARY</td>
                    {currentWeekDays.map(day => {
                      let dayTotalSec = 0;
                      if (scopedActivities && scopedActivities.length > 0) {
                        const matchedActs = scopedActivities.filter(a => normalizeDateToYMD(a.date) === day.dateStr);
                        dayTotalSec = matchedActs.reduce((acc, a) => acc + (a.durationSeconds || parseTimeToSeconds(a.durationFormatted) || 0), 0);
                      } else if (day.dateStr >= '2026-08-31' && day.dateStr <= '2026-09-06') {
                        filteredRows.forEach(row => {
                          if (row[day.key]) {
                            dayTotalSec += parseTimeToSeconds(row[day.key]);
                          }
                        });
                      }
                      const effectiveDaySec = roundingEnabled ? roundTo15Minutes(dayTotalSec) : dayTotalSec;
                      return (
                        <td key={day.dateStr} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: effectiveDaySec > 0 ? '#008a00' : '#cbd5e1' }}>
                          {effectiveDaySec > 0 ? formatSecondsToHMS(effectiveDaySec) : '—'}
                        </td>
                      );
                    })}
                    <td className="detailed-duration-cell" style={{ textAlign: 'right', color: '#008a00', fontSize: '14px' }}>
                      {liveTotalTime}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : activeSubtab === 'Shared' ? (
          /* SHARED REPORTS MANAGEMENT VIEW */
          <div className="reports-detailed-card" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div className="detailed-report-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div className="detailed-report-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                <Globe size={18} color="#00cc00" />
                <span>Team & Management Shared Reports</span>
                <span className="detailed-count-badge" style={{ background: '#00cc00', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                  {sharedReportsList.length} Active Links
                </span>
              </div>
              <button 
                type="button" 
                className="btn-clockify-apply"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#00cc00', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                onClick={handleOpenShareModal}
              >
                <Plus size={14} />
                <span>Create Shared Report</span>
              </button>
            </div>

            <div className="reports-shared-kpi-grid" style={{ padding: '20px 20px 10px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div className="attendance-kpi-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <span className="attendance-kpi-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Shared Links</span>
                <div className="attendance-kpi-val" style={{ color: '#00cc00', fontSize: '24px', fontWeight: 800, margin: '4px 0 2px 0' }}>{sharedReportsList.length} Shared Links</div>
                <span className="attendance-kpi-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Live management review portals</span>
              </div>
              <div className="attendance-kpi-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <span className="attendance-kpi-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Employees</span>
                <div className="attendance-kpi-val" style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 800, margin: '4px 0 2px 0' }}>
                  {(() => {
                    const activeCount = Array.isArray(usersList) && usersList.length > 0 
                      ? usersList.filter(u => u.active !== false && u.accessGranted !== false).length || usersList.length 
                      : 5;
                    return `${activeCount} Employees`;
                  })()}
                </div>
                <span className="attendance-kpi-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Logged in & using Clockodo</span>
              </div>
              <div className="attendance-kpi-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                <span className="attendance-kpi-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Updating Tasks</span>
                <div className="attendance-kpi-val" style={{ color: '#10b981', fontSize: '24px', fontWeight: 800, margin: '4px 0 2px 0' }}>
                  {(() => {
                    const userSet = new Set();
                    if (Array.isArray(activities)) {
                      activities.forEach(a => {
                        const u = (a.user || a.userName || a.userEmail || '').trim();
                        if (u) userSet.add(u.toLowerCase());
                      });
                    }
                    const count = userSet.size > 0 ? userSet.size : (Array.isArray(usersList) && usersList.length > 0 ? Math.min(usersList.length, 4) : 4);
                    return `${count} Employees`;
                  })()}
                </div>
                <span className="attendance-kpi-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Actively tracking & logging work</span>
              </div>
            </div>

            <div className="clockodo-detailed-table-wrapper" style={{ padding: '0 20px 20px 20px' }}>
              <table className="clockodo-detailed-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '11px', textAlign: 'left' }}>
                    <th style={{ width: '280px', padding: '12px 14px', fontWeight: 700 }}>REPORT NAME</th>
                    <th style={{ width: '180px', padding: '12px 14px', fontWeight: 700 }}>PROJECT / SCOPE</th>
                    <th style={{ width: '160px', padding: '12px 14px', fontWeight: 700 }}>PERIOD</th>
                    <th style={{ width: '120px', padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>TOTAL TIME</th>
                    <th style={{ width: '130px', padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>ACCESS</th>
                    <th style={{ width: '110px', padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>VIEWS</th>
                    <th style={{ width: '180px', padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sharedReportsList.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <Globe size={28} color="#94a3b8" />
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>No Shared Reports Created Yet</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '400px' }}>
                            Create a public share link to provide your clients and management with a live, real-time deliverable portal.
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSharedReportsList(INITIAL_SHARED_REPORTS);
                              localStorage.setItem('clockodo_shared_reports_v2', JSON.stringify(INITIAL_SHARED_REPORTS));
                            }}
                            style={{
                              marginTop: '8px',
                              padding: '6px 14px',
                              background: '#f1f5f9',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#334155',
                              cursor: 'pointer'
                            }}
                          >
                            Restore Default Live Reports
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sharedReportsList.map((rep) => {
                      const isCopied = copiedLinkToken === rep.linkToken;
                      const scopeLabel = (rep.client === 'All Clients' || !rep.client) ? 'All Projects' : rep.client;
                      return (
                        <tr key={rep.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(0, 204, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Globe size={16} color="#008a00" />
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>{rep.name}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Created: {rep.createdDate}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span className="detailed-billable-badge" style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                              {scopeLabel}
                            </span>
                          </td>
                          <td className="detailed-date-cell" style={{ padding: '12px 14px', fontSize: '12px', color: '#334155' }}>
                            {rep.period}
                          </td>
                          <td className="detailed-duration-cell" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: '#008a00', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                            {rep.totalHours}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {rep.isPublic ? (
                              <span className="detailed-billable-badge" style={{ background: 'rgba(0, 204, 0, 0.1)', color: '#008a00', border: '1px solid rgba(0, 204, 0, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                ● Public Link
                              </span>
                            ) : (
                              <span className="detailed-billable-badge" style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                                <Lock size={11} style={{ marginRight: 4 }} /> Private
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#64748b', fontSize: '12px' }}>
                            {rep.viewsCount || 0} views
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleCopyShareLink(rep.linkToken)}
                                title="Copy Public Link"
                                style={{
                                  background: isCopied ? '#00cc00' : '#f1f5f9',
                                  color: isCopied ? '#ffffff' : '#334155',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                {isCopied ? <Check size={12} /> : <Copy size={12} />}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => window.open(`${window.location.origin}/#/shared/${rep.linkToken}`, '_blank')}
                                title="Preview Shared Report"
                                style={{
                                  background: '#f1f5f9',
                                  color: '#0284c7',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <ExternalLink size={12} />
                                <span>Preview</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSharedReport(rep.id)}
                                title="Delete Link"
                                style={{
                                  background: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  padding: '5px 8px',
                                  borderRadius: '5px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        ) : hasRecords ? (
          <>
            {/* Top Summary Role-Based KPI Metric Cards */}
            <div className="attendance-kpi-grid" style={{ marginBottom: '16px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="attendance-kpi-item">
                <span className="attendance-kpi-label">{summaryKPIs.kpi1Label}</span>
                <div className="attendance-kpi-val" style={{ color: summaryKPIs.kpi1Color }}>{summaryKPIs.kpi1Val}</div>
              </div>
              <div className="attendance-kpi-item">
                <span className="attendance-kpi-label">{summaryKPIs.kpi2Label}</span>
                <div className="attendance-kpi-val" style={{ color: summaryKPIs.kpi2Color }}>{summaryKPIs.kpi2Val}</div>
              </div>
              <div className="attendance-kpi-item">
                <span className="attendance-kpi-label">{summaryKPIs.kpi3Label}</span>
                <div className="attendance-kpi-val" style={{ color: summaryKPIs.kpi3Color }}>{summaryKPIs.kpi3Val}</div>
              </div>
            </div>

            {/* Visual Bar Chart with Mon-Sun Bars Matching Dashboard Large Size */}
            <div className="reports-chart-card" style={{ marginTop: '16px', padding: '28px 36px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <span style={{ fontSize: '13px', color: '#00cc00', fontWeight: 800, letterSpacing: '0.2px' }}>
                  {(() => {
                    let peakDay = dailyBarData[0]?.day || 'Mon, Aug 31';
                    let peakHours = 0;
                    dailyBarData.forEach(d => {
                      if (d.hours > peakHours) {
                        peakHours = d.hours;
                        peakDay = d.day;
                      }
                    });
                    return peakHours > 0 ? `Peak: ${peakDay} (${peakHours.toFixed(2)}h)` : 'No entries logged yet';
                  })()}
                </span>
              </div>

              <div className="reports-bars-scroll-wrapper" style={{ width: '100%', overflowX: 'auto', paddingBottom: '8px' }}>
                <div className="reports-bars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '20px', height: '310px', alignItems: 'flex-end', paddingBottom: '20px' }}>
                {dailyBarData.map((d, idx) => (
                  <div key={idx} className="reports-bar-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '10px' }}>
                    {/* Top Duration Label */}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: d.hours > 0 ? '#1e293b' : '#94a3b8', fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {d.time}
                    </span>

                    {/* Large Solid Green Bar Fill */}
                    <div 
                      className="reports-bar-fill" 
                      style={{ 
                        width: '100%',
                        maxWidth: '110px',
                        height: `${d.heightPercent}%`,
                        minHeight: d.hours > 0 ? '16px' : '4px',
                        background: d.hours > 0 ? '#00cc00' : '#e2e8f0',
                        borderRadius: '4px 4px 0 0',
                        boxShadow: d.hours > 0 ? '0 4px 10px rgba(0, 204, 0, 0.3)' : 'none',
                        transition: 'height 0.35s ease, background 0.2s ease',
                        cursor: 'pointer'
                      }}
                      title={`${d.day}: ${d.time}`}
                    />

                    {/* Day Label Beneath Baseline */}
                    <span style={{ fontSize: '13px', color: d.hours > 0 ? '#0f172a' : '#94a3b8', fontWeight: d.hours > 0 ? 800 : 600, whiteSpace: 'nowrap', marginTop: '6px' }}>
                      {d.day}
                    </span>
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* Group by Bar & Lower Content (Table + Segmented Donut) */}
            <div className="clockify-groupby-bar">
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Group by:</span>
              <div className="clockify-filter-pill" style={{ background: '#ffffff' }}>
                <select value={groupByPrimary} onChange={(e) => setGroupByPrimary(e.target.value)}>
                  <option value="Project">Project</option>
                  <option value="User">User / Team Member</option>
                  <option value="Date">Date</option>
                </select>
                <ChevronDown size={11} className="clockify-chevron" />
              </div>
              <div className="clockify-filter-pill" style={{ background: '#ffffff' }}>
                <select value={groupBySecondary} onChange={(e) => setGroupBySecondary(e.target.value)}>
                  <option value="Date">Date</option>
                  <option value="User">User / Team Member</option>
                  <option value="Project">Project</option>
                  <option value="Description">Description</option>
                </select>
                <ChevronDown size={11} className="clockify-chevron" />
              </div>
            </div>

            <div className="reports-summary-lower-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%', alignItems: 'stretch' }}>
              {/* Left Column: Group Breakdown Table with Scroll-Down Model & Dynamic Equal Height */}
              <div className="activity-card reports-table-scroll-container" style={{ 
                padding: '0', 
                borderRadius: '12px', 
                border: '1px solid #e2e8f0', 
                background: '#ffffff', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)', 
                display: 'flex', 
                flexDirection: 'column', 
                height: `${Math.max(540, 360 + summaryBreakdownList.length * 36)}px`,
                maxHeight: `${Math.max(540, 360 + summaryBreakdownList.length * 36)}px`,
                overflowY: 'auto', 
                overflowX: 'hidden', 
                minWidth: 0, 
                boxSizing: 'border-box' 
              }}>
                <table className="projects-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#ffffff' }}>
                    <tr style={{ background: '#ffffff', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase', padding: '16px 20px', background: '#ffffff' }}>
                        <span>
                          {groupByPrimary === 'User' ? 'TEAM MEMBER / USER' : (groupByPrimary === 'Client' ? 'CLIENT NAME' : (groupByPrimary === 'Date' ? 'DATE' : (groupByPrimary === 'Task' ? 'TASK' : (groupByPrimary === 'Tag' ? 'TAG' : 'PROJECT TITLE'))))}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>↑</span>
                      </th>
                      <th style={{ textAlign: 'right', fontSize: '12.5px', fontWeight: 700, color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase', padding: '16px 20px', background: '#ffffff' }}>
                        <span>DURATION</span>
                        <span style={{ fontSize: '11px', marginLeft: '6px', color: '#64748b' }}>⇅</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryBreakdownList.length === 0 ? (
                      <tr>
                        <td colSpan={2} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13.5px' }}>
                          No entries logged for the selected group filters.
                        </td>
                      </tr>
                    ) : (
                      summaryBreakdownList.map((item, idx) => {
                        const isExpanded = expandedGroupIds[item.id] !== false;
                        const hasChildren = item.children && item.children.length > 0;

                        return (
                          <React.Fragment key={item.id || idx}>
                            {/* Primary Group Row */}
                            <tr 
                              style={{ 
                                borderBottom: '1px solid #f1f5f9',
                                cursor: hasChildren ? 'pointer' : 'default',
                                transition: 'background 0.15s ease'
                              }}
                              onClick={() => hasChildren && toggleGroup(item.id)}
                              className="summary-table-row"
                            >
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {hasChildren ? (
                                    <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', transition: 'transform 0.15s ease' }}>
                                      {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                    </span>
                                  ) : (
                                    <span style={{ width: '15px', display: 'inline-block' }} />
                                  )}

                                  {/* Item bullet */}
                                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color || '#00cc00', flexShrink: 0 }} />

                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                                        {item.name}
                                      </span>
                                      {item.count > 0 && (
                                        <span style={{ 
                                          fontSize: '11.5px', 
                                          color: '#64748b', 
                                          background: '#f1f5f9', 
                                          padding: '2px 8px', 
                                          borderRadius: '12px',
                                          fontWeight: 600
                                        }}>
                                          {item.count} {groupBySecondary} {item.count > 1 ? 'entries' : 'entry'}
                                        </span>
                                      )}
                                    </div>

                                    {item.subtitle && (
                                      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '3px', fontWeight: 500 }}>
                                        {item.subtitle}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '14px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: 700, fontSize: '14px' }}>
                                <div>{item.duration}</div>
                                <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{item.percentage}%</div>
                              </td>
                            </tr>

                            {/* Secondary Group Nested Sub-Rows */}
                            {hasChildren && isExpanded && item.children.map((child, cIdx) => (
                              <tr 
                                key={child.id || `sub-${cIdx}`}
                                style={{ 
                                  background: '#f8fafc', 
                                  borderBottom: '1px solid #f1f5f9'
                                }}
                              >
                                <td style={{ padding: '11px 20px 11px 52px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: child.color || item.color || '#94a3b8', flexShrink: 0 }} />
                                    <div>
                                      <span style={{ color: '#334155', fontWeight: 600, fontSize: '13px' }}>{child.name}</span>
                                      {child.subtitle && child.subtitle !== child.name && (
                                        <span style={{ color: '#64748b', fontSize: '11.5px', marginLeft: '8px' }}>
                                          • {child.subtitle}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '11px 20px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#475569', fontSize: '13px', fontWeight: 600 }}>
                                  <div>{child.duration}</div>
                                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{child.percentage}% of group</div>
                                </td>
                              </tr>
                            ))}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Right Column: User / Project Ratio Breakdown & Large Donut Covering Half The Card */}
              <div className="reports-breakdown-card" style={{ 
                height: `${Math.max(540, 360 + summaryBreakdownList.length * 36)}px`,
                maxHeight: `${Math.max(540, 360 + summaryBreakdownList.length * 36)}px`,
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.2px' }}>
                    {groupByPrimary === 'User' ? 'Team Member Breakdown' : (groupByPrimary === 'Client' ? 'Client Ratio Breakdown' : (groupByPrimary === 'Date' ? 'Date Breakdown' : (groupByPrimary === 'Task' ? 'Task Ratio Breakdown' : (groupByPrimary === 'Tag' ? 'Tag Ratio Breakdown' : 'Project Ratio Breakdown'))))}
                  </span>
                  <span style={{ fontSize: '14px', color: '#008a00', fontWeight: 800, background: 'rgba(0, 204, 0, 0.08)', padding: '4px 12px', borderRadius: '6px', border: '1px solid rgba(0, 204, 0, 0.2)' }}>
                    {liveTotalTime}
                  </span>
                </div>

                {/* Large Impressive 260px Donut Chart Covering ~50% of the Card */}
                <div className="reports-donut-large-wrapper">
                  <svg width="260" height="260" viewBox="0 0 42 42" style={{ display: 'block', margin: '0 auto', width: '260px', height: '260px' }}>
                    <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5.5" />
                    {(() => {
                      let cumulative = 25;
                      return summaryBreakdownList.map((item, idx) => {
                        const offset = cumulative;
                        const pct = parseFloat(item.percentage);
                        cumulative -= pct;
                        return (
                          <circle
                            key={idx}
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke={item.color}
                            strokeWidth="5.5"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={offset}
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                      {liveTotalTime}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '4px' }}>
                      TOTAL PERIOD
                    </div>
                  </div>
                </div>

                {/* Color & Percentage Legend - Clean, Spacious & Full Width */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '8px' }}>
                  {summaryBreakdownList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: '6px', fontSize: '13.5px', background: '#ffffff', transition: 'background 0.15s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, marginRight: '16px' }}>
                        <span style={{ backgroundColor: item.color, width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 }} />
                        <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '13.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                          {item.name} {item.username && `(${item.username})`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                        <span style={{ color: '#475569', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>{item.duration}</span>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '13.5px', minWidth: '48px', textAlign: 'right' }}>{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* NO UPDATES / EMPTY STATE FOR DATES WITH 0 RECORDS (e.g. Aug 20, 2026) */
          <div className="reports-empty-state">
            <div className="reports-empty-icon">
              <Calendar size={32} color="var(--digi-green)" />
            </div>
            <h3 className="reports-empty-title">No Updates for {appliedRange}</h3>
            <p className="reports-empty-desc">
              There are no tracked hours or work session entries recorded for this date.
              Try selecting another date or switch back to the active week.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button"
                className="btn-apply-filter"
                onClick={() => {
                  setSelectedRange('This week (Aug 24 - Aug 30)');
                  setAppliedRange('This week (Aug 24 - Aug 30)');
                }}
              >
                Switch to This Week (Aug 24 - Aug 30)
              </button>
            </div>
          </div>
        )}

        {/* OFFICIAL PRINTABLE REPORT DOCUMENT (Rendered cleanly when printing / saving PDF) */}
        <div className="official-print-document">
          <div className="print-document-frame">
            {/* Top Green Brand Accent Bar */}
            <div className="print-accent-bar" />

            {/* Header with Company Logo & Document Info */}
            <div className="print-header">
              <div className="print-brand">
                <div className="print-logo-box">
                  <div 
                    className="print-logo-icon-box"
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0fed05 0%, #00cc00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5), 0 2px 5px rgba(0, 0, 0, 0.3)',
                      border: '1.5px solid #032117'
                    }}
                  >
                    <Clock size={25} color="#032117" strokeWidth={2.8} style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))' }} />
                  </div>
                  <div>
                    <div className="print-brand-name">
                      <span > CLOCK</span><span style={{ color: '#00cc00' }}>ODO</span>
                      <span className="print-pro-badge" style={{
                        background: 'linear-gradient(135deg, #0fed05 0%, #00cc00 100%)',
                        color: '#032117',
                        fontSize: '10.5px',
                        fontWeight: 900,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        marginLeft: '8px',
                        boxShadow: '0 3px 8px rgba(0, 0, 0, 0.45)',
                        border: '1px solid #032117'
                      }}>PRO</span>
                    </div>
                    <div className="print-brand-sub">DigiPlusAgency Online Workspace • Official Timesheet</div>
                  </div>
                </div>
              </div>

              <div className="print-doc-meta">
                <div className="print-title">TIME & ATTENDANCE REPORT</div>
                <div className="print-meta-line">Report Period: <strong>{appliedRange}</strong></div>
                <div className="print-meta-line">Generated Date: <strong > August 27, 2026</strong></div>
                <div className="print-meta-line">Verification: <strong style={{ color: '#009900' }}>OFFICIALLY VERIFIED</strong></div>
              </div>
            </div>

            {/* Key Summary Cards */}
            <div className="print-summary-box">
              <div className="print-summary-item">
                <span className="print-lbl">Employee</span>
                <span className="print-val">{USER_PROFILE.name}</span>
              </div>
              <div className="print-summary-item">
                <span className="print-lbl">Workspace</span>
                <span className="print-val">{USER_PROFILE.workspace}</span>
              </div>
              <div className="print-summary-item">
                <span className="print-lbl">Total Tracked Hours</span>
                <span className="print-val" style={{ color: '#009900', fontSize: '16px', fontWeight: 900 }}>{liveTotalTime}</span>
              </div>
              <div className="print-summary-item">
                <span className="print-lbl">Rounding Policy</span>
                <span className="print-val">{roundingEnabled ? '15-Minute Rounding Applied' : 'Exact Recorded Time'}</span>
              </div>
            </div>

            {/* Structured Printable Data Table with Clear Borders */}
            <table className="print-data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th style={{ width: '110px' }}>Date</th>
                  <th style={{ width: '160px' }}>Project</th>
                  <th > Task / Activity Description</th>
                  <th style={{ width: '125px', textAlign: 'center' }}>Time Interval</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Duration</th>
                  <th style={{ width: '75px', textAlign: 'center' }}>Billable</th>
                </tr>
              </thead>
              <tbody>
                {printTableRows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600 }}>{row.date}</td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{row.project}</strong>
                    </td>
                    <td>{row.description}</td>
                    <td style={{ textAlign: 'center', color: '#475569' }}>{row.interval}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 800, color: '#009900', fontSize: '12px' }}>
                      {row.duration}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: row.billable ? '#009900' : '#94a3b8' }}>
                      {row.billable ? '✓ Yes' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} style={{ textAlign: 'right', fontWeight: 900, fontSize: '12px' }}>
                    TOTAL HOURS LOGGED:
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 900, color: '#009900', fontSize: '15px', fontFamily: 'monospace' }}>
                    {liveTotalTime}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures & Certification */}
            <div className="print-signatures">
              <div className="print-sign-box">
                <div className="sign-line"></div>
                <span > Employee Signature ({USER_PROFILE.name})</span>
              </div>
              <div className="print-sign-box">
                <div className="sign-line"></div>
                <span > Manager / Lead Approval</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      {/* SHARE REPORT MODAL */}
      {showShareModal && (
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
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="#00cc00" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                  Share Public Report Link
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSharedReport} style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Report Name
                </label>
                <input
                  type="text"
                  value={newShareName}
                  onChange={(e) => setNewShareName(e.target.value)}
                  placeholder="e.g. JRKS Logistics - Client Timesheet"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ background: '#f1f5f9', padding: '12px 14px', borderRadius: '6px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Report Scope
                </div>
                <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                  Period: <strong>{appliedRange}</strong> | Total: <strong style={{ color: '#008a00' }}>{liveTotalTime}</strong>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Public Access Link</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Anyone with this link can view the report without login</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newSharePublic}
                    onChange={(e) => setNewSharePublic(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#00cc00' }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Show Billable Rates & Amounts</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Include hourly earnings and project financial total</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newShareShowAmounts}
                    onChange={(e) => setNewShareShowAmounts(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#00cc00' }}
                  />
                </label>
              </div>

              {/* Generated URL Box */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Live Link URL
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/#/shared/${newShareToken}`}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: '#0369a1'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyShareLink(newShareToken)}
                    style={{
                      background: copiedLinkToken === newShareToken ? '#10b981' : '#00cc00',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedLinkToken === newShareToken ? (
                      <>
                        <Check size={13} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#00cc00',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save & Create Shared Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW SHARED REPORT MODAL */}
      {previewSharedReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '680px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0a0e14',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="#00cc00" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                  {previewSharedReport.name} (Live Public View)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewSharedReport(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ffffff' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Client: <strong>{previewSharedReport.client}</strong></div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Period: <strong>{previewSharedReport.period}</strong></div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Total Recorded Time</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#008a00', fontFamily: 'var(--font-mono)' }}>
                    {previewSharedReport.totalHours}
                  </div>
                </div>
              </div>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                ✓ This report is publicly accessible via read-only link. Live entries tracked by team members will automatically reflect in real-time.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleCopyShareLink(previewSharedReport.linkToken)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#00cc00',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Copy Live Link
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewSharedReport(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}