// Clean Slate Initial Data for Clockodo Production

export const INITIAL_PROJECTS = [];

export const INITIAL_USERS = [
  { 
    id: 'usr-admin-1', 
    name: 'Bharath (Owner)', 
    username: 'bharath_owner', 
    email: 'bharath.owner@digiplusagency.com', 
    password: '1234567890',
    role: 'admin', 
    group: 'Management / Executive', 
    department: 'Management / Executive', 
    active: true,
    accessGranted: true,
    avatarInitials: 'BO',
    avatarColor: '#10b981',
    workspace: 'DigiPlus'
  }
];

export const DIGIPLUS_TEAM_MEMBERS = INITIAL_USERS;

export const DASHBOARD_METRICS = {
  totalTime: '00:00:00',
  topProject: '—',
  topClient: '—',
  dailyBars: [
    { day: 'Mon', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Tue', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Wed', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Thu', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Fri', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Sat', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Sun', total: '00:00:00', totalHours: 0, segments: [] }
  ],
  projectBreakdown: [],
  activitiesList: []
};

export const REPORTS_DATA = {
  totalSummary: '00:00:00',
  dailyHours: [],
  projectList: [],
};

export const CALENDAR_WEEK_SCHEDULE = {
  weekLabel: 'Current Week',
  totalWeekLogged: '00:00:00',
  totalWeekHours: 0.0,
  days: [
    { dayNum: 1, dayName: 'Mon', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 2, dayName: 'Tue', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 3, dayName: 'Wed', totalStr: '00:00:00', isToday: true, isWeekend: false, blocks: [] },
    { dayNum: 4, dayName: 'Thu', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 5, dayName: 'Fri', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 6, dayName: 'Sat', totalStr: '00:00:00', isToday: false, isWeekend: true, blocks: [] },
    { dayNum: 7, dayName: 'Sun', totalStr: '00:00:00', isToday: false, isWeekend: true, blocks: [] },
  ]
};

export const INITIAL_TIMESHEET_ROWS = [];

export const INITIAL_RECENT_ACTIVITIES = [];

export const CALENDAR_DAYS_AUGUST_2026 = [];

export const INITIAL_NOTIFICATIONS = [];

export const USER_PROFILE = {
  name: 'Bharath (Owner)',
  title: 'Administrator / Owner',
  email: 'bharath.owner@digiplusagency.com',
  workspace: 'DigiPlus',
  avatar: null,
  role: 'Owner',
  department: 'Management / Executive'
};

export const DEFAULT_REGISTERED_USERS = INITIAL_USERS;
