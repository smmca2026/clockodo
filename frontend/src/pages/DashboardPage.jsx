import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  PieChart, 
  Clock, 
  Calendar, 
  ChevronDown, 
  ArrowUpRight, 
  Filter, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  User,
  X,
  ArrowUp,
  ArrowDown,
  Pin,
  ArrowUpDown,
  Building2,
  Folder,
  Briefcase
} from 'lucide-react';
import { DASHBOARD_METRICS, INITIAL_PROJECTS, USER_PROFILE } from '../data/mockData';

function parseTimeToSeconds(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  if (parts.length === 2) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60;
  return 0;
}

function formatSecondsToHMS(sec) {
  if (!sec || sec <= 0) return '00:00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getActivityDate(act) {
  if (!act) return '';
  const raw = act.date || act.group || act.createdAt || act.timestamp || '';
  if (!raw) return '2026-09-08';
  
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return raw.trim();
  }

  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(raw.trim())) {
    return raw.trim().slice(0, 10);
  }

  const str = String(raw).trim().toLowerCase();

  if (str.includes('today')) return '2026-09-08';
  if (str.includes('yesterday')) return '2026-09-07';

  const monthMap = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };

  const monthDayMatch = str.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:[,\s]+(\d{4}))?/i);
  if (monthDayMatch) {
    const m = monthMap[monthDayMatch[1].toLowerCase().slice(0, 3)];
    const d = String(monthDayMatch[2]).padStart(2, '0');
    const y = monthDayMatch[3] || '2026';
    return y + '-' + m + '-' + d;
  }

  const dayMonthMatch = str.match(/(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:[,\s]+(\d{4}))?/i);
  if (dayMonthMatch) {
    const d = String(dayMonthMatch[1]).padStart(2, '0');
    const m = monthMap[dayMonthMatch[2].toLowerCase().slice(0, 3)];
    const y = dayMonthMatch[3] || '2026';
    return y + '-' + m + '-' + d;
  }

  try {
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      const yr = parsed.getFullYear();
      const mo = String(parsed.getMonth() + 1).padStart(2, '0');
      const da = String(parsed.getDate()).padStart(2, '0');
      return yr + '-' + mo + '-' + da;
    }
  } catch (e) {}

  return '2026-09-08';
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Recently';
  if (dateStr.includes('Today') || dateStr === '2026-09-08') return 'an hour ago';
  if (dateStr.includes('Yesterday') || dateStr === '2026-09-07') return 'a day ago';
  if (dateStr === '2026-09-04' || dateStr.includes('Sep 04') || dateStr.includes('Sep 4')) return '4 days ago';
  if (dateStr === '2026-09-03' || dateStr.includes('Sep 03')) return '5 days ago';
  if (dateStr === '2026-09-02' || dateStr.includes('Sep 02')) return '6 days ago';
  if (dateStr === '2026-09-01' || dateStr.includes('Sep 01')) return 'a week ago';
  if (dateStr.includes('Aug 31')) return '8 days ago';
  return dateStr;
}

const WEEK_DAYS_META = [
  { key: 'mon', label: 'Mon, Aug 31', dayNum: 31 },
  { key: 'tue', label: 'Tue, Sep 1', dayNum: 1 },
  { key: 'wed', label: 'Wed, Sep 2', dayNum: 2 },
  { key: 'thu', label: 'Thu, Sep 3', dayNum: 3 },
  { key: 'fri', label: 'Fri, Sep 4', dayNum: 4 },
  { key: 'sat', label: 'Sat, Sep 5', dayNum: 5 },
  { key: 'sun', label: 'Sun, Sep 6', dayNum: 6 },
];

function getActivityDayKey(act) {
  if (!act) return 'mon';
  const dStr = (act.date || act.group || '').toLowerCase();
  if (dStr.includes('2026-09-08') || dStr.includes('tue') || dStr.includes('today') || dStr.includes('sep 1') || dStr.includes('sep 8')) return 'tue';
  if (dStr.includes('2026-09-07') || dStr.includes('mon') || dStr.includes('yesterday') || dStr.includes('aug 31') || dStr.includes('sep 7')) return 'mon';
  if (dStr.includes('wed') || dStr.includes('sep 2')) return 'wed';
  if (dStr.includes('thu') || dStr.includes('sep 3')) return 'thu';
  if (dStr.includes('fri') || dStr.includes('sep 4')) return 'fri';
  if (dStr.includes('sat') || dStr.includes('sep 5')) return 'sat';
  if (dStr.includes('sun') || dStr.includes('sep 6')) return 'sun';
  
  if (act.date && /^\d{4}-\d{2}-\d{2}$/.test(act.date)) {
    const d = new Date(act.date);
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return days[d.getDay()] || 'mon';
  }
  return 'mon';
}

export default function DashboardPage({
  timesheetRows = [],
  activities = [],
  projects = INITIAL_PROJECTS,
  usersList = [],
  currentUser = USER_PROFILE,
}) {
  // Global Workspace Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [pinnedTeamCard, setPinnedTeamCard] = useState(true);
  
  // Date Range State: defaults to the active tracking week (Aug 31 - Sep 8, 2026)
  const [dateRange, setDateRange] = useState({
    start: '2026-08-31',
    end: '2026-09-06'
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);

  // Close Popover on Outside Click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const formatISODateToShort = (isoStr) => {
    if (!isoStr) return '';
    const [yr, mo, da] = isoStr.split('-').map(Number);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[mo - 1]} ${da}, ${yr}`;
  };

  const formatRangeTitle = (startISO, endISO) => {
    if (!startISO) return 'Select Date Range';
    if (!endISO || startISO === endISO) return formatISODateToShort(startISO);
    return `${formatISODateToShort(startISO)} - ${formatISODateToShort(endISO)}`;
  };

  // 1. Get raw activities for selected user/member from real activities only
  const memberActivities = useMemo(() => {
    if (userFilter === 'all' || userFilter === 'Show all' || userFilter === 'Everyone') {
      return activities;
    }

    if (userFilter === 'Only me') {
      const myName = (currentUser?.name || '').trim().toLowerCase();
      const myEmail = (currentUser?.email || '').trim().toLowerCase();

      return activities.filter(a => {
        const aMember = (a.member || a.user || a.assignedTo || a.userName || a.user_name || '').trim().toLowerCase();
        const aEmail = (a.userEmail || a.email || '').trim().toLowerCase();

        if (myEmail && aEmail && aEmail === myEmail) return true;
        if (myName && aMember && aMember.includes(myName)) return true;
        if (!aMember && !aEmail) return true;
        return false;
      });
    }

    const target = userFilter.trim().toLowerCase();
    return activities.filter(a => {
      const aMember = (a.member || a.user || a.assignedTo || a.userName || a.user_name || '').trim().toLowerCase();
      const aEmail = (a.userEmail || a.email || '').trim().toLowerCase();
      return aMember.includes(target) || (target && aEmail.includes(target));
    });
  }, [userFilter, activities, currentUser]);

  // 2. Filter by Date Period Range (start to end inclusive)
  const periodFilteredActivities = useMemo(() => {
    return memberActivities.filter(act => {
      const actDate = getActivityDate(act);
      if (!actDate) return false;
      return actDate >= dateRange.start && actDate <= dateRange.end;
    });
  }, [memberActivities, dateRange]);

  // 3. Filter by selected project
  const filteredActivities = useMemo(() => {
    if (selectedProjectFilter === 'all') return periodFilteredActivities;
    return periodFilteredActivities.filter(a => a.project === selectedProjectFilter);
  }, [periodFilteredActivities, selectedProjectFilter]);


      // Dynamic 7-day week (Monday to Sunday) generated from currently selected dateRange
  const daysMeta = useMemo(() => {
    let startD;
    if (dateRange.start) {
      const [yr, mo, da] = dateRange.start.split('-').map(Number);
      startD = new Date(yr, mo - 1, da);
    } else {
      startD = new Date(2026, 8, 7);
    }
    
    // Anchor to the Monday of the active start date
    const monday = new Date(startD);
    const dayOfWeek = (monday.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    monday.setDate(monday.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${da}`;
      const dayName = dayNames[i];
      const monthName = monthNames[d.getMonth()];
      const dayNum = d.getDate();

      days.push({
        key: iso,
        iso,
        dayName,
        dateLabel: `${monthName} ${dayNum}`,
        label: `${dayName}, ${monthName} ${dayNum}`,
        dayKeyIndex: i
      });
    }
    return days;
  }, [dateRange.start]);

  // Compute Daily Bar Data (Mon-Sun) dynamically matching selected week with multi-colored project segments
  const dailyBarData = useMemo(() => {
    let highestSec = 0;
    const bars = daysMeta.map(({ iso, label, dayName, dayKeyIndex }) => {
      let daySec = 0;
      const dayProjMap = {};

      // Ingest from filtered activities matching this specific day's ISO date
      filteredActivities.forEach(a => {
        const aDate = getActivityDate(a);
        if (aDate === iso) {
          const sec = a.durationSeconds || parseTimeToSeconds(a.durationFormatted || a.duration);
          if (sec > 0) {
            daySec += sec;
            const pName = a.project || a.projectName || 'General Task';
            if (!dayProjMap[pName]) {
              const projObj = projects.find(p => p.name.toLowerCase() === pName.toLowerCase());
              dayProjMap[pName] = {
                project: pName,
                color: a.projectColor || projObj?.color || a.color || '#00cc00',
                sec: 0
              };
            }
            dayProjMap[pName].sec += sec;
          }
        }
      });

      // Ingest from timesheetRows if no activities exist for this day and fallback needed (only for base week Aug 31 - Sep 6)
      if (daySec === 0 && (iso >= '2026-08-31' && iso <= '2026-09-06')) {
        const dayKeyNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const dayKey = dayKeyNames[dayKeyIndex] || 'mon';
        if (filteredActivities.length === 0 || userFilter === 'all' || userFilter === 'Show all') {
          (timesheetRows || []).forEach(row => {
            const hoursObj = row.hours || row.days;
            if (hoursObj && hoursObj[dayKey]) {
              const sec = parseTimeToSeconds(hoursObj[dayKey]);
              if (sec > 0 && filteredActivities.length === 0) {
                daySec += sec;
                const pName = row.project || row.projectName || 'General Task';
                if (!dayProjMap[pName]) {
                  const projObj = projects.find(p => p.name.toLowerCase() === pName.toLowerCase());
                  dayProjMap[pName] = {
                    project: pName,
                    color: row.color || projObj?.color || '#00cc00',
                    sec: 0
                  };
                }
                dayProjMap[pName].sec += sec;
              }
            }
          });
        }
      }

      const projectSegments = Object.values(dayProjMap).sort((a, b) => b.sec - a.sec);

      if (daySec > highestSec) highestSec = daySec;

      return {
        key: iso,
        iso,
        day: label,
        dayName,
        totalSec: daySec,
        time: formatSecondsToHMS(daySec),
        hours: daySec / 3600,
        projectSegments
      };
    });

    const maxSec = Math.max(highestSec, 3600 * 8);

    return bars.map(b => ({
      ...b,
      heightPercent: maxSec > 0 ? Math.min(100, Math.max(4, (b.totalSec / maxSec) * 100)) : 4
    }));
  }, [daysMeta, filteredActivities, timesheetRows, userFilter, projects]);

  // Dynamic Total Time synced with 7-day daily bars
  const dynamicTotalSec = useMemo(() => {
    return dailyBarData.reduce((acc, b) => acc + (b.totalSec || 0), 0);
  }, [dailyBarData]);

  const liveTotalTime = useMemo(() => {
    if (dynamicTotalSec <= 0) return '00:00:00';
    return formatSecondsToHMS(dynamicTotalSec);
  }, [dynamicTotalSec]);

  // Dynamic Project Breakdown & Percentages with Clockodo Green Increment/Trend Badges
  const liveProjectBreakdown = useMemo(() => {
    const projMap = {};
    let grandTotalSec = 0;

    filteredActivities.forEach((act) => {
      const sec = act.durationSeconds || parseTimeToSeconds(act.durationFormatted || act.duration);
      if (sec > 0) {
        grandTotalSec += sec;
        const pName = act.project || act.projectName || 'General Task';
        if (!projMap[pName]) {
          const projObj = projects.find(p => p.name.toLowerCase() === pName.toLowerCase());
          projMap[pName] = {
            project: pName,
            color: act.projectColor || projObj?.color || act.color || '#00cc00',
            client: act.client || projObj?.client || 'DigiPlus Corp',
            totalSec: 0,
            entriesCount: 0,
          };
        }
        projMap[pName].totalSec += sec;
        projMap[pName].entriesCount += 1;
      }
    });

    const list = Object.values(projMap).map((item, idx) => {
      const percentage = grandTotalSec > 0 ? ((item.totalSec / grandTotalSec) * 100).toFixed(2) : '0.00';
      const hoursNum = (item.totalSec / 3600).toFixed(1);
      const incrementVal = (parseFloat(percentage) * 0.45 + (idx === 0 ? 8.5 : 3.2)).toFixed(1);

      return {
        project: item.project,
        client: item.client,
        color: item.color,
        time: formatSecondsToHMS(item.totalSec),
        totalSec: item.totalSec,
        percentage: parseFloat(percentage),
        hoursNum: hoursNum + 'h',
        incrementBadge: '+' + incrementVal + '%',
        entriesCount: item.entriesCount
      };
    });

    list.sort((a, b) => b.totalSec - a.totalSec);
    return { list, grandTotalSec };
  }, [filteredActivities, projects]);

  // Dynamic Peak Day calculation for Weekly Overview header
  const peakDay = useMemo(() => {
    let max = { day: 'Thu, Sep 17', hours: 0 };
    dailyBarData.forEach(d => {
      if (d.hours > max.hours) {
        max = { day: d.day, hours: d.hours };
      }
    });
    return max;
  }, [dailyBarData]);

  const topProjectObj = liveProjectBreakdown.list[0];
  const topProject = topProjectObj?.project || (filteredActivities.length > 0 ? (filteredActivities[0].project || filteredActivities[0].projectName) : 'None');
  const topProjectTime = topProjectObj?.time || '00:00:00';
  const topProjectPercent = topProjectObj?.percentage || 0;
  const topProjectColor = topProjectObj?.color || (projects.find(p => p.name === topProject)?.color) || '#00cc00';

  const topClient = topProjectObj?.client || (projects.find(p => p.name === topProject)?.client) || (projects.length > 0 ? (projects[0].client || 'DigiPlus Corp') : 'DigiPlus Corp');


  // Most Tracked Activities list
  const topTrackedActivities = useMemo(() => {
    const taskMap = {};

    filteredActivities.forEach(act => {
      const taskName = act.description || act.task || 'Working session';
      const projName = act.project || act.projectName || 'General Task';
      
      const rawUser = act.user || act.userName || act.user_name || act.assignedTo || act.member;
      let userName = rawUser;
      if (!userName && act.userEmail && usersList.length > 0) {
        const matched = usersList.find(u => (u.email || '').toLowerCase() === act.userEmail.toLowerCase());
        if (matched) userName = matched.name;
      }
      if (!userName) userName = act.userEmail || 'Team Member';

      const dateStr = act.date || act.group || '';
      const key = act.id || `${projName}-${taskName}-${userName}-${dateStr}`;
      const sec = act.durationSeconds || parseTimeToSeconds(act.durationFormatted || act.duration);

      if (sec > 0) {
        if (!taskMap[key]) {
          const projObj = projects.find(p => p.name === projName);
          taskMap[key] = {
            id: act.id || key,
            task: taskName,
            project: projName,
            color: act.projectColor || projObj?.color || act.color || '#00cc00',
            userName: userName,
            date: dateStr,
            totalSec: 0,
          };
        }
        taskMap[key].totalSec += sec;
      }
    });

    const userActivitiesList = Object.values(taskMap);

    if (userActivitiesList.length > 0) {
      userActivitiesList.sort((a, b) => b.totalSec - a.totalSec);
      const isAllView = showAllTasks || userFilter === 'all';
      const items = isAllView ? userActivitiesList : userActivitiesList.slice(0, 10);
      return items.map((item, idx) => ({
        ...item,
        rank: idx + 1,
        durationFormatted: formatSecondsToHMS(item.totalSec),
      }));
    }

    return [];
  }, [filteredActivities, projects, usersList, showAllTasks, userFilter]);

  const totalTasksCount = useMemo(() => {
    const uniqueKeys = new Set(filteredActivities.map(a => `${a.project}-${a.description || a.task}-${a.user || a.userName}`));
    return uniqueKeys.size || filteredActivities.length;
  }, [filteredActivities]);

  // Dynamic Team Activities Table (Real-time Workspace Users with Clockodo Green Progress Bars)
  const teamActivitiesList = useMemo(() => {
    const baseUsers = (usersList && usersList.length > 0 ? usersList : [
      { id: 'usr-admin-1', name: 'Bharath (Owner)', email: 'bharath@digiplus.com', role: 'admin' },
      { id: 'usr-1', name: 'anbu', email: 'anbu@digiplus.com', role: 'employee' },
      { id: 'usr-2', name: 'Muthu', email: 'muthu@digiplus.com', role: 'employee' },
      { id: 'usr-3', name: 'mani', email: 'mani@digiplus.com', role: 'employee' },
      { id: 'usr-4', name: 'sivanparu', email: 'sivanparu@digiplus.com', role: 'employee' }
    ]);

    const userColorPalette = [
      '#0d9488', // Teal
      '#10b981', // Emerald
      '#2563eb', // Blue
      '#ea580c', // Orange
      '#7c3aed', // Purple
      '#059669', // Green
      '#db2777', // Pink
      '#d97706'  // Amber
    ];

    const map = {};
    baseUsers.forEach((u, i) => {
      const uName = u.name || 'Member';
      const cleanName = uName.replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim();
      const initials = cleanName.length >= 2 
        ? (cleanName.split(' ').length > 1 
            ? `${cleanName.split(' ')[0][0]}${cleanName.split(' ')[1][0]}` 
            : cleanName.substring(0, 2)).toUpperCase()
        : cleanName.toUpperCase() || 'TM';

      map[uName.toLowerCase()] = {
        id: u.id || `user-${i}`,
        name: uName,
        displayName: cleanName,
        email: u.email || `${cleanName.toLowerCase()}@digiplus.com`,
        role: u.role || 'employee',
        initials,
        avatarColor: userColorPalette[i % userColorPalette.length],
        totalSec: 0,
        latestActivity: null,
        activitiesList: []
      };
    });

    const activitiesToUse = (userFilter === 'all' || userFilter === 'Show all' || userFilter === 'Everyone')
      ? periodFilteredActivities
      : memberActivities.filter(act => {
          const actDate = getActivityDate(act);
          if (!actDate) return false;
          return actDate >= dateRange.start && actDate <= dateRange.end;
        });

    activitiesToUse.forEach(act => {
      const sec = act.durationSeconds || parseTimeToSeconds(act.durationFormatted || act.duration);
      const rawUser = (act.user || act.userName || act.user_name || act.assignedTo || act.member || act.userEmail || '').trim().toLowerCase();
      
      let targetKey = Object.keys(map).find(k => k === rawUser || k.includes(rawUser) || rawUser.includes(k.split(' ')[0]));
      
      if (!targetKey && rawUser) {
        const cleanName = rawUser.replace(/\s*\(Owner\)|\s*\(Admin\)/i, '').trim();
        const initials = cleanName.substring(0, 2).toUpperCase();
        targetKey = rawUser;
        map[targetKey] = {
          id: `usr-${targetKey}`,
          name: act.user || act.userName || rawUser,
          displayName: cleanName,
          email: act.userEmail || `${cleanName.toLowerCase()}@digiplus.com`,
          role: 'employee',
          initials,
          avatarColor: userColorPalette[Object.keys(map).length % userColorPalette.length],
          totalSec: 0,
          latestActivity: null,
          activitiesList: []
        };
      }

      if (targetKey && map[targetKey]) {
        map[targetKey].totalSec += sec;
        map[targetKey].activitiesList.push(act);
        
        if (!map[targetKey].latestActivity) {
          map[targetKey].latestActivity = act;
        }
      }
    });

    const list = Object.values(map);
    const maxSec = Math.max(...list.map(u => u.totalSec), 3600 * 40);

    return list.map(item => {
      const projObj = item.latestActivity ? projects.find(p => p.name === (item.latestActivity.project || item.latestActivity.projectName)) : null;
      const progressPercent = maxSec > 0 ? Math.min(100, Math.round((item.totalSec / maxSec) * 100)) : 0;

      return {
        ...item,
        totalTimeFormatted: formatSecondsToHMS(item.totalSec),
        progressPercent,
        latestTask: item.latestActivity ? (item.latestActivity.description || item.latestActivity.task || 'Working session') : 'No recent activity',
        latestProject: item.latestActivity ? (item.latestActivity.project || item.latestActivity.projectName || 'DigiPlus Operations') : '',
        latestProjectColor: item.latestActivity ? (item.latestActivity.projectColor || projObj?.color || item.latestActivity.color || '#00cc00') : '#94a3b8',
        latestDuration: item.latestActivity ? (item.latestActivity.durationFormatted || formatSecondsToHMS(item.latestActivity.durationSeconds || 0)) : '',
        latestDate: item.latestActivity ? (item.latestActivity.date || item.latestActivity.group || 'Today') : '',
        relativeTimeStr: item.latestActivity ? formatRelativeTime(item.latestActivity.date || item.latestActivity.group) : ''
      };
    }).sort((a, b) => b.totalSec - a.totalSec);
  }, [usersList, periodFilteredActivities, memberActivities, userFilter, dateRange, projects]);

  const [popoverDate, setPopoverDate] = useState({ year: 2026, month: 8 }); // 8 = September (0-indexed)

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const MONTH_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setPopoverDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setPopoverDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handleQuickRange = (preset) => {
    const today = new Date('2026-09-08');
    let s = new Date(today);
    let e = new Date(today);

    if (preset === 'today') {
      // today
    } else if (preset === 'yesterday') {
      s.setDate(today.getDate() - 1);
      e.setDate(today.getDate() - 1);
    } else if (preset === 'thisWeek') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      s.setDate(diff);
      e = new Date(s);
      e.setDate(s.getDate() + 6);
    } else if (preset === 'lastWeek') {
      const day = today.getDay();
      const diff = today.getDate() - day - 6;
      s.setDate(diff);
      e = new Date(s);
      e.setDate(s.getDate() + 6);
    } else if (preset === 'thisMonth') {
      s = new Date(today.getFullYear(), today.getMonth(), 1);
      e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset === 'lastMonth') {
      s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      e = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (preset === 'thisYear') {
      s = new Date(today.getFullYear(), 0, 1);
      e = new Date(today.getFullYear(), 11, 31);
    }

    const fmt = (d) => {
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${yr}-${mo}-${da}`;
    };

    setDateRange({ start: fmt(s), end: fmt(e) });
    setShowDatePicker(false);
  };

    const handleShiftPeriod = (direction) => {
    if (!dateRange.start) return;
    const [yr, mo, da] = dateRange.start.split('-').map(Number);
    const s = new Date(yr, mo - 1, da);
    s.setDate(s.getDate() + (direction * 7));
    const e = new Date(s);
    e.setDate(s.getDate() + 6);

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setDateRange({ start: fmt(s), end: fmt(e) });
  };

  const getCalendarDays = () => {
    const { year, month } = popoverDate;
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, disabled: true });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const iso = `${year}-${mStr}-${dStr}`;

      const isStart = iso === dateRange.start;
      const isEnd = iso === dateRange.end;
      const isInRange = dateRange.start && dateRange.end && iso >= dateRange.start && iso <= dateRange.end;

      days.push({
        day: i,
        iso,
        currentMonth: true,
        isStart,
        isEnd,
        isInRange
      });
    }

    const totalSlots = Math.ceil(days.length / 7) * 7;
    let nextD = 1;
    while (days.length < totalSlots) {
      days.push({ day: nextD++, currentMonth: false, disabled: true });
    }

    return days;
  };

  const handleDateClick = (dayObj) => {
    if (!dayObj.currentMonth || !dayObj.iso) return;
    const clickedISO = dayObj.iso;

    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      setDateRange({ start: clickedISO, end: '' });
    } else {
      if (clickedISO < dateRange.start) {
        setDateRange({ start: clickedISO, end: dateRange.start });
      } else {
        setDateRange({ start: dateRange.start, end: clickedISO });
      }
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-view">
        {/* Top Filter Toolbar */}
        <div className="dash-filter-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
          {/* 1. Project Filter */}
          <select 
            className="dash-dropdown"
            value={selectedProjectFilter}
            onChange={(e) => setSelectedProjectFilter(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            <option value="all">Project: All</option>
            {projects.map(p => (
              <option key={p.id || p.name} value={p.name}>Project: {p.name}</option>
            ))}
          </select>

          {/* 2. User / Team Filter: Only 2 options (Show all & Only me) */}
          <select 
            className="dash-dropdown"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            style={{ fontWeight: 600 }}
          >
            <option value="all">Show all (Everyone / Team)</option>
            <option value="Only me">Only me ({currentUser?.name || USER_PROFILE.name})</option>
          </select>

          {/* Clockify Date Range Selector Group with < > arrows */}
          <div className="dash-date-group" style={{ display: 'flex', alignItems: 'center', position: 'relative' }} ref={datePickerRef}>
            <button
              type="button"
              className="dash-date-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                height: '38px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderTopLeftRadius: '6px',
                borderBottomLeftRadius: '6px',
                borderRight: 'none',
                color: '#334155',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Click to open Date Range Picker"
            >
              <Calendar size={15} color="#008a00" />
              <span>{formatRangeTitle(dateRange.start, dateRange.end)}</span>
              <ChevronDown size={14} color="#64748b" />
            </button>

            {/* Left/Right Prev/Next Range Shift Buttons */}
            <div style={{ display: 'flex', height: '38px' }}>
              <button
                type="button"
                className="dash-arrow-btn"
                style={{
                  border: '1px solid #cbd5e1',
                  borderRight: 'none',
                  background: '#ffffff',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'background 0.12s ease'
                }}
                onClick={() => handleShiftPeriod(-1)}
                title="Previous Period"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="dash-arrow-btn"
                style={{
                  border: '1px solid #cbd5e1',
                  borderTopRightRadius: '6px',
                  borderBottomRightRadius: '6px',
                  background: '#ffffff',
                  padding: '0 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'background 0.12s ease'
                }}
                onClick={() => handleShiftPeriod(1)}
                title="Next Period"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Interactive Date Range Popover */}
            {showDatePicker && (
              <div 
                className="dash-date-popover"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '420px',
                  background: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '8px',
                  boxShadow: '0 16px 45px rgba(0,0,0,0.2), 0 2px 10px rgba(0,0,0,0.06)',
                  zIndex: 999999,
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                }}
              >
                <div style={{ width: '130px', borderRight: '1px solid #f1f5f9', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Presets</div>
                  {[
                    { key: 'today', label: 'Today' },
                    { key: 'yesterday', label: 'Yesterday' },
                    { key: 'thisWeek', label: 'This week' },
                    { key: 'lastWeek', label: 'Last week' },
                    { key: 'thisMonth', label: 'This month' },
                    { key: 'lastMonth', label: 'Last month' },
                    { key: 'thisYear', label: 'This year' }
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleQuickRange(p.key)}
                      style={{
                        textAlign: 'left',
                        padding: '6px 8px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12.5px',
                        color: '#334155',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#f0fdf4'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                      {MONTH_NAMES[popoverDate.month]} {popoverDate.year}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        style={{ border: '1px solid #e2e8f0', background: '#ffffff', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer' }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    <span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span><span>Su</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                    {getCalendarDays().map((dObj, idx) => {
                      let bg = 'transparent';
                      let color = dObj.currentMonth ? '#334155' : '#cbd5e1';
                      let fontWeight = 500;

                      if (dObj.isStart || dObj.isEnd) {
                        bg = '#00cc00';
                        color = '#ffffff';
                        fontWeight = 700;
                      } else if (dObj.isInRange) {
                        bg = '#dcfce7';
                        color = '#166534';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={dObj.disabled}
                          onClick={() => handleDateClick(dObj)}
                          style={{
                            height: '28px',
                            background: bg,
                            color: color,
                            border: 'none',
                            borderRadius: dObj.isStart ? '4px 0 0 4px' : dObj.isEnd ? '0 4px 4px 0' : '0',
                            fontSize: '11.5px',
                            fontWeight: fontWeight,
                            cursor: dObj.disabled ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {dObj.day}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      style={{
                        padding: '4px 14px',
                        background: '#00cc00',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

                        {/* Top 3 Metric Headers Row: Total Time, Top Project, Top Client */}
        <div className="dash-metric-banner" style={{ marginTop: '16px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'center' }}>
          {/* Card 1: Total Time */}
          <div className="dash-metric-item" style={{ textAlign: 'center', padding: '8px 16px', borderRight: '1px solid #f1f5f9' }}>
            <div className="dash-metric-label" style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
              TOTAL TIME
            </div>
            <div className="dash-metric-val green-highlight" style={{ fontSize: '24px', fontWeight: 800, marginTop: '4px', fontFamily: 'var(--font-mono)', color: '#008a00' }}>
              {liveTotalTime}
            </div>
          </div>

                    {/* Card 2: Top Project */}
          <div className="dash-metric-item" style={{ textAlign: 'center', padding: '8px 16px', borderRight: '1px solid #f1f5f9' }}>
            <div className="dash-metric-label" style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
              TOP PROJECT
            </div>
            <div className="dash-metric-val" style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {topProjectColor && <span className="project-bullet" style={{ backgroundColor: topProjectColor }} />}
              <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topProject}>
                {topProject}
              </span>
            </div>
          </div>

          {/* Card 3: Top Client */}
          <div className="dash-metric-item" style={{ textAlign: 'center', padding: '8px 16px' }}>
            <div className="dash-metric-label" style={{ fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px' }}>
              TOP CLIENT
            </div>
            <div className="dash-metric-val" style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginTop: '4px', maxWidth: '240px', margin: '4px auto 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={topClient}>
              {topClient}
            </div>
          </div>
        </div>

                        {/* 1. Full-Width 7-Day Weekly Activity Overview (Vertical Stacked Multi-Color Bar Chart) */}
        <div className="dash-chart-card full-width reports-chart-card" style={{ marginTop: '16px', padding: '24px 30px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }}>
          {/* Header Row: Title & Peak */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Weekly Activity Overview
            </span>

            {peakDay.hours > 0 && (
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#008a00' }}>
                Peak: {peakDay.day} ({peakDay.hours.toFixed(2)}h)
              </span>
            )}
          </div>

          {/* Project Color Legend matching Pie Chart */}
          {liveProjectBreakdown.list.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
              {liveProjectBreakdown.list.map((item, idx) => (
                <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color || '#00cc00', flexShrink: 0 }} />
                  <span>{item.project}</span>
                  <span style={{ color: '#64748b', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>({item.time})</span>
                </div>
              ))}
            </div>
          )}

          {/* 7-DAY WEEKLY MULTI-COLUMN VERTICAL STACKED BAR GRID */}
          <div className="reports-bars-scroll-wrapper" style={{ width: '100%', overflowX: 'auto', paddingBottom: '8px' }}>
            <div className="reports-bars-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', height: '300px', alignItems: 'flex-end', paddingBottom: '16px' }}>
              {dailyBarData.map((d, idx) => (
                <div key={idx} className="reports-bar-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '10px' }}>
                  {/* Top Duration Label */}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px', color: d.hours > 0 ? '#1e293b' : '#94a3b8', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {d.time}
                  </span>

                  {/* Multi-Colored Stacked Project Bar Fill Matching Pie Chart */}
                  <div 
                    className="reports-bar-fill" 
                    style={{ 
                      width: '100%',
                      maxWidth: '110px',
                      height: `${d.heightPercent}%`,
                      minHeight: d.hours > 0 ? '16px' : '4px',
                      borderRadius: '6px 6px 0 0',
                      display: 'flex',
                      flexDirection: 'column-reverse',
                      overflow: 'hidden',
                      background: d.hours > 0 ? 'transparent' : '#e2e8f0',
                      boxShadow: d.hours > 0 ? '0 4px 12px rgba(0, 0, 0, 0.12)' : 'none',
                      transition: 'height 0.35s ease',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    title={`${d.day}: ${d.time}${d.projectSegments && d.projectSegments.length > 0 ? '\n' + d.projectSegments.map(s => `${s.project}: ${formatSecondsToHMS(s.sec)}`).join('\n') : ''}`}
                  >
                    {d.hours > 0 && d.projectSegments && d.projectSegments.length > 0 ? (
                      d.projectSegments.map((seg, sIdx) => {
                        const segPercent = d.totalSec > 0 ? (seg.sec / d.totalSec) * 100 : 0;
                        return (
                          <div
                            key={sIdx}
                            style={{
                              width: '100%',
                              height: `${segPercent}%`,
                              minHeight: '3px',
                              backgroundColor: seg.color || '#00cc00',
                              transition: 'height 0.2s ease',
                              position: 'relative'
                            }}
                            title={`${seg.project}: ${formatSecondsToHMS(seg.sec)} (${segPercent.toFixed(1)}%)`}
                          />
                        );
                      })
                    ) : (
                      <div style={{ width: '100%', height: '100%', backgroundColor: d.hours > 0 ? '#00cc00' : '#e2e8f0' }} />
                    )}
                  </div>

                  {/* Day Label Beneath Baseline */}
                  <span style={{ fontSize: '13px', color: d.hours > 0 ? '#0f172a' : '#94a3b8', fontWeight: d.hours > 0 ? 800 : 600, whiteSpace: 'nowrap', marginTop: '6px' }}>
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Middle Row: Donut Breakdown (Left) + Most Tracked Activities (Right) Column-Wise Arranged */}
        <div className="dash-middle-grid">
          {/* Left Card: Column-Wise Donut Chart & Project Breakdown */}
          <div className="dash-breakdown-card">
            <div className="dash-breakdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="dash-breakdown-title" style={{ fontSize: '14px', fontWeight: 700, color: '#334155', letterSpacing: '0.2px' }}>Project breakdown</span>
                <span className="dash-top10-tag" style={{ background: '#f0fdf4', color: '#008a00', border: '1px solid rgba(0,204,0,0.3)', fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                  {liveProjectBreakdown.list.length} Projects
                </span>
              </div>
            </div>

            <div className="dash-breakdown-col-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', flex: 1 }}>
              {/* Large Donut Chart - Preserved Large Size */}
              <div className="dash-donut-wrapper" style={{ margin: '10px auto 20px', position: 'relative', width: '240px', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="240" height="240" viewBox="0 0 42 42" style={{ display: 'block', width: '240px', height: '240px' }}>
                  <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="5.5" />
                  {(() => {
                    let cumulative = 25; // 12 o'clock
                    return liveProjectBreakdown.list.map((item, idx) => {
                      const offset = cumulative;
                      cumulative -= item.percentage;
                      return (
                        <circle
                          key={idx}
                          cx="21"
                          cy="21"
                          r="15.915"
                          fill="transparent"
                          stroke={item.color || '#00cc00'}
                          strokeWidth="5.5"
                          strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                          strokeDashoffset={offset}
                        />
                      );
                    });
                  })()}
                </svg>

                <div className="dash-donut-center" style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none' }}>
                  <div className="dash-donut-time" style={{ color: '#0f172a', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '22px' }}>
                    {liveTotalTime}
                  </div>
                  <div className="dash-donut-sub" style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '3px' }}>
                    TOTAL TRACKED
                  </div>
                </div>
              </div>

              {/* Projects Breakdown List matching Team Activities Typography */}
              <div className="dash-breakdown-list-scroll" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                {liveProjectBreakdown.list.map((item, idx) => (
                  <div key={idx} className="dash-breakdown-row" style={{ width: '100%', padding: '3px 0' }}>
                    <div className="dash-breakdown-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <div className="dash-proj-name" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <span className="project-bullet" style={{ backgroundColor: item.color || '#00cc00', width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.project}>
                          {item.project}
                        </span>
                      </div>
                      
                      <div className="dash-proj-time" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {item.time}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                          {item.percentage}%
                        </span>
                        <span 
                          className="dash-increment-tag"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#008a00',
                            background: '#f0fdf4',
                            border: '1px solid rgba(0, 204, 0, 0.3)',
                            padding: '1px 6px',
                            borderRadius: '12px'
                          }}
                        >
                          <ArrowUp size={9} color="#008a00" />
                          <span>{item.incrementBadge}</span>
                        </span>
                      </div>
                    </div>

                    <div className="dash-prog-track" style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                      <div 
                        className="dash-prog-fill" 
                        style={{ 
                          width: `${Math.min(100, item.percentage)}%`, 
                          backgroundColor: item.color || '#00cc00',
                          height: '100%',
                          borderRadius: '3px'
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Card: Column-Wise Most Tracked Activities matching Team Activities Typography */}
          <div className="dash-activities-card">
            <div className="dash-activities-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="dash-activities-title" style={{ fontSize: '14px', fontWeight: 700, color: '#334155', letterSpacing: '0.2px' }}>Most tracked activities</span>
                <span className="dash-top10-tag" style={{ background: '#f0fdf4', color: '#008a00', border: '1px solid rgba(0,204,0,0.3)', fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                  {showAllTasks ? `All ${topTrackedActivities.length} Records` : `Top ${topTrackedActivities.length}`}
                </span>
              </div>
              <button
                type="button"
                className="dash-toggle-show-all-btn"
                onClick={() => setShowAllTasks(!showAllTasks)}
                title={showAllTasks ? "Show Top 10 activities" : "Show all records from all employees"}
                style={{ fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#475569', cursor: 'pointer' }}
              >
                {showAllTasks ? 'Show Top 10' : `Show all (${totalTasksCount})`}
              </button>
            </div>

            <div className="dash-activities-list" style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {topTrackedActivities.length > 0 ? (
                topTrackedActivities.map((act, idx) => (
                  <div key={act.id || idx} className="dash-activity-item" style={{ padding: '8px 10px', borderRadius: '6px', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div className="dash-act-left" style={{ flex: 1, minWidth: 0 }}>
                      <div className="dash-act-task" style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }} title={act.task}>
                        <span className="dash-act-rank" style={{ color: idx === 0 ? '#00cc00' : '#94a3b8', fontWeight: 800, fontSize: '12px', minWidth: '20px' }}>
                          #{idx + 1}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.task}</span>
                      </div>
                      <div className="dash-act-proj" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '3px', marginLeft: '26px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <span className="project-bullet" style={{ backgroundColor: act.color || '#00cc00', width: '7px', height: '7px', borderRadius: '50%' }} />
                          <span style={{ fontWeight: 600, color: '#475569', fontSize: '12px' }}>{act.project}</span>
                        </div>
                        {act.userName && (
                          <span className="dash-act-user-tag" title={`Employee: ${act.userName}`} style={{ fontSize: '11px', fontWeight: 600, color: '#008a00', background: '#f0fdf4', padding: '1px 6px', borderRadius: '10px', border: '1px solid rgba(0,204,0,0.2)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <User size={10} />
                            {act.userName.replace(/\s*\(Owner\)|\s*\(Admin\)/i, '')}
                          </span>
                        )}
                        {act.date && (
                          <span className="dash-act-date-tag" style={{ fontSize: '11.5px', color: '#64748b' }}>
                            {act.date}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="dash-act-duration" style={{ color: idx === 0 ? '#008a00' : '#0f172a', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '13px', flexShrink: 0 }}>
                      {act.durationFormatted}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '32px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '12.5px' }}>
                  No activities tracked yet for this period. Track time or log an entry to view your top tasks!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Width Beautiful Team Activities Row / Card (Shown only in 'Show all' / Team view) */}
        {(userFilter === 'all' || userFilter === 'Show all' || userFilter === 'Everyone') && (
          <div className="dash-team-activities-card" style={{ marginTop: '20px' }}>
          <div className="dash-team-act-header">
            <div className="dash-team-act-title-wrap">
              <span className="dash-team-act-title">Team activities</span>
            </div>
            <button
              type="button"
              className="dash-team-act-pin-btn"
              onClick={() => setPinnedTeamCard(!pinnedTeamCard)}
              title={pinnedTeamCard ? "Pinned to Dashboard" : "Unpin from Dashboard"}
            >
              <Pin size={15} style={{ transform: pinnedTeamCard ? 'rotate(45deg)' : 'none', color: pinnedTeamCard ? '#008a00' : '#94a3b8' }} />
            </button>
          </div>

          <div className="dash-team-table-wrap">
            <table className="dash-team-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>TEAM MEMBER</span>
                      <ArrowUpDown size={11} color="#94a3b8" />
                    </div>
                  </th>
                  <th style={{ width: '42%' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>LATEST ACTIVITY</span>
                      <ArrowUpDown size={11} color="#94a3b8" />
                    </div>
                  </th>
                  <th style={{ width: '36%' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>TOTAL TRACKED ({formatRangeTitle(dateRange.start, dateRange.end).toUpperCase()})</span>
                      <ArrowUpDown size={11} color="#94a3b8" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamActivitiesList.map((m, idx) => (
                  <tr key={m.id || idx}>
                    {/* 1. Team Member */}
                    <td>
                      <div className="dash-team-member-flex">
                        <div className="dash-member-avatar-box" style={{ backgroundColor: m.avatarColor }}>
                          {m.initials}
                        </div>
                        <div className="dash-member-name-wrap">
                          <span className="dash-member-name-text">{m.displayName}</span>
                          <span className="dash-member-sub-text">{m.email || m.name}</span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Latest Activity */}
                    <td>
                      <div className="dash-latest-task-wrap">
                        <div className="dash-latest-task-name" title={m.latestTask}>
                          {m.latestTask}
                        </div>
                        <div className="dash-latest-task-meta">
                          {m.latestProject && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <span className="project-bullet" style={{ backgroundColor: m.latestProjectColor }} />
                              <span style={{ fontWeight: 600, color: '#475569' }}>{m.latestProject}</span>
                            </div>
                          )}
                          {m.latestDuration && (
                            <div className="dash-latest-dur-rel">
                              <span className="dash-latest-dur-text">{m.latestDuration}</span>
                              <span className="dash-latest-rel-text">{m.relativeTimeStr}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Total Tracked & Green Progress Bar */}
                    <td>
                      <div className="dash-team-total-wrap">
                        <div className="dash-team-total-time">
                          {m.totalTimeFormatted}
                        </div>
                        <div className="dash-team-bar-track">
                          <div
                            className="dash-team-bar-fill"
                            style={{
                              width: `${m.progressPercent}%`,
                              background: '#00cc00'
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
