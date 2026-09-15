import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar as CalendarIcon, 
  IndianRupee, 
  Clock, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ListFilter,
  Play,
  Square
} from 'lucide-react';
import ProjectPickerDropdown from './ProjectPickerDropdown';

export default function TimeTracker({
  projects = [],
  onAddManualEntry,
  onCreateProject,
  activeTimer = null,
  onStartTimer = () => {},
  onStopTimer = () => {}
}) {
  const [trackerMode, setTrackerMode] = useState('timer'); // 'timer' (Stopwatch) | 'manual' (Time range + ADD)
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [isBillable, setIsBillable] = useState(true);

  // Time States (for Manual Mode)
  const [fromTime, setFromTime] = useState('11:24');
  const [toTime, setToTime] = useState('15:08');
  const [duration, setDuration] = useState('03:44:00');
  
  // Time Picker Popover State ('from' | 'to' | null)
  const [activeTimePicker, setActiveTimePicker] = useState(null);

  // Date States
  const [selectedDateLabel, setSelectedDateLabel] = useState('Today');
  const [selectedDateObj, setSelectedDateObj] = useState(new Date(2026, 8, 8)); // Sep 8, 2026 (Today) // Sep 1, 2026 (Today)
  const [viewMonth, setViewMonth] = useState(8); // 0-indexed, 8 = September
  const [viewYear, setViewYear] = useState(2026);
  const [showDatePopover, setShowDatePopover] = useState(false);

  const datePopoverRef = useRef(null);
  const timePickerRef = useRef(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Common standard time slots for quick picking
  const timePresetsList = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  // Auto-compute duration whenever fromTime or toTime changes
  useEffect(() => {
    if (!fromTime || !toTime) return;

    const parseTime = (tStr) => {
      const parts = tStr.split(':').map(Number);
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
      }
      return null;
    };

    const m1 = parseTime(fromTime);
    const m2 = parseTime(toTime);

    if (m1 !== null && m2 !== null) {
      let diff = m2 - m1;
      if (diff < 0) diff += 24 * 60; // overnight wrap

      const hrs = Math.floor(diff / 60);
      const mins = diff % 60;
      setDuration(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`);
    }
  }, [fromTime, toTime]);

  // Close calendar popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePopoverRef.current && !datePopoverRef.current.contains(e.target)) {
        setShowDatePopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Date Select (Dynamic Real-time)
  const handleSelectQuickDate = (type) => {
    const now = new Date();
    if (type === 'today') {
      setSelectedDateLabel('Today');
      setSelectedDateObj(now);
    } else if (type === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      setSelectedDateLabel('Yesterday');
      setSelectedDateObj(yest);
    }
    setShowDatePopover(false);
  };

  // Select a specific day from calendar
  const handleSelectCalendarDay = (dayNumber) => {
    const selected = new Date(viewYear, viewMonth, dayNumber);
    setSelectedDateObj(selected);

    const now = new Date();
    const isToday = selected.toDateString() === now.toDateString();
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const isYesterday = selected.toDateString() === yest.toDateString();

    if (isToday) {
      setSelectedDateLabel('Today');
    } else if (isYesterday) {
      setSelectedDateLabel('Yesterday');
    } else {
      const monthShort = monthNames[viewMonth].substring(0, 3);
      const dayName = selected.toLocaleDateString('en-US', { weekday: 'short' });
      setSelectedDateLabel(`${dayName}, ${monthShort} ${String(dayNumber).padStart(2, '0')}`);
    }

    setShowDatePopover(false);
  };

  // Change Month in Calendar
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year, month) => new Date(year, month, 1).getDay();

  const totalDays = getDaysInMonth(viewYear, viewMonth);
  const startDay = getFirstDayOfWeek(viewYear, viewMonth);

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;

  const handleAddClick = (e) => {
    e.preventDefault();
    const d = selectedDateObj || new Date(2026, 8, 8);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const isoDate = `${yr}-${mo}-${da}`;

    if (onAddManualEntry) {
      onAddManualEntry({
        project: selectedProject ? selectedProject.name : 'No Project',
        projectColor: selectedProject ? (selectedProject.color || '#00cc00') : '#94a3b8',
        description: taskDescription.trim() || 'General session',
        date: isoDate,
        group: selectedDateLabel,
        startTime: fromTime,
        endTime: toTime,
        durationFormatted: duration === '00:00:00' ? '01:00:00' : duration,
        billable: isBillable,
        status: 'Completed',
      });
    }

    setTaskDescription('');
    setSelectedProjectId(null);
  };

  // Progressive live auto-colon formatting for HH:MM as user types
  const autoFormatTimeHHMM = (input) => {
    if (!input) return '';
    const trimmed = input.trim();
    if (!trimmed) return '';

    // Direct colon typed like "9:" or "2:"
    if (/^\d{1,2}:$/.test(trimmed)) {
      const h = parseInt(trimmed, 10);
      return `${String(h).padStart(2, '0')}:`;
    }

    const digits = trimmed.replace(/\D/g, '');
    if (!digits) return '';

    // 1 Digit
    if (digits.length === 1) {
      const d = parseInt(digits, 10);
      if (d >= 3 && d <= 9) {
        return `0${d}:`;
      }
      return digits;
    }

    // 2 Digits
    if (digits.length === 2) {
      const val = parseInt(digits, 10);
      if (val <= 24) {
        return `${String(val).padStart(2, '0')}:`;
      } else {
        const h = parseInt(digits[0], 10);
        const m = digits[1];
        return `0${h}:${m}`;
      }
    }

    // 3 Digits
    if (digits.length === 3) {
      if (digits.startsWith('0')) {
        return `${digits.slice(0, 2)}:${digits.slice(2)}`;
      }
      const firstDigit = parseInt(digits[0], 10);
      if (firstDigit >= 3) {
        return `0${firstDigit}:${digits.slice(1, 3)}`;
      } else {
        const twoHour = parseInt(digits.slice(0, 2), 10);
        if (twoHour <= 24 && parseInt(digits[2], 10) <= 5) {
          return `${digits.slice(0, 2)}:${digits.slice(2)}`;
        } else {
          return `0${digits[0]}:${digits.slice(1, 3)}`;
        }
      }
    }

    // 4 Digits
    if (digits.length >= 4) {
      const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
      const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    return trimmed;
  };

  // Final format on Blur / Enter
  const formatFinalTimeHHMM = (input) => {
    if (!input || typeof input !== 'string') return '00:00';
    const trimmed = input.trim();
    if (!trimmed || trimmed === '0') return '00:00';

    if (trimmed.includes(':')) {
      const parts = trimmed.split(':');
      const h = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
      const m = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 1 || (digits.length === 2 && parseInt(digits, 10) <= 24)) {
      const h = Math.min(23, parseInt(digits, 10));
      return `${String(h).padStart(2, '0')}:00`;
    } else if (digits.length === 3) {
      const h = Math.min(23, parseInt(digits.slice(0, 1), 10));
      const m = Math.min(59, parseInt(digits.slice(1, 3), 10));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } else if (digits.length >= 4) {
      const h = Math.min(23, parseInt(digits.slice(0, 2), 10));
      const m = Math.min(59, parseInt(digits.slice(2, 4), 10));
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    return '00:00';
  };

  const handleFromChange = (rawVal) => {
    let val = rawVal;
    if (rawVal.length > fromTime.length) {
      val = autoFormatTimeHHMM(rawVal);
    }
    setFromTime(val);
  };

  const handleToChange = (rawVal) => {
    let val = rawVal;
    if (rawVal.length > toTime.length) {
      val = autoFormatTimeHHMM(rawVal);
    }
    setToTime(val);
  };

  const handleFromBlur = () => {
    setFromTime(formatFinalTimeHHMM(fromTime));
  };

  const handleToBlur = () => {
    setToTime(formatFinalTimeHHMM(toTime));
  };

  return (
    <div className="clockify-tracker-bar">
      {/* 1. Main input with placeholder: What have you worked on? */}
      <div className="clockify-input-col">
        <input
          type="text"
          className="clockify-task-input"
          placeholder="What have you worked on?"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddClick(e);
          }}
        />
      </div>

      {/* 2. + Project Dropdown Popover */}
      <div className="clockify-col-project">
        <ProjectPickerDropdown
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={(id) => setSelectedProjectId(id)}
          onCreateProject={onCreateProject}
        />
      </div>

      {/* 3. Rupee (₹) Billable Icon */}
      <button
        type="button"
        className={`clockify-billable-btn ${isBillable ? 'active' : ''}`}
        onClick={() => setIsBillable(!isBillable)}
        title={isBillable ? "Billable (₹)" : "Non-billable"}
      >
        <IndianRupee size={15} />
      </button>

      {/* 5. Time Range Input (From - To) - in manual mode */}
      {trackerMode === 'manual' && (
        <div className="clockify-time-range-box">
          <input
            type="text"
            className="clockify-time-input"
            value={fromTime}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleFromChange(e.target.value)}
            onBlur={handleFromBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFromBlur();
                e.target.blur();
              }
            }}
            style={{ width: '54px', textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '5px 4px', fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', color: '#0f172a' }}
          />
          <span className="time-separator" style={{ color: '#94a3b8', fontWeight: 600 }}>-</span>
          <input
            type="text"
            className="clockify-time-input"
            value={toTime}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleToChange(e.target.value)}
            onBlur={handleToBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleToBlur();
                e.target.blur();
              }
            }}
            style={{ width: '54px', textAlign: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '5px 4px', fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', color: '#0f172a' }}
          />
        </div>
      )}

      {/* 6. INTERACTIVE CALENDAR POPOVER - only in manual mode */}
      {trackerMode === 'manual' && (
        <div className="clockify-date-box-wrapper" ref={datePopoverRef}>
          <div 
            className="clockify-date-box"
            onClick={() => setShowDatePopover(!showDatePopover)}
            title="Click to change date"
          >
            <CalendarIcon size={14} className="clockify-date-icon" />
            <span className="clockify-date-text">{selectedDateLabel}</span>
          </div>

          {/* The Interactive Date Picker Popover */}
          {showDatePopover && (
            <div className="clockify-calendar-popover">
              {/* Quick date shortcuts */}
              <div className="calendar-quick-actions">
                <button 
                  type="button" 
                  className={`quick-date-chip ${selectedDateLabel === 'Today' ? 'active' : ''}`}
                  onClick={() => handleSelectQuickDate('today')}
                >
                  Today
                </button>
                <button 
                  type="button" 
                  className={`quick-date-chip ${selectedDateLabel === 'Yesterday' ? 'active' : ''}`}
                  onClick={() => handleSelectQuickDate('yesterday')}
                >
                  Yesterday
                </button>
              </div>

              {/* Month & Year navigation */}
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

              {/* Day of Week Headers */}
              <div className="calendar-weekdays-grid">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Calendar Days Grid */}
              <div className="calendar-days-grid">
                {Array.from({ length: startDay }).map((_, i) => (
                  <span key={`empty-${i}`} className="cal-day-empty" />
                ))}

                {Array.from({ length: totalDays }).map((_, i) => {
                  const dayNum = i + 1;
                  const isSelected = 
                    selectedDateObj.getDate() === dayNum &&
                    selectedDateObj.getMonth() === viewMonth &&
                    selectedDateObj.getFullYear() === viewYear;

                  const now = new Date();
                  const isToday = 
                    viewYear === now.getFullYear() && 
                    viewMonth === now.getMonth() && 
                    dayNum === now.getDate();

                  return (
                    <button
                      key={dayNum}
                      type="button"
                      className={`cal-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'is-today' : ''}`}
                      onClick={() => handleSelectCalendarDay(dayNum)}
                      title={isToday ? "Today (Active)" : undefined}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Duration Box */}
      <div className="clockify-duration-box" title={trackerMode === 'timer' ? (activeTimer?.isRunning ? "Live Running Stopwatch" : "Stopwatch") : "Calculated Duration"}>
        {trackerMode === 'timer' 
          ? (activeTimer?.isRunning 
              ? `${String(Math.floor(activeTimer.elapsedSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((activeTimer.elapsedSeconds % 3600) / 60)).padStart(2, '0')}:${String(activeTimer.elapsedSeconds % 60).padStart(2, '0')}` 
              : '00:00:00')
          : duration}
      </div>

      {/* 8. Action Button (START / STOP / ADD) */}
      {trackerMode === 'timer' ? (
        activeTimer?.isRunning ? (
          <button
            type="button"
            className="clockify-btn-add is-stop-btn"
            style={{ background: '#008a00', color: '#ffffff' }}
            onClick={onStopTimer}
            title="Stop Timer & Save Entry"
          >
            STOP
          </button>
        ) : (
          <button
            type="button"
            className="clockify-btn-add"
            style={{ background: '#00cc00', color: '#ffffff' }}
            onClick={() => {
              onStartTimer({
                projectName: selectedProject ? selectedProject.name : 'General Task',
                projectColor: selectedProject ? (selectedProject.color || '#00cc00') : '#00cc00',
                taskDescription: taskDescription.trim() || 'Working session',
                isBillable: isBillable,
              });
            }}
            title="Start Stopwatch Timer"
          >
            START
          </button>
        )
      ) : (
        <button
          type="button"
          className="clockify-btn-add"
          onClick={handleAddClick}
          title="Add Manual Time Entry"
        >
          ADD
        </button>
      )}

      {/* 9. Mode Switcher icon on far right */}
      <button 
        type="button" 
        className="clockify-mode-icon" 
        onClick={() => setTrackerMode(trackerMode === 'timer' ? 'manual' : 'timer')}
        title={trackerMode === 'timer' ? "Switch to Manual Entry Mode (Range & Date)" : "Switch to Live Timer Stopwatch Mode"}
      >
        {trackerMode === 'timer' ? <ListFilter size={16} /> : <Clock size={16} />}
      </button>
    </div>
  );
}
