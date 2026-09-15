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

export default function SharedPublicReportPage({ 
  token = 'rpt_selva_4311b', 
  currentUser = null, 
  onBackToApp = null,
  onGoToLogin = null
}) {
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [restrictedModalTitle, setRestrictedModalTitle] = useState('Access Denied: Cannot Access or Modify This Page');
  const [restrictedModalMsg, setRestrictedModalMsg] = useState(
    'Do Not Access / Modify This Page: You are viewing a Shared Public Link. Adding or modifying work details is strictly restricted. Only authorized admins and active employees in the main workspace can add work logs.'
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [inputTaskName, setInputTaskName] = useState('');
  const [inputDuration, setInputDuration] = useState('02:00:00');

  // Predefined shared report datasets based on token
  const reportData = useMemo(() => {
    if (token.includes('jrks')) {
      return {
        id: 'sr-1',
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
          { id: 3, date: 'Tue, Sep 1, 2026', task: 'Logistics ledger calculation & voucher entries', user: 'Ariharasudhan', duration: '05:30:00', billable: true },
          { id: 4, date: 'Tue, Sep 1, 2026', task: 'Client review meeting & sprint planning', user: 'Bharath (Owner)', duration: '02:00:00', billable: true },
          { id: 5, date: 'Mon, Aug 31, 2026', task: 'Trip sheet automated billing logic', user: 'Aishwarya', duration: '06:15:00', billable: true },
        ]
      };
    } else if (token.includes('exec')) {
      return {
        id: 'sr-3',
        title: 'DigiPlus Executive Summary Report',
        client: 'DigiPlusAgency',
        projectName: 'A2z4r.com & Operations',
        projectColor: '#10b981',
        period: 'Last Month (August 2026)',
        totalHours: '140:58:00',
        totalBillable: '140:58:00',
        billableRate: '$85 / hr',
        totalAmount: '$11,982.30',
        createdDate: 'August 25, 2026',
        leadName: 'Bharath (Executive)',
        entries: [
          { id: 1, date: 'Fri, Aug 28, 2026', task: 'Enterprise architecture review', user: 'Bharath', duration: '08:00:00', billable: true },
          { id: 2, date: 'Thu, Aug 27, 2026', task: 'Client performance metrics audit', user: 'balaji', duration: '07:30:00', billable: true },
          { id: 3, date: 'Wed, Aug 26, 2026', task: 'Infrastructure scaling and optimization', user: 'Ariharasudhan', duration: '08:15:00', billable: true },
        ]
      };
    } else {
      // Default: Selva Chit App / Custom Report
      return {
        id: 'sr-2',
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
          { id: 2, date: 'Wed, Sep 2, 2026', task: 'Customer receipt print format and styling', user: 'Aishwarya', duration: '01:30:00', billable: true },
          { id: 3, date: 'Tue, Sep 1, 2026', task: 'Daily collection transaction sync API', user: 'Ariharasudhan', duration: '05:40:00', billable: true },
          { id: 4, date: 'Tue, Sep 1, 2026', task: 'Auction ledger automation & balance sheet', user: 'Karthick Raja', duration: '04:15:00', billable: true },
          { id: 5, date: 'Mon, Aug 31, 2026', task: 'Mobile app chit group bidding interface', user: 'bavithra', duration: '06:45:00', billable: true },
        ]
      };
    }
  }, [token]);

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
    setRestrictedModalMsg('Do Not Access / Modify This Page: You are viewing a Shared Public Link. Adding or modifying work details is strictly restricted. Only authorized admins and active employees in the main workspace can add work logs.');
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
    <div className="page-container">
      {/* Top Banner Toolbar */}
      <div className="reports-summary-banner" style={{ marginBottom: '20px', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={handleBackClick}
            className="reports-icon-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px', height: '32px', fontSize: '12px', fontWeight: 600, color: '#475569' }}
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
            padding: '4px 10px',
            fontSize: '11px',
            color: '#00cc00',
            fontWeight: 700
          }}>
            <span style={{
              width: '6px',
              height: '6px',
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
            style={{ display: 'flex', alignItems: 'center', gap: '6px', width: 'auto', padding: '0 12px', height: '32px', fontSize: '12px', fontWeight: 600 }}
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
              padding: '6px 14px',
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

          {/* Total Highlight */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1.5px solid rgba(0, 204, 0, 0.3)',
            borderRadius: '10px',
            padding: '14px 20px',
            textAlign: 'right',
            minWidth: '180px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL TRACKED TIME
            </span>
            <div style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#008a00',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              marginTop: '4px'
            }}>
              {reportData.totalHours}
            </div>
            <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>
              100% Billable Deliverable
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="attendance-kpi-grid" style={{ marginBottom: '20px' }}>
        <div className="attendance-kpi-item">
          <span className="attendance-kpi-label">Total Hours</span>
          <div className="attendance-kpi-val" style={{ color: '#00cc00' }}>
            {reportData.totalHours}
          </div>
          <span className="attendance-kpi-sub">Verified Work Duration</span>
        </div>

        <div className="attendance-kpi-item">
          <span className="attendance-kpi-label">Total Tasks</span>
          <div className="attendance-kpi-val">
            {reportData.entries.length} Entries
          </div>
          <span className="attendance-kpi-sub">Logged across sprint</span>
        </div>

        <div className="attendance-kpi-item">
          <span className="attendance-kpi-label">Billable Rate</span>
          <div className="attendance-kpi-val" style={{ color: '#2563eb' }}>
            {reportData.billableRate}
          </div>
          <span className="attendance-kpi-sub">Standard agreed rate</span>
        </div>

        <div className="attendance-kpi-item">
          <span className="attendance-kpi-label">Total Financial</span>
          <div className="attendance-kpi-val" style={{ color: '#059669' }}>
            {reportData.totalAmount}
          </div>
          <span className="attendance-kpi-sub">Estimated Milestone Invoice</span>
        </div>
      </div>

      {/* Detailed Work Activities Table with Add Work Entry Button */}
      <div className="reports-detailed-card">
        <div className="detailed-header-bar">
          <div className="detailed-header-title">
            <Layers size={16} color="#00cc00" />
            <span>Itemized Work & Time Breakdown</span>
            <span className="detailed-count-badge">{reportData.entries.length} Logs</span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-clockify-apply"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px' }}
          >
            <Plus size={14} />
            <span>{showAddForm ? 'Close Entry Form' : '+ Add Work Entry'}</span>
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
                    cursor: 'pointer'
                  }}
                >
                  <span>Proceed & Add Log</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="clockodo-detailed-table-wrapper">
          <table className="clockodo-detailed-table">
            <thead>
              <tr>
                <th style={{ width: '140px' }}>DATE</th>
                <th style={{ width: '180px' }}>TEAM MEMBER</th>
                <th>WORK DESCRIPTION / DELIVERABLE</th>
                <th style={{ width: '120px', textAlign: 'right' }}>DURATION</th>
                <th style={{ width: '120px', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {reportData.entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="detailed-date-cell">{entry.date}</td>
                  <td>
                    <div className="detailed-user-cell">
                      <div className="detailed-user-avatar" style={{ background: '#00cc00', color: '#ffffff' }}>
                        {entry.user.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="detailed-user-name">{entry.user}</span>
                    </div>
                  </td>
                  <td className="detailed-desc-cell">{entry.task}</td>
                  <td className="detailed-duration-cell" style={{ textAlign: 'right' }}>
                    {entry.duration}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="detailed-billable-badge">
                      ✓ Billable
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ACCESS DENIED POPUP MODAL */}
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
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            border: '1px solid #fecaca',
            overflow: 'hidden'
          }}>
            {/* Modal Top Red Alert Bar */}
            <div style={{
              padding: '18px 24px',
              backgroundColor: '#18181b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '2px solid #ef4444'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1.5px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShieldAlert size={20} color="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
                    {restrictedModalTitle}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 600 }}>
                    🚫 Access Restricted to Authorized Staff Only
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRestrictedModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <Ban size={22} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: '#991b1b', lineHeight: 1.5 }}>
                  <strong>Do Not Access / Modify This Page:</strong>
                  <div style={{ marginTop: '4px' }}>
                    {restrictedModalMsg}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 22px 0' }}>
                This is a secure company workspace. If you are an authorized developer, lead, or admin, please log in with your company credentials in the main workspace to add and manage tasks.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowRestrictedModal(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Dismiss & Stay on Read-Only
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRestrictedModal(false);
                    if (onGoToLogin) {
                      onGoToLogin();
                    } else if (onBackToApp) {
                      onBackToApp();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
                  }}
                >
                  <LogIn size={15} />
                  <span>Sign In as Admin / Staff</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
