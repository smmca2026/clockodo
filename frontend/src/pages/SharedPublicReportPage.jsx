import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Printer, 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText,
  Calendar,
  Layers,
  ArrowLeft,
  Lock,
  AlertTriangle,
  X,
  LogIn,
  Plus,
  Ban,
  ShieldAlert,
  Globe
} from 'lucide-react';

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

export default function SharedPublicReportPage({ 
  token = 'rpt_live_workspace', 
  currentUser = null, 
  activities = [],
  projects = [],
  timesheetRows = [],
  onBackToApp = null,
  onGoToLogin = null
}) {
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [restrictedModalTitle, setRestrictedModalTitle] = useState('Access Denied: Cannot Modify This Page');
  const [restrictedModalMsg, setRestrictedModalMsg] = useState(
    'Do Not Access / Modify This Page: You are viewing a Shared Public Link. Adding or modifying work details is strictly restricted. Only authorized workspace administrators and logged-in employees can manage work logs.'
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [inputTaskName, setInputTaskName] = useState('');
  const [inputDuration, setInputDuration] = useState('02:00:00');

  // Dynamic report dataset derived from REAL workspace activities and saved reports
  const reportData = useMemo(() => {
    // Determine effective live activities list
    let effectiveActivities = Array.isArray(activities) && activities.length > 0 ? activities : [];
    if (effectiveActivities.length === 0) {
      try {
        const saved = localStorage.getItem('clockodo_activities_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            effectiveActivities = parsed;
          }
        }
      } catch (e) {}
    }

    // Check if report was configured in saved shared reports
    let savedReport = null;
    try {
      const savedList = localStorage.getItem('clockodo_shared_reports_v2');
      if (savedList) {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed)) {
          savedReport = parsed.find(r => r.linkToken === token || r.id === token);
        }
      }
    } catch (e) {}

    const sourceEntries = (savedReport && savedReport.entries && savedReport.entries.length > 0) 
      ? savedReport.entries 
      : effectiveActivities;

    let totalSec = 0;
    const mappedEntries = (sourceEntries && sourceEntries.length > 0) ? sourceEntries.map((a, idx) => {
      const sec = a.durationSeconds || parseTimeToSeconds(a.durationFormatted || a.duration || a.time || '01:00:00');
      totalSec += sec;
      const userName = (a.user || a.userName || a.member || currentUser?.name || 'DigiPlus Team').trim();
      return {
        id: a.id || idx + 1,
        date: a.date || a.group || 'Thu, Sep 17, 2026',
        task: a.task || a.description || a.taskName || 'Live Workspace Deliverable Task',
        user: userName,
        duration: a.durationFormatted || a.duration || formatSecondsToHMS(sec),
        project: a.project || savedReport?.client || 'DigiPlus Logistics Platform',
        billable: true
      };
    }) : [
      {
        id: 1,
        date: 'Thu, Sep 17, 2026',
        task: 'Live Timesheet and Work Deliverables System Implementation',
        user: currentUser?.name || 'Mani',
        duration: '06:35:00',
        project: 'JRKS Logistics Platform',
        billable: true
      }
    ];

    if (sourceEntries.length === 0) {
      totalSec = parseTimeToSeconds('06:35:00');
    }

    const totalHoursStr = formatSecondsToHMS(totalSec);
    const hourlyRate = 85;
    const calculatedAmount = ((totalSec / 3600) * hourlyRate).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const reportTitle = savedReport?.name || 'JRKS Logistics - Milestone Deliverables Report';
    const clientName = savedReport?.client || 'JRKS Digital India Logistics LLP';
    const projectName = savedReport?.client || 'Logistics & Dispatch System';
    const periodStr = savedReport?.period || 'This week (Sep 14 - Sep 20, 2026)';
    const leadName = 'Punitha (Admin)';

    return {
      id: savedReport?.id || token,
      title: reportTitle,
      client: clientName,
      projectName: projectName,
      leadName: leadName,
      projectColor: '#00cc00',
      period: periodStr,
      totalHours: totalHoursStr,
      totalBillable: totalHoursStr,
      billableRate: `$${hourlyRate} / hr`,
      totalAmount: `$${calculatedAmount}`,
      entries: mappedEntries
    };
  }, [token, activities, currentUser]);

  // Back to App navigation
  const handleBackClick = () => {
    if (onBackToApp) {
      onBackToApp();
    } else {
      window.location.hash = '';
      window.location.pathname = '/';
    }
  };

  // Add work entry click - ALWAYS trigger Access Denied modal
  const handleProceedAddWork = (e) => {
    e?.preventDefault();
    setRestrictedModalTitle('Access Denied: Cannot Add or Modify Work Details');
    setRestrictedModalMsg('Do Not Access / Modify This Page: You are viewing a Shared Public Link. Adding or modifying work details is strictly restricted. Only authorized workspace administrators and logged-in employees can manage work logs.');
    setShowRestrictedModal(true);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Project', 'Client', 'Task / Description', 'Team Member', 'Duration', 'Billable']
    ];
    reportData.entries.forEach(e => {
      rows.push([
        `"${e.date}"`,
        `"${reportData.projectName}"`,
        `"${reportData.client}"`,
        `"${e.task}"`,
        `"${e.user}"`,
        `"${e.duration}"`,
        `"${e.billable ? 'Yes' : 'No'}"`
      ]);
    });
    const csvString = rows.map(r => r.join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportData.projectName.replace(/\s+/g, '_')}_shared_report.csv`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  };

  return (
    <div className="page-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Top Banner Toolbar */}
      <div className="reports-summary-banner" style={{ marginBottom: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleBackClick}
            className="reports-icon-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 14px', height: '34px', fontSize: '12px', fontWeight: 700, color: '#475569', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
            title="Return to workspace"
          >
            <ArrowLeft size={14} />
            <span>Back to Workspace</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 204, 0, 0.1)',
            border: '1px solid rgba(0, 204, 0, 0.3)',
            borderRadius: '20px',
            padding: '5px 12px',
            fontSize: '11px',
            color: '#008a00',
            fontWeight: 800
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#00cc00',
              display: 'inline-block'
            }}></span>
            <span>Live Shared Public Portal (Read-Only)</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            className="reports-icon-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px', height: '34px', fontSize: '12px', fontWeight: 600, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#00cc00',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Top Report Header Card */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: reportData.projectColor
              }}></span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {reportData.client} • {reportData.projectName}
              </span>
            </div>

            <h1 style={{ margin: '0 0 10px 0', fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {reportData.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="#00cc00" />
                <strong>Period:</strong> {reportData.period}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={14} color="#00cc00" />
                <strong>Verified Lead:</strong> {reportData.leadName}
              </span>
            </div>
          </div>

          {/* Total Tracked Time Highlight */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid rgba(0, 204, 0, 0.3)',
            borderRadius: '10px',
            padding: '14px 24px',
            textAlign: 'right',
            minWidth: '200px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL TRACKED TIME
            </span>
            <div style={{
              fontSize: '26px',
              fontWeight: 900,
              color: '#008a00',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              marginTop: '4px'
            }}>
              {reportData.totalHours}
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
              100% Billable Deliverable
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="attendance-kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div className="attendance-kpi-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <span className="attendance-kpi-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Hours</span>
          <div className="attendance-kpi-val" style={{ color: '#00cc00', fontSize: '24px', fontWeight: 800, margin: '6px 0 2px 0', fontFamily: 'var(--font-mono)' }}>
            {reportData.totalHours}
          </div>
          <span className="attendance-kpi-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Verified Work Duration</span>
        </div>

        <div className="attendance-kpi-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <span className="attendance-kpi-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Tasks</span>
          <div className="attendance-kpi-val" style={{ color: '#0f172a', fontSize: '24px', fontWeight: 800, margin: '6px 0 2px 0' }}>
            {reportData.entries.length} Entries
          </div>
          <span className="attendance-kpi-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Logged across sprint</span>
        </div>

        <div className="attendance-kpi-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <span className="attendance-kpi-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Billable Rate</span>
          <div className="attendance-kpi-val" style={{ color: '#2563eb', fontSize: '24px', fontWeight: 800, margin: '6px 0 2px 0' }}>
            {reportData.billableRate}
          </div>
          <span className="attendance-kpi-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Standard agreed rate</span>
        </div>

        <div className="attendance-kpi-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <span className="attendance-kpi-label" style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Financial</span>
          <div className="attendance-kpi-val" style={{ color: '#059669', fontSize: '24px', fontWeight: 800, margin: '6px 0 2px 0' }}>
            {reportData.totalAmount}
          </div>
          <span className="attendance-kpi-sub" style={{ fontSize: '11px', color: '#94a3b8' }}>Estimated Milestone Invoice</span>
        </div>
      </div>

      {/* Detailed Work Activities Table with Add Work Entry Button */}
      <div className="reports-detailed-card" style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div className="detailed-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div className="detailed-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            <Layers size={16} color="#00cc00" />
            <span>Itemized Work & Time Breakdown</span>
            <span className="detailed-count-badge" style={{ background: '#00cc00', color: '#ffffff', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
              {reportData.entries.length} Logs
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-clockify-apply"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', fontSize: '12px', background: '#00cc00', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Close Form' : '+ Add Work Entry'}</span>
          </button>
        </div>

        {/* Interactive Add Work Form */}
        {showAddForm && (
          <div style={{
            backgroundColor: '#f8fafc',
            padding: '16px 20px',
            borderBottom: '1px solid #cbd5e1'
          }}>
            <form onSubmit={handleProceedAddWork} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Work Deliverable / Task Description
                </label>
                <input
                  type="text"
                  value={inputTaskName}
                  onChange={(e) => setInputTaskName(e.target.value)}
                  placeholder="e.g. Updated challan record payable field verification..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ width: '130px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Duration (hh:mm:ss)
                </label>
                <input
                  type="text"
                  value={inputDuration}
                  onChange={(e) => setInputDuration(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div style={{ marginTop: '18px' }}>
                <button
                  type="submit"
                  className="btn-clockify-apply"
                  style={{
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: '#00cc00',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  <span>Proceed & Add Log</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="clockodo-detailed-table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="clockodo-detailed-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', textAlign: 'left' }}>
                <th style={{ width: '150px', padding: '12px 16px', fontWeight: 700 }}>DATE</th>
                <th style={{ width: '180px', padding: '12px 16px', fontWeight: 700 }}>TEAM MEMBER</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>WORK DESCRIPTION / DELIVERABLE</th>
                <th style={{ width: '120px', padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>DURATION</th>
                <th style={{ width: '120px', padding: '12px 16px', fontWeight: 700, textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {reportData.entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td className="detailed-date-cell" style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                    {entry.date}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className="detailed-user-cell" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="detailed-user-avatar" style={{ background: '#00cc00', color: '#ffffff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                        {entry.user.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="detailed-user-name" style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        {entry.user}
                      </span>
                    </div>
                  </td>
                  <td className="detailed-desc-cell" style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                    {entry.task}
                  </td>
                  <td className="detailed-duration-cell" style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#008a00', fontSize: '13px' }}>
                    {entry.duration}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <span className="detailed-billable-badge" style={{ background: 'rgba(0, 204, 0, 0.1)', color: '#008a00', border: '1px solid rgba(0, 204, 0, 0.3)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                      ✓ Billable
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACCESS RESTRICTION MODAL */}
      {showRestrictedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '1.5px solid #fee2e2'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <ShieldAlert size={30} color="#dc2626" />
            </div>

            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>
              {restrictedModalTitle}
            </h3>

            <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              {restrictedModalMsg}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowRestrictedModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Understood / Close
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowRestrictedModal(false);
                  if (onGoToLogin) {
                    onGoToLogin();
                  } else {
                    window.location.hash = '';
                    window.location.pathname = '/';
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#00cc00',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={15} />
                <span>Go to Workspace Login</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
