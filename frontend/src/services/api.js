// Clockodo API Client Service Layer
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    if (import.meta.env && import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    // Production default: relative '/api' to avoid Mixed Content / port blocking
    return '/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`API Request failed for ${endpoint}, falling back to local state:`, error.message);
    return null;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Auth & Users
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getUsers: () => request('/users'),
  addUser: (userData) => request('/users', { method: 'POST', body: JSON.stringify(userData) }),
  toggleUserAccess: (id) => request(`/users/${id}/access`, { method: 'PATCH' }),
  updateProfile: (id, data) => request(`/users/${id}/profile`, { method: 'PUT', body: JSON.stringify(data) }),
  updateCredentials: (id, data) => request(`/users/${id}/credentials`, { method: 'PUT', body: JSON.stringify(data) }),

  // Activities / Tracker
  getActivities: (params = '') => request(`/activities${params ? '?' + new URLSearchParams(params) : ''}`),
  addActivity: (act) => request('/activities', { method: 'POST', body: JSON.stringify(act) }),
  updateActivity: (id, updates) => request(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteActivity: (id) => request(`/activities/${id}`, { method: 'DELETE' }),
  deleteProjectActivities: (projectName) => request(`/activities/project/${encodeURIComponent(projectName)}`, { method: 'DELETE' }),

  // Timesheets
  getTimesheets: () => request('/timesheets'),
  syncTimesheets: (rows) => request('/timesheets', { method: 'PUT', body: JSON.stringify({ rows }) }),
  addTimesheetRow: (row) => request('/timesheets/row', { method: 'POST', body: JSON.stringify(row) }),
  deleteTimesheetRow: (id) => request(`/timesheets/row/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: () => request('/projects'),
  createProject: (project) => request('/projects', { method: 'POST', body: JSON.stringify(project) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Attendance
  getAttendance: () => request('/attendance'),
  clockIn: (data) => request('/attendance/clock-in', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getSharedReport: (token) => request(`/reports/shared/${token}`),
  getReportSummary: () => request('/reports/summary'),
};
