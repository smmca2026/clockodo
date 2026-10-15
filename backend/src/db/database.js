const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../data/clockodo_db.json');

// Default initial datasets
const DEFAULT_INITIAL_DATA = {
  users: [
    { id: 'usr-1', name: 'Bharath (Owner)', email: 'bharath@digiplusagency.com', role: 'admin', active: true, avatarInitials: 'BO', avatarColor: '#10b981', workspace: 'DigiPlus' },
    { id: 'usr-2', name: 'abirami', email: 'abirami@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'AB', avatarColor: '#3b82f6', workspace: 'DigiPlus' },
    { id: 'usr-3', name: 'Aishwarya', email: 'aishwarya@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'AI', avatarColor: '#8b5cf6', workspace: 'DigiPlus' },
    { id: 'usr-4', name: 'aishwaryadevi', email: 'aishwaryadevi@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'AD', avatarColor: '#ec4899', workspace: 'DigiPlus' },
    { id: 'usr-5', name: 'Arabina', email: 'arabina@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'AR', avatarColor: '#f97316', workspace: 'DigiPlus' },
    { id: 'usr-6', name: 'Ariharasudhan', email: 'ariharasudhan@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'AS', avatarColor: '#06b6d4', workspace: 'DigiPlus' },
    { id: 'usr-7', name: 'balaji', email: 'balaji@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'BA', avatarColor: '#14b8a6', workspace: 'DigiPlus' },
    { id: 'usr-8', name: 'bavithra', email: 'bavithra@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'BV', avatarColor: '#6366f1', workspace: 'DigiPlus' },
    { id: 'usr-9', name: 'Karthick Raja', email: 'karthick@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'KR', avatarColor: '#059669', workspace: 'DigiPlus' },
    { id: 'usr-10', name: 'Priya Dharshini', email: 'priyadharshini@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'PD', avatarColor: '#d946ef', workspace: 'DigiPlus' },
    { id: 'usr-11', name: 'Vigneshwaran', email: 'vigneshwaran@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'VW', avatarColor: '#0ea5e9', workspace: 'DigiPlus' },
    { id: 'usr-12', name: 'Santhosh Kumar', email: 'santhosh@digiplusagency.com', role: 'employee', active: true, avatarInitials: 'SK', avatarColor: '#eab308', workspace: 'DigiPlus' }
  ],
  projects: [
    { id: 'proj-1', name: 'A2z4r.com', client: 'DigiPlusAgency', color: '#10b981', trackedHours: '42:15', budget: '80h', hourlyRate: 85, isBillable: true },
    { id: 'proj-2', name: 'JRKS Logistics', client: 'JRKS Fleet', color: '#059669', trackedHours: '68:14', budget: '120h', hourlyRate: 95, isBillable: true },
    { id: 'proj-3', name: 'Selva Chit App', client: 'Selva FinTech', color: '#0d9488', trackedHours: '88:30', budget: '100h', hourlyRate: 85, isBillable: true },
    { id: 'proj-4', name: 'Internal Operations', client: 'DigiPlusAgency', color: '#3b82f6', trackedHours: '31:20', budget: '50h', hourlyRate: 0, isBillable: false },
    { id: 'proj-5', name: 'CRM Integration', client: 'Alpha Corp', color: '#8b5cf6', trackedHours: '19:45', budget: '40h', hourlyRate: 90, isBillable: true },
    { id: 'proj-6', name: 'Mobile App Revamp', client: 'Beta LLC', color: '#ec4899', trackedHours: '54:10', budget: '75h', hourlyRate: 100, isBillable: true },
    { id: 'proj-7', name: 'Fleet Tracker IoT', client: 'JRKS Fleet', color: '#f97316', trackedHours: '15:20', budget: '60h', hourlyRate: 95, isBillable: true },
    { id: 'proj-8', name: 'Billing Automation', client: 'Selva FinTech', color: '#06b6d4', trackedHours: '27:50', budget: '45h', hourlyRate: 85, isBillable: true }
  ],
  activities: [
    {
      id: 'act-101',
      project: 'JRKS Logistics',
      projectColor: '#059669',
      description: 'Testing and Fleet Invoicing API module',
      group: 'Today',
      date: 'Wed, Sep 2, 2026',
      startTime: '09:00 AM',
      endTime: '02:40 PM',
      durationFormatted: '05:40:00',
      durationSeconds: 20400,
      billable: true,
      user: 'Karthick Raja'
    },
    {
      id: 'act-102',
      project: 'JRKS Logistics',
      projectColor: '#059669',
      description: 'Challan record payable field verification',
      group: 'Today',
      date: 'Wed, Sep 2, 2026',
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      durationFormatted: '04:00:00',
      durationSeconds: 14400,
      billable: true,
      user: 'Priya Dharshini'
    },
    {
      id: 'act-103',
      project: 'Selva Chit App',
      projectColor: '#0d9488',
      description: 'Detailed chit customer report section and print layout',
      group: 'Today',
      date: 'Wed, Sep 2, 2026',
      startTime: '09:00 AM',
      endTime: '11:20 AM',
      durationFormatted: '02:20:00',
      durationSeconds: 8400,
      billable: true,
      user: 'abirami'
    },
    {
      id: 'act-104',
      project: 'A2z4r.com',
      projectColor: '#10b981',
      description: 'Enterprise architecture & sprint planning review',
      group: 'Yesterday',
      date: 'Tue, Sep 1, 2026',
      startTime: '09:05 AM',
      endTime: '05:30 PM',
      durationFormatted: '07:40:00',
      durationSeconds: 27600,
      billable: true,
      user: 'Bharath (Owner)'
    }
  ],
  timesheets: [
    {
      id: 'ts-1',
      projectName: 'JRKS Logistics',
      projectColor: '#059669',
      taskDescription: 'Fleet Invoicing & Challan Module',
      billable: true,
      days: { 'mon': '06:15:00', 'tue': '05:30:00', 'wed': '05:40:00', 'thu': '00:00:00', 'fri': '00:00:00', 'sat': '00:00:00', 'sun': '00:00:00' },
      total: '17:25:00'
    },
    {
      id: 'ts-2',
      projectName: 'Selva Chit App',
      projectColor: '#0d9488',
      taskDescription: 'Daily collection sync & chit auction ledger',
      billable: true,
      days: { 'mon': '06:45:00', 'tue': '05:40:00', 'wed': '02:20:00', 'thu': '00:00:00', 'fri': '00:00:00', 'sat': '00:00:00', 'sun': '00:00:00' },
      total: '14:45:00'
    },
    {
      id: 'ts-3',
      projectName: 'A2z4r.com',
      projectColor: '#10b981',
      taskDescription: 'Enterprise architecture review',
      billable: true,
      days: { 'mon': '08:00:00', 'tue': '07:40:00', 'wed': '07:15:00', 'thu': '00:00:00', 'fri': '00:00:00', 'sat': '00:00:00', 'sun': '00:00:00' },
      total: '22:55:00'
    }
  ],
  attendance: [
    { id: 'att-1', userId: 'usr-1', userName: 'Bharath (Owner)', userRole: 'Admin (Owner)', date: 'Wed, Sep 2, 2026', clockIn: '09:00 AM', clockOut: '05:00 PM', breakTime: '00:45:00', totalShift: '07:15:00', status: 'Active (Working)' },
    { id: 'att-2', userId: 'usr-4', userName: 'aishwaryadevi', userRole: 'Quality Assurance', date: 'Tue, Sep 1, 2026', clockIn: '09:20 AM', clockOut: '05:45 PM', breakTime: '00:45:00', totalShift: '07:40:00', status: 'Present (On-Time)' },
    { id: 'att-3', userId: 'usr-8', userName: 'bavithra', userRole: 'Mobile Apps', date: 'Mon, Aug 31, 2026', clockIn: '09:15 AM', clockOut: '05:40 PM', breakTime: '00:45:00', totalShift: '07:40:00', status: 'Present (On-Time)' },
    { id: 'att-4', userId: 'usr-12', userName: 'Santhosh Kumar', userRole: 'Backend Engineering', date: 'Mon, Aug 31, 2026', clockIn: '—', clockOut: '—', breakTime: '—', totalShift: '—', status: 'On Leave (Annual Leave)' }
  ],
  sharedReports: {
    'rpt_jrks_9843a': {
      title: 'JRKS Logistics - Client Timesheet (Sep 2026)',
      client: 'JRKS Fleet',
      projectName: 'JRKS Logistics',
      projectColor: '#059669',
      period: 'September 2026 (Live)',
      totalHours: '68:14:00',
      totalBillable: '68:14:00',
      billableRate: '$95 / hr',
      totalAmount: '$6,482.16',
      createdDate: 'September 1, 2026',
      leadName: 'Karthick Raja (Project Lead)',
      entries: [
        { id: 1, date: 'Wed, Sep 2, 2026', task: 'Testing and Fleet Invoicing API module', user: 'Karthick Raja', duration: '05:40:00', billable: true },
        { id: 2, date: 'Wed, Sep 2, 2026', task: 'Challan record payable field verification', user: 'Priya Dharshini', duration: '04:00:00', billable: true },
        { id: 3, date: 'Tue, Sep 1, 2026', task: 'Logistics ledger calculation & voucher entries', user: 'Ariharasudhan', duration: '05:30:00', billable: true }
      ]
    },
    'rpt_selva_4311b': {
      title: 'Selva Chit App - Milestone 1 Deliverables',
      client: 'Selva FinTech',
      projectName: 'Selva Chit App',
      projectColor: '#0d9488',
      period: 'This week (Aug 31 - Sep 6, 2026)',
      totalHours: '88:30:00',
      totalBillable: '88:30:00',
      billableRate: '$85 / hr',
      totalAmount: '$7,522.50',
      createdDate: 'August 28, 2026',
      leadName: 'DigiPlus FinTech Team',
      entries: [
        { id: 1, date: 'Wed, Sep 2, 2026', task: 'Detailed chit customer report section and print layout', user: 'abirami', duration: '02:20:00', billable: true },
        { id: 2, date: 'Tue, Sep 1, 2026', task: 'Daily collection transaction sync API', user: 'Ariharasudhan', duration: '05:40:00', billable: true }
      ]
    }
  }
};

class JSONDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
      this.save();
      console.log('✅ Clockodo Database initialized and seeded with default data.');
    } else {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading DB, resetting to defaults:', err);
        this.data = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
        this.save();
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error writing to DB file:', err);
    }
  }

  get(table) {
    return this.data[table] || [];
  }

  set(table, records) {
    this.data[table] = records;
    this.save();
    return this.data[table];
  }

  find(table, predicate) {
    const list = this.get(table);
    return list.find(predicate);
  }

  filter(table, predicate) {
    const list = this.get(table);
    return list.filter(predicate);
  }

  insert(table, item) {
    if (!this.data[table]) this.data[table] = [];
    const newRecord = { id: item.id || `${table.slice(0, 3)}-${Date.now()}`, ...item };
    this.data[table].unshift(newRecord);
    this.save();
    return newRecord;
  }

  update(table, id, updates) {
    if (!this.data[table]) return null;
    const index = this.data[table].findIndex(i => i.id === id);
    if (index !== -1) {
      this.data[table][index] = { ...this.data[table][index], ...updates };
      this.save();
      return this.data[table][index];
    }
    return null;
  }

  delete(table, id) {
    if (!this.data[table]) return false;
    const initialLen = this.data[table].length;
    this.data[table] = this.data[table].filter(i => i.id !== id);
    this.save();
    return this.data[table].length < initialLen;
  }
}

const db = new JSONDatabase();
module.exports = db;
