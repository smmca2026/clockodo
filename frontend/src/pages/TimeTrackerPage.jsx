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

  const formatTimeWithAmPm = (timeStr) => {
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
  };

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

  // Start seamless inline description editing
  const startEditingDescription = (itemKey, currentText, e) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingItemKey(itemKey);
    setEditingDescText(currentText || '');
    setActiveMenuId(null);
  };

  // Save seamless inline description
  const handleSaveDescription = (itemOrCluster, newText) => {
    const cleanText = newText.trim() || 'Working session';
    const updates = { description: cleanText };

    if (itemOrCluster.sessions && Array.isArray(itemOrCluster.sessions)) {
      itemOrCluster.sessions.forEach(s => {
        onUpdateActivity(s.id, updates);
      });
    } else if (itemOrCluster.id) {
      onUpdateActivity(itemOrCluster.id, updates);
    } else if (itemOrCluster.representativeItem?.id) {
      onUpdateActivity(itemOrCluster.representativeItem.id, updates);
    }

    setEditingItemKey(null);
    showToast(`✓ Description saved: "${cleanText}"`);
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
                    {(() => {
                      const clustersMap = {};
                      const clustersOrder = [];

                      groupItems.forEach((item) => {
                        const projKey = (item.project || 'No Project').trim().toLowerCase();
                        const clusterKey = projKey;

                        if (!clustersMap[clusterKey]) {
                          clustersMap[clusterKey] = {
                            key: clusterKey,
                            description: item.description,
                            project: item.project || 'No Project',
                            projectColor: item.projectColor || '#00cc00',
                            billable: item.billable !== false,
                            sessions: [],
                            totalSec: 0,
                            representativeItem: item,
                          };
                          clustersOrder.push(clusterKey);
                        }

                        clustersMap[clusterKey].sessions.push(item);
                        clustersMap[clusterKey].totalSec += parseTimeToSeconds(item.durationFormatted);
                      });

                      clustersOrder.forEach((key) => {
                        clustersMap[key].sessions.sort((a, b) => {
                          return parseStartMinutes(b.startTime) - parseStartMinutes(a.startTime);
                        });
                      });

                      return clustersOrder.map((clusterKey, cIdx) => {
                        const cluster = clustersMap[clusterKey];
                        const isMultiSession = cluster.sessions.length > 1;
                        const taskExpandedKey = `${isoDate}_${clusterKey}`;
                        const isExpanded = !!expandedTasks[taskExpandedKey];
                        const repItem = cluster.representativeItem;
                        const running = cluster.sessions.some((s) => isItemRunning(s));
                        const formattedClusterTotal = formatSecondsToTime(cluster.totalSec);
                        const isLastInGroup = cIdx === clustersOrder.length - 1;
                        const shouldOpenUpwards = isLastGroup || isLastInGroup;

                        const parentRowKey = `parent_${isoDate}_${clusterKey}`;
                        const isEditingDesc = editingItemKey === parentRowKey;
                        const isDatePickerOpen = activeDatePickerKey === parentRowKey;
                        const isProjPickerOpen = activeProjectPickerKey === parentRowKey;

                        let earliestMin = 99999;
                        let earliestStartStr = cluster.sessions[0].startTime;
                        let latestMin = -1;
                        let latestEndStr = cluster.sessions[0].endTime;

                        cluster.sessions.forEach((s) => {
                          const sMin = parseStartMinutes(s.startTime);
                          const eMin = parseStartMinutes(s.endTime);
                          if (sMin < earliestMin) {
                            earliestMin = sMin;
                            earliestStartStr = s.startTime;
                          }
                          if (eMin > latestMin) {
                            latestMin = eMin;
                            latestEndStr = s.endTime;
                          }
                        });

                        const displayDesc = isMultiSession
                          ? (cluster.sessions[0]?.description || cluster.project)
                          : (cluster.sessions[0]?.description || cluster.project);

                        return (
                          <div 
                            key={clusterKey} 
                            className={`clockify-entry-cluster ${isExpanded ? 'is-cluster-expanded' : ''}`}
                            style={{ 
                              position: 'relative', 
                              zIndex: (isDatePickerOpen || isProjPickerOpen || activeMenuId === parentRowKey) ? 9999 : (isExpanded ? 10 : 1) 
                            }}
                          >
                            {/* Main Task Row */}
                            <div 
                              className={`clockify-entry-row ${running ? 'is-row-running' : ''} ${isMultiSession ? 'is-multi-session' : ''}`}
                              onClick={() => {
                                if (isMultiSession && !isEditingDesc && !isProjPickerOpen) {
                                  toggleTaskExpand(taskExpandedKey);
                                }
                              }}
                              style={{ 
                                cursor: isMultiSession ? 'pointer' : 'default',
                                position: 'relative'
                              }}
                            >
                              {/* Description & Clean Project Picker (NO '+' BUTTON!) */}
                              <div className="clockify-entry-left">
                                {isMultiSession ? (
                                  <button 
                                    type="button" 
                                    className="cluster-expand-chevron-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleTaskExpand(taskExpandedKey);
                                    }}
                                    title={isExpanded ? "Collapse project sessions" : "Expand project sessions dropdown"}
                                  >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                  </button>
                                ) : (
                                  <span className="cluster-single-indent" />
                                )}

                                {/* Seamless Inline Editable Description */}
                                <div className="clockify-desc-cell-wrapper" onClick={(e) => e.stopPropagation()}>
                                  {isEditingDesc ? (
                                    <input
                                      type="text"
                                      className="clockify-desc-seamless-input"
                                      value={editingDescText}
                                      onChange={(e) => setEditingDescText(e.target.value)}
                                      onBlur={() => handleSaveDescription(cluster, editingDescText)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleSaveDescription(cluster, editingDescText);
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
                                      onClick={(e) => startEditingDescription(parentRowKey, displayDesc, e)}
                                      title="Click to edit task description"
                                    >
                                      {displayDesc || 'Add description...'}
                                      {isMultiSession && (
                                        <span className="sub-session-count-tag" style={{ marginLeft: '6px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                          (+{cluster.sessions.length - 1})
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                
                                {/* Clean Project Selector: Dot + Project Name with Hover Underline (NO '+' sign!) */}
                                <RowProjectPicker
                                  projects={projects}
                                  currentProjectName={cluster.project}
                                  currentProjectColor={cluster.projectColor}
                                  isOpen={isProjPickerOpen}
                                  onToggle={(isOpen) => setActiveProjectPickerKey(isOpen ? parentRowKey : null)}
                                  onSelectProject={(projObj) => handleRowSelectProject(cluster, projObj)}
                                />
                              </div>

                              {/* Meta Icon: Billable Rupee */}
                              <div className="clockify-entry-meta">
                                <IndianRupee 
                                  size={15} 
                                  className={`entry-icon-rupee ${cluster.billable ? 'is-billable' : ''}`} 
                                  title={cluster.billable ? "Billable task (₹)" : "Non-billable task"}
                                />
                              </div>

                              {/* Interval: Earliest start to latest end */}
                              <div className="clockify-entry-window">
                                <span>{formatTimeWithAmPm(earliestStartStr)}</span>
                                <span className="window-sep">-</span>
                                <span>{formatTimeWithAmPm(latestEndStr)}</span>
                              </div>

                              {/* Calendar Icon Button with Interactive Date Picker Popover */}
                              <div className="clockify-cal-action-wrapper">
                                <button
                                  type="button"
                                  className={`clockify-entry-cal-btn is-clickable ${isDatePickerOpen ? 'active' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDatePickerKey(isDatePickerOpen ? null : parentRowKey);
                                  }}
                                  title="Click to view/change date"
                                >
                                  <CalendarIcon size={14} />
                                </button>

                                {isDatePickerOpen && (
                                  <RowDatePickerPopover
                                    currentIsoDate={isoDate}
                                    onSelectDate={(newDate) => handleSelectNewDate(cluster, newDate)}
                                    onClose={() => setActiveDatePickerKey(null)}
                                  />
                                )}
                              </div>

                              {/* Duration / Cluster Total */}
                              <div 
                                className="clockify-entry-duration"
                                style={running ? { color: '#009900', fontWeight: 800 } : {}}
                              >
                                {running && activeTimer?.isRunning
                                  ? `${String(Math.floor(activeTimer.elapsedSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((activeTimer.elapsedSeconds % 3600) / 60)).padStart(2, '0')}:${String(activeTimer.elapsedSeconds % 60).padStart(2, '0')}`
                                  : formattedClusterTotal}
                              </div>

                              {/* Direct Play / Pause Action Button */}
                              <div className="clockify-entry-actions">
                                {running ? (
                                  <button 
                                    type="button" 
                                    className="entry-btn-play" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePlayEntry(repItem);
                                    }}
                                    title={`Pause timer for "${cluster.project}"`}
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
                                      handleTogglePlayEntry(repItem);
                                    }}
                                    title={`Start timer for "${cluster.project}"`}
                                  >
                                    <Play size={13} fill="currentColor" />
                                  </button>
                                )}

                                <div className="clockify-entry-menu-wrapper" style={{ position: 'relative' }}>
                                  <button 
                                    type="button" 
                                    className={`entry-btn-options ${activeMenuId === parentRowKey ? 'active' : ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(activeMenuId === parentRowKey ? null : parentRowKey);
                                    }}
                                    title="More options (Edit, Duplicate, Delete)"
                                  >
                                    <MoreVertical size={14} />
                                  </button>

                                  {/* 3-Dots Dropdown Menu */}
                                  {activeMenuId === parentRowKey && (
                                    <div 
                                      className={`clockify-entry-dropdown-menu ${shouldOpenUpwards ? 'open-upwards' : ''}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button 
                                        type="button" 
                                        className="clockify-entry-menu-item"
                                        onClick={(e) => startEditingDescription(parentRowKey, displayDesc, e)}
                                      >
                                        <Edit3 size={13} color="#3b82f6" />
                                        <span>Edit Description</span>
                                      </button>
                                      <button 
                                        type="button" 
                                        className="clockify-entry-menu-item"
                                        onClick={() => handleDuplicate(repItem)}
                                      >
                                        <Copy size={13} color="#00cc00" />
                                        <span>Duplicate</span>
                                      </button>
                                      <button 
                                        type="button" 
                                        className="clockify-entry-menu-item is-delete"
                                        onClick={() => {
                                          cluster.sessions.forEach(s => onDeleteActivity(s.id));
                                          setActiveMenuId(null);
                                          showToast(`✓ Deleted time entries for "${cluster.project}"`);
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

                            {/* INLINE SUB-ROWS ROW BY ROW DIRECTLY BENEATH THAT SPECIFIC TASK */}
                            {isMultiSession && isExpanded && (
                              <div className="clockify-sub-sessions-list">
                                {cluster.sessions.map((session, sIdx) => {
                                  const sessionRunning = isItemRunning(session);
                                  const subRowKey = `sub_${session.id || sIdx}`;
                                  const isSubEditingDesc = editingItemKey === subRowKey;
                                  const isSubDatePickerOpen = activeDatePickerKey === subRowKey;
                                  const isSubProjPickerOpen = activeProjectPickerKey === subRowKey;

                                  return (
                                    <div 
                                      key={session.id || sIdx} 
                                      className={`clockify-entry-row clockify-sub-session-row ${sessionRunning ? 'is-row-running' : ''}`}
                                      style={{ 
                                        zIndex: (isSubDatePickerOpen || isSubProjPickerOpen || activeMenuId === subRowKey) ? 9999 : 2, 
                                        position: 'relative' 
                                      }}
                                    >
                                      {/* Description & Clean Project Picker (NO '+' BUTTON!) */}
                                      <div className="clockify-entry-left">
                                        <span className="sub-session-indent-spacer" />
                                        
                                        {/* Sub-Session Seamless Editable Description */}
                                        <div className="clockify-desc-cell-wrapper" onClick={(e) => e.stopPropagation()}>
                                          {isSubEditingDesc ? (
                                            <input
                                              type="text"
                                              className="clockify-desc-seamless-input"
                                              value={editingDescText}
                                              onChange={(e) => setEditingDescText(e.target.value)}
                                              onBlur={() => handleSaveDescription(session, editingDescText)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  handleSaveDescription(session, editingDescText);
                                                  e.target.blur();
                                                }
                                                if (e.key === 'Escape') {
                                                  setEditingItemKey(null);
                                                }
                                              }}
                                              autoFocus
                                              placeholder="Session description..."
                                            />
                                          ) : (
                                            <span 
                                              className="clockify-entry-desc-clean"
                                              onClick={(e) => startEditingDescription(subRowKey, session.description, e)}
                                              title="Click to edit session description"
                                            >
                                              {session.description || 'Session details'}
                                            </span>
                                          )}
                                        </div>

                                        {/* Sub-Session Clean Project Picker */}
                                        <RowProjectPicker
                                          projects={projects}
                                          currentProjectName={session.project}
                                          currentProjectColor={session.projectColor}
                                          isOpen={isSubProjPickerOpen}
                                          onToggle={(isOpen) => setActiveProjectPickerKey(isOpen ? subRowKey : null)}
                                          onSelectProject={(projObj) => handleRowSelectProject(session, projObj)}
                                        />
                                      </div>

                                      {/* Meta Icon: Billable Rupee */}
                                      <div className="clockify-entry-meta">
                                        <IndianRupee 
                                          size={15} 
                                          className={`entry-icon-rupee ${session.billable ? 'is-billable' : ''}`} 
                                          title={session.billable ? "Billable task (₹)" : "Non-billable task"}
                                        />
                                      </div>

                                      {/* Exact Session Time Interval (From - To) */}
                                      <div className="clockify-entry-window">
                                        <span>{formatTimeWithAmPm(session.startTime)}</span>
                                        <span className="window-sep">-</span>
                                        <span>{formatTimeWithAmPm(session.endTime)}</span>
                                      </div>

                                      {/* Calendar Icon Button with Interactive Date Picker Popover */}
                                      <div className="clockify-cal-action-wrapper">
                                        <button
                                          type="button"
                                          className={`clockify-entry-cal-btn is-clickable ${isSubDatePickerOpen ? 'active' : ''}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveDatePickerKey(isSubDatePickerOpen ? null : subRowKey);
                                          }}
                                          title="Click to view/change date"
                                        >
                                          <CalendarIcon size={14} />
                                        </button>

                                        {isSubDatePickerOpen && (
                                          <RowDatePickerPopover
                                            currentIsoDate={normalizeActivityDate(session)}
                                            onSelectDate={(newDate) => handleSelectNewDate(session, newDate)}
                                            onClose={() => setActiveDatePickerKey(null)}
                                          />
                                        )}
                                      </div>

                                      {/* Duration */}
                                      <div 
                                        className="clockify-entry-duration"
                                        style={sessionRunning ? { color: '#009900', fontWeight: 800 } : {}}
                                      >
                                        {session.durationFormatted}
                                      </div>

                                      {/* Direct Play / Pause Action Button */}
                                      <div className="clockify-entry-actions">
                                        {sessionRunning ? (
                                          <button 
                                            type="button" 
                                            className="entry-btn-play" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTogglePlayEntry(session);
                                            }}
                                            title="Pause session"
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
                                              handleTogglePlayEntry(session);
                                            }}
                                            title="Resume session"
                                          >
                                            <Play size={13} fill="currentColor" />
                                          </button>
                                        )}

                                        <div className="clockify-entry-menu-wrapper" style={{ position: 'relative' }}>
                                          <button 
                                            type="button" 
                                            className={`entry-btn-options ${activeMenuId === subRowKey ? 'active' : ''}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveMenuId(activeMenuId === subRowKey ? null : subRowKey);
                                            }}
                                            title="More options (Edit, Duplicate, Delete)"
                                          >
                                            <MoreVertical size={14} />
                                          </button>

                                          {activeMenuId === subRowKey && (
                                            <div 
                                              className="clockify-entry-dropdown-menu open-upwards"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <button 
                                                type="button" 
                                                className="clockify-entry-menu-item"
                                                onClick={(e) => startEditingDescription(subRowKey, session.description, e)}
                                              >
                                                <Edit3 size={13} color="#3b82f6" />
                                                <span>Edit Description</span>
                                              </button>
                                              <button 
                                                type="button" 
                                                className="clockify-entry-menu-item"
                                                onClick={() => handleDuplicate(session)}
                                              >
                                                <Copy size={13} color="#00cc00" />
                                                <span>Duplicate</span>
                                              </button>
                                              <button 
                                                type="button" 
                                                className="clockify-entry-menu-item is-delete"
                                                onClick={() => handleDelete(session)}
                                              >
                                                <Trash2 size={13} color="#ef4444" />
                                                <span>Delete</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
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
