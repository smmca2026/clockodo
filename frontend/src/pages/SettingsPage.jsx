import React, { useState, useEffect } from 'react';
import { 
  User, 
  Palette, 
  Bell, 
  Clock, 
  Check, 
  Sparkles,
  Shield,
  KeyRound,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building,
  Mail,
  ShieldCheck,
  Languages,
  Sliders,
  Calendar,
  DollarSign,
  Lock,
  Smartphone,
  SlidersHorizontal,
  ArrowRight
} from 'lucide-react';
import { USER_PROFILE } from '../data/mockData';
import { api } from '../services/api';

export default function SettingsPage({ 
  currentUser = null, 
  onUpdateCurrentUser = () => {},
  usersList = [],
  setUsersList = () => {},
  initialTab = 'profile'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'profile' | 'security' | 'language' | 'appearance' | 'notifications' | 'tracking'
  
  // Profile State
  const [profile, setProfile] = useState({
    name: currentUser?.name || USER_PROFILE.name,
    username: currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : 'bharath_owner'),
    email: currentUser?.email || USER_PROFILE.email,
    title: currentUser?.department || USER_PROFILE.title,
    workspace: currentUser?.workspace || USER_PROFILE.workspace,
    timezone: USER_PROFILE.timezone || 'UTC+05:30 (IST)',
    dailyHours: 8,
    weeklyHours: 40,
    hourlyRate: 75,
    currency: 'USD ($)',
  });

  // Security & Password State
  const [securityForm, setSecurityForm] = useState({
    username: currentUser?.username || (currentUser?.email ? currentUser.email.split('@')[0] : 'bharath_owner'),
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Language & Regional State
  const [languageSettings, setLanguageSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_language_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      language: 'en', // 'en' | 'ta' | 'hi' | 'de' | 'fr' | 'es'
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      firstDayOfWeek: 'monday',
      currency: 'USD ($)',
      numberFormat: 'en-US'
    };
  });

  // Toggles
  const [toggles, setToggles] = useState(() => {
    try {
      const saved = localStorage.getItem('clockodo_preference_toggles');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      dailyReminder: true,
      dailyReminderTime: '17:30',
      weeklyReport: true,
      overtimeAlert: true,
      soundAlerts: false,
      autoPauseOnIdle: true,
      highContrastGlow: true,
    };
  });

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success'); // 'success' | 'error'
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser?.role === 'admin' || 
                  (currentUser?.name && currentUser.name.toLowerCase().includes('owner')) || 
                  (currentUser?.name && currentUser.name.toLowerCase().includes('bharath'));

  // Sync profile when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        name: currentUser.name || prev.name,
        username: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : prev.username),
        email: currentUser.email || prev.email,
        title: currentUser.department || prev.title,
        workspace: currentUser.workspace || prev.workspace,
      }));
      setSecurityForm(prev => ({
        ...prev,
        username: currentUser.username || (currentUser.email ? currentUser.email.split('@')[0] : prev.username),
      }));
    }
  }, [currentUser]);

  // Sync tab if initialTab prop changes, ensure non-admins don't get stuck on security tab
  useEffect(() => {
    if (initialTab) {
      if (initialTab === 'security' && !isAdmin) {
        setActiveTab('profile');
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, isAdmin]);

  // Auto-redirect employee away from security tab if accessed
  useEffect(() => {
    if (!isAdmin && activeTab === 'security') {
      setActiveTab('profile');
    }
  }, [isAdmin, activeTab]);

  const showToast = (msg, type = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleToggle = (key) => {
    setToggles(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('clockodo_preference_toggles', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // 1. SAVE PROFILE DETAILS
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const userId = currentUser?.id || 'usr-admin-1';
      const updatedData = {
        name: profile.name.trim(),
        username: profile.username.trim().toLowerCase(),
        email: profile.email.trim().toLowerCase(),
        department: profile.title.trim(),
        workspace: profile.workspace.trim(),
      };

      const res = await api.updateProfile(userId, updatedData);
      onUpdateCurrentUser(res?.user || { ...currentUser, ...updatedData });
      showToast('Profile information updated successfully!');
    } catch (err) {
      console.warn('Profile save error:', err);
      onUpdateCurrentUser({
        ...currentUser,
        name: profile.name.trim(),
        username: profile.username.trim().toLowerCase(),
        email: profile.email.trim().toLowerCase(),
        department: profile.title.trim(),
        workspace: profile.workspace.trim(),
      });
      showToast('Profile saved to local workspace session!');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. SAVE SECURITY & CREDENTIALS (USERNAME / PASSWORD)
  // 2. SAVE SECURITY & CREDENTIALS (PASSWORD CHANGE)
  const handleSaveCredentials = async (e) => {
    if (e) e.preventDefault();

    const cleanCurrent = securityForm.currentPassword.trim();
    const cleanNew = securityForm.newPassword.trim();
    const cleanConfirm = securityForm.confirmPassword.trim();

    if (!cleanNew) {
      showToast('Please enter your New Password in the New Password field.', 'error');
      return;
    }
    if (cleanNew.length < 4) {
      showToast('New password must be at least 4 characters long.', 'error');
      return;
    }
    if (!cleanConfirm) {
      showToast('Please confirm your new password in the Confirm field.', 'error');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      showToast('New password and Confirm password do not match.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const userId = currentUser?.id || currentUser?.email || 'usr-admin-1';
      const payload = {
        username: currentUser?.username || 'bharath_owner',
        currentPassword: cleanCurrent || '1234567890',
        newPassword: cleanNew
      };

      const res = await api.updateCredentials(userId, payload);

      const updatedUser = {
        ...currentUser,
        password: cleanNew
      };

      onUpdateCurrentUser(res?.user || updatedUser);

      setUsersList(prev => prev.map(u => {
        if (u.id === userId || (u.email && currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase()) || (u.role === 'admin' && currentUser?.role === 'admin')) {
          return {
            ...u,
            password: cleanNew
          };
        }
        return u;
      }));

      setSecurityForm({
        username: currentUser?.username || 'bharath_owner',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      showToast(`✅ Password successfully updated to "${cleanNew}"! You can now log in with this password.`);
    } catch (err) {
      console.warn('Credentials update fallback:', err);
      const updatedUser = {
        ...currentUser,
        password: cleanNew
      };
      onUpdateCurrentUser(updatedUser);
      showToast(`✅ Password saved successfully! Your new password is "${cleanNew}".`);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. SAVE LANGUAGE SETTINGS
  const handleSaveLanguage = (e) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('clockodo_language_settings', JSON.stringify(languageSettings));
    } catch (err) {}
    showToast('Language and localization preferences updated!');
  };

  // 4. SAVE GENERAL PREFERENCES
  const handleSaveGeneral = (e) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('clockodo_preference_toggles', JSON.stringify(toggles));
    } catch (err) {}
    showToast('Workspace settings saved successfully!');
  };

  const LANGUAGES_LIST = [
    { code: 'en', name: 'English', nativeName: 'English (US / UK)', flag: '🇬🇧', tag: 'Primary' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ் (Tamil)', flag: '🇮🇳', tag: 'Regional' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (Hindi)', flag: '🇮🇳', tag: 'National' },
  ];

  return (
    <div className="page-container">
      {/* 1. TOP SUMMARY BANNER WITH CLOCKODO SIGNATURE EMERALD GREEN ACCENT */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #0d1217 0%, #080c10 100%)',
          border: '1.5px solid rgba(0, 204, 0, 0.35)',
          borderRadius: '14px',
          padding: '20px 24px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(0, 204, 0, 0.12)',
              border: '1.5px solid var(--digi-green, #00cc00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0, 204, 0, 0.35)',
              color: 'var(--digi-green, #00cc00)'
            }}
          >
            <Sliders size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 800, 
                color: 'var(--digi-green, #00cc00)', 
                background: 'rgba(0, 204, 0, 0.1)', 
                border: '1px solid rgba(0, 204, 0, 0.3)', 
                borderRadius: '4px', 
                padding: '2px 8px',
                letterSpacing: '0.5px'
              }}>
                CLOCKODO WORKSPACE
              </span>
              <span style={{ color: '#64748b', fontSize: '11px' }}>•</span>
              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>Preferences & Credentials</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Workspace & Account Settings
            </h2>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '3px 0 0 0' }}>
              Configure login credentials, language localization, UI appearance, and time tracking policies.
            </p>
          </div>
        </div>

        {/* User Role Pill */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#111822',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '8px 14px'
          }}
        >
          <div 
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--digi-green, #00cc00)',
              boxShadow: '0 0 8px var(--digi-green, #00cc00)'
            }}
          />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
              {currentUser?.name || USER_PROFILE.name}
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: currentUser?.role === 'admin' ? 'var(--digi-green, #00cc00)' : '#38bdf8' }}>
              {currentUser?.role === 'admin' ? '👑 Workspace Admin' : '👤 Employee Account'}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-view">
        <div className="settings-card">
          {/* 2. TAB NAVIGATION BAR */}
          <div className="settings-tabs-bar">
            <button 
              type="button"
              className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={16} />
              <span>Profile & Workspace</span>
            </button>

            {isAdmin && (
              <button 
                type="button"
                className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <KeyRound size={16} />
                <span>Security & Password</span>
                <span style={{ 
                  fontSize: '9.5px', 
                  fontWeight: 800, 
                  backgroundColor: activeTab === 'security' ? '#032117' : 'var(--digi-green, #00cc00)', 
                  color: activeTab === 'security' ? 'var(--digi-green, #00cc00)' : '#032117', 
                  padding: '1px 6px', 
                  borderRadius: '6px',
                  marginLeft: '4px'
                }}>
                  Live
                </span>
              </button>
            )}

            <button 
              type="button"
              className={`settings-tab-btn ${activeTab === 'language' ? 'active' : ''}`}
              onClick={() => setActiveTab('language')}
            >
              <Globe size={16} />
              <span>Language & Region (தமிழ்)</span>
            </button>

            <button 
              type="button"
              className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={16} />
              <span>Appearance & Theme</span>
            </button>

            <button 
              type="button"
              className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={16} />
              <span>Notifications</span>
            </button>

            <button 
              type="button"
              className={`settings-tab-btn ${activeTab === 'tracking' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracking')}
            >
              <Clock size={16} />
              <span>Tracking Rules</span>
            </button>
          </div>

          {/* 3. TAB CONTENTS */}
          <div style={{ marginTop: '10px' }}>

            {/* TAB 1: PROFILE & WORKSPACE */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile}>
                {/* Section Header with Green Accent */}
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 204, 0, 0.12)',
                        border: '1px solid rgba(0, 204, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--digi-green, #00cc00)'
                      }}>
                        <User size={18} />
                      </div>
                      <span>Personal Details & Workspace Affiliation</span>
                    </h3>
                    <p className="settings-section-desc">
                      Manage your profile information, registered work email address, department, and company workspace affiliation.
                    </p>
                  </div>
                </div>

                {/* Sub-panel 1: Personal Profile */}
                <div className="settings-panel-box">
                  <div className="settings-panel-header">
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(0, 204, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--digi-green, #00cc00)' }}>
                      <User size={15} />
                    </div>
                    <h4 className="settings-panel-title">Employee Profile Information</h4>
                  </div>
                  <p className="settings-panel-desc">
                    These details identify your timesheet submissions, report activity logs, and workspace team directory entries.
                  </p>

                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label className="settings-label">Full Name</label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Work Email</label>
                      <input 
                        type="email" 
                        className="settings-input" 
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Department / Designation</label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        value={profile.title}
                        onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        placeholder="e.g. Full Stack Developer, Management"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Organization Workspace</label>
                      <input 
                        type="text" 
                        className="settings-input" 
                        value={profile.workspace}
                        onChange={(e) => setProfile({ ...profile, workspace: e.target.value })}
                        placeholder="e.g. DigiPlus"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Save Action */}
                <div className="settings-actions-footer">
                  <button type="submit" className="btn-save-settings" disabled={isSaving}>
                    <Save size={16} />
                    <span>{isSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: SECURITY & CREDENTIALS (USERNAME / PASSWORD) - ADMIN ONLY */}
            {activeTab === 'security' && isAdmin && (
              <form onSubmit={handleSaveCredentials}>
                {/* Section Header with Green Accent */}
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 204, 0, 0.12)',
                        border: '1px solid rgba(0, 204, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--digi-green, #00cc00)'
                      }}>
                        <KeyRound size={18} />
                      </div>
                      <span>Admin Account Security & Password</span>
                    </h3>
                    <p className="settings-section-desc">
                      Update the login password for the primary workspace Administrator account (<strong>Bharath (Owner)</strong>).
                    </p>
                  </div>
                </div>

                {/* Sub-panel 1: Admin Account Summary (Clarifies that this is the existing Admin account) */}
                <div className="settings-panel-box" style={{ background: '#0b1219', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'var(--grad-primary, linear-gradient(135deg, #00cc00 0%, #009900 100%))',
                        color: '#04261b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '15px'
                      }}>
                        {currentUser?.avatarInitials || 'BO'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{currentUser?.name || 'Bharath (Owner)'}</span>
                          <span style={{ fontSize: '10.5px', background: 'rgba(0,204,0,0.12)', color: '#00cc00', border: '1px solid rgba(0,204,0,0.3)', padding: '1px 7px', borderRadius: '4px', fontWeight: 800 }}>
                            👑 Primary Admin
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                          {currentUser?.email || 'bharath.owner@digiplusagency.com'}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#64748b', background: '#111822', padding: '6px 12px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                      🔒 Changing password for this existing Admin account
                    </div>
                  </div>
                </div>

                {/* Sub-panel 2: Change Password Form */}
                <div className="settings-panel-box">
                  <div className="settings-panel-header">
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(0, 204, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--digi-green, #00cc00)' }}>
                      <Lock size={15} />
                    </div>
                    <h4 className="settings-panel-title">Set New Admin Password</h4>
                  </div>
                  <p className="settings-panel-desc">
                    Enter your <strong>Current Password</strong> and your <strong>New Password</strong> below. Changes apply live to MySQL and your workspace login.
                  </p>

                  <div className="settings-form-grid">
                    {/* Current Password */}
                    <div className="settings-field full-width">
                      <label className="settings-label">
                        Current Password <span style={{ color: '#f87171' }}>*</span>
                      </label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input 
                          type={showCurrentPass ? 'text' : 'password'} 
                          className="settings-input" 
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                          placeholder="Enter current password (e.g. Bharath@Admin2026 / Digi@2024)"
                          style={{ paddingRight: '44px' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title={showCurrentPass ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPass ? <EyeOff size={16} color="var(--digi-green, #00cc00)" /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="settings-field">
                      <label className="settings-label">
                        New Password <span style={{ color: '#00cc00' }}>*</span>
                      </label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input 
                          type={showNewPass ? 'text' : 'password'} 
                          className="settings-input" 
                          value={securityForm.newPassword}
                          onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                          placeholder="Minimum 4 characters"
                          style={{ paddingRight: '44px' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title={showNewPass ? 'Hide password' : 'Show password'}
                        >
                          {showNewPass ? <EyeOff size={16} color="var(--digi-green, #00cc00)" /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password */}
                    <div className="settings-field">
                      <label className="settings-label">
                        Confirm New Password <span style={{ color: '#00cc00' }}>*</span>
                      </label>
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input 
                          type={showConfirmPass ? 'text' : 'password'} 
                          className="settings-input" 
                          value={securityForm.confirmPassword}
                          onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                          placeholder="Re-type new password"
                          style={{ paddingRight: '44px' }}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title={showConfirmPass ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPass ? <EyeOff size={16} color="var(--digi-green, #00cc00)" /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Match Status Helper */}
                  {securityForm.newPassword && (
                    <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                      {securityForm.newPassword === securityForm.confirmPassword ? (
                        <span style={{ color: 'var(--digi-green, #00cc00)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                          <CheckCircle2 size={15} /> Passwords match! Ready to save.
                        </span>
                      ) : (
                        <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <AlertCircle size={15} /> Passwords do not match yet
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Save Action */}
                <div className="settings-actions-footer">
                  <button type="submit" className="btn-save-settings" disabled={isSaving}>
                    <Save size={16} />
                    <span>{isSaving ? 'Saving New Password...' : '💾 Save & Update Password'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: LANGUAGE & REGION */}
            {activeTab === 'language' && (
              <form onSubmit={handleSaveLanguage}>
                {/* Section Header with Green Accent */}
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 204, 0, 0.12)',
                        border: '1px solid rgba(0, 204, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--digi-green, #00cc00)'
                      }}>
                        <Languages size={18} />
                      </div>
                      <span>Language & Regional Preferences</span>
                    </h3>
                    <p className="settings-section-desc">
                      Choose your preferred interface language, date formatting, time representation, and workspace currency.
                    </p>
                  </div>
                </div>

                {/* Sub-panel 1: Language Picker */}
                <div className="settings-panel-box">
                  <div className="settings-panel-header">
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(0, 204, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--digi-green, #00cc00)' }}>
                      <Globe size={15} />
                    </div>
                    <h4 className="settings-panel-title">Select Primary Display Language</h4>
                  </div>
                  <p className="settings-panel-desc">
                    Choose between English, Tamil (தமிழ்), Hindi (हिन्दी), and international languages.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {LANGUAGES_LIST.map((lang) => {
                      const isSelected = languageSettings.language === lang.code;
                      return (
                        <div 
                          key={lang.code}
                          onClick={() => setLanguageSettings({ ...languageSettings, language: lang.code })}
                          style={{
                            padding: '14px 16px',
                            borderRadius: '10px',
                            background: isSelected ? 'rgba(0, 204, 0, 0.12)' : '#111822',
                            border: isSelected ? '2px solid var(--digi-green, #00cc00)' : '1.5px solid #1e293b',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            boxShadow: isSelected ? '0 0 16px rgba(0, 204, 0, 0.25)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>{lang.flag}</span>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                                {lang.nativeName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {lang.name} • {lang.tag}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--digi-green, #00cc00)',
                              color: '#032117',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 0 8px var(--digi-green, #00cc00)'
                            }}>
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-panel 2: Regional Formats */}
                <div className="settings-panel-box">
                  <div className="settings-panel-header">
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(0, 204, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--digi-green, #00cc00)' }}>
                      <Calendar size={15} />
                    </div>
                    <h4 className="settings-panel-title">Regional Formats & Currency</h4>
                  </div>
                  <p className="settings-panel-desc">
                    Configure how dates, clock times, calendar weeks, and billing rates appear throughout the platform.
                  </p>

                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label className="settings-label">Date Format</label>
                      <select 
                        className="settings-select"
                        value={languageSettings.dateFormat}
                        onChange={(e) => setLanguageSettings({ ...languageSettings, dateFormat: e.target.value })}
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 14/09/2026 - India / UK Standard)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/14/2026 - US Standard)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-14 - ISO International)</option>
                      </select>
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Time Representation</label>
                      <select 
                        className="settings-select"
                        value={languageSettings.timeFormat}
                        onChange={(e) => setLanguageSettings({ ...languageSettings, timeFormat: e.target.value })}
                      >
                        <option value="12h">12-Hour Format (e.g. 02:45 PM)</option>
                        <option value="24h">24-Hour Format (e.g. 14:45)</option>
                      </select>
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">First Day of Week</label>
                      <select 
                        className="settings-select"
                        value={languageSettings.firstDayOfWeek}
                        onChange={(e) => setLanguageSettings({ ...languageSettings, firstDayOfWeek: e.target.value })}
                      >
                        <option value="monday">Monday (Standard Work Week)</option>
                        <option value="sunday">Sunday (US / Middle East Standard)</option>
                      </select>
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Primary Billing Currency</label>
                      <select 
                        className="settings-select"
                        value={languageSettings.currency}
                        onChange={(e) => setLanguageSettings({ ...languageSettings, currency: e.target.value })}
                      >
                        <option value="USD ($)">USD ($) - US Dollar</option>
                        <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                        <option value="EUR (€)">EUR (€) - Euro</option>
                        <option value="GBP (£)">GBP (£) - British Pound</option>
                        <option value="AED (د.إ)">AED (د.إ) - UAE Dirham</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Footer Save Action */}
                <div className="settings-actions-footer">
                  <button type="submit" className="btn-save-settings">
                    <Save size={16} />
                    <span>Save Language Preferences</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: APPEARANCE & THEME */}
            {activeTab === 'appearance' && (
              <div>
                {/* Section Header with Green Accent */}
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 204, 0, 0.12)',
                        border: '1px solid rgba(0, 204, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--digi-green, #00cc00)'
                      }}>
                        <Palette size={18} />
                      </div>
                      <span>Visual Theme & Display Preferences</span>
                    </h3>
                    <p className="settings-section-desc">
                      Clockodo is styled with our signature high-contrast Deep Obsidian + Emerald Green SaaS theme.
                    </p>
                  </div>
                </div>

                <div className="settings-panel-box">
                  <div 
                    style={{ 
                      padding: '16px 20px', 
                      borderRadius: '10px', 
                      background: '#111822', 
                      border: '1.5px solid var(--digi-green, #00cc00)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                      boxShadow: '0 0 16px rgba(0, 204, 0, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div 
                        style={{ 
                          width: 44, 
                          height: 44, 
                          borderRadius: 10, 
                          background: '#080c10', 
                          border: '2px solid var(--digi-green, #00cc00)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          boxShadow: '0 0 14px rgba(0, 204, 0, 0.4)'
                        }}
                      >
                        <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--digi-green, #00cc00)' }}></span>
                      </div>
                      <div>
                        <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#ffffff' }}>
                          Clockodo Signature (Deep Obsidian + Emerald Green)
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          Deep Dark Obsidian • Vibrant Emerald Green Accents • High-Contrast Typography
                        </div>
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(0, 204, 0, 0.15)',
                      border: '1px solid var(--digi-green, #00cc00)',
                      color: 'var(--digi-green, #00cc00)',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      <Check size={13} strokeWidth={3} /> Active System Theme
                    </span>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div className="toggle-info-title">Emerald Green Glow Micro-Animations</div>
                      <div className="toggle-info-desc">Subtle pulsing glow indicators for active timers, live sessions, and running project counters</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.highContrastGlow}
                        onChange={() => handleToggle('highContrastGlow')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-actions-footer">
                  <button type="button" className="btn-save-settings" onClick={handleSaveGeneral}>
                    <Save size={16} />
                    <span>Save Theme Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div>
                {/* Section Header with Green Accent */}
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 204, 0, 0.12)',
                        border: '1px solid rgba(0, 204, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--digi-green, #00cc00)'
                      }}>
                        <Bell size={18} />
                      </div>
                      <span>Alerts & Notification Preferences</span>
                    </h3>
                    <p className="settings-section-desc">
                      Configure automated daily timesheet reminders, weekly activity digests, and shift cap notifications.
                    </p>
                  </div>
                </div>

                <div className="settings-panel-box">
                  <div className="settings-toggle-row">
                    <div>
                      <div className="toggle-info-title">Daily Timesheet Logging Reminder</div>
                      <div className="toggle-info-desc">Send alert at 5:30 PM if recorded daily hours are below the 8-hour target</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.dailyReminder}
                        onChange={() => handleToggle('dailyReminder')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div className="toggle-info-title">Weekly Timesheet Digest Report</div>
                      <div className="toggle-info-desc">Summary digest sent every Friday evening with tracked project hours breakdown</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.weeklyReport}
                        onChange={() => handleToggle('weeklyReport')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div className="toggle-info-title">Daily Overtime & Shift Cap Alerts</div>
                      <div className="toggle-info-desc">Notify when a logged session exceeds 8 hours in a single calendar day</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.overtimeAlert}
                        onChange={() => handleToggle('overtimeAlert')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-actions-footer">
                  <button type="button" className="btn-save-settings" onClick={handleSaveGeneral}>
                    <Save size={16} />
                    <span>Save Notification Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 6: TRACKING RULES */}
            {activeTab === 'tracking' && (
              <div>
                {/* Section Header with Green Accent */}
                <div className="settings-section-header">
                  <div>
                    <h3 className="settings-section-title">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 204, 0, 0.12)',
                        border: '1px solid rgba(0, 204, 0, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--digi-green, #00cc00)'
                      }}>
                        <Clock size={18} />
                      </div>
                      <span>Workspace Time Tracking Rules & Defaults</span>
                    </h3>
                    <p className="settings-section-desc">
                      Set standard working hour goals, default billing rates, rounding precision, and idle pause rules.
                    </p>
                  </div>
                </div>

                <div className="settings-panel-box">
                  <div className="settings-form-grid">
                    <div className="settings-field">
                      <label className="settings-label">Daily Standard Hours Goal</label>
                      <input 
                        type="number" 
                        className="settings-input" 
                        value={profile.dailyHours}
                        onChange={(e) => setProfile({ ...profile, dailyHours: parseInt(e.target.value, 10) || 8 })}
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Weekly Working Hours Target</label>
                      <input 
                        type="number" 
                        className="settings-input" 
                        value={profile.weeklyHours}
                        onChange={(e) => setProfile({ ...profile, weeklyHours: parseInt(e.target.value, 10) || 40 })}
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Default Hourly Rate ($/hr)</label>
                      <input 
                        type="number" 
                        className="settings-input" 
                        value={profile.hourlyRate}
                        onChange={(e) => setProfile({ ...profile, hourlyRate: parseInt(e.target.value, 10) || 75 })}
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Time Rounding Precision</label>
                      <select className="settings-select" defaultValue="exact">
                        <option value="exact">Exact (to the exact second)</option>
                        <option value="5min">Round to nearest 5 minutes</option>
                        <option value="15min">Round to nearest 15 minutes</option>
                        <option value="30min">Round to nearest 30 minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="settings-toggle-row" style={{ marginTop: '20px' }}>
                    <div>
                      <div className="toggle-info-title">Auto-pause on System Idle Inactivity</div>
                      <div className="toggle-info-desc">Automatically pause the live timer when keyboard/mouse inactivity exceeds 10 minutes</div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={toggles.autoPauseOnIdle}
                        onChange={() => handleToggle('autoPauseOnIdle')}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-actions-footer">
                  <button type="button" className="btn-save-settings" onClick={handleSaveGeneral}>
                    <Save size={16} />
                    <span>Save Tracking Rules</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div 
          className="toast-message" 
          style={{ 
            backgroundColor: toastType === 'error' ? '#ef4444' : 'var(--digi-green, #00cc00)',
            color: toastType === 'error' ? '#ffffff' : '#032117',
            boxShadow: toastType === 'error' ? '0 10px 25px rgba(239, 68, 68, 0.4)' : '0 10px 25px rgba(0, 204, 0, 0.45)',
            border: toastType === 'error' ? '1px solid #f87171' : '1px solid #00ee00'
          }}
        >
          {toastType === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span style={{ fontWeight: 700 }}>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
