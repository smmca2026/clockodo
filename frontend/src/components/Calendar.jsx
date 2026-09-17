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
  Trash2
} from 'lucide-react';
import { CALENDAR_WEEK_SCHEDULE, INITIAL_PROJECTS } from '../data/mockData';

function getActivityDate(act) {
  if (!act) return '';
  if (act.date && /^\d{4}-\d{2}-\d{2}$/.test(act.date)) return act.date;
  const g = (act.group || act.date || '').toLowerCase();
  if (g.includes('today') || g.includes('sep 1')) return '2026-09-01';
  if (g.includes('yesterday') || g.includes('aug 31') || g.includes('31')) return '2026-08-31';
  if (/aug(ust)?\s*28|\b28\b/i.test(g)) return '2026-08-28';
  if (/aug(ust)?\s*27|\b27\b/i.test(g)) return '2026-08-27';
  if (/aug(ust)?\s*26|\b26\b/i.test(g)) return '2026-08-26';
  if (/aug(ust)?\s*25|\b25\b/i.test(g)) return '2026-08-25';
  if (/aug(ust)?\s*24|\b24\b/i.test(g)) return '2026-08-24';
  if (/aug(ust)?\s*17|\b17\b/i.test(g)) return '2026-08-17';
  return '2026-09-01';
}

function formatTimeWithAmPm(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const marker = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;

    if (marker) {
      if (hours === 0) hours = 12;
      return `${String(hours).padStart(2, '0')}:${mins} ${marker}`;
    } else {
      const period = hours >= 12 ? 'PM' : 'AM';
      let h12 = hours % 12;
      if (h12 === 0) h12 = 12;
      return `${String(h12).padStart(2, '0')}:${mins} ${period}`;
    }
  }

  return trimmed;
}

export default function Calendar({
  calendarSchedule = CALENDAR_WEEK_SCHEDULE,
  onUpdateCalendarSchedule,
  activeTimer = null,
  activities = [],
  timesheetRows = [],
  projects = INITIAL_PROJECTS,
  currentUser = null,
  onAddManualEntry,
  onDeleteCalendarEntry
}) {
  // View mode: 'week' | 'day' (Default to 'week')
  const [calendarViewMode, setCalendarViewMode] = useState('week');
  const [weekOffset, setWeekOffset] = useState(0);
  
  // Real-time dynamic current date tracking (Auto-rolls over at midnight)
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(() => new Date());

  // Helper to match activities for the currently logged in user (Admin / Employee personal scoping)
  const userFilteredActivities = useMemo(() => {
    if (!currentUser) return activities;
    const myName = (currentUser.name || '').trim().toLowerCase();
    const myEmail = (currentUser.email || '').trim().toLowerCase();
    const myId = currentUser.id ? String(currentUser.id) : '';

    return activities.filter(act => {
      const actUser = (act.user || act.userName || act.user_name || act.member || act.assignedTo || '').trim().toLowerCase();
      const actEmail = (act.userEmail || act.email || '').trim().toLowerCase();
      const actUserId = (act.userId || act.user_id) ? String(act.userId || act.user_id) : '';

      if (myId && actUserId && myId === actUserId) return true;
      if (myEmail && actEmail && myEmail === actEmail) return true;
      if (myName && actUser && (actUser === myName || actUser.includes(myName) || myName.includes(actUser))) return true;
      if (!actUser && !actEmail && !actUserId) return true; // legacy local items created in current session
      return false;
    });
  }, [activities, currentUser]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePopoverRef = useRef(null);
  const timelineScrollRef = useRef(null);

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

        const START_HOUR = 8;
  const HOUR_HEIGHT = 64;
  const timelineHours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
    '20:00', '21:00', '22:00'
  ];

  
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

  // Progressive Live Auto-Colon Helper for Time Range
  const handleTimeTyping = (input, setter) => {
    if (!input) {
      setter('');
      return;
    }
    const trimmed = input.trim();

    // Direct colon typed like "9:" or "10:"
    if (/^\d{1,2}:$/.test(trimmed)) {
      const h = parseInt(trimmed, 10);
      setter(`${String(h).padStart(2, '0')}:`);
      return;
    }

    // Has colon with minutes being typed: "09:3", "09:30", "10:15"
    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      let h = parts[0].replace(/\D/g, '').slice(0, 2);
      let m = parts[1].replace(/\D/g, '').slice(0, 2);
      if (h.length === 1 && parseInt(h, 10) >= 3) {
        h = '0' + h;
      }
      setter(`${h}:${m}`);
      return;
    }

    // Only digits without colon
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) {
      setter('');
      return;
    }

    // 1 Digit: If 3-9, instantly add colon (e.g. '9' -> '09:', '4' -> '04:')
    if (digits.length === 1) {
      const d = parseInt(digits, 10);
      if (d >= 3 && d <= 9) {
        setter(`0${d}:`);
        return;
      }
      setter(digits);
      return;
    }

    // 2 Digits: If <= 24, append colon (e.g. '10' -> '10:', '09' -> '09:')
    if (digits.length === 2) {
      const val = parseInt(digits, 10);
      if (val <= 24) {
        setter(`${String(val).padStart(2, '0')}:`);
        return;
      } else {
        setter(`0${digits[0]}:${digits[1]}`);
        return;
      }
    }

    // 3 Digits: (e.g. '930' -> '09:30', '130' -> '01:30')
    if (digits.length === 3) {
      const first = parseInt(digits[0], 10);
      if (first >= 3) {
        setter(`0${first}:${digits.slice(1, 3)}`);
        return;
      } else {
        setter(`${digits.slice(0, 2)}:${digits[2]}`);
        return;
      }
    }

    // 4 Digits: (e.g. '0930' -> '09:30', '1045' -> '10:45')
    if (digits.length >= 4) {
      const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
      const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
      setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      return;
    }

    setter(trimmed);
  };

  const handleTimeBlur = (input, setter) => {
    if (!input || typeof input !== 'string') return;
    const trimmed = input.trim();
    if (!trimmed || trimmed === '0') return;

    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
      const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
      setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      return;
    }

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 1 || (digits.length === 2 && parseInt(digits, 10) <= 24)) {
      const h = Math.min(23, parseInt(digits, 10));
      setter(`${String(h).padStart(2, '0')}:00`);
    } else if (digits.length === 3) {
      const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
      const m = parseInt(digits[2] + '0', 10);
      setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    } else if (digits.length >= 4) {
      const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
      const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
      setter(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
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
    setModalDayNum(dayObj.dayNum);
    setModalIsoDate(dayObj.isoDate || `2026-09-${String(dayObj.dayNum).padStart(2, '0')}`);
    setModalDateLabel(dayObj.dateStr || `Sep ${dayObj.dayNum}, 2026`);
    setModalFromTime(defaultFrom);
    setModalToTime(defaultTo);
    setModalDescription('');
    setModalProject(projects[0]?.name || 'JRKS Logistics');
    setModalBillable(true);
    setShowAddModal(true);
  };

  // Handle Form Submit (Add Entry & Sync Globally)
  const handleAddEntrySubmit = (e) => {
    e.preventDefault();
    const fromDec = parseTimeToDecimal(modalFromTime);
    const toDec = parseTimeToDecimal(modalToTime);
    let diffHours = toDec - fromDec;
    if (diffHours <= 0) diffHours = 1.0;

    const projObj = projects.find(p => p.name === modalProject);
    const targetISO = modalIsoDate;
    const groupName = modalDateLabel;

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
          title: act.description,
          subtitle: `${formatTimeWithAmPm(act.startTime || '09:00')} - ${formatTimeWithAmPm(act.endTime || '10:00')}`,
          project: act.project,
          duration: act.durationFormatted,
          topHour: rawH,
          durationHours: durH,
          color: act.projectColor || '#00cc00',
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
  }, [weekOffset, activities]);

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
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="Pick a Date"
          >
            <CalendarIcon size={15} />
            <span>Calendar</span>
          </button>

          {/* Date Picker Popover */}
          {showDatePicker && (
            <div className="calendar-popover-dropdown" ref={datePopoverRef}>
              <div className="popover-month-header">
                <span>September 2026</span>
                <button 
                  type="button" 
                  onClick={() => setShowDatePicker(false)} 
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}
                >
                  ✕
                </button>
              </div>
              <div className="popover-weekdays-row">
                <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
              </div>
              <div className="popover-days-grid">
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                  const isCurrentSelected = selectedDayDate.getDate() === d && selectedDayDate.getMonth() === 8 && selectedDayDate.getFullYear() === 2026;
                  const isToday = currentDate.getDate() === d && currentDate.getMonth() === 8 && currentDate.getFullYear() === 2026;
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`popover-day-btn ${isToday ? 'is-today' : ''} ${isCurrentSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedDayDate(new Date(2026, 8, d));
                        setCalendarViewMode('day');
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
                        }}
                        title={`${block.project}: ${block.title} (${block.duration})`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="event-block-del-btn"
                          onClick={(e) => handleDeleteEntry(day.dayNum, block.id, e, block)}
                          title="Delete this time entry"
                        >
                          <Trash2 size={11} />
                        </button>
                        
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
                      title: act.description,
                      subtitle: `${formatTimeWithAmPm(act.startTime || '09:00')} - ${formatTimeWithAmPm(act.endTime || '10:00')}`,
                      project: act.project,
                      duration: act.durationFormatted,
                      topHour: rawH,
                      durationHours: durH,
                      color: act.projectColor || '#00cc00',
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
                      }}
                      title={`${block.project}: ${block.title} (${block.duration})`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="event-block-del-btn"
                        onClick={(e) => handleDeleteEntry(selectedDayDate.getDate(), block.id, e, block)}
                        title="Delete this time entry"
                      >
                        <Trash2 size={11} />
                      </button>
                      
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
        <div className="cal-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="cal-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="cal-modal-header">
              <div className="cal-modal-title-group">
                <div className="cal-modal-icon-badge">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="cal-modal-title">Add Time Entry</div>
                  <div className="cal-modal-subtitle">Log work directly to calendar timeline</div>
                </div>
              </div>
              <button 
                type="button" 
                className="cal-modal-close-btn"
                onClick={() => setShowAddModal(false)}
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

                {/* Project Selection */}
                <div className="cal-form-group">
                  <label className="cal-form-label">Project</label>
                  <select
                    className="cal-form-select"
                    value={modalProject}
                    onChange={(e) => setModalProject(e.target.value)}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>
                        {p.name} ({p.client || 'Client'})
                      </option>
                    ))}
                  </select>
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
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cal-btn-submit"
                >
                  <Plus size={15} />
                  <span>Add Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
