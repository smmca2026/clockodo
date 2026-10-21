import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  MoreVertical, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Calendar as CalendarIcon, 
  IndianRupee, 
  Trash2, 
  Copy, 
  CheckCircle2,
  Edit3,
  Search,
  Star,
  Check
} from 'lucide-react';
import TimeTracker from '../components/TimeTracker';
import { INITIAL_PROJECTS } from '../data/mockData';

// Reusable Inline Date Picker Popover Component
function RowDatePickerPopover({
  currentIsoDate,
  onSelectDate,
  onClose
}) {
  const popoverRef = useRef(null);
  
  const initDate = (() => {
    if (currentIsoDate && /^\d{4}-\d{2}-\d{2}$/.test(currentIsoDate)) {
      const [y, m, d] = currentIsoDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  })();

  const [viewYear, setViewYear] = useState(initDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initDate.getMonth());

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectQuickDate = (type, e) => {
    e.preventDefault();
    e.stopPropagation();
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    onSelectDate(`${yr}-${mo}-${da}`);
  };

  const handleSelectDay = (dayNum, e) => {
    e.preventDefault();
    e.stopPropagation();
    const yr = viewYear;
    const mo = String(viewMonth + 1).padStart(2, '0');
    const da = String(dayNum).padStart(2, '0');
    onSelectDate(`${yr}-${mo}-${da}`);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const now = new Date();
  const isSelectedDate = (dayNum) => {
    const yr = viewYear;
    const mo = String(viewMonth + 1).padStart(2, '0');
    const da = String(dayNum).padStart(2, '0');
    return `${yr}-${mo}-${da}` === currentIsoDate;
  };

  return (
    <div 
      className="clockify-entry-cal-popover" 
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="calendar-quick-actions">
        <button 
          type="button" 
          className="quick-date-chip"
          onClick={(e) => handleSelectQuickDate('today', e)}
        >
          Today
        </button>
        <button 
          type="button" 
          className="quick-date-chip"
          onClick={(e) => handleSelectQuickDate('yesterday', e)}
        >
          Yesterday
        </button>
      </div>

      <div className="calendar-month-nav">
        <button type="button" className="cal-nav-btn" onClick={handlePrevMonth}>
          <ChevronLeft size={15} />
        </button>
        <span className="cal-current-month">
          {monthNames[viewMonth]} {viewYear}
        </span>
        <button type="button" className="cal-nav-btn" onClick={handleNextMonth}>
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="calendar-weekdays-grid">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      <div className="calendar-days-grid">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <span key={`empty-${i}`} className="cal-day-empty" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const isSelected = isSelectedDate(dayNum);
          const isToday = 
            viewYear === now.getFullYear() && 
            viewMonth === now.getMonth() && 
            dayNum === now.getDate();

          return (
            <button
              key={dayNum}
              type="button"
              className={`cal-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={(e) => handleSelectDay(dayNum, e)}
              title={isToday ? "Today" : undefined}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Reusable Clean Row Project Dropdown Popover (No '+' Button)
function RowProjectPicker({
  projects = [],
  currentProjectName = '',
  currentProjectColor = '#00cc00',
  isOpen = false,
  onToggle,
  onSelectProject
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);

  const allProjects = (Array.isArray(projects) && projects.length > 0) ? projects : INITIAL_PROJECTS;

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onToggle(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  const filtered = allProjects.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.client && p.client.toLowerCase().includes(q))
    );
  });

  const clientGroups = filtered.reduce((acc, proj) => {
    const clientName = proj.client || 'General / Internal';
    if (!acc[clientName]) acc[clientName] = [];
    acc[clientName].push(proj);
    return acc;
  }, {});

  const displayTitle = currentProjectName && currentProjectName !== 'No Project' 
    ? currentProjectName 
    : 'Select Project';

  return (
    <div className="clockify-row-project-container" ref={popoverRef}>
      {/* Clean Trigger Button: Dot + Project Name with Hover Underline (No '+' button!) */}
      <button
        type="button"
        className={`clockify-row-proj-btn ${isOpen ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggle(!isOpen);
        }}
        title="Click to select or change project"
      >
        <span 
          className="clockify-row-proj-bullet" 
          style={{ backgroundColor: currentProjectColor || '#00cc00' }} 
        />
        <span className="clockify-row-proj-name">{displayTitle}</span>
      </button>

      {/* Floating Searchable Project Dropdown Popover */}
      {isOpen && (
        <div 
          className="project-picker-popover clockify-row-proj-popover"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="project-search-box">
            <Search size={15} className="project-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="project-search-input"
              placeholder="Search Project or Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
                    <span className="client-header-count">{projs.length}</span>
                  </div>

                  <div className="project-items-list">
                    {projs.map((proj) => {
                      const isSelected = 
                        currentProjectName && 
                        proj.name.toLowerCase() === currentProjectName.toLowerCase();
                      return (
                        <div
                          key={proj.id}
                          className={`project-picker-item ${isSelected ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectProject(proj);
                            onToggle(false);
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
        </div>
      )}
    </div>
  );
}

export default function TimeTrackerPage({
  projects = [],
  activities = [],
  onAddManualEntry,
  onCreateProject,
  searchQuery = '',
  activeTimer = null,
  onStartTimer = () => {},
  onStopTimer = () => {},
  onDeleteActivity = () => {},
  onDuplicateActivity = () => {},
  onUpdateActivityDate = () => {},
  onUpdateActivity = () => {},
  currentUser = null
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const [activeDatePickerKey, setActiveDatePickerKey] = useState(null);
  const [activeProjectPickerKey, setActiveProjectPickerKey] = useState(null);

  const [editingItemKey, setEditingItemKey] = useState(null);
  const [editingDescText, setEditingDescText] = useState('');
  const [editingStartTime, setEditingStartTime] = useState('');
  const [editingEndTime, setEditingEndTime] = useState('');
  const [editingTargetObj, setEditingTargetObj] = useState(null);
  const [editingMode, setEditingMode] = useState(null); // 'desc_only' | 'time_only' | 'both'

  const getTimeFormatPreference = () => {
    try {
      const saved = localStorage.getItem('clockodo_language_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userExplicitlySetTimeFormat && parsed.timeFormat) {
          return parsed.timeFormat;
        }
      }
    } catch (e) {}
    return '24h'; // Fixed default: Railway time (24-hour format)
  };

  const [activeTimeFormat, setActiveTimeFormat] = useState(() => getTimeFormatPreference());

  useEffect(() => {
    const checkPref = () => {
      setActiveTimeFormat(getTimeFormatPreference());
    };
    window.addEventListener('storage', checkPref);
    const interval = setInterval(checkPref, 1000);
    return () => {
      window.removeEventListener('storage', checkPref);
      clearInterval(interval);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveMenuId(null);
    };
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const toggleTaskExpand = (taskKey) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskKey]: !prev[taskKey]
    }));
  };

  const toggleGroupCollapse = (dateKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }));
  };

  const parseStartMinutes = (t) => {
    if (!t) return 0;
    const clean = t.trim().toUpperCase();
    const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) || 0;
      const marker = match[3];
      if (marker === 'PM' && h < 12) h += 12;
      if (marker === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    const parts = t.split(':').map(Number);
    let h = parts[0] || 0;
    if (h >= 1 && h <= 6) h += 12;
    return h * 60 + (parts[1] || 0);
  };

  const autoFormatTimeHHMM = (input) => {
    if (!input) return '';
    const trimmed = input.trim();
    if (!trimmed) return '';
    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 2) {
      const val = parseInt(digits, 10);
      if (val <= 23 && digits.length === 2) return `${digits}:`;
      return digits;
    }
    const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
    const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const calcDurationFromTimes = (startStr, endStr) => {
    if (!startStr || !endStr) return null;
    const startM = parseStartMinutes(startStr);
    const endM = parseStartMinutes(endStr);
    let diffM = endM - startM;
    if (diffM < 0) diffM += 24 * 60;
    const h = Math.floor(diffM / 60);
    const m = diffM % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  };

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    const trimmed = timeStr.trim();
    if (!trimmed) return '';

    const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
    if (!ampmMatch) return trimmed;

    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const marker = ampmMatch[3] ? ampmMatch[3].toUpperCase() : null;

    let h24 = hours;
    if (marker === 'PM' && hours < 12) h24 = hours + 12;
    if (marker === 'AM' && hours === 12) h24 = 0;

    if (activeTimeFormat === '12h') {
      const period = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      return `${String(h12).padStart(2, '0')}:${mins} ${period}`;
    } else {
      return `${String(h24).padStart(2, '0')}:${mins}`;
    }
  };

  const formatTimeWithAmPm = formatTimeDisplay;

  const parseTimeToSeconds = (str) => {
    if (!str || typeof str !== 'string') return 0;
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
    if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
    return 0;
  };

  const formatSecondsToTime = (sec) => {
    if (!sec || sec <= 0) return '00:00:00';
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTodayISO = () => {
    const d = new Date();
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const getYesterdayISO = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const normalizeActivityDate = (act) => {
    const todayISO = getTodayISO();
    const yestISO = getYesterdayISO();
    if (!act) return todayISO;
    
    if (act.date && /^\d{4}-\d{2}-\d{2}$/.test(act.date)) {
      return act.date;
    }
    const g = (act.group || act.date || '').toUpperCase();
    if (g.includes('TODAY')) return todayISO;
    if (g.includes('YESTERDAY')) return yestISO;

    const mMatch = g.match(/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{1,2})/i);
    if (mMatch) {
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const mIdx = monthNames.indexOf(mMatch[1].toUpperCase()) + 1;
      const dayNum = parseInt(mMatch[2], 10);
      return `2026-${String(mIdx).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }

    return todayISO;
  };

  const getDisplayLabelForDate = (isoDate) => {
    const todayISO = getTodayISO();
    const yestISO = getYesterdayISO();

    if (isoDate === todayISO) return 'Today';
    if (isoDate === yestISO) return 'Yesterday';

    const [y, m, d] = isoDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayOfWeek = dayNames[dateObj.getDay()];
    const monthStr = monthNames[m - 1];
    const dayStr = String(d).padStart(2, '0');

    return `${dayOfWeek}, ${monthStr} ${dayStr}`;
  };

  const filteredActivities = activities.filter(act => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (act.description && act.description.toLowerCase().includes(q)) ||
           (act.project && act.project.toLowerCase().includes(q));
  });

  const groupedByDate = filteredActivities.reduce((acc, act) => {
    const isoDate = normalizeActivityDate(act);
    if (!acc[isoDate]) acc[isoDate] = [];
    acc[isoDate].push(act);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  let overallSec = 0;
  filteredActivities.forEach(act => {
    overallSec += parseTimeToSeconds(act.durationFormatted);
  });
  const weekTotalFormatted = formatSecondsToTime(overallSec);

  const isItemRunning = (item) => {
    return !!activeTimer?.isRunning && (
      (activeTimer.taskId && activeTimer.taskId === item.id) ||
      (activeTimer.taskDescription === item.description && activeTimer.projectName === item.project)
    );
  };

  const handleTogglePlayEntry = (item) => {
    if (isItemRunning(item)) {
      onStopTimer();
      showToast(`✓ Paused timer for "${item.project}"`);
    } else {
      onStartTimer({
        taskId: item.id,
        projectName: item.project,
        projectColor: item.projectColor || '#00cc00',
        taskDescription: item.description,
        isBillable: item.billable !== false,
      });
      showToast(`▶ Started timer for "${item.project}"`);
    }
  };

  const handleDuplicate = (item) => {
    onDuplicateActivity(item);
    setActiveMenuId(null);
    showToast(`✓ Duplicated entry for "${item.project}"`);
  };

  const handleDelete = (item) => {
    onDeleteActivity(item.id);
    setActiveMenuId(null);
    showToast(`✓ Deleted time entry`);
  };

  // 1. Edit Description ONLY (when clicking description text)
  const startEditingDescOnly = (itemKey, currentText, targetObj, e) => {
    if (e) e.stopPropagation();
    setEditingItemKey(itemKey);
    setEditingMode('desc_only');
    setEditingDescText(currentText || '');
    setEditingTargetObj(targetObj);
    setActiveMenuId(null);
  };

  // 2. Edit Timing ONLY (when clicking time interval)
  const startEditingTimeOnly = (itemKey, startStr, endStr, targetObj, e) => {
    if (e) e.stopPropagation();
    setEditingItemKey(itemKey);
    setEditingMode('time_only');
    setEditingStartTime(formatTimeDisplay(startStr) || '09:00');
    setEditingEndTime(formatTimeDisplay(endStr) || '17:00');
    setEditingTargetObj(targetObj);
    setActiveMenuId(null);
  };

  // 3. Edit BOTH Description & Time (when selecting 3-dots "Edit Description & Time")
  const startEditingBoth = (itemKey, currentText, startStr, endStr, targetObj, e) => {
    if (e) e.stopPropagation();
    setEditingItemKey(itemKey);
    setEditingMode('both');
    setEditingDescText(currentText || '');
    setEditingStartTime(formatTimeDisplay(startStr) || '09:00');
    setEditingEndTime(formatTimeDisplay(endStr) || '17:00');
    setEditingTargetObj(targetObj);
    setActiveMenuId(null);
  };

  const startEditingEntry = startEditingBoth;
  const startEditingDescription = startEditingDescOnly;

  // Save inline description and/or timing based on active mode
  const handleSaveEntry = (itemOrCluster) => {
    const target = itemOrCluster || editingTargetObj;
    if (!target) {
      setEditingItemKey(null);
      setEditingMode(null);
      return;
    }

    const updates = {};
    let toastDetails = '';

    if (editingMode === 'desc_only') {
      const cleanText = (editingDescText || '').trim() || 'Working session';
      updates.description = cleanText;
      toastDetails = `description: "${cleanText}"`;
    } else if (editingMode === 'time_only') {
      const cleanStart = (editingStartTime || '').trim();
      const cleanEnd = (editingEndTime || '').trim();
      if (cleanStart) updates.startTime = cleanStart;
      if (cleanEnd) updates.endTime = cleanEnd;
      if (cleanStart && cleanEnd) {
        const calculatedDuration = calcDurationFromTimes(cleanStart, cleanEnd);
        if (calculatedDuration) updates.durationFormatted = calculatedDuration;
      }
      toastDetails = `time: (${cleanStart} - ${cleanEnd})`;
    } else {
      // Both
      const cleanText = (editingDescText || '').trim() || 'Working session';
      const cleanStart = (editingStartTime || '').trim();
      const cleanEnd = (editingEndTime || '').trim();
      updates.description = cleanText;
      if (cleanStart) updates.startTime = cleanStart;
      if (cleanEnd) updates.endTime = cleanEnd;
      if (cleanStart && cleanEnd) {
        const calculatedDuration = calcDurationFromTimes(cleanStart, cleanEnd);
        if (calculatedDuration) updates.durationFormatted = calculatedDuration;
      }
      toastDetails = `description & time: "${cleanText}" (${cleanStart} - ${cleanEnd})`;
    }

    if (target.sessions && Array.isArray(target.sessions)) {
      target.sessions.forEach(s => {
        onUpdateActivity(s.id, updates);
      });
    } else if (target.id) {
      onUpdateActivity(target.id, updates);
    } else if (target.representativeItem?.id) {
      onUpdateActivity(target.representativeItem.id, updates);
    }

    setEditingItemKey(null);
    setEditingMode(null);
    setEditingTargetObj(null);
    showToast(`✓ Updated ${toastDetails}`);
  };

  const handleSaveDescription = (itemOrCluster) => {
    handleSaveEntry(itemOrCluster);
  };

  // Handle project selection from row dropdown
  const handleRowSelectProject = (itemOrCluster, projObj) => {
    const projName = projObj?.name || 'No Project';
    const projColor = projObj?.color || '#00cc00';
    const projId = projObj?.id || `proj-${Date.now()}`;

    const updates = { 
      project: projName, 
      projectColor: projColor,
      projectId: projId 
    };

    if (itemOrCluster.sessions && Array.isArray(itemOrCluster.sessions)) {
      itemOrCluster.sessions.forEach(s => {
        onUpdateActivity(s.id, updates);
      });
    } else if (itemOrCluster.id) {
      onUpdateActivity(itemOrCluster.id, updates);
    } else if (itemOrCluster.representativeItem?.id) {
      onUpdateActivity(itemOrCluster.representativeItem.id, updates);
    }

    setActiveProjectPickerKey(null);
    showToast(`✓ Project changed to "${projName}"`);
  };

  // Handle date change from Date Picker Popover
  const handleSelectNewDate = (itemOrCluster, newIsoDate) => {
    const newGroupLabel = getDisplayLabelForDate(newIsoDate);
    if (itemOrCluster.sessions && Array.isArray(itemOrCluster.sessions)) {
      itemOrCluster.sessions.forEach(s => {
        onUpdateActivityDate(s.id, newIsoDate, newGroupLabel);
        onUpdateActivity(s.id, { date: newIsoDate, group: newGroupLabel });
      });
    } else if (itemOrCluster.id) {
      onUpdateActivityDate(itemOrCluster.id, newIsoDate, newGroupLabel);
      onUpdateActivity(itemOrCluster.id, { date: newIsoDate, group: newGroupLabel });
    } else if (itemOrCluster.representativeItem?.id) {
      onUpdateActivityDate(itemOrCluster.representativeItem.id, newIsoDate, newGroupLabel);
      onUpdateActivity(itemOrCluster.representativeItem.id, { date: newIsoDate, group: newGroupLabel });
    }
    setActiveDatePickerKey(null);
    showToast(`✓ Entry moved to ${newGroupLabel}`);
  };

  return (
    <div className="clockify-page-container">
      {/* 1. Clockify Simple Horizontal Tracker Bar */}
      <TimeTracker
        projects={projects}
        onAddManualEntry={onAddManualEntry}
        onCreateProject={onCreateProject}
        activeTimer={activeTimer}
        onStartTimer={onStartTimer}
        onStopTimer={onStopTimer}
        currentUser={currentUser}
      />

      {/* 2. List Header: "This week" and "Week total: 23:30:00" */}
      <div className="clockify-week-header">
        <span className="clockify-week-title">This week</span>
        <span className="clockify-week-total">
          Week total: <strong className="week-total-bold">{weekTotalFormatted}</strong>
        </span>
      </div>

      {/* 3. Grouped Daily Cards */}
      <div className="clockify-groups-container">
        {sortedDateKeys.length === 0 ? (
          <div style={{ background: '#ffffff', padding: '36px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}>
            No recorded time entries found.
          </div>
        ) : (
          sortedDateKeys.map((isoDate, groupIdx) => {
            const rawItems = groupedByDate[isoDate] || [];
            const groupLabel = getDisplayLabelForDate(isoDate);
            const isCollapsed = !!collapsedGroups[isoDate];

            const groupItems = [...rawItems].sort((a, b) => {
              return parseStartMinutes(b.startTime) - parseStartMinutes(a.startTime);
            });

            let daySec = 0;
            rawItems.forEach(item => {
              daySec += parseTimeToSeconds(item.durationFormatted);
            });
            const groupTotal = formatSecondsToTime(daySec);
            const isLastGroup = groupIdx === sortedDateKeys.length - 1;

            return (
              <div key={isoDate} className={`clockify-day-card ${isCollapsed ? 'is-collapsed' : ''}`}>
                {/* Day Header Row */}
                <div 
                  className="clockify-day-header"
                  onClick={() => toggleGroupCollapse(isoDate)}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  title={isCollapsed ? `Click to expand ${groupLabel}` : `Click to collapse ${groupLabel}`}
                >
                  <div className="clockify-day-header-left">
                    <button 
                      type="button" 
                      className="clockify-group-collapse-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroupCollapse(isoDate);
                      }}
                      title={isCollapsed ? "Expand" : "Collapse"}
                    >
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <span className="clockify-day-name">{groupLabel}</span>
                    {isCollapsed && (
                      <span className="clockify-day-collapsed-badge">
                        {rawItems.length} {rawItems.length === 1 ? 'entry' : 'entries'}
                      </span>
                    )}
                  </div>
                  <div className="clockify-day-total-wrap">
                    <span className="clockify-day-total-label">Total:</span>
                    <span className="clockify-day-total-val">{groupTotal}</span>
                  </div>
                </div>

                {/* Day Entry Rows */}
                {!isCollapsed && (
                  <div className="clockify-entries-list">
                    {groupItems.map((item, itemIdx) => {
                      const rowKey = `row_${item.id || itemIdx}`;
                      const running = isItemRunning(item);
                      const isRowActive = editingItemKey === rowKey;
                      const isEditingDesc = isRowActive && (editingMode === 'desc_only' || editingMode === 'both');
                      const isEditingTime = isRowActive && (editingMode === 'time_only' || editingMode === 'both');
                      const isDatePickerOpen = activeDatePickerKey === rowKey;
                      const isProjPickerOpen = activeProjectPickerKey === rowKey;
                      const isLastInGroup = itemIdx === groupItems.length - 1;
                      const shouldOpenUpwards = isLastGroup || isLastInGroup;

                      const startStr = item.startTime || '09:00';
                      const endStr = item.endTime || '17:00';
                      const displayDesc = item.description || 'Working session';
                      const displayDuration = item.durationFormatted || '00:00:00';

                      return (
                        <div 
                          key={item.id || itemIdx} 
                          className="clockify-entry-cluster"
                          style={{ 
                            position: 'relative', 
                            zIndex: (isDatePickerOpen || isProjPickerOpen || activeMenuId === rowKey) ? 9999 : 1 
                          }}
                        >
                          <div 
                            className={`clockify-entry-row ${running ? 'is-row-running' : ''}`}
                            style={{ position: 'relative' }}
                          >
                            {/* Description & Clean Project Picker */}
                            <div className="clockify-entry-left">
                              <span className="cluster-single-indent" />

                              {/* Seamless Inline Editable Description */}
                              <div className="clockify-desc-cell-wrapper" onClick={(e) => e.stopPropagation()}>
                                {isEditingDesc ? (
                                  <input
                                    type="text"
                                    className="clockify-desc-seamless-input"
                                    value={editingDescText}
                                    onChange={(e) => setEditingDescText(e.target.value)}
                                    onBlur={() => handleSaveEntry(item)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveEntry(item);
                                        e.target.blur();
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingItemKey(null);
                                      }
                                    }}
                                    autoFocus
                                    placeholder="What did you work on?"
                                  />
                                ) : (
                                  <span 
                                    className="clockify-entry-desc-clean"
                                    onClick={(e) => startEditingDescOnly(rowKey, displayDesc, item, e)}
                                    title="Click to edit task description"
                                  >
                                    {displayDesc}
                                  </span>
                                )}
                              </div>
                              
                              {/* Clean Project Selector: Dot + Project Name with Hover Underline (NO '+' sign!) */}
                              <RowProjectPicker
                                projects={projects}
                                currentProjectName={item.project || 'No Project'}
                                currentProjectColor={item.projectColor || '#00cc00'}
                                isOpen={isProjPickerOpen}
                                onToggle={(isOpen) => setActiveProjectPickerKey(isOpen ? rowKey : null)}
                                onSelectProject={(projObj) => handleRowSelectProject(item, projObj)}
                              />
                            </div>

                            {/* Meta Icon: Billable Rupee */}
                            <div className="clockify-entry-meta">
                              <IndianRupee 
                                size={15} 
                                className={`entry-icon-rupee ${item.billable !== false ? 'is-billable' : ''}`} 
                                title={item.billable !== false ? "Billable task (₹)" : "Non-billable task"}
                              />
                            </div>

                            {/* Interval: start to end (Editable timing & 24h Railway display) */}
                            {isEditingTime ? (
                              <div className="clockify-entry-window is-editing" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <input 
                                  type="text"
                                  value={editingStartTime}
                                  onChange={(e) => setEditingStartTime(autoFormatTimeHHMM(e.target.value))}
                                  placeholder="10:00"
                                  title="Start Time"
                                  style={{ width: '56px', padding: '2px 4px', fontSize: '12px', textAlign: 'center', borderRadius: '4px', border: '1px solid #00cc00', outline: 'none', fontFamily: 'var(--font-mono)', background: '#ffffff', color: '#0f172a', fontWeight: 600 }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEntry(item);
                                    if (e.key === 'Escape') setEditingItemKey(null);
                                  }}
                                />
                                <span className="window-sep">-</span>
                                <input 
                                  type="text"
                                  value={editingEndTime}
                                  onChange={(e) => setEditingEndTime(autoFormatTimeHHMM(e.target.value))}
                                  placeholder="18:00"
                                  title="End Time"
                                  style={{ width: '56px', padding: '2px 4px', fontSize: '12px', textAlign: 'center', borderRadius: '4px', border: '1px solid #00cc00', outline: 'none', fontFamily: 'var(--font-mono)', background: '#ffffff', color: '#0f172a', fontWeight: 600 }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEntry(item);
                                    if (e.key === 'Escape') setEditingItemKey(null);
                                  }}
                                />
                                <button 
                                  type="button" 
                                  onClick={() => handleSaveEntry(item)} 
                                  title="Save Changes (Enter)" 
                                  style={{ background: '#00cc00', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                                >
                                  ✓
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => { setEditingItemKey(null); setEditingMode(null); }} 
                                  title="Cancel (Esc)" 
                                  style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div 
                                className="clockify-entry-window is-clickable"
                                onClick={(e) => startEditingTimeOnly(rowKey, startStr, endStr, item, e)}
                                title="Click to edit timing"
                                style={{ cursor: 'pointer' }}
                              >
                                <span>{formatTimeDisplay(startStr)}</span>
                                <span className="window-sep">-</span>
                                <span>{formatTimeDisplay(endStr)}</span>
                              </div>
                            )}

                            {/* Calendar Icon Button with Interactive Date Picker Popover */}
                            <div className="clockify-cal-action-wrapper">
                              <button
                                type="button"
                                className={`clockify-entry-cal-btn is-clickable ${isDatePickerOpen ? 'active' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDatePickerKey(isDatePickerOpen ? null : rowKey);
                                }}
                                title="Click to view/change date"
                              >
                                <CalendarIcon size={14} />
                              </button>

                              {isDatePickerOpen && (
                                <RowDatePickerPopover
                                  currentIsoDate={isoDate}
                                  onSelectDate={(newDate) => handleSelectNewDate(item, newDate)}
                                  onClose={() => setActiveDatePickerKey(null)}
                                />
                              )}
                            </div>

                            {/* Exact Individual Duration (e.g. 03:20:00, NOT the summed 13:20:00!) */}
                            <div 
                              className="clockify-entry-duration"
                              style={running ? { color: '#009900', fontWeight: 800 } : {}}
                            >
                              {running && activeTimer?.isRunning
                                ? `${String(Math.floor(activeTimer.elapsedSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((activeTimer.elapsedSeconds % 3600) / 60)).padStart(2, '0')}:${String(activeTimer.elapsedSeconds % 60).padStart(2, '0')}`
                                : displayDuration}
                            </div>

                            {/* Direct Play / Pause Action Button */}
                            <div className="clockify-entry-actions">
                              {running ? (
                                <button 
                                  type="button" 
                                  className="entry-btn-play" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePlayEntry(item);
                                  }}
                                  title={`Pause timer for "${item.project}"`}
                                  style={{ color: '#009900' }}
                                >
                                  <Pause size={13} fill="currentColor" />
                                </button>
                              ) : (
                                <button 
                                  type="button" 
                                  className="entry-btn-play" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePlayEntry(item);
                                  }}
                                  title={`Start timer for "${item.project}"`}
                                >
                                  <Play size={13} fill="currentColor" />
                                </button>
                              )}

                              <div className="clockify-entry-menu-wrapper" style={{ position: 'relative' }}>
                                <button 
                                  type="button" 
                                  className={`entry-btn-options ${activeMenuId === rowKey ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === rowKey ? null : rowKey);
                                  }}
                                  title="More options (Edit, Delete)"
                                >
                                  <MoreVertical size={14} />
                                </button>

                                {/* 3-Dots Dropdown Menu */}
                                {activeMenuId === rowKey && (
                                  <div 
                                    className={`clockify-entry-dropdown-menu ${shouldOpenUpwards ? 'open-upwards' : ''}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button 
                                      type="button" 
                                      className="clockify-entry-menu-item"
                                      onClick={(e) => startEditingBoth(rowKey, displayDesc, startStr, endStr, item, e)}
                                    >
                                      <Edit3 size={13} color="#3b82f6" />
                                      <span>Edit Description & Time</span>
                                    </button>
                                    <button 
                                      type="button" 
                                      className="clockify-entry-menu-item is-delete"
                                      onClick={() => {
                                        onDeleteActivity(item.id);
                                        setActiveMenuId(null);
                                        showToast(`✓ Deleted time entry`);
                                      }}
                                    >
                                      <Trash2 size={13} color="#ef4444" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating In-App Toast */}
      {toastMessage && (
        <div className="clockodo-toast-pill">
          <CheckCircle2 size={15} color="#00cc00" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
