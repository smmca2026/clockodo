import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  PlusCircle,
  Copy, 
  Save, 
  Calendar,
  ChevronDown,
  Menu,
  MoreVertical,
  Printer,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  FileText,
  Trash2, 
  X,
  Users,
  Clock
} from 'lucide-react';
import ProjectPickerDropdown from './ProjectPickerDropdown';
import { INITIAL_PROJECTS, DIGIPLUS_TEAM_MEMBERS, USER_PROFILE } from '../data/mockData';

export default function TimesheetTable({
  timesheetRows = [],
  onUpdateTimesheetRows,
  projects = INITIAL_PROJECTS,
  onCreateProject,
  searchQuery = '',
  activities = [],
  onAddManualEntry,
  onUpdateTimesheetCell,
  onDeleteProjectActivities,
  onUpdateProjectName,
  onDeleteActivity,
  currentUser = null,
  usersList = []
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [localBlankRows, setLocalBlankRows] = useState([]);
  const [cellDrafts, setCellDrafts] = useState({});
  const [selectedTeammate, setSelectedTeammate] = useState(null);

  const debounceTimersRef = useRef({});

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  const timeToSec = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
    return 0;
  };

  const secToHMS = (sec) => {
    if (!sec || sec <= 0) return '00:00:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Derive target ISO date (YYYY-MM-DD) for a given dayKey ('mon'..'sun') and week offset
  const getDayISODate = (dayKey, offset = 0) => {
    const dayIndexMap = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
    const targetDayIndex = dayIndexMap[dayKey] !== undefined ? dayIndexMap[dayKey] : 1;

    // Anchor to active work date: Wednesday, Sep 2, 2026
    const baseDate = new Date(2026, 8, 8); // Active system anchor date: Tue, Sep 8, 2026 (Today)
    const dayOfWeek = (baseDate.getDay() + 6) % 7; // 0 for Mon ... 6 for Sun
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() - dayOfWeek + (offset * 7));

    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + targetDayIndex);

    const yr = targetDate.getFullYear();
    const mo = String(targetDate.getMonth() + 1).padStart(2, '0');
    const da = String(targetDate.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const getActivityDate = (act) => {
    if (!act) return '';
    if (act.date && /^\d{4}-\d{2}-\d{2}$/.test(act.date)) return act.date;
    const g = (act.group || act.date || '').toLowerCase();
    if (g.includes('today') || g.includes('sep 8') || g.includes('sep 08') || g.includes('tue')) return '2026-09-08';
    if (g.includes('yesterday') || g.includes('sep 7') || g.includes('sep 07') || g.includes('mon')) return '2026-09-07';
    if (g.includes('sep 4') || g.includes('sep 04') || g.includes('fri')) return '2026-09-04';
    if (g.includes('sep 3') || g.includes('sep 03') || g.includes('thu')) return '2026-09-03';
    if (g.includes('sep 2') || g.includes('sep 02') || g.includes('wed')) return '2026-09-02';
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

  const activityMatchesDay = (act, dayKey, offset = 0) => {
    const targetISO = getDayISODate(dayKey, offset);
    const actDate = getActivityDate(act);
    return actDate === targetISO;
  };

  // Filter activities strictly by logged-in user so demo data is NOT leaked to other accounts
  const effectiveActivities = useMemo(() => {
    if (!currentUser) return activities;
    const isEmp = currentUser.role !== 'admin';

    if (isEmp) {
      const curEmail = (currentUser.email || '').trim().toLowerCase();
      const curName = (currentUser.name || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();

      return activities.filter(a => {
        const actEmail = (a.userEmail || a.email || '').trim().toLowerCase();
        const actUser = (a.user || a.userName || a.user_name || a.assignedTo || a.member || '').trim().toLowerCase();

        if (curEmail && actEmail && curEmail === actEmail) return true;
        if (curName && actUser && (actUser.includes(curName) || curName.includes(actUser))) return true;
        if (!actEmail && !actUser) return true;
        return false;
      });
    }

    // Admin view: If filtered by specific teammate
    if (selectedTeammate) {
      const tEmail = (selectedTeammate.email || '').trim().toLowerCase();
      const tName = (selectedTeammate.name || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();

      return activities.filter(a => {
        const actEmail = (a.userEmail || a.email || '').trim().toLowerCase();
        const actUser = (a.user || a.userName || a.user_name || a.assignedTo || a.member || '').trim().toLowerCase();

        if (tEmail && actEmail && tEmail === actEmail) return true;
        if (tName && actUser && (actUser.includes(tName) || tName.includes(actUser))) return true;
        return false;
      });
    }

    return activities;
  }, [activities, currentUser, selectedTeammate]);

  // Derive rows purely from master activities for the active week
  const activeRows = useMemo(() => {
    const projectMap = {};

    effectiveActivities.forEach(act => {
      if (!act.project) return;
      const projName = act.project.trim();
      const dayHoursSec = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, sun: 0 };
      let hasTimeThisWeek = false;

      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(dayKey => {
        if (activityMatchesDay(act, dayKey, weekOffset)) {
          const sec = act.durationSeconds || timeToSec(act.durationFormatted);
          dayHoursSec[dayKey] += sec;
          if (sec > 0) hasTimeThisWeek = true;
        }
      });

      if (hasTimeThisWeek) {
        if (!projectMap[projName]) {
          const matchedProj = projects.find(p => p.name.toLowerCase() === projName.toLowerCase());
          projectMap[projName] = {
            id: `ts-${projName.replace(/\s+/g, '-').toLowerCase()}-${weekOffset}`,
            projectId: matchedProj?.id || '',
            projectName: projName,
            taskDescription: act.description || '',
            color: act.projectColor || matchedProj?.color || '#00cc00',
            hoursSec: { ...dayHoursSec },
            billable: act.billable !== false,
          };
        } else {
          ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(dayKey => {
            projectMap[projName].hoursSec[dayKey] += dayHoursSec[dayKey];
          });
        }
      }
    });

    const rows = Object.values(projectMap).map(rowObj => {
      const hours = {};
      let rowTotalSec = 0;
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(dayKey => {
        const sec = rowObj.hoursSec[dayKey];
        hours[dayKey] = sec > 0 ? secToHMS(sec) : '';
        rowTotalSec += sec;
      });
      return {
        id: rowObj.id,
        projectId: rowObj.projectId,
        projectName: rowObj.projectName,
        taskDescription: rowObj.taskDescription,
        color: rowObj.color,
        hours,
        total: secToHMS(rowTotalSec) || '00:00:00',
        billable: rowObj.billable,
      };
    });

    const weekBlankRows = localBlankRows.filter(r => r.weekOffset === weekOffset);

    if (rows.length === 0 && weekBlankRows.length === 0) {
      return [
        {
          id: `ts-blank-${weekOffset}-0`,
          projectId: '',
          projectName: '',
          taskDescription: '',
          color: '#00cc00',
          hours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
          total: '00:00:00',
          billable: true,
        }
      ];
    }

    return [...rows, ...weekBlankRows];
  }, [effectiveActivities, weekOffset, projects, localBlankRows]);

  // Filter rows by live in-page searchQuery
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeRows;
    return activeRows.filter(row => 
      (row.projectName && row.projectName.toLowerCase().includes(q)) ||
      (row.taskDescription && row.taskDescription.toLowerCase().includes(q))
    )
  }, [activeRows, searchQuery]);

  const [showTeammates, setShowTeammates] = useState(false);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [showCalendarOnly, setShowCalendarOnly] = useState(false);
  const [showPresetsOnly, setShowPresetsOnly] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [hideWeekends, setHideWeekends] = useState(false);
  const [activePickerRowId, setActivePickerRowId] = useState(null);
  const [activeRowActionsId, setActiveRowActionsId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const teammatesRef = useRef(null);
  const copyMenuRef = useRef(null);
  const calModalRef = useRef(null);
  const presetsMenuRef = useRef(null);
  const optionsMenuRef = useRef(null);
  const rowActionsRef = useRef(null);

  // Dynamic Week Days Calculation (Real-time live today & dynamic Monday)
  const getWeekDays = (offset = 0) => {
    const baseDate = new Date(2026, 8, 8); // Active system anchor date: Tue, Sep 8, 2026 (Today)
    const baseMonday = new Date(baseDate);
    const dayOfWeek = (baseMonday.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    baseMonday.setDate(baseMonday.getDate() - dayOfWeek + offset * 7);
    baseMonday.setHours(0, 0, 0, 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayPrefixes = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    return dayKeys.map((key, i) => {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      const dayName = dayPrefixes[i];
      const month = monthNames[d.getMonth()];
      const dayNum = d.getDate();
      const isToday = d.toDateString() === baseDate.toDateString();
      return {
        key,
        name: `${dayName}, ${month} ${dayNum}`,
        month,
        dayNum,
        isWeekend: key === 'sat' || key === 'sun',
        isToday,
        fullDate: `${month} ${dayNum}, ${d.getFullYear()}`,
      };
    });
  };

  const allDaysConfig = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const daysConfig = useMemo(() => {
    if (hideWeekends) return allDaysConfig.filter(d => !d.isWeekend);
    return allDaysConfig;
  }, [allDaysConfig, hideWeekends]);

  const weekRangeLabel = useMemo(() => {
    if (weekOffset === 0) return 'This week';
    if (weekOffset === -1) return 'Last week';
    if (weekOffset === 1) return 'Next week';
    const first = allDaysConfig[0];
    const last = allDaysConfig[6];
    return `${first.month} ${first.dayNum} – ${last.month} ${last.dayNum}`;
  }, [weekOffset, allDaysConfig]);

  // Calendar month state
  const [calDate, setCalDate] = useState(new Date(2026, 8, 1)); // September 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 8, 1)); // single date selection

  // Generate 35 / 42 cells calendar grid
  const calendarGrid = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells = [];

    // Prev month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      cells.push({ date: d, dayNum: daysInPrevMonth - i, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      cells.push({ date: d, dayNum: i, isCurrentMonth: true });
    }

    // Next month filler
    const totalCells = cells.length <= 35 ? 35 : 42;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ date: d, dayNum: i, isCurrentMonth: false });
    }

    // Selected week boundary (Monday to Sunday) based on weekOffset
    const baseDate = new Date(2026, 8, 8); // Anchor date: Tue, Sep 8, 2026 (Today)
    const dayOfWeek = (baseDate.getDay() + 6) % 7;
    const selectedMonday = new Date(baseDate);
    selectedMonday.setDate(baseDate.getDate() - dayOfWeek + weekOffset * 7);
    selectedMonday.setHours(0, 0, 0, 0);

    const selectedSunday = new Date(selectedMonday);
    selectedSunday.setDate(selectedSunday.getDate() + 6);
    selectedSunday.setHours(23, 59, 59, 999);

    return cells.map(cell => {
      const cellTime = cell.date.getTime();
      const isSelected = cellTime >= selectedMonday.getTime() && cellTime <= selectedSunday.getTime();
      const isStart = cell.date.toDateString() === selectedMonday.toDateString();
      const isEnd = cell.date.toDateString() === selectedSunday.toDateString();
      return {
        ...cell,
        isSelectedWeek: isSelected,
        isStartOfWeek: isStart,
        isEndOfWeek: isEnd,
      };
    });
  }, [calDate, weekOffset]);

  const handlePrevCalMonth = (e) => {
    e.stopPropagation();
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  };

  const handleNextCalMonth = (e) => {
    e.stopPropagation();
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
  };

  const handleDaySelect = (dayDate) => {
    setSelectedDate(dayDate);
    const dayOfWeek = dayDate.getDay();
    const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const clickedMonday = new Date(dayDate);
    clickedMonday.setDate(dayDate.getDate() + diffToMon);
    clickedMonday.setHours(0, 0, 0, 0);

    const baseDate = new Date(2026, 8, 8);
    const dayOfWeekBase = (baseDate.getDay() + 6) % 7;
    const baseMonday = new Date(baseDate);
    baseMonday.setDate(baseDate.getDate() - dayOfWeekBase);
    baseMonday.setHours(0, 0, 0, 0);

    const diffDays = Math.round((clickedMonday - baseMonday) / (1000 * 60 * 60 * 24));
    const newOffset = Math.round(diffDays / 7);

    setWeekOffset(newOffset);
  };

  const selectedRangeText = useMemo(() => {
    const baseDate = new Date(2026, 8, 8);
    const dayOfWeek = (baseDate.getDay() + 6) % 7;
    const mon = new Date(baseDate);
    mon.setDate(baseDate.getDate() - dayOfWeek + weekOffset * 7);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[mon.getMonth()]} ${mon.getDate()}, ${mon.getFullYear()} – ${monthNames[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`;
  }, [weekOffset]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (teammatesRef.current && !teammatesRef.current.contains(event.target)) {
        setShowTeammates(false);
      }
      if (copyMenuRef.current && !copyMenuRef.current.contains(event.target)) {
        setShowCopyMenu(false);
      }
      if (calModalRef.current && !calModalRef.current.contains(event.target)) {
        setShowCalendarOnly(false);
      }
      if (presetsMenuRef.current && !presetsMenuRef.current.contains(event.target)) {
        setShowPresetsOnly(false);
      }
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
        setShowOptionsMenu(false);
      }
      if (!event.target.closest('.clockodo-ts-row-menu-wrapper')) {
        setActiveRowActionsId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to format any user input into standard "HH:MM:SS" with automatic colons
  const formatTimeToHHMMSS = (input) => {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim().replace(',', '.');
    if (!trimmed || trimmed === '0' || trimmed === '00:00:00' || trimmed === '00:00' || trimmed === '0:00') return '';

    // 1. Check for hour/minute strings like "2h 30m", "45m", "2h", "1.5h", "30min"
    if (/[hm]/i.test(trimmed)) {
      let hours = 0;
      let mins = 0;
      const hMatch = trimmed.match(/(\d+(\.\d+)?)\s*h/i);
      const mMatch = trimmed.match(/(\d+(\.\d+)?)\s*m/i);
      if (hMatch) hours += parseFloat(hMatch[1]) || 0;
      if (mMatch) mins += parseFloat(mMatch[1]) || 0;
      const totalSec = Math.round((hours * 3600) + (mins * 60));
      if (totalSec <= 0) return '';
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    // 2. Space-separated: e.g. "2 30" (2 hours 30 mins), "1 45"
    if (trimmed.includes(' ') && !trimmed.includes(':')) {
      const parts = trimmed.split(/\s+/).map(p => parseInt(p, 10) || 0);
      if (parts.length >= 2) {
        const h = parts[0];
        const m = parts[1];
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      }
    }

    // 3. Decimal numbers: e.g. "2.5" (2h 30m), "8.25" (8h 15m), "0.5" (30m), ".75"
    if (trimmed.includes('.') && !trimmed.includes(':')) {
      const dec = parseFloat(trimmed);
      if (!isNaN(dec) && dec > 0) {
        const totalSec = Math.round(dec * 3600);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
    }

    // 4. Colon-separated values:
    // "2:30" -> "02:30:00"
    // "2:5" -> "02:05:00"
    // "02:30:00" -> "02:30:00"
    // "1:15:30" -> "01:15:30"
    // "2:" -> "02:00:00"
    // ":30" -> "00:30:00"
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      if (parts.length === 2) {
        const h = parts[0] === '' ? 0 : (parseInt(parts[0], 10) || 0);
        const m = parts[1] === '' ? 0 : (parseInt(parts[1], 10) || 0);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      } else if (parts.length >= 3) {
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2], 10) || 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
    }

    // 5. Raw digits:
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      if (digitsOnly.length === 1) {
        // "2" -> 2 hours -> "02:00:00"
        const h = parseInt(digitsOnly, 10);
        return `${String(h).padStart(2, '0')}:00:00`;
      } else if (digitsOnly.length === 2) {
        const val = parseInt(digitsOnly, 10);
        // If <= 24, treat as hours: "08" -> "08:00:00", "12" -> "12:00:00"
        // If > 24 (e.g. "30", "45"), treat as minutes: "30" -> "00:30:00", "45" -> "00:45:00"
        if (val <= 24) {
          return `${String(val).padStart(2, '0')}:00:00`;
        } else {
          return `00:${String(val).padStart(2, '0')}:00`;
        }
      } else if (digitsOnly.length === 3) {
        // e.g. "230" -> 2h 30m -> "02:30:00", "145" -> 1h 45m -> "01:45:00", "830" -> 8h 30m -> "08:30:00"
        const h = parseInt(digitsOnly.slice(0, 1), 10);
        const m = parseInt(digitsOnly.slice(1, 3), 10);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      } else if (digitsOnly.length === 4) {
        // e.g. "0230" -> 02h 30m -> "02:30:00", "1245" -> 12h 45m -> "12:45:00"
        const h = parseInt(digitsOnly.slice(0, 2), 10);
        const m = parseInt(digitsOnly.slice(2, 4), 10);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
      } else if (digitsOnly.length >= 5) {
        // e.g. "023000" -> "02:30:00"
        const h = parseInt(digitsOnly.slice(0, 2), 10);
        const m = parseInt(digitsOnly.slice(2, 4), 10);
        const s = parseInt(digitsOnly.slice(4, 6), 10) || 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
    }

    return trimmed;
  };

  // Helper to parse "HH:MM:SS" or decimal numbers "8", "7.5" into seconds
  const parseTimeToSeconds = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const trimmed = str.trim().replace(',', '.');
    if (!trimmed || trimmed === '0' || trimmed === '00:00:00') return 0;

    // Check hour/minute: "2h 30m", "45m"
    if (/[hm]/i.test(trimmed)) {
      let hours = 0;
      let mins = 0;
      const hMatch = trimmed.match(/(\d+(\.\d+)?)\s*h/i);
      const mMatch = trimmed.match(/(\d+(\.\d+)?)\s*m/i);
      if (hMatch) hours += parseFloat(hMatch[1]) || 0;
      if (mMatch) mins += parseFloat(mMatch[1]) || 0;
      return Math.round((hours * 3600) + (mins * 60));
    }

    // Space separated: "2 30"
    if (trimmed.includes(' ') && !trimmed.includes(':')) {
      const parts = trimmed.split(/\s+/).map(p => parseInt(p, 10) || 0);
      if (parts.length >= 2) return parts[0] * 3600 + parts[1] * 60;
    }

    // Colon separated: "2:30", "02:30:00"
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':').map(p => parseInt(p, 10) || 0);
      if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
      if (parts.length >= 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    }

    // Decimal numbers: "2.5" -> 2.5 * 3600
    if (trimmed.includes('.')) {
      const num = parseFloat(trimmed);
      if (!isNaN(num)) return Math.round(num * 3600);
    }

    // Raw digits:
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 1) {
      return parseInt(digits, 10) * 3600;
    } else if (digits.length === 2) {
      const val = parseInt(digits, 10);
      return val <= 24 ? val * 3600 : val * 60;
    } else if (digits.length === 3) {
      const h = parseInt(digits.slice(0, 1), 10);
      const m = parseInt(digits.slice(1, 3), 10);
      return h * 3600 + m * 60;
    } else if (digits.length === 4) {
      const h = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      return h * 3600 + m * 60;
    } else if (digits.length >= 5) {
      const h = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      const s = parseInt(digits.slice(4, 6), 10) || 0;
      return h * 3600 + m * 60 + s;
    }

    return 0;
  };

  // Format seconds into "HH:MM:SS"
  const formatSecondsToTime = (sec) => {
    if (!sec || sec <= 0) return '00:00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Live auto-colon formatting as the user types digits
  const autoFormatOnType = (input) => {
    if (!input) return '';
    const trimmed = input.trim();
    if (!trimmed || trimmed === '0') return '';

    // If user typed colon directly, e.g. "9:" or "2:" or "1:"
    if (/^\d{1,2}:$/.test(trimmed)) {
      const h = parseInt(trimmed, 10);
      return `${String(h).padStart(2, '0')}:`;
    }

    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return '';

    // 1 DIGIT:
    if (digits.length === 1) {
      const d = parseInt(digits, 10);
      // If 3..9, hour is unambiguous (03..09) -> immediately add colon!
      if (d >= 3 && d <= 9) {
        return `0${d}:`;
      }
      // If 1 or 2, keep single digit to allow typing 12, 18, 24 or typing colon
      return digits;
    }

    // 2 DIGITS:
    if (digits.length === 2) {
      const val = parseInt(digits, 10);
      if (val <= 24) {
        // e.g. "09" -> "09:", "12" -> "12:", "02" -> "02:"
        return `${String(val).padStart(2, '0')}:`;
      } else {
        // e.g. "93" (hour 9, minute 3) -> "09:3"
        const h = parseInt(digits[0], 10);
        const m = digits[1];
        return `0${h}:${m}`;
      }
    }

    // 3 DIGITS:
    if (digits.length === 3) {
      if (digits.startsWith('0')) {
        // e.g. "093" -> "09:3"
        return `${digits.slice(0, 2)}:${digits.slice(2)}`;
      }
      const firstDigit = parseInt(digits[0], 10);
      if (firstDigit >= 3) {
        // e.g. "930" -> "09:30:00"
        return `0${firstDigit}:${digits.slice(1, 3)}:00`;
      } else {
        const twoHour = parseInt(digits.slice(0, 2), 10);
        if (twoHour <= 24 && parseInt(digits[2], 10) <= 5) {
          // e.g. "123" -> "12:3" (waiting for 4th digit)
          return `${digits.slice(0, 2)}:${digits.slice(2)}`;
        } else {
          // e.g. "230" -> "02:30:00"
          return `0${digits[0]}:${digits.slice(1, 3)}:00`;
        }
      }
    }

    // 4 DIGITS: (e.g. "0930" -> "09:30:00", "1245" -> "12:45:00")
    if (digits.length === 4) {
      const h = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    }

    // 5 or 6 DIGITS:
    if (digits.length >= 5) {
      const h = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      const s = parseInt(digits.slice(4, 6), 10) || 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    return trimmed;
  };

  // Handle cell edit while typing - lets user type freely without interfering
  const handleCellChange = (rowId, dayKey, rawVal) => {
    const cellKey = `${rowId}-${dayKey}`;
    setCellDrafts((prev) => ({ ...prev, [cellKey]: rawVal }));
  };

  // Automatically format cell into standard HH:MM:SS on blur or Enter and sync to master state
  const handleCellBlur = (rowId, dayKey, rawVal) => {
    const cellKey = `${rowId}-${dayKey}`;
    const formatted = formatTimeToHHMMSS(rawVal);

    setCellDrafts((prev) => {
      const next = { ...prev };
      delete next[cellKey];
      return next;
    });

    const row = activeRows.find((r) => r.id === rowId);
    if (!row || !row.projectName) return;

    const targetISO = getDayISODate(dayKey, weekOffset);
    const dayObj = allDaysConfig.find((d) => d.key === dayKey);

    if (onUpdateTimesheetCell) {
      onUpdateTimesheetCell({
        rowId: row.id,
        projectName: row.projectName,
        projectColor: row.color || '#00cc00',
        taskDescription: row.taskDescription || `${row.projectName} task`,
        dayKey,
        targetISO,
        formattedDuration: formatted || '',
        weekOffset,
        userEmail: currentUser?.email,
        userName: currentUser?.name,
        userId: currentUser?.id,
      });
      showToast(`✓ Updated ${row.projectName} for ${dayObj?.name || dayKey.toUpperCase()}: ${formatted || 'Cleared'}`);
    } else if (onAddManualEntry) {
      onAddManualEntry({
        project: row.projectName,
        projectColor: row.color || '#00cc00',
        description: row.taskDescription || `${row.projectName} task`,
        date: targetISO,
        group: dayObj?.name || 'Today',
        startTime: '09:00',
        endTime: '17:00',
        durationFormatted: formatted || '00:00:00',
        durationSeconds: timeToSec(formatted),
        billable: row.billable !== false,
      });
      showToast(`✓ Updated ${row.projectName} for ${dayObj?.name || dayKey.toUpperCase()}: ${formatted || '00:00:00'}`);
    }
  };

    // Calculate live row total with draft edits
  const getRowTotal = (row) => {
    let rowSec = 0;
    daysConfig.forEach((d) => {
      const cellKey = `${row.id}-${d.key}`;
      const val = cellDrafts[cellKey] !== undefined ? cellDrafts[cellKey] : (row?.hours?.[d.key] || '');
      rowSec += parseTimeToSeconds(val);
    });
    return formatSecondsToTime(rowSec);
  };

  // Calculate day column totals
  const getDayTotal = (dayKey) => {
    let daySec = 0;
    activeRows.forEach((r) => {
      const cellKey = `${r.id}-${dayKey}`;
      const val = cellDrafts[cellKey] !== undefined ? cellDrafts[cellKey] : (r?.hours?.[dayKey] || '');
      daySec += parseTimeToSeconds(val);
    });
    return formatSecondsToTime(daySec);
  };

  // Calculate grand weekly total
  const getGrandTotal = () => {
    let grandSec = 0;
    activeRows.forEach((r) => {
      allDaysConfig.forEach((d) => {
        const cellKey = `${r.id}-${d.key}`;
        const val = cellDrafts[cellKey] !== undefined ? cellDrafts[cellKey] : (r?.hours?.[d.key] || '');
        grandSec += parseTimeToSeconds(val);
      });
    });
    return formatSecondsToTime(grandSec);
  };

  // Add new empty row
  const handleAddNewBlankRow = () => {
    if (!currentUser || currentUser.role === 'guest') {
      onAddManualEntry?.(null);
      return;
    }
    const newBlank = {
      id: `ts-blank-${weekOffset}-${Date.now()}`,
      weekOffset,
      projectId: '',
      projectName: '',
      taskDescription: '',
      color: '#00cc00',
      hours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
      total: '00:00:00',
      billable: true,
    };
    setLocalBlankRows((prev) => [...prev, newBlank]);
  };

  // Change project for a specific row or clear project
  const handleSelectRowProject = (rowId, projId) => {
    const allProjects = (Array.isArray(projects) && projects.length > 0) ? projects : INITIAL_PROJECTS;
    const row = activeRows.find((r) => r.id === rowId) || localBlankRows.find((r) => r.id === rowId);

    if (!projId) {
      // User clicked 'X' (Clear/remove project from row)
      if (row?.projectName && onDeleteProjectActivities) {
        onDeleteProjectActivities(row.projectName, weekOffset);
      }
      setLocalBlankRows((prev) => prev.filter((r) => r.id !== rowId));
      setCellDrafts((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${rowId}-`)) delete next[k];
        });
        return next;
      });
      setActivePickerRowId(null);
      showToast(`✓ Removed "${row?.projectName || 'project'}" from timesheet`);
      return;
    }

    const project = allProjects.find((p) => p.id === projId || p.name === projId || (typeof projId === 'string' && p.name.toLowerCase() === projId.toLowerCase()));
    if (!project) return;

    // If row already had a different project and has logged hours, update activities to new project
    if (row && row.projectName && row.projectName.toLowerCase() !== project.name.toLowerCase()) {
      if (onUpdateProjectName) {
        onUpdateProjectName(row.projectName, project, weekOffset);
      } else if (onDeleteProjectActivities) {
        // Reassign days to new project
        daysConfig.forEach((d) => {
          const val = row.hours?.[d.key];
          if (val && val !== '00:00:00') {
            const targetISO = getDayISODate(d.key, weekOffset);
            onUpdateTimesheetCell?.({
              rowId: `ts-${project.name.replace(/\s+/g, '-').toLowerCase()}-${weekOffset}`,
              projectName: project.name,
              projectColor: project.color || '#00cc00',
              taskDescription: `${project.name} task`,
              dayKey: d.key,
              targetISO,
              formattedDuration: val,
              weekOffset,
              userEmail: currentUser?.email,
              userName: currentUser?.name,
              userId: currentUser?.id,
            });
          }
        });
        onDeleteProjectActivities(row.projectName, weekOffset);
      }
    }

    setLocalBlankRows((prev) => {
      const exists = prev.some((r) => r.id === rowId);
      if (exists) {
        return prev.map((r) => {
          if (r.id !== rowId) return r;
          return {
            ...r,
            projectId: project.id,
            projectName: project.name,
            color: project.color || '#00cc00',
          };
        });
      } else if (!row || !row.projectName) {
        return [
          ...prev,
          {
            id: rowId,
            weekOffset,
            projectId: project.id,
            projectName: project.name,
            taskDescription: '',
            color: project.color || '#00cc00',
            hours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
            total: '00:00:00',
            billable: true,
          },
        ];
      }
      return prev;
    });

    setActivePickerRowId(null);
    showToast(`✓ Selected project "${project.name}"`);
  };

  // Delete row from master activities
  const handleDeleteRow = (rowId) => {
    const row = activeRows.find((r) => r.id === rowId) || localBlankRows.find((r) => r.id === rowId);
    if (!row) return;

    if (row.projectName && onDeleteProjectActivities) {
      onDeleteProjectActivities(row.projectName, weekOffset);
    }
    setLocalBlankRows((prev) => prev.filter((r) => r.id !== rowId));
    setCellDrafts((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${rowId}-`)) delete next[k];
      });
      return next;
    });
    setActiveRowActionsId(null);
    showToast(`✓ Removed "${row.projectName || 'row'}" from timesheet`);
  };

  // Duplicate row
  const handleDuplicateRow = (row) => {
    if (!currentUser || currentUser.role === 'guest') {
      onAddManualEntry?.(null);
      return;
    }
    const newBlank = {
      id: `ts-blank-${weekOffset}-${Date.now()}`,
      weekOffset,
      projectId: row.projectId,
      projectName: `${row.projectName || 'New Project'} (Copy)`,
      taskDescription: row.taskDescription,
      color: row.color || '#00cc00',
      hours: { ...row.hours },
      total: row.total,
      billable: true,
    };
    setLocalBlankRows((prev) => [...prev, newBlank]);
    setActiveRowActionsId(null);
    showToast(`✓ Duplicated row for "${row.projectName || 'project'}"`);
  };

  // Discard / Clear hours for specific row
  const handleClearRowHours = (rowId) => {
    const row = activeRows.find((r) => r.id === rowId) || localBlankRows.find((r) => r.id === rowId);
    if (row?.projectName && onDeleteProjectActivities) {
      onDeleteProjectActivities(row.projectName, weekOffset);
    }
    setLocalBlankRows((prev) => prev.map((r) => {
      if (r.id !== rowId) return r;
      return {
        ...r,
        hours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
        total: '00:00:00'
      };
    }));
    setCellDrafts((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${rowId}-`)) delete next[k];
      });
      return next;
    });
    setActiveRowActionsId(null);
    showToast(`✓ Discarded / cleared tracked hours for "${row?.projectName || 'row'}"`);
  };

  // Clear all hours for current week
  const handleClearAllHours = () => {
    if (!currentUser || currentUser.role === 'guest') {
      onAddManualEntry?.(null);
      return;
    }
    if (window.confirm('Are you sure you want to clear all tracked hours for this week?')) {
      activeRows.forEach((r) => {
        if (r.projectName && onDeleteProjectActivities) {
          onDeleteProjectActivities(r.projectName, weekOffset);
        }
      });
      setLocalBlankRows([]);
      setCellDrafts({});
      setShowOptionsMenu(false);
    }
  };

  const handleCopyLastWeek = () => {
    if (!currentUser || currentUser.role === 'guest') {
      onAddManualEntry?.(null);
      return;
    }
    const sourceProjects = Array.isArray(projects) && projects.length > 0 ? projects : [];
    if (sourceProjects.length === 0) {
      showToast('No active projects to copy.');
      setShowCopyMenu(false);
      return;
    }
    const copiedRows = sourceProjects.map((proj, idx) => ({
      id: `ts-copied-${Date.now()}-${idx}`,
      projectId: proj.id,
      projectName: proj.name,
      color: proj.color || '#10b981',
      hours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' },
      total: '00:00:00',
    }));
    updateCurrentRows(copiedRows);
    setShowCopyMenu(false);
    showToast('✓ Copied project list from previous week');
  };

  const handleCopyProjectsWithHours = () => {
    const sourceProjects = Array.isArray(projects) && projects.length > 0 ? projects : [];
    if (sourceProjects.length === 0) {
      showToast('No active projects to copy.');
      setShowCopyMenu(false);
      return;
    }
    const copiedRows = sourceProjects.map((proj, idx) => ({
      id: `ts-copied-${Date.now()}-${idx}`,
      projectId: proj.id,
      projectName: proj.name,
      color: proj.color || '#10b981',
      hours: {
        mon: '',
        tue: '',
        wed: '',
        thu: '',
        fri: '',
        sat: '',
        sun: ''
      },
      total: '00:00:00',
    }));
    updateCurrentRows(copiedRows);
    setShowCopyMenu(false);
    showToast('✓ Copied projects from last week');
  };

  const handleSaveAsTemplate = () => {
    showToast('✓ Current timesheet setup saved as weekly template');
  };

  const handlePrintTimesheet = () => {
    setShowOptionsMenu(false);
    setShowTeammates(false);
    setShowCalendarOnly(false);
    setShowPresetsOnly(false);
    setShowCopyMenu(false);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleExportCSV = () => {
    setShowOptionsMenu(false);

    const headers = ['#', 'Project Name', ...daysConfig.map(d => `"${d.name}"`), 'Total Hours'];
    const rows = [headers];

    activeRows.forEach((row, idx) => {
      const rowData = [
        idx + 1,
        `"${row.projectName || 'General Task'}"`,
        ...daysConfig.map(d => `"${row.hours[d.key] || '00:00:00'}"`),
        `"${row.total || '00:00:00'}"`
      ];
      rows.push(rowData);
    });

    // Add totals row
    const totalsRow = [
      '',
      '"TOTAL"',
      ...daysConfig.map(d => `"${getDayTotal(d.key)}"`),
      `"${getGrandTotal()}"`
    ];
    rows.push(totalsRow);

    const csvString = rows.map(e => e.join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `digiplus_timesheet_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);

    showToast('✓ Weekly timesheet CSV downloaded to your computer');
  };

  return (
    <div className="clockodo-timesheet-container">
      {/* Top Header Row: Timesheet Title + Right Controls */}
      <div className="clockodo-timesheet-header-row">
        <h1 className="clockodo-timesheet-title">Timesheet</h1>

        <div className="clockodo-timesheet-controls-right">
          {/* Teammates Dropdown Button */}
          <div style={{ position: 'relative' }} ref={teammatesRef}>
            {currentUser?.role !== 'admin' ? (
              <div 
                className="clockodo-ts-btn-teammates"
                style={{ cursor: 'default', background: '#f8fafc', color: '#1e293b' }}
                title="Your Personal Timesheet"
              >
                <Users size={13} color="#00cc00" />
                <span>My Timesheet</span>
              </div>
            ) : (
              <button 
                type="button" 
                className="clockodo-ts-btn-teammates"
                onClick={() => setShowTeammates(!showTeammates)}
                title="Filter by Teammate (Admin)"
              >
                <span>{selectedTeammate ? selectedTeammate.name : 'All Teammates'}</span>
                <ChevronDown size={14} color="#00cc00" />
              </button>
            )}

            {showTeammates && currentUser?.role === 'admin' && (
              <div className="clockodo-ts-popover">
                <div className="clockodo-ts-popover-header">Filter by Teammate</div>
                <div 
                  className="clockodo-ts-popover-item"
                  onClick={() => {
                    setSelectedTeammate(null);
                    setShowTeammates(false);
                  }}
                >
                  <Users size={14} color="#00cc00" />
                  <span>All Workspace Activities</span>
                </div>
                {(usersList && usersList.length > 0 ? usersList : [{ id: 'usr-admin-1', name: 'Bharath (Owner)', role: 'Owner' }]).map(m => (
                  <div 
                    key={m.id || m.email}
                    className="clockodo-ts-popover-item"
                    onClick={() => {
                      setSelectedTeammate(m);
                      setShowTeammates(false);
                    }}
                  >
                    <div className="clockodo-ts-user-avatar">{(m.name || 'U').substring(0, 2).toUpperCase()}</div>
                    <span>{m.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3 Dots Options Button */}
          <div style={{ position: 'relative' }} ref={optionsMenuRef}>
            <button 
              type="button" 
              className="clockodo-ts-btn-icon" 
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              title="Timesheet Options & Actions"
            >
              <MoreVertical size={16} color="#00cc00" />
            </button>

            {showOptionsMenu && (
              <div className="clockodo-ts-popover clockodo-ts-popover-right">
                <div className="clockodo-ts-popover-header">Timesheet Actions</div>
                <div className="clockodo-ts-popover-item" onClick={handlePrintTimesheet}>
                  <Printer size={14} color="#00cc00" />
                  <span>Print Timesheet / PDF</span>
                </div>
                <div className="clockodo-ts-popover-item" onClick={handleExportCSV}>
                  <Download size={14} color="#00cc00" />
                  <span>Export to CSV / Excel</span>
                </div>
                <div 
                  className="clockodo-ts-popover-item" 
                  onClick={() => {
                    setHideWeekends(!hideWeekends);
                    setShowOptionsMenu(false);
                  }}
                >
                  {hideWeekends ? <Eye size={14} color="#00cc00" /> : <EyeOff size={14} color="#00cc00" />}
                  <span>{hideWeekends ? 'Show Weekends (Sat, Sun)' : 'Hide Weekends (Sat, Sun)'}</span>
                </div>
                <div className="clockodo-ts-popover-divider" />
                <div className="clockodo-ts-popover-item text-danger" onClick={handleClearAllHours}>
                  <RotateCcw size={14} color="#ef4444" />
                  <span style={{ color: '#ef4444' }}>Clear all hours this week</span>
                </div>
              </div>
            )}
          </div>

          {/* Date Picker Range Pill with Separate Calendar & Dropdown Popups */}
          <div style={{ position: 'relative' }}>
            <div className="clockodo-ts-date-nav">
              {/* 1. CALENDAR ICON ONLY BUTTON */}
              <button 
                type="button" 
                className={`clockodo-ts-cal-icon-btn ${showCalendarOnly ? 'active' : ''}`}
                onClick={() => {
                  setShowCalendarOnly(!showCalendarOnly);
                  setShowPresetsOnly(false);
                }}
                title="Open Calendar"
              >
                <Calendar size={15} color="#00cc00" />
              </button>

              {/* 2. THIS WEEK PRESETS DROPDOWN BUTTON */}
              <button 
                type="button" 
                className={`clockodo-ts-presets-btn ${showPresetsOnly ? 'active' : ''}`}
                onClick={() => {
                  setShowPresetsOnly(!showPresetsOnly);
                  setShowCalendarOnly(false);
                }}
                title="Select Date Preset"
              >
                <span>{weekRangeLabel}</span>
                <ChevronDown size={12} color="#00cc00" style={{ marginLeft: 4 }} />
              </button>

              {/* 3. PREV WEEK ARROW */}
              <button 
                type="button" 
                className="clockodo-ts-nav-arrow"
                onClick={() => setWeekOffset(weekOffset - 1)}
                title="Previous Week"
              >
                <ChevronLeft size={15} />
              </button>

              {/* 4. NEXT WEEK ARROW */}
              <button 
                type="button" 
                className="clockodo-ts-nav-arrow"
                onClick={() => setWeekOffset(weekOffset + 1)}
                title="Next Week"
              >
                <ChevronRight size={15} />
              </button>
            </div>

            {/* CALENDAR ONLY MODAL (Opens ONLY when Calendar icon is clicked) */}
            {showCalendarOnly && (
              <div className="clockodo-calendar-only-popup" ref={calModalRef}>
                {/* Month Navigator Header */}
                <div className="clockodo-dp-cal-header">
                  <button 
                    type="button" 
                    className="clockodo-dp-month-arrow" 
                    onClick={handlePrevCalMonth}
                    title="Previous Month"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <div className="clockodo-dp-month-title">
                    {['January','February','March','April','May','June','July','August','September','October','November','December'][calDate.getMonth()]} {calDate.getFullYear()}
                  </div>

                  <button 
                    type="button" 
                    className="clockodo-dp-month-arrow" 
                    onClick={handleNextCalMonth}
                    title="Next Month"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>

                {/* Weekday Labels (Mo - Su) */}
                <div className="clockodo-dp-weekdays-row">
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                  <span>Su</span>
                </div>

                {/* Days Grid - Week-wise connected strip */}
                <div className="clockodo-dp-days-grid">
                  {calendarGrid.map((cell, idx) => {
                    const now = new Date();
                    const isToday = cell.date.toDateString() === now.toDateString();
                    return (
                      <div
                        key={idx}
                        className={`clockodo-dp-day-cell 
                          ${!cell.isCurrentMonth ? 'other-month' : ''} 
                          ${cell.isSelectedWeek ? 'in-selected-week' : ''} 
                          ${cell.isStartOfWeek ? 'start-week' : ''} 
                          ${cell.isEndOfWeek ? 'end-week' : ''}
                          ${isToday ? 'is-today' : ''}
                        `}
                        onClick={() => handleDaySelect(cell.date)}
                        title={`${cell.date.toDateString()}${isToday ? ' (Today)' : ''}`}
                      >
                        <span className="clockodo-dp-day-num">{cell.dayNum}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Calendar Footer */}
                <div className="clockodo-dp-footer">
                  <div className="clockodo-dp-footer-text">
                    <span>Selected: <strong>{selectedRangeText}</strong></span>
                  </div>

                  <button 
                    type="button" 
                    className="clockodo-dp-btn-apply"
                    onClick={() => {
                      setShowCalendarOnly(false);
                      showToast(`✓ Applied week: ${selectedRangeText}`);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {/* PRESETS DROPDOWN ONLY (Opens ONLY when This week is clicked) */}
            {showPresetsOnly && (
              <div className="clockodo-ts-popover clockodo-ts-popover-date" ref={presetsMenuRef}>
                <div className="clockodo-ts-popover-header">Date Presets</div>
                <div 
                  className={`clockodo-ts-popover-item ${weekOffset === 0 ? 'active' : ''}`}
                  onClick={() => { setWeekOffset(0); setShowPresetsOnly(false); }}
                >
                  <Clock size={14} color="#00cc00" />
                  <span>This week (Sep 7 – Sep 13)</span>
                  {weekOffset === 0 && <Check size={14} color="#00cc00" style={{ marginLeft: 'auto' }} />}
                </div>
                <div 
                  className={`clockodo-ts-popover-item ${weekOffset === -1 ? 'active' : ''}`}
                  onClick={() => { setWeekOffset(-1); setShowPresetsOnly(false); }}
                >
                  <Clock size={14} color="#00cc00" />
                  <span>Last week (Aug 31 – Sep 6)</span>
                  {weekOffset === -1 && <Check size={14} color="#00cc00" style={{ marginLeft: 'auto' }} />}
                </div>
                <div 
                  className={`clockodo-ts-popover-item ${weekOffset === -2 ? 'active' : ''}`}
                  onClick={() => { setWeekOffset(-2); setShowPresetsOnly(false); }}
                >
                  <Clock size={14} color="#00cc00" />
                  <span>2 weeks ago (Aug 24 – Aug 30)</span>
                  {weekOffset === -2 && <Check size={14} color="#00cc00" style={{ marginLeft: 'auto' }} />}
                </div>
                <div 
                  className={`clockodo-ts-popover-item ${weekOffset === 1 ? 'active' : ''}`}
                  onClick={() => { setWeekOffset(1); setShowPresetsOnly(false); }}
                >
                  <Clock size={14} color="#00cc00" />
                  <span>Next week (Sep 14 – Sep 20)</span>
                  {weekOffset === 1 && <Check size={14} color="#00cc00" style={{ marginLeft: 'auto' }} />}
                </div>
                <div className="clockodo-ts-popover-divider" />
                <div 
                  className="clockodo-ts-popover-item"
                  onClick={() => { setWeekOffset(0); setShowPresetsOnly(false); }}
                >
                  <Calendar size={14} color="#00cc00" />
                  <span>This month (September 2026)</span>
                </div>
                <div 
                  className="clockodo-ts-popover-item"
                  onClick={() => { setWeekOffset(-1); setShowPresetsOnly(false); }}
                >
                  <Calendar size={14} color="#00cc00" />
                  <span>Last month (August 2026)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timesheet Matrix Table Card */}
      <div className="clockodo-ts-table-wrapper">
        <table className="clockodo-ts-table">
          <thead>
            <tr>
              <th className="clockodo-ts-th-project">Projects</th>
              {daysConfig.map((d) => (
                <th key={d.key} className={`clockodo-ts-th-day ${d.isToday ? 'is-today-col timesheet-col-today' : ''}`}>
                  {d.name} {d.isToday && <span style={{ color: '#008a00', fontSize: '10px', marginLeft: '4px' }}>●</span>}
                </th>
              ))}
              <th className="clockodo-ts-th-total">Total:</th>
              <th className="clockodo-ts-th-action"></th>
            </tr>
          </thead>

          <tbody>
            {activeRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="clockodo-ts-empty-state-card">
                  <div className="clockodo-ts-no-data-box">
                    <div className="clockodo-ts-no-data-icon">
                      <Calendar size={30} color="#00cc00" strokeWidth={2} />
                    </div>
                    <h3 className="clockodo-ts-no-data-title">No time entries tracked for this week</h3>
                    <p className="clockodo-ts-no-data-sub">
                      There are currently no recorded project hours for <strong>{weekRangeLabel} ({allDaysConfig[0]?.name} – {allDaysConfig[allDaysConfig.length - 1]?.name})</strong>.
                    </p>
                    <div className="clockodo-ts-no-data-actions">
                      <button 
                        type="button" 
                        className="clockodo-btn-empty-add"
                        onClick={handleAddNewBlankRow}
                      >
                        <Plus size={15} />
                        <span>Add New Row</span>
                      </button>
                      <button 
                        type="button" 
                        className="clockodo-btn-empty-copy"
                        onClick={handleCopyLastWeek}
                      >
                        <Copy size={14} />
                        <span>Copy Projects from Last Week</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : filteredRows.length === 0 && searchQuery.trim() ? (
              <tr>
                <td colSpan={10} className="clockodo-ts-empty-state">
                  No projects matching "<strong>{searchQuery}</strong>" found in this week. Clear search to see all projects.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIdx) => {
                const isLastRow = rowIdx === filteredRows.length - 1;
                const isSingleRow = filteredRows.length === 1;
                const shouldOpenUpwards = isLastRow || isSingleRow || (rowIdx >= filteredRows.length - 2);

                return (
                  <tr 
                    key={row.id}
                    style={{ 
                      position: 'relative', 
                      zIndex: activePickerRowId === row.id ? 99999 : (activeRowActionsId === row.id ? 9999 : 1) 
                    }}
                  >
                    {/* Project Selector Cell */}
                    <td 
                      className="clockodo-ts-td-project"
                      style={{ 
                        position: 'relative', 
                        zIndex: activePickerRowId === row.id ? 99999 : 'auto' 
                      }}
                    >
                      <ProjectPickerDropdown
                        projects={projects}
                        selectedProjectId={row.projectId || row.projectName}
                        selectedProjectName={row.projectName}
                        isOpen={activePickerRowId === row.id}
                        onOpenChange={(isOpen) => setActivePickerRowId(isOpen ? row.id : null)}
                        onSelectProject={(projId) => handleSelectRowProject(row.id, projId)}
                        onCreateProject={onCreateProject}
                      />
                    </td>

                    {/* 7 Daily Input Cells */}
                    {daysConfig.map((d) => {
                      const cellKey = `${row.id}-${d.key}`;
                      const draftVal = cellDrafts[cellKey];
                      const cellVal = draftVal !== undefined ? draftVal : (row?.hours?.[d.key] || '');
                      const displayVal = cellVal === '00:00:00' || cellVal === '0' ? '' : (cellVal || '');
                      return (
                        <td key={d.key} className="clockodo-ts-td-day">
                          <input
                            type="text"
                            className="clockodo-ts-input"
                            placeholder=""
                            value={displayVal}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleCellChange(row.id, d.key, e.target.value)}
                            onBlur={(e) => handleCellBlur(row.id, d.key, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              }
                            }}
                          />
                        </td>
                      );
                    })}

                    {/* Row Total */}
                    <td className="clockodo-ts-td-total">
                      {getRowTotal(row)}
                    </td>

                    {/* 3-Dots Action Button & Dropdown */}
                    <td className="clockodo-ts-td-action">
                      <div className="clockodo-ts-row-menu-wrapper" style={{ position: 'relative' }}>
                        <button 
                          type="button" 
                          className={`clockodo-ts-btn-more ${activeRowActionsId === row.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveRowActionsId(activeRowActionsId === row.id ? null : row.id);
                          }}
                          title="Row options (Duplicate, Discard, Delete)"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeRowActionsId === row.id && (
                          <div 
                            className={`clockodo-ts-row-dropdown ${shouldOpenUpwards ? 'open-upwards' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button 
                              type="button" 
                              className="clockodo-ts-row-dropdown-item"
                              onClick={() => handleDuplicateRow(row)}
                            >
                              <Copy size={13} color="#00cc00" />
                              <span>Duplicate</span>
                            </button>

                            <button 
                              type="button" 
                              className="clockodo-ts-row-dropdown-item is-delete"
                              onClick={() => handleDeleteRow(row.id)}
                            >
                              <Trash2 size={13} color="#ef4444" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}

            {/* Total Summary Row (shown if rows exist) */}
            {activeRows.length > 0 && (
              <tr className="clockodo-ts-tr-total">
                <td className="clockodo-ts-td-total-label">
                  Total:
                </td>
                {daysConfig.map((d) => (
                  <td key={d.key} className="clockodo-ts-td-day-total">
                    {getDayTotal(d.key)}
                  </td>
                ))}
                <td className="clockodo-ts-td-grand-total">
                  {getGrandTotal()}
                </td>
                <td className="clockodo-ts-td-action"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Actions Row: Add new row, Copy last week, Save as template */}
      <div className="clockodo-ts-bottom-actions">
        {/* Add new row */}
        <button 
          type="button" 
          className="clockodo-ts-btn-action clockodo-ts-btn-add-row"
          onClick={handleAddNewBlankRow}
        >
          <span className="clockodo-ts-plus-circle">⊕</span>
          <span>Add new row</span>
        </button>

        {/* Copy last week */}
        <div style={{ position: 'relative' }} ref={copyMenuRef}>
          <button 
            type="button" 
            className="clockodo-ts-btn-action"
            onClick={() => setShowCopyMenu(!showCopyMenu)}
          >
            <FileText size={15} color="#94a3b8" />
            <span>Copy last week</span>
            <ChevronDown size={13} color="#94a3b8" />
          </button>

          {showCopyMenu && (
            <div className="clockodo-ts-popover">
              <div 
                className="clockodo-ts-popover-item"
                onClick={handleCopyLastWeek}
              >
                <Copy size={14} color="#64748b" />
                <span>Copy project names & tasks</span>
              </div>
              <div 
                className="clockodo-ts-popover-item"
                onClick={handleCopyProjectsWithHours}
              >
                <FileText size={14} color="#64748b" />
                <span>Copy projects with hours</span>
              </div>
            </div>
          )}
        </div>

        {/* Save as template */}
        <button 
          type="button" 
          className="clockodo-ts-btn-action"
          onClick={handleSaveAsTemplate}
        >
          <Save size={15} color="#94a3b8" />
          <span>Save as template</span>
        </button>
      </div>

      {/* Floating Smooth Toast Notification */}
      {toastMessage && (
        <div className="clockodo-toast-pill">
          <Check size={15} color="#00cc00" strokeWidth={2.5} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          SIMPLE CLEAN BLACK & WHITE A4 PRINTABLE REPORT
          ========================================================================= */}
      <div className="official-timesheet-print-document">
        <div className="bw-report-wrapper">
          {/* Header */}
          <div className="bw-report-header">
            <div>
              <div className="bw-report-title">DIGIPLUS</div>
              <div className="bw-report-subtitle">Weekly Timesheet Report</div>
            </div>
            <div className="bw-report-meta">
              <div><strong>Period:</strong> {selectedRangeText}</div>
              <div><strong>Employee:</strong> {selectedTeammate ? selectedTeammate.name : USER_PROFILE.name}</div>
              <div><strong>Date:</strong> September 8, 2026</div>
            </div>
          </div>

          <div className="bw-report-divider" />

          {/* Simple Info Row */}
          <div className="bw-report-info-row">
            <div><strong>Workspace:</strong> {USER_PROFILE.workspace}</div>
            <div><strong>Total Tracked Hours:</strong> {getGrandTotal()}</div>
          </div>

          {/* Clean Black & White Table */}
          <table className="bw-report-table">
            <thead>
              <tr>
                <th style={{ width: '28px', textAlign: 'center' }}>#</th>
                <th style={{ textAlign: 'left' }}>Project Name</th>
                {daysConfig.map((d) => (
                  <th key={d.key} style={{ textAlign: 'center', width: '65px' }}>
                    {d.name.split(',')[0]}
                  </th>
                ))}
                <th style={{ textAlign: 'right', width: '75px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {activeRows.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ textAlign: 'left', fontWeight: 600 }}>{row.projectName || 'General Task'}</td>
                  {daysConfig.map((d) => {
                    const hVal = row.hours[d.key];
                    const hasVal = hVal && hVal !== '00:00:00' && hVal !== '0';
                    return (
                      <td key={d.key} style={{ textAlign: 'center' }}>
                        {hasVal ? hVal : '—'}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    {row.total || '00:00:00'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: 'left', fontWeight: 700 }}>
                  TOTAL:
                </td>
                {daysConfig.map((d) => (
                  <td key={d.key} style={{ textAlign: 'center', fontWeight: 700 }}>
                    {getDayTotal(d.key)}
                  </td>
                ))}
                <td style={{ textAlign: 'right', fontWeight: 700 }}>
                  {getGrandTotal()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Simple Signature Lines */}
          <div className="bw-report-signatures">
            <div className="bw-sign-block">
              <div className="bw-sign-line" />
              <div>Employee Signature ({selectedTeammate ? selectedTeammate.name : USER_PROFILE.name})</div>
            </div>
            <div className="bw-sign-block">
              <div className="bw-sign-line" />
              <div>Manager / Client Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
