import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus,
  CheckCircle2,
  X,
  DollarSign,
  Trash2,
  Search,
  Check,
  ChevronDown,
  Edit3
} from 'lucide-react';
import { CALENDAR_WEEK_SCHEDULE, INITIAL_PROJECTS } from '../data/mockData';

function formatTime24h(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const marker = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;
    if (marker === 'PM' && hours < 12) hours += 12;
    if (marker === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 4) {
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  }
  return trimmed;
}

function getActivityDate(act) {
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
  } catch (e) {}

  return todayISO;
}

function normalizeTimeTo24h(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '09:00';
  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const marker = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;
    if (marker === 'PM' && h < 12) h += 12;
    if (marker === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 4) {
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
    const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    let h = parseInt(parts[0], 10) || 0;
    let m = parseInt(parts[1], 10) || 0;
    return `${String(Math.min(23, h)).padStart(2, '0')}:${String(Math.min(59, m)).padStart(2, '0')}`;
  }
  return '09:00';
}

function getGlobalTimeFormatPreference() {
  try {
    const direct = localStorage.getItem('clockodo_time_format');
    if (direct === '12h' || direct === '24h') return direct;
    const saved = localStorage.getItem('clockodo_language_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.userExplicitlySetTimeFormat && parsed.timeFormat) {
        return parsed.timeFormat;
      }
    }
  } catch (e) {}
  return '24h'; // Default: Railway time
}

function formatTimeDisplay(timeStr, activeFormat = null) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  const fmt = activeFormat || getGlobalTimeFormatPreference();

  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const marker = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;

    let h24 = hours;
    if (marker === 'PM' && hours < 12) h24 = hours + 12;
    if (marker === 'AM' && hours === 12) h24 = 0;

    if (fmt === '12h') {
      const period = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      return `${String(h12).padStart(2, '0')}:${mins} ${period}`;
    } else {
      return `${String(h24).padStart(2, '0')}:${mins}`;
    }
  }

  return trimmed;
}

const formatTimeWithAmPm = formatTimeDisplay;

export default function Calendar({
  calendarSchedule = CALENDAR_WEEK_SCHEDULE,
  onUpdateCalendarSchedule,
  activeTimer = null,
  activities = [],
  timesheetRows = [],
  projects = INITIAL_PROJECTS,
  currentUser = null,
  onAddManualEntry,
  onDeleteCalendarEntry,
  onUpdateActivity,
  onUpdateActivityDate,
}) {
  // View mode: 'week' | 'day' (Default to 'week')
  const [calendarViewMode, setCalendarViewMode] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  const [editingBlock, setEditingBlock] = useState(null);
  
  // Real-time dynamic current date tracking (Auto-rolls over at midnight)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(() => new Date());

  // Helper to match activities for the currently logged in user (shows only logged-in user's schedule to prevent multi-employee clutter)
  const userFilteredActivities = useMemo(() => {
    if (!currentUser) return activities;
    const myName = (currentUser.name || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();
    const myEmail = (currentUser.email || '').trim().toLowerCase();
    const myId = currentUser.id ? String(currentUser.id) : '';

    return activities.filter(act => {
      const actUser = (act.user || act.userName || act.user_name || act.member || act.assignedTo || '').replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim().toLowerCase();
      const actEmail = (act.userEmail || act.email || '').trim().toLowerCase();
      const actUserId = (act.userId || act.user_id) ? String(act.userId || act.user_id) : '';

      if (myId && actUserId && myId === actUserId) return true;
      if (myEmail && actEmail && myEmail === actEmail) return true;
      if (myName && actUser && (actUser === myName || actUser.includes(myName) || myName.includes(actUser))) return true;
      return false;
    });
  }, [activities, currentUser]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calViewYear, setCalViewYear] = useState(() => selectedDayDate.getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(() => selectedDayDate.getMonth());
  const datePopoverRef = useRef(null);
  const timelineScrollRef = useRef(null);

  const monthNamesFull = useMemo(() => [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ], []);

  const handlePrevCalMonth = (e) => {
    e?.stopPropagation();
    setCalViewMonth((prev) => {
      if (prev === 0) {
        setCalViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextCalMonth = (e) => {
    e?.stopPropagation();
    setCalViewMonth((prev) => {
      if (prev === 11) {
        setCalViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  // Midnight Auto-Refresh Listener: Checks every second if date rolled over
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== currentDate.toDateString()) {
        setCurrentDate(now);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentDate]);

  // Derived Dynamic Date Strings for Day View & Today
  const todayIsoDate = useMemo(() => {
    const yr = currentDate.getFullYear();
    const mo = String(currentDate.getMonth() + 1).padStart(2, '0');
    const da = String(currentDate.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }, [currentDate]);

  const dayViewIsoDate = useMemo(() => {
    const yr = selectedDayDate.getFullYear();
    const mo = String(selectedDayDate.getMonth() + 1).padStart(2, '0');
    const da = String(selectedDayDate.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }, [selectedDayDate]);

  const dayViewTitle = useMemo(() => {
    const dayName = selectedDayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = selectedDayDate.toLocaleDateString('en-US', { month: 'short' });
    const d = selectedDayDate.getDate();
    const y = selectedDayDate.getFullYear();
    return `${dayName}, ${monthName} ${d}, ${y}`;
  }, [selectedDayDate]);

  const isDayViewToday = dayViewIsoDate === todayIsoDate;

  // Local storage for user-added calendar blocks
  const [customBlocksMap, setCustomBlocksMap] = useState({});
  const [toastMessage, setToastMessage] = useState('');

  // "Add Time Entry" Mini Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalDayNum, setModalDayNum] = useState(() => currentDate.getDate());
  const [modalIsoDate, setModalIsoDate] = useState(() => todayIsoDate);
  const [modalDateLabel, setModalDateLabel] = useState(() => {
    const d = currentDate;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    return `${dayName}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
  });
  const [modalFromTime, setModalFromTime] = useState('09:00');
  const [modalToTime, setModalToTime] = useState('10:00');
  const [modalDescription, setModalDescription] = useState('');
  const [modalProject, setModalProject] = useState(projects[0]?.name || 'JRKS Logistics');
  const [modalBillable, setModalBillable] = useState(true);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef(null);

  // Close project dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target)) {
        setIsProjectDropdownOpen(false);
      }
    };
    if (isProjectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProjectDropdownOpen]);

  // Filtered projects for the Add Entry modal based on search query
  const filteredModalProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) return projects || [];
    const q = projectSearchQuery.toLowerCase();
    return (projects || []).filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.client && p.client.toLowerCase().includes(q))
    );
  }, [projects, projectSearchQuery]);

  // Currently selected project object
  const currentModalProjectObj = useMemo(() => {
    return (projects || []).find(p => p.name === modalProject) || projects[0] || null;
  }, [projects, modalProject]);

  // Active 24h vs 12h time format preference
  const [activeTimeFormat, setActiveTimeFormat] = useState(() => getGlobalTimeFormatPreference());

  useEffect(() => {
    const handleFormatChange = () => {
      setActiveTimeFormat(getGlobalTimeFormatPreference());
    };
    window.addEventListener('clockodo_format_change', handleFormatChange);
    window.addEventListener('storage', handleFormatChange);
    const interval = setInterval(handleFormatChange, 1000);
    return () => {
      window.removeEventListener('clockodo_format_change', handleFormatChange);
      window.removeEventListener('storage', handleFormatChange);
      clearInterval(interval);
    };
  }, []);

  const START_HOUR = 8;
  const HOUR_HEIGHT = 64;
  const timelineHours = useMemo(() => {
    const rawHours = [
      '08:00', '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
      '20:00', '21:00', '22:00'
    ];
    if (activeTimeFormat === '12h') {
      return rawHours.map(t => formatTimeDisplay(t, '12h'));
    }
    return rawHours;
  }, [activeTimeFormat]);

  
  // Clean scroll reset on view change
  useEffect(() => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTop = 0;
    }
  }, [calendarViewMode, weekOffset]);

  // Toast Timer
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePopoverRef.current && !datePopoverRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    }
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDatePicker]);

  // Live progressive typing: let user type freely without prematurely forcing 03:
  const handleTimeTyping = (val, setter) => {
    if (!val) {
      setter('');
      return;
    }
    const clean = val.replace(/[^0-9:]/g, '');
    if (/^\d{4}$/.test(clean)) {
      setter(`${clean.slice(0, 2)}:${clean.slice(2, 4)}`);
      return;
    }
    setter(clean);
  };

  const handleTimeBlur = (input, setter) => {
    if (!input || typeof input !== 'string') return;
    const trimmed = input.trim();
    if (!trimmed || trimmed === '0') return;

    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      let h = parseInt(parts[0], 10);
      if (isNaN(h)) h = 0;
      h = Math.min(23, Math.max(0, h));

      let mStr = parts[1] || '00';
      let m = parseInt(mStr, 10);
      if (isNaN(m)) m = 0;
      if (mStr.length === 1 && m > 0 && m <= 5) {
        m = m * 10;
      }
      m = Math.min(59, Math.max(0, m));
      setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      return;
    }

    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return;
    if (digits.length === 4) {
      const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
      const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
      setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    } else if (digits.length === 3) {
      const h = Math.min(23, parseInt(digits.slice(0, 1), 10));
      const m = Math.min(59, parseInt(digits.slice(1, 3), 10));
      setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    } else if (digits.length <= 2) {
      const h = Math.min(23, parseInt(digits, 10));
      setter(`${String(h).padStart(2, '0')}:00`);
    }
  };

  // Convert "HH:MM" or "HH:MM:SS" to decimal hour (Smart 12h/24h conversion: 01:00-06:00 -> 13:00-18:00 PM)
  const parseTimeToDecimal = (timeStr) => {
    if (!timeStr) return 10.0;
    const parts = timeStr.split(':').map(Number);
    let h = parts[0] || 0;
    const m = parts[1] || 0;
    if (h >= 1 && h <= 6) {
      h += 12; // Convert 1 PM - 6 PM to 13:00 - 18:00
    }
    return h + m / 60;
  };

  // Convert decimal seconds to HH:MM:SS
  const formatSecondsToHMS = (sec) => {
    if (!sec || sec <= 0) return '00:00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate duration between fromTime and toTime
  const calculatedDuration = useMemo(() => {
    const fromDec = parseTimeToDecimal(modalFromTime);
    const toDec = parseTimeToDecimal(modalToTime);
    let diffHours = toDec - fromDec;
    if (diffHours <= 0) diffHours = 1.0;
    const totalSec = Math.round(diffHours * 3600);
    return {
      hoursDecimal: diffHours,
      timeStr: formatSecondsToHMS(totalSec),
      readable: `${Math.floor(totalSec / 3600)}h ${Math.floor((totalSec % 3600) / 60)}m`
    };
  }, [modalFromTime, modalToTime]);

  // Open "Add Time Entry" Modal when clicking any time slot
  const handleOpenAddModal = (dayObj, defaultFrom = '10:00', defaultTo = '11:00') => {
    setEditingBlock(null);
    setModalDayNum(dayObj.dayNum);
    const fallbackIso = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(dayObj.dayNum || currentDate.getDate()).padStart(2, '0')}`;
    setModalIsoDate(dayObj.isoDate || fallbackIso);
    setModalDateLabel(dayObj.dateStr || `${currentDate.toLocaleDateString('en-US', { month: 'short' })} ${dayObj.dayNum || currentDate.getDate()}, ${currentDate.getFullYear()}`);
    setModalFromTime(defaultFrom);
    setModalToTime(defaultTo);
    setModalDescription('');
    setProjectSearchQuery('');
    setIsProjectDropdownOpen(false);
    setModalProject(projects[0]?.name || 'JRKS Logistics');
    setModalBillable(true);
    setShowAddModal(true);
  };

  // Open "Edit Time Entry" Modal when clicking an existing entry
  const handleOpenEditModal = (block) => {
    if (!block) return;
    setEditingBlock(block);

    const originalAct = block.act || (activities || []).find(a => String(a.id) === String(block.id));

    const fallbackIso = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const isoDate = originalAct?.date || block.isoDate || fallbackIso;
    setModalIsoDate(isoDate);

    const [y, m, d] = (isoDate || '').split('-').map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const dateObj = new Date(y, m - 1, d);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
      setModalDateLabel(`${dayName}, ${monthName} ${d}`);
      setModalDayNum(d);
    } else {
      setModalDateLabel(block.title || 'Date');
    }

    const startRaw = originalAct?.startTime || block.startTime || (block.subtitle ? block.subtitle.split('-')[0].trim() : '09:00');
    const endRaw = originalAct?.endTime || block.endTime || (block.subtitle ? block.subtitle.split('-')[1]?.trim() : '10:00');
    setModalFromTime(formatTime24h(startRaw) || '09:00');
    setModalToTime(formatTime24h(endRaw) || '10:00');

    setModalDescription(originalAct?.description || block.title || '');
    setModalProject(originalAct?.project || block.project || projects[0]?.name || 'No Project');
    setModalBillable(originalAct?.billable !== false && block.billable !== false);
    setProjectSearchQuery('');
    setIsProjectDropdownOpen(false);
    setShowAddModal(true);
  };

  // Handle Form Submit (Add or Edit Entry & Sync Globally)
  const handleAddEntrySubmit = (e) => {
    e.preventDefault();
    const fromDec = parseTimeToDecimal(modalFromTime);
    const toDec = parseTimeToDecimal(modalToTime);
    let diffHours = toDec - fromDec;
    if (diffHours <= 0) diffHours = 1.0;

    const projObj = projects.find(p => p.name === modalProject);
    const targetISO = modalIsoDate;
    const groupName = modalDateLabel.includes(',') ? modalDateLabel.split(',')[0].trim() : 'Today';

    if (editingBlock) {
      // EDIT EXISTING ENTRY
      const actId = editingBlock.id;
      const updates = {
        description: modalDescription.trim() || 'Working session',
        project: modalProject,
        projectColor: projObj?.color || '#00cc00',
        date: targetISO,
        group: groupName,
        startTime: modalFromTime,
        endTime: modalToTime,
        durationFormatted: calculatedDuration.timeStr,
        durationSeconds: Math.round(diffHours * 3600),
        billable: modalBillable,
      };

      // 1. Update in customBlocksMap if present
      setCustomBlocksMap(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(dayKey => {
          next[dayKey] = (next[dayKey] || []).map(b => {
            if (String(b.id) === String(actId)) {
              return {
                ...b,
                title: updates.description,
                project: updates.project,
                color: updates.projectColor,
                subtitle: `${formatTimeWithAmPm(modalFromTime)} - ${formatTimeWithAmPm(modalToTime)}`,
                startTime: modalFromTime,
                endTime: modalToTime,
                duration: updates.durationFormatted,
                durationHours: diffHours,
                topHour: fromDec,
                isoDate: targetISO,
                billable: modalBillable,
              };
            }
            return b;
          });
        });
        return next;
      });

      // 2. Global Cross-Page Sync via onUpdateActivity
      if (onUpdateActivity) {
        onUpdateActivity(actId, updates);
      }
      if (onUpdateActivityDate && targetISO) {
        onUpdateActivityDate(actId, targetISO, groupName);
      }

      setEditingBlock(null);
      setShowAddModal(false);
      setToastMessage(`✓ Updated time entry: ${updates.description}`);
      return;
    }

    const newBlock = {
      id: `custom-b-${Date.now()}`,
      title: modalDescription.trim() || 'Working session',
      subtitle: `${modalFromTime} - ${modalToTime}`,
      project: modalProject,
      duration: calculatedDuration.timeStr,
      topHour: fromDec,
      durationHours: diffHours,
      color: projObj?.color || '#00cc00',
      billable: modalBillable,
    };

    // 1. Sync Globally to Time Tracker, Timesheet, Dashboard, and Reports
    if (onAddManualEntry) {
      onAddManualEntry({
        project: modalProject,
        projectColor: projObj?.color || '#00cc00',
        description: modalDescription.trim() || 'Working session',
        date: targetISO,
        group: groupName,
        startTime: modalFromTime,
        endTime: modalToTime,
        durationFormatted: calculatedDuration.timeStr,
        billable: modalBillable,
      });
    }

    setShowAddModal(false);
    setToastMessage(`Time entry added for ${modalDateLabel}: ${newBlock.title} (${calculatedDuration.readable})`);
  };

  // Handle Delete / Remove Time Entry from Calendar & Global Sync
  const handleDeleteEntry = (dayNum, blockId, e, blockObj = {}) => {
    if (e) e.stopPropagation();

    // 1. Remove from user customBlocksMap
    setCustomBlocksMap(prev => {
      const existing = prev[dayNum] || [];
      const updated = existing.filter(b => b.id !== blockId);
      return {
        ...prev,
        [dayNum]: updated
      };
    });

    // 2. Remove from base calendarSchedule if present
    if (onUpdateCalendarSchedule && calendarSchedule?.days) {
      const updatedDays = calendarSchedule.days.map(day => {
        if (day.dayNum === dayNum) {
          const updatedBlocks = day.blocks.filter(b => b.id !== blockId);
          let daySec = 0;
          updatedBlocks.forEach(b => {
            const parts = (b.duration || '00:00:00').split(':').map(Number);
            daySec += (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
          });
          return {
            ...day,
            blocks: updatedBlocks,
            totalStr: formatSecondsToHMS(daySec),
          };
        }
        return day;
      });
      onUpdateCalendarSchedule({ ...calendarSchedule, days: updatedDays });
    }

    // 3. Global Cross-Page Sync: Remove from Time Tracker activities & Dashboard
    if (onDeleteCalendarEntry) {
      onDeleteCalendarEntry(dayNum, blockId, blockObj);
    }

    setToastMessage('Time entry removed from calendar');
  };

  // Compute 7 days for current week offset (Active Dynamic Week)
  const currentWeekDays = useMemo(() => {
    const baseMon = new Date(currentDate);
    const dayOfWeek = (baseMon.getDay() + 6) % 7; // 0 for Mon, 6 for Sun
    baseMon.setDate(baseMon.getDate() - dayOfWeek + (weekOffset * 7));
    baseMon.setHours(0, 0, 0, 0);

    const days = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMon);
      d.setDate(baseMon.getDate() + i);
      const isToday = d.toDateString() === currentDate.toDateString();
      const dayNum = d.getDate();

      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const isoDate = `${yr}-${mo}-${da}`;

      // Filter activities for this day from master activities ONLY by exact ISO date
      const dayActs = userFilteredActivities.filter(act => {
        const actDate = getActivityDate(act);
        return actDate === isoDate;
      });

      // Automatically sort in strict chronological order (earliest start time to latest)
      dayActs.sort((a, b) => {
        const aStart = parseTimeToDecimal(a.startTime || '09:00');
        const bStart = parseTimeToDecimal(b.startTime || '09:00');
        return aStart - bStart;
      });

      const dayBlocks = dayActs.map(act => {
        const [sh, sm] = (act.startTime || '10:00').split(':').map(Number);
        let rawH = (isNaN(sh) ? 10 : sh) + ((isNaN(sm) ? 0 : sm) / 60);
        const p = (act.durationFormatted || '01:00:00').split(':').map(Number);
        const durSec = act.durationSeconds || ((p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0));
        const durH = durSec > 0 ? durSec / 3600 : 1;

        return {
          id: act.id,
          act: act,
          title: act.description,
          subtitle: `${formatTimeWithAmPm(act.startTime || '09:00')} - ${formatTimeWithAmPm(act.endTime || '10:00')}`,
          startTime: act.startTime,
          endTime: act.endTime,
          isoDate: isoDate,
          dayNum: dayNum,
          dateObj: d,
          project: act.project,
          duration: act.durationFormatted,
          topHour: rawH,
          durationHours: durH,
          color: act.projectColor || '#00cc00',
          billable: act.billable,
        };
      });

      let daySec = 0;
      dayActs.forEach(act => {
        const p = (act.durationFormatted || '00:00:00').split(':').map(Number);
        daySec += act.durationSeconds || ((p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0));
      });

      days.push({
        dateObj: d,
        dayNum: dayNum,
        isoDate: isoDate,
        dateStr: `${dayNames[i]}, ${monthNames[d.getMonth()]} ${dayNum}`,
        totalStr: formatSecondsToHMS(daySec),
        isToday: isToday,
        blocks: dayBlocks
      });
    }
    return days;
  }, [weekOffset, userFilteredActivities]);

  // Dynamic Week Title
  const weekTitleLabel = useMemo(() => {
    if (currentWeekDays.length < 7) return 'Aug 31 – Sep 06, 2026';
    const first = currentWeekDays[0];
    const last = currentWeekDays[6];
    const fMonth = first.dateObj.toLocaleString('en-US', { month: 'short' });
    const lMonth = last.dateObj.toLocaleString('en-US', { month: 'short' });
    if (fMonth === lMonth) {
      return `${fMonth} ${first.dayNum} – ${last.dayNum}, ${first.dateObj.getFullYear()}`;
    }
    return `${fMonth} ${first.dayNum} – ${lMonth} ${last.dayNum}, ${first.dateObj.getFullYear()}`;
  }, [currentWeekDays]);

  // Dynamic week total hours
  const dynamicWeekTotal = useMemo(() => {
    let totalSec = 0;
    currentWeekDays.forEach(d => {
      if (d.totalStr) {
        const parts = d.totalStr.split(':').map(Number);
        totalSec += (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
      }
    });
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [currentWeekDays]);

  // Handlers for Navigation
  const handlePrev = () => {
    if (calendarViewMode === 'week') {
      setWeekOffset(w => w - 1);
    } else {
      setSelectedDayDate(d => {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 1);
        return prev;
      });
    }
  };

  const handleNext = () => {
    if (calendarViewMode === 'week') {
      setWeekOffset(w => w + 1);
    } else {
      setSelectedDayDate(d => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        return next;
      });
    }
  };

  const handleThisWeekOrToday = () => {
    setWeekOffset(0);
    setSelectedDayDate(new Date(currentDate));
  };

  return (
    <div className="calendar-view">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            zIndex: 10000,
            borderLeft: '4px solid #00cc00',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <CheckCircle2 size={16} color="#00cc00" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Calendar Header Bar */}
      <div className="calendar-header-bar">
        {/* Left: Green Calendar Button & View Mode Toggle (Week | Day) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', flexWrap: 'wrap' }}>
          {/* Green Calendar Button */}
          <button 
            type="button" 
            className="calendar-green-btn"
            onClick={() => {
              if (!showDatePicker) {
                setCalViewYear(selectedDayDate.getFullYear());
                setCalViewMonth(selectedDayDate.getMonth());
              }
              setShowDatePicker(!showDatePicker);
            }}
            title="Pick a Date"
          >
            <CalendarIcon size={15} />
            <span>Calendar</span>
          </button>

          {/* Date Picker Popover */}
          {showDatePicker && (
            <div className="calendar-popover-dropdown" ref={datePopoverRef}>
              <div className="popover-month-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0 8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button 
                    type="button" 
                    onClick={handlePrevCalMonth}
                    title="Previous month"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#475569', cursor: 'pointer', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                    {monthNamesFull[calViewMonth]} {calViewYear}
                  </span>
                  <button 
                    type="button" 
                    onClick={handleNextCalMonth}
                    title="Next month"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', color: '#475569', cursor: 'pointer', padding: '3px 6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowDatePicker(false)} 
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', padding: '2px 4px' }}
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div className="popover-weekdays-row">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="popover-days-grid">
                {/* Blank padding days for the first day of the active month */}
                {Array.from({ length: new Date(calViewYear, calViewMonth, 1).getDay() }).map((_, i) => (
                  <div key={`cal-pad-${i}`} style={{ height: '26px' }} />
                ))}

                {Array.from({ length: new Date(calViewYear, calViewMonth + 1, 0).getDate() }, (_, i) => i + 1).map((d) => {
                  const isCurrentSelected = selectedDayDate.getDate() === d && selectedDayDate.getMonth() === calViewMonth && selectedDayDate.getFullYear() === calViewYear;
                  const isToday = currentDate.getDate() === d && currentDate.getMonth() === calViewMonth && currentDate.getFullYear() === calViewYear;
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`popover-day-btn ${isToday ? 'is-today' : ''} ${isCurrentSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        const targetDate = new Date(calViewYear, calViewMonth, d);
                        setSelectedDayDate(targetDate);
                        setCalendarViewMode('day');

                        // Synchronize weekOffset so Week view is also aligned with chosen date
                        const nowMon = new Date(currentDate);
                        const nowDayOfWeek = (nowMon.getDay() + 6) % 7;
                        nowMon.setDate(nowMon.getDate() - nowDayOfWeek);
                        nowMon.setHours(0, 0, 0, 0);

                        const targetMon = new Date(targetDate);
                        const targetDayOfWeek = (targetMon.getDay() + 6) % 7;
                        targetMon.setDate(targetMon.getDate() - targetDayOfWeek);
                        targetMon.setHours(0, 0, 0, 0);

                        const diffWeeks = Math.round((targetMon - nowMon) / (7 * 24 * 60 * 60 * 1000));
                        setWeekOffset(diffWeeks);

                        setShowDatePicker(false);
                      }}
                      title={isToday ? "Today (Active)" : `${monthNamesFull[calViewMonth].slice(0, 3)} ${d}, ${calViewYear}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Mode Toggle: Week | Day */}
          <div className="calendar-view-toggle">
            <button
              className={`cal-toggle-btn ${calendarViewMode === 'week' ? 'active' : ''}`}
              onClick={() => setCalendarViewMode('week')}
            >
              Week
            </button>
            <button
              className={`cal-toggle-btn ${calendarViewMode === 'day' ? 'active' : ''}`}
              onClick={() => setCalendarViewMode('day')}
            >
              Day
            </button>
          </div>

          {/* Stepper: < [Title] > */}
          <div className="calendar-month-selector">
            <button 
              className="calendar-month-btn" 
              onClick={handlePrev}
              title={calendarViewMode === 'week' ? "Previous Week" : "Previous Day"}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="calendar-month-title">
              {calendarViewMode === 'week' ? weekTitleLabel : dayViewTitle}
            </span>
            <button 
              className="calendar-month-btn" 
              onClick={handleNext}
              title={calendarViewMode === 'week' ? "Next Week" : "Next Day"}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Right Controls: Add Time Entry Button, Week Logged & This Week */}
        <div className="calendar-stats-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          {/* Quick Add Time Entry Button */}
          <button
            type="button"
            className="cal-btn-submit"
            onClick={() => {
              if (calendarViewMode === 'day') {
                handleOpenAddModal({
                  dayNum: selectedDayDate.getDate(),
                  isoDate: dayViewIsoDate,
                  dateStr: dayViewTitle
                }, '09:00', '10:00');
              } else {
                const currentDay = currentWeekDays[1] || currentWeekDays[0];
                handleOpenAddModal(currentDay, '09:00', '10:00');
              }
            }}
            title="Add new time entry to calendar"
          >
            <Plus size={15} />
            <span>Add Entry</span>
          </button>

          {/* Week Logged Hours */}
          <div className="calendar-stat-badge">
            <span>{calendarViewMode === 'week' ? 'Week Logged:' : 'Day Logged:'}</span>
            <span className="calendar-stat-bold">
              {calendarViewMode === 'week' 
                ? dynamicWeekTotal 
                : (() => {
                    let totalSec = 0;
                    userFilteredActivities.filter(act => getActivityDate(act) === dayViewIsoDate).forEach(act => {
                      const p = (act.durationFormatted || '00:00:00').split(':').map(Number);
                      totalSec += act.durationSeconds || ((p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0));
                    });
                    return formatSecondsToHMS(totalSec);
                  })()}
            </span>
          </div>

          {/* This week / Today Button */}
          <button 
            className="calendar-today-btn"
            onClick={handleThisWeekOrToday}
          >
            {calendarViewMode === 'week' ? 'This week' : 'Today'}
          </button>
        </div>
      </div>

      {/* WEEK TIMELINE VIEW */}
      {calendarViewMode === 'week' && (
        <div className="week-timeline-card">
          <div className="week-timeline-scroll-wrapper" ref={timelineScrollRef}>
            {/* Header Row with Day Names & Daily Totals (Sticky Top) */}
            <div className="week-timeline-header-grid">
              <div className="week-header-corner">
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>TIME</span>
              </div>
              {currentWeekDays.map((day, idx) => (
                <div 
                  key={idx} 
                  className={`week-header-day ${day.isToday ? 'is-today-col' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedDayDate(day.dateObj);
                    setCalendarViewMode('day');
                  }}
                  title={`Click to view ${day.dateStr} Day details`}
                >
                  <div className="week-day-title">
                    {day.dateStr}
                  </div>
                  <div className="week-day-total">
                    {day.totalStr}
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline Body Grid */}
            <div className="week-timeline-body">
              {/* Left Time Column (Sticky Left) */}
              <div className="week-time-gutter">
                {timelineHours.map((hour, hIdx) => (
                  <div key={hIdx} className="time-slot-label">
                    <span>{hour}</span>
                  </div>
                ))}
              </div>

                            {/* 7 Days Columns with Clean Activity Blocks */}
              {currentWeekDays.map((day, dIdx) => (
                <div 
                  key={dIdx} 
                  className="week-day-column cal-slot-hint"
                  title={`Click to add time entry on ${day.dateStr}`}
                  onClick={(e) => {
                    if (e.target.closest('.timeline-event-block')) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const hourClicked = Math.floor(clickY / HOUR_HEIGHT) + START_HOUR;
                    const fromH = Math.min(21, Math.max(START_HOUR, hourClicked));
                    const toH = Math.min(22, fromH + 1);
                    handleOpenAddModal(
                      day, 
                      `${String(fromH).padStart(2, '0')}:00`, 
                      `${String(toH).padStart(2, '0')}:00`
                    );
                  }}
                >
                  {/* Horizontal Grid Row Lines perfectly aligned with Time Gutter */}
                  <div className="column-grid-lines">
                    {timelineHours.map((_, hIdx) => (
                      <div key={hIdx} className="grid-hour-cell" />
                    ))}
                  </div>

                  {/* Live Running Stopwatch Session Block */}
                  {day.isToday && activeTimer?.isRunning && (
                    <div
                      className="timeline-event-block is-live-running"
                      style={{
                        top: `${(10 - START_HOUR) * HOUR_HEIGHT + 2}px`,
                        height: '56px',
                        borderLeftColor: activeTimer.projectColor || '#00cc00',
                        border: '1.5px solid #00cc00',
                        background: '#ffffff',
                        boxShadow: '0 2px 10px rgba(0, 204, 0, 0.15)',
                        zIndex: 10,
                      }}
                    >
                      <div className="event-block-title" style={{ color: '#008a00', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00cc00', display: 'inline-block' }} />
                        [Live] {activeTimer.taskDescription || 'Working Session'}
                      </div>
                      <div className="event-block-proj" style={{ color: activeTimer.projectColor || '#00cc00' }}>
                        <span className="project-color-dot" style={{ backgroundColor: activeTimer.projectColor || '#00cc00' }} />
                        <span>{activeTimer.projectName || 'General Task'}</span>
                      </div>
                      <div className="event-block-duration" style={{ color: '#008a00', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                        {formatSecondsToHMS(activeTimer.elapsedSeconds)}
                      </div>
                    </div>
                  )}

                  {/* Pre-recorded & custom user activity blocks */}
                  {day.blocks.map((block) => {
                    const rawStart = block.topHour || 10;
                    const startHour = (rawStart >= 1 && rawStart <= 6) ? rawStart + 12 : rawStart;
                    const topPx = Math.max(0, (startHour - START_HOUR) * HOUR_HEIGHT);
                    const durH = block.durationHours || 1;
                    const heightPx = Math.max(56, durH * HOUR_HEIGHT);
                    const isShortBlock = durH <= 1.25;

                    return (
                      <div
                        key={block.id}
                        className="timeline-event-block"
                        style={{
                          top: `${topPx + 2}px`,
                          height: `${heightPx - 4}px`,
                          borderLeftColor: block.color || '#00cc00',
                          background: '#ffffff',
                          cursor: 'pointer',
                        }}
                        title={`Click to edit: ${block.project}: ${block.title} (${block.duration})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(block);
                        }}
                      >
                        <div className="event-block-actions" style={{ position: 'absolute', top: '3px', right: '3px', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 10 }}>
                          <button
                            type="button"
                            className="event-block-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(block);
                            }}
                            title="Edit this time entry"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            type="button"
                            className="event-block-del-btn"
                            onClick={(e) => handleDeleteEntry(day.dayNum, block.id, e, block)}
                            title="Delete this time entry"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        
                        {isShortBlock ? (
                          <>
                            <div className="event-block-header-row">
                              <span className="event-block-title">{block.title}</span>
                              <span className="event-block-duration">{block.duration}</span>
                            </div>
                            {block.subtitle && (
                              <div className="event-block-time">{block.subtitle}</div>
                            )}
                            <div className="event-block-proj" style={{ color: block.color || '#00cc00' }}>
                              <span className="project-color-dot" style={{ backgroundColor: block.color || '#00cc00' }} />
                              <span>{block.project}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="event-block-title" style={{ paddingRight: '16px' }}>{block.title}</div>
                            {block.subtitle && (
                              <div className="event-block-time">{block.subtitle}</div>
                            )}
                            <div className="event-block-proj" style={{ color: block.color || '#00cc00' }}>
                              <span className="project-color-dot" style={{ backgroundColor: block.color || '#00cc00' }} />
                              <span>{block.project}</span>
                            </div>
                            <div className="event-block-duration" style={{ marginTop: 'auto' }}>{block.duration}</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DAY TIMELINE VIEW */}
      {calendarViewMode === 'day' && (
        <div className="day-timeline-card">
          <div className="day-timeline-header">
            <div>
              <div className="day-timeline-title">
                {dayViewTitle} {isDayViewToday && <span style={{ color: '#008a00', fontSize: '13px', marginLeft: 8 }}>(Today)</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Click any hour slot to add a new time entry
              </div>
            </div>
            <div className="day-timeline-stats">
              <span style={{ fontSize: '13px', color: '#64748b' }}>Hours Logged:</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: '#008a00' }}>
                {(() => {
                  let totalSec = 0;
                  userFilteredActivities.filter(act => getActivityDate(act) === dayViewIsoDate).forEach(act => {
                    const p = (act.durationFormatted || '00:00:00').split(':').map(Number);
                    totalSec += act.durationSeconds || ((p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0));
                  });
                  return formatSecondsToHMS(totalSec);
                })()}
              </span>
            </div>
          </div>

          <div className="day-timeline-scroll-wrapper">
            <div className="day-timeline-body">
              <div className="day-time-gutter">
                {timelineHours.map((hour, hIdx) => (
                  <div key={hIdx} className="time-slot-label">
                    <span>{hour}</span>
                  </div>
                ))}
              </div>

              <div 
                className="day-column-content cal-slot-hint" 
                style={{ position: 'relative' }}
                title="Click to add time entry for this day"
                onClick={(e) => {
                  if (e.target.closest('.timeline-event-block')) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const hourClicked = Math.floor(clickY / HOUR_HEIGHT) + START_HOUR;
                  const fromH = Math.min(21, Math.max(START_HOUR, hourClicked));
                  const toH = Math.min(22, fromH + 1);
                  handleOpenAddModal(
                    {
                      dayNum: selectedDayDate.getDate(),
                      isoDate: dayViewIsoDate,
                      dateStr: dayViewTitle
                    }, 
                    `${String(fromH).padStart(2, '0')}:00`, 
                    `${String(toH).padStart(2, '0')}:00`
                  );
                }}
              >
                {/* Horizontal Grid Row Lines */}
                <div className="column-grid-lines">
                  {timelineHours.map((_, hIdx) => (
                    <div key={hIdx} className="grid-hour-cell" />
                  ))}
                </div>

                {/* Live Running Stopwatch Session Block */}
                {isDayViewToday && activeTimer?.isRunning && (
                  <div
                    className="timeline-event-block is-live-running"
                    style={{
                      top: `${(10 - START_HOUR) * HOUR_HEIGHT + 3}px`,
                      height: '58px',
                      borderLeftColor: activeTimer.projectColor || '#00cc00',
                      border: '1.5px solid #00cc00',
                      background: '#ffffff',
                      boxShadow: '0 2px 10px rgba(0, 204, 0, 0.15)',
                      zIndex: 10,
                    }}
                  >
                    <div className="event-block-title" style={{ color: '#008a00', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00cc00', display: 'inline-block' }} />
                      [Live] {activeTimer.taskDescription || 'Working Session'}
                    </div>
                    <div className="event-block-proj" style={{ color: activeTimer.projectColor || '#00cc00' }}>
                      <span className="project-color-dot" style={{ backgroundColor: activeTimer.projectColor || '#00cc00' }} />
                      <span>{activeTimer.projectName || 'General Task'}</span>
                    </div>
                    <div className="event-block-duration" style={{ color: '#008a00', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                      {formatSecondsToHMS(activeTimer.elapsedSeconds)}
                    </div>
                  </div>
                )}

                {/* Day Activity Blocks */}
                {(() => {
                  const dayActs = userFilteredActivities.filter(act => {
                    const actDate = getActivityDate(act);
                    return actDate === dayViewIsoDate;
                  });

                  dayActs.sort((a, b) => {
                    const aStart = parseTimeToDecimal(a.startTime || '09:00');
                    const bStart = parseTimeToDecimal(b.startTime || '09:00');
                    return aStart - bStart;
                  });

                  const blocksToShow = dayActs.map(act => {
                    const [sh, sm] = (act.startTime || '10:00').split(':').map(Number);
                    let rawH = (isNaN(sh) ? 10 : sh) + ((isNaN(sm) ? 0 : sm) / 60);
                    const p = (act.durationFormatted || '01:00:00').split(':').map(Number);
                    const durSec = act.durationSeconds || ((p[0] || 0) * 3600 + (p[1] || 0) * 60 + (p[2] || 0));
                    const durH = durSec > 0 ? durSec / 3600 : 1;

                    return {
                      id: act.id,
                      act: act,
                      title: act.description,
                      subtitle: `${formatTimeWithAmPm(act.startTime || '09:00')} - ${formatTimeWithAmPm(act.endTime || '10:00')}`,
                      startTime: act.startTime,
                      endTime: act.endTime,
                      isoDate: dayViewIsoDate,
                      dayNum: selectedDayDate.getDate(),
                      dateObj: selectedDayDate,
                      project: act.project,
                      duration: act.durationFormatted,
                      topHour: rawH,
                      durationHours: durH,
                      color: act.projectColor || '#00cc00',
                      billable: act.billable,
                    };
                  });

                  return blocksToShow.map((block) => {
                    const rawStart = block.topHour || 10;
                    const startHour = (rawStart >= 1 && rawStart <= 6) ? rawStart + 12 : rawStart;
                    const topPx = Math.max(0, (startHour - START_HOUR) * HOUR_HEIGHT);
                    const durH = block.durationHours || 1;
                    const heightPx = Math.max(56, durH * HOUR_HEIGHT);
                    const isShortBlock = durH <= 1.25;

                    return (
                      <div
                        key={block.id}
                        className="timeline-event-block"
                        style={{
                          top: `${topPx + 2}px`,
                          height: `${heightPx - 4}px`,
                          borderLeftColor: block.color || '#00cc00',
                          background: '#ffffff',
                          cursor: 'pointer',
                        }}
                        title={`Click to edit: ${block.project}: ${block.title} (${block.duration})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditModal(block);
                        }}
                      >
                        <div className="event-block-actions" style={{ position: 'absolute', top: '3px', right: '3px', display: 'flex', alignItems: 'center', gap: '3px', zIndex: 10 }}>
                          <button
                            type="button"
                            className="event-block-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(block);
                            }}
                            title="Edit this time entry"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            type="button"
                            className="event-block-del-btn"
                            onClick={(e) => handleDeleteEntry(selectedDayDate.getDate(), block.id, e, block)}
                            title="Delete this time entry"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      
                      {isShortBlock ? (
                        <>
                          <div className="event-block-header-row">
                            <span className="event-block-title">{block.title}</span>
                            <span className="event-block-duration">{block.duration}</span>
                          </div>
                          {block.subtitle && (
                            <div className="event-block-time">{block.subtitle}</div>
                          )}
                          <div className="event-block-proj" style={{ color: block.color || '#00cc00' }}>
                            <span className="project-color-dot" style={{ backgroundColor: block.color || '#00cc00' }} />
                            <span>{block.project}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="event-block-title" style={{ paddingRight: '16px' }}>{block.title}</div>
                          {block.subtitle && (
                            <div className="event-block-time">{block.subtitle}</div>
                          )}
                          <div className="event-block-proj" style={{ color: block.color || '#00cc00' }}>
                            <span className="project-color-dot" style={{ backgroundColor: block.color || '#00cc00' }} />
                            <span>{block.project}</span>
                          </div>
                          <div className="event-block-duration" style={{ marginTop: 'auto' }}>{block.duration}</div>
                        </>
                      )}
                    </div>
                  );
                });
              })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="cal-modal-overlay" onClick={() => { setShowAddModal(false); setEditingBlock(null); }}>
          <div className="cal-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="cal-modal-header">
              <div className="cal-modal-title-group">
                <div className="cal-modal-icon-badge">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="cal-modal-title">{editingBlock ? 'Edit Time Entry' : 'Add Time Entry'}</div>
                  <div className="cal-modal-subtitle">{editingBlock ? 'Modify entry details, timing, or project' : 'Log work directly to calendar timeline'}</div>
                </div>
              </div>
              <button 
                type="button" 
                className="cal-modal-close-btn"
                onClick={() => { setShowAddModal(false); setEditingBlock(null); }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleAddEntrySubmit}>
              <div className="cal-modal-body">
                {/* Date Row - Fully Editable & Interactive Date Picker */}
                <div className="cal-form-group">
                  <label className="cal-form-label">
                    <span>Date</span>
                    <span style={{ color: '#008a00', fontSize: '11px', fontWeight: 700 }}>{modalDateLabel}</span>
                  </label>
                  <input
                    type="date"
                    className="cal-form-input"
                    value={modalIsoDate}
                    onChange={(e) => {
                      const newIso = e.target.value;
                      if (!newIso) return;
                      setModalIsoDate(newIso);
                      const [y, m, d] = newIso.split('-').map(Number);
                      const dateObj = new Date(y, m - 1, d);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                      setModalDateLabel(`${dayName}, ${monthName} ${d}`);
                      setModalDayNum(d);
                    }}
                    style={{ fontWeight: 600, cursor: 'pointer' }}
                    required
                  />
                </div>

                {/* Time Range: From - To */}
                <div className="cal-form-group">
                  <label className="cal-form-label">
                    <span>Time Range (From – To)</span>
                    <span className="cal-duration-chip">Duration: {calculatedDuration.readable}</span>
                  </label>
                  <div className="cal-time-range-grid">
                    <div className="cal-time-input-wrap">
                      <input
                        type="text"
                        className="cal-form-input"
                        placeholder="09:00"
                        value={modalFromTime}
                        onChange={(e) => handleTimeTyping(e.target.value, setModalFromTime)}
                        onBlur={(e) => handleTimeBlur(e.target.value, setModalFromTime)}
                        required
                      />
                    </div>
                    <div className="cal-time-input-wrap">
                      <input
                        type="text"
                        className="cal-form-input"
                        placeholder="10:00"
                        value={modalToTime}
                        onChange={(e) => handleTimeTyping(e.target.value, setModalToTime)}
                        onBlur={(e) => handleTimeBlur(e.target.value, setModalToTime)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Task / Description */}
                <div className="cal-form-group">
                  <label className="cal-form-label">Task Description</label>
                  <input
                    type="text"
                    className="cal-form-input"
                    placeholder="What did you work on?"
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                {/* Project Selection with Clickable Searchable Combobox */}
                <div className="cal-form-group" ref={projectDropdownRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="cal-form-label" style={{ margin: 0 }}>Project</label>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {filteredModalProjects.length} of {projects.length} projects
                    </span>
                  </div>

                  {/* Search Input Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search 
                      size={14} 
                      color="#94a3b8" 
                      style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
                    />
                    <input
                      type="text"
                      className="cal-form-input"
                      placeholder="Type to search or select project..."
                      value={projectSearchQuery}
                      onFocus={() => setIsProjectDropdownOpen(true)}
                      onClick={() => setIsProjectDropdownOpen(true)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProjectSearchQuery(val);
                        setIsProjectDropdownOpen(true);
                        // Auto-sync project selection if query matches
                        if (val.trim()) {
                          const q = val.toLowerCase();
                          const match = (projects || []).find(p => 
                            (p.name && p.name.toLowerCase().includes(q)) || 
                            (p.client && p.client.toLowerCase().includes(q))
                          );
                          if (match) {
                            setModalProject(match.name);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // Stop premature form submission
                          if (filteredModalProjects.length > 0) {
                            setModalProject(filteredModalProjects[0].name);
                            setIsProjectDropdownOpen(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsProjectDropdownOpen(false);
                        } else if (e.key === 'ArrowDown') {
                          setIsProjectDropdownOpen(true);
                        }
                      }}
                      style={{ 
                        paddingLeft: '32px', 
                        paddingRight: projectSearchQuery ? '30px' : '10px', 
                        height: '38px', 
                        fontSize: '13px', 
                        background: '#ffffff',
                        borderColor: isProjectDropdownOpen ? '#00cc00' : '#cbd5e1'
                      }}
                    />
                    {projectSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setProjectSearchQuery('');
                          setIsProjectDropdownOpen(true);
                        }}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                        title="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Selected Project Preview Card (Clickable to re-open dropdown) */}
                  <div
                    onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      marginTop: '6px',
                      transition: 'border-color 0.15s ease'
                    }}
                    title="Click to choose a project"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                      <span 
                        style={{ 
                          width: '9px', 
                          height: '9px', 
                          borderRadius: '50%', 
                          backgroundColor: currentModalProjectObj?.color || '#00cc00',
                          flexShrink: 0
                        }} 
                      />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {modalProject}
                      </span>
                      {currentModalProjectObj?.client && currentModalProjectObj.client !== '—' && (
                        <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                          ({currentModalProjectObj.client})
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#00cc00', fontWeight: 600, flexShrink: 0, marginLeft: '6px' }}>
                      <Check size={13} />
                      <span>Selected</span>
                      <ChevronDown size={13} color="#64748b" style={{ marginLeft: '2px' }} />
                    </div>
                  </div>

                  {/* Interactive Clickable Dropdown Menu */}
                  {isProjectDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 12px 28px -4px rgba(0,0,0,0.15), 0 6px 12px -4px rgba(0,0,0,0.08)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: 1100
                      }}
                    >
                      {filteredModalProjects.length === 0 ? (
                        <div style={{ padding: '14px 12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                          No projects match "{projectSearchQuery}"
                        </div>
                      ) : (
                        filteredModalProjects.map((p) => {
                          const isSelected = p.name === modalProject;
                          return (
                            <div
                              key={p.id || p.name}
                              onClick={() => {
                                setModalProject(p.name);
                                setIsProjectDropdownOpen(false);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '9px 12px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                background: isSelected ? '#f0fdf4' : 'transparent',
                                borderBottom: '1px solid #f1f5f9',
                                transition: 'background 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = '#f8fafc';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                <span 
                                  style={{ 
                                    width: '8px', 
                                    height: '8px', 
                                    borderRadius: '50%', 
                                    backgroundColor: p.color || '#00cc00', 
                                    flexShrink: 0 
                                  }} 
                                />
                                <span style={{ fontWeight: isSelected ? 600 : 500, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.name}
                                </span>
                                {p.client && p.client !== '—' && (
                                  <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                                    ({p.client})
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <Check size={14} color="#00cc00" style={{ flexShrink: 0, marginLeft: '8px' }} />
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Billable Toggle */}
                <label className="cal-billable-toggle">
                  <input
                    type="checkbox"
                    checked={modalBillable}
                    onChange={(e) => setModalBillable(e.target.checked)}
                    style={{ accentColor: '#00cc00', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <span>Billable task</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="cal-modal-footer">
                <button
                  type="button"
                  className="cal-btn-cancel"
                  onClick={() => { setShowAddModal(false); setEditingBlock(null); }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cal-btn-submit"
                >
                  {editingBlock ? <Check size={15} /> : <Plus size={15} />}
                  <span>{editingBlock ? 'Save Changes' : 'Add Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
