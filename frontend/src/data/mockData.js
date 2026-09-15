// Comprehensive mock data for Tracko featuring all DigiPlus reference screenshots

export const INITIAL_PROJECTS = [
  { id: 'proj-1', name: 'A2z4r.com', client: 'A2z4r Ventures', color: '#10b981', tracked: '140.58h', progress: '—', access: 'Public', billableRate: 85, isFavorite: true },
  { id: 'proj-2', name: 'JRKS Logistics', client: 'JRKS Fleet Corp', color: '#059669', tracked: '68.14h', progress: '—', access: 'Public', billableRate: 95, isFavorite: true },
  { id: 'proj-3', name: 'Selva Chit App', client: 'Selva FinTech Ltd', color: '#0d9488', tracked: '88.30h', progress: '—', access: 'Public', billableRate: 90, isFavorite: true },
  { id: 'proj-4', name: 'DigiPlus Operations', client: 'DigiPlus Agency HQ', color: '#3b82f6', tracked: '31.20h', progress: '—', access: 'Public', billableRate: 75, isFavorite: false },
  { id: 'proj-5', name: 'CRM Enterprise Integration', client: 'Alpha Global Corp', color: '#8b5cf6', tracked: '19.45h', progress: '—', access: 'Public', billableRate: 110, isFavorite: false },
  { id: 'proj-6', name: 'Mobile Delivery App Revamp', client: 'Beta Logistics LLC', color: '#ec4899', tracked: '54.10h', progress: '—', access: 'Public', billableRate: 105, isFavorite: false },
  { id: 'proj-7', name: 'Fleet Tracker IoT', client: 'Omni Telematics', color: '#f97316', tracked: '15.20h', progress: '—', access: 'Public', billableRate: 115, isFavorite: false },
  { id: 'proj-8', name: 'Billing & Ledger Automation', client: 'Apex FinTech Global', color: '#06b6d4', tracked: '27.50h', progress: '—', access: 'Public', billableRate: 100, isFavorite: false }
];

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
  },
  { 
    id: 'usr-1788775861951', 
    name: 'anbu', 
    username: 'anbu2822', 
    email: 'anbu2822@gmail.com', 
    password: 'Anbu2822',
    role: 'employee', 
    group: 'Full Stack', 
    department: 'Full Stack', 
    active: true,
    accessGranted: true,
    avatarInitials: 'A',
    avatarColor: '#14b8a6',
    workspace: 'DigiPlus'
  },
  { 
    id: 'usr-1788781817045', 
    name: 'Muthu', 
    username: 'muthulakshmi2002apk', 
    email: 'muthulakshmi2002apk@gmail.com', 
    password: 'Muthu2002',
    role: 'employee', 
    group: 'Frontend Dev', 
    department: 'Frontend Dev', 
    active: true,
    accessGranted: true,
    avatarInitials: 'M',
    avatarColor: '#ec4899',
    workspace: 'DigiPlus'
  },
  { 
    id: 'usr-1788782032047', 
    name: 'sivanparu', 
    username: 'sivanparu', 
    email: 'sivanparu@gmail.com', 
    password: 'sivanparu',
    role: 'employee', 
    group: 'Backend Engineering', 
    department: 'Backend Engineering', 
    active: true,
    accessGranted: true,
    avatarInitials: 'S',
    avatarColor: '#3b82f6',
    workspace: 'DigiPlus'
  },
  { 
    id: 'usr-1788783507309', 
    name: 'mani', 
    username: 'mani', 
    email: 'mani@gmail.com', 
    password: 'Mani02',
    role: 'employee', 
    group: 'Design & UI', 
    department: 'Design & UI', 
    active: true,
    accessGranted: true,
    avatarInitials: 'M',
    avatarColor: '#06b6d4',
    workspace: 'DigiPlus'
  },
  { 
    id: 'usr-1789370216451', 
    name: 'babu', 
    username: 'babu', 
    email: 'babu@gmail.com', 
    password: 'babu123',
    role: 'employee', 
    group: 'Quality Assurance', 
    department: 'Quality Assurance', 
    active: true,
    accessGranted: true,
    avatarInitials: 'B',
    avatarColor: '#06b6d4',
    workspace: 'DigiPlus'
  }
];

export const DIGIPLUS_TEAM_MEMBERS = INITIAL_USERS;

export const DASHBOARD_METRICS = {
  totalTime: '00:00:00',
  topProject: '—',
  topClient: '—',
  dailyBars: [
    { day: 'Mon, Aug 31', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Tue, Sep 1', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Wed, Sep 2', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Thu, Sep 3', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Fri, Sep 4', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Sat, Sep 5', total: '00:00:00', totalHours: 0, segments: [] },
    { day: 'Sun, Sep 6', total: '00:00:00', totalHours: 0, segments: [] }
  ],
  projectBreakdown: [],
  activitiesList: []
};

export const REPORTS_DATA = {
  totalSummary: '235:09:00',
  dailyHours: [
    { day: 'Mon, Aug 24', time: '86:45:00', hours: 86.75, heightPercent: 90 },
    { day: 'Tue, Aug 25', time: '84:00:00', hours: 84.0, heightPercent: 86 },
    { day: 'Wed, Aug 26', time: '62:24:00', hours: 62.4, heightPercent: 64 },
    { day: 'Thu, Aug 27', time: '02:00:00', hours: 2.0, heightPercent: 4 },
    { day: 'Fri, Aug 28', time: '00:00:00', hours: 0, heightPercent: 0 },
    { day: 'Sat, Aug 29', time: '00:00:00', hours: 0, heightPercent: 0 },
    { day: 'Sun, Aug 30', time: '00:00:00', hours: 0, heightPercent: 0 },
  ],
  projectList: [
    { id: 'rep-1', name: '1page', duration: '15:55:00', color: '#3b82f6', percent: 18.5 },
    { id: 'rep-2', name: 'Accounts - DigiPlusAgency', duration: '04:25:00', color: '#10b981', percent: 8.2 },
    { id: 'rep-3', name: 'A2z4r.com', duration: '42:15:00', color: '#059669', percent: 24.0 },
    { id: 'rep-4', name: 'abudhabiguide', duration: '38:40:00', color: '#22c55e', percent: 21.0 },
    { id: 'rep-5', name: 'JRKS Logistics', duration: '68:14:00', color: '#0d9488', percent: 28.3 },
  ],
};

export const CALENDAR_WEEK_SCHEDULE = {
  weekLabel: 'Aug 31 – Sep 6, 2026',
  totalWeekLogged: '00:00:00',
  totalWeekHours: 0.0,
  days: [
    { dayNum: 31, dayName: 'Mon, Aug 31', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 1, dayName: 'Tue, Sep 1', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 2, dayName: 'Wed, Sep 2', totalStr: '00:00:00', isToday: true, isWeekend: false, blocks: [] },
    { dayNum: 3, dayName: 'Thu, Sep 3', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 4, dayName: 'Fri, Sep 4', totalStr: '00:00:00', isToday: false, isWeekend: false, blocks: [] },
    { dayNum: 5, dayName: 'Sat, Sep 5', totalStr: '00:00:00', isToday: false, isWeekend: true, blocks: [] },
    { dayNum: 6, dayName: 'Sun, Sep 6', totalStr: '00:00:00', isToday: false, isWeekend: true, blocks: [] },
  ]
};

export const INITIAL_TIMESHEET_ROWS = [];

export const INITIAL_RECENT_ACTIVITIES = [];

export const CALENDAR_DAYS_AUGUST_2026 = [
  { day: 1, isCurrentMonth: true, weekday: 6, hours: 0, entries: [] },
  { day: 2, isCurrentMonth: true, weekday: 0, hours: 0, entries: [] },
  {
    day: 3, isCurrentMonth: true, weekday: 1, hours: 8.0,
    entries: [
      { project: 'JRKS Logistics', hours: '4.5h', color: '#059669' },
      { project: 'Operations', hours: '3.5h', color: '#475569' },
    ]
  },
  {
    day: 4, isCurrentMonth: true, weekday: 2, hours: 8.5,
    entries: [
      { project: 'Selva Chit App', hours: '5.0h', color: '#0d9488' },
      { project: 'Task Management app', hours: '3.5h', color: '#10b981' },
    ]
  },
  {
    day: 5, isCurrentMonth: true, weekday: 3, hours: 7.75,
    entries: [
      { project: 'Ashoka Rolls LLP', hours: '4.0h', color: '#0284c7' },
      { project: 'JRKS Logistics', hours: '3.75h', color: '#059669' },
    ]
  },
  {
    day: 6, isCurrentMonth: true, weekday: 4, hours: 8.0,
    entries: [
      { project: 'Task Management app', hours: '8.0h', color: '#10b981' },
    ]
  },
  {
    day: 7, isCurrentMonth: true, weekday: 5, hours: 6.5,
    entries: [
      { project: 'Operations', hours: '2.0h', color: '#475569' },
      { project: 'Selva Chit App', hours: '4.5h', color: '#0d9488' },
    ]
  },
  { day: 8, isCurrentMonth: true, weekday: 6, hours: 0, entries: [] },
  { day: 9, isCurrentMonth: true, weekday: 0, hours: 0, entries: [] },
  {
    day: 10, isCurrentMonth: true, weekday: 1, hours: 8.0,
    entries: [
      { project: 'JRKS Logistics', hours: '5.0h', color: '#059669' },
      { project: 'Task Management app', hours: '3.0h', color: '#10b981' },
    ]
  },
  {
    day: 11, isCurrentMonth: true, weekday: 2, hours: 8.0,
    entries: [
      { project: 'Selva Chit App', hours: '6.0h', color: '#0d9488' },
      { project: 'Operations', hours: '2.0h', color: '#475569' },
    ]
  },
  {
    day: 12, isCurrentMonth: true, weekday: 3, hours: 7.5,
    entries: [
      { project: 'Ashoka Rolls LLP', hours: '5.0h', color: '#0284c7' },
      { project: 'JRKS Logistics', hours: '2.5h', color: '#059669' },
    ]
  },
  {
    day: 13, isCurrentMonth: true, weekday: 4, hours: 8.25,
    entries: [
      { project: 'Task Management app', hours: '8.25h', color: '#10b981' },
    ]
  },
  {
    day: 14, isCurrentMonth: true, weekday: 5, hours: 7.0,
    entries: [
      { project: 'JRKS Logistics', hours: '4.0h', color: '#059669' },
      { project: 'Operations', hours: '3.0h', color: '#475569' },
    ]
  },
  {
    day: 15, isCurrentMonth: true, weekday: 6, hours: 0,
    badge: { label: 'Independence Day', type: 'holiday' },
    entries: []
  },
  { day: 16, isCurrentMonth: true, weekday: 0, hours: 0, entries: [] },
  {
    day: 17, isCurrentMonth: true, weekday: 1, hours: 8.0,
    entries: [
      { project: 'Selva Chit App', hours: '4.0h', color: '#0d9488' },
      { project: 'Ashoka Rolls LLP', hours: '4.0h', color: '#0284c7' },
    ]
  },
  {
    day: 18, isCurrentMonth: true, weekday: 2, hours: 8.0,
    entries: [
      { project: 'JRKS Logistics', hours: '6.0h', color: '#059669' },
      { project: 'Operations', hours: '2.0h', color: '#475569' },
    ]
  },
  {
    day: 19, isCurrentMonth: true, weekday: 3, hours: 8.0,
    entries: [
      { project: 'Task Management app', hours: '5.5h', color: '#10b981' },
      { project: 'Selva Chit App', hours: '2.5h', color: '#0d9488' },
    ]
  },
  {
    day: 20, isCurrentMonth: true, weekday: 4, hours: 7.5,
    entries: [
      { project: 'JRKS Logistics', hours: '4.5h', color: '#059669' },
      { project: 'Ashoka Rolls LLP', hours: '3.0h', color: '#0284c7' },
    ]
  },
  {
    day: 21, isCurrentMonth: true, weekday: 5, hours: 6.0,
    entries: [
      { project: 'Operations', hours: '3.0h', color: '#475569' },
      { project: 'Task Management app', hours: '3.0h', color: '#10b981' },
    ]
  },
  { day: 22, isCurrentMonth: true, weekday: 6, hours: 0, entries: [] },
  { day: 23, isCurrentMonth: true, weekday: 0, hours: 0, entries: [] },
  {
    day: 24, isCurrentMonth: true, weekday: 1, hours: 8.0,
    entries: [
      { project: 'JRKS Logistics', hours: '2.0h', color: '#059669' },
      { project: 'Operations', hours: '2.5h', color: '#475569' },
      { project: 'Selva Chit App', hours: '2.0h', color: '#0d9488' },
      { project: 'Task Management app', hours: '1.5h', color: '#10b981' },
    ]
  },
  {
    day: 25, isCurrentMonth: true, weekday: 2, hours: 8.0,
    entries: [
      { project: 'JRKS Logistics', hours: '5.66h', color: '#059669' },
      { project: 'Selva Chit App', hours: '2.33h', color: '#0d9488' },
    ]
  },
  {
    day: 26, isCurrentMonth: true, weekday: 3, hours: 7.5,
    entries: [
      { project: 'Ashoka Rolls LLP', hours: '1.5h', color: '#0284c7' },
      { project: 'JRKS Logistics', hours: '4.75h', color: '#059669' },
      { project: 'Operations', hours: '1.25h', color: '#475569' },
    ]
  },
  {
    day: 27, isCurrentMonth: true, weekday: 4, hours: 4.5, isToday: true,
    entries: [
      { project: 'Task Management app', hours: '2.25h', color: '#10b981' },
      { project: 'JRKS Logistics', hours: '2.25h', color: '#059669' },
    ]
  },
  { day: 28, isCurrentMonth: true, weekday: 5, hours: 0, entries: [] },
  { day: 29, isCurrentMonth: true, weekday: 6, hours: 0, entries: [] },
  { day: 30, isCurrentMonth: true, weekday: 0, hours: 0, entries: [] },
  {
    day: 31, isCurrentMonth: true, weekday: 1, hours: 0,
    badge: { label: 'Bank Holiday', type: 'holiday' },
    entries: []
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Timesheet Approved',
    message: 'Your timesheet for Aug 17 - Aug 23 was approved by Bharath (Owner).',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 'notif-2',
    title: 'Weekly Target Reached',
    message: 'You have completed 32 of your 40 weekly hours goal!',
    time: '5 hours ago',
    unread: true,
  },
  {
    id: 'notif-3',
    title: 'Project Assigned',
    message: 'You were added to "A2z4r.com" by DigiPlus.',
    time: 'Yesterday',
    unread: false,
  },
];

export const USER_PROFILE = {
  name: 'DigiPlus Employee',
  title: 'Team Member',
  email: 'employee@digiplusagency.com',
  workspace: 'DigiPlus',
  timezone: 'UTC+05:30 (IST)',
  avatarInitials: 'DE',
  weeklyTargetHours: 40,
  dailyTargetHours: 8,
  currency: 'INR (₹)',
  hourlyRate: 75,
};

export const DEFAULT_REGISTERED_USERS = [
  {
    id: 'usr-admin-1',
    name: 'Bharath (Owner)',
    username: 'bharath_owner',
    email: 'bharath.owner@digiplusagency.com',
    password: 'Bharath@Admin2026',
    role: 'admin',
    group: 'Management / Executive',
    accessGranted: true,
    avatarInitials: 'BO',
  },
  {
    id: 'usr-emp-1',
    name: 'DigiPlus Employee',
    username: 'digiplus_employee',
    email: 'employee@digipl.us',
    password: 'Employee@Digi2026',
    role: 'employee',
    group: 'Full Stack',
    accessGranted: true,
    avatarInitials: 'DE',
  },
  {
    id: 'usr-emp-2',
    name: 'abirami',
    username: 'abirami_ui',
    email: 'abirami.frontend@digiplusagency.com',
    password: 'Abirami@Front2026',
    role: 'employee',
    group: 'Frontend Dev',
    accessGranted: true,
    avatarInitials: 'AB',
  },
  {
    id: 'usr-emp-3',
    name: 'Aishwarya',
    username: 'aishwarya_dev',
    email: 'aishwarya.fullstack@digiplusagency.com',
    password: 'Aish@Fullstack2026',
    role: 'employee',
    group: 'Full Stack',
    accessGranted: true,
    avatarInitials: 'AI',
  },
  {
    id: 'usr-emp-4',
    name: 'Karthick Raja',
    username: 'karthick_lead',
    email: 'karthick.logistics@digiplusagency.com',
    password: 'Karthick@Fleet2026',
    role: 'employee',
    group: 'JRKS Logistics Lead',
    accessGranted: true,
    avatarInitials: 'KR',
  },
];

