import React, { useState } from 'react';
import { 
  Clock, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  UserPlus,
  LogIn,
  ArrowLeft,
  Building
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginPage({ usersList = [], onLogin, onRegister }) {
  const [viewMode, setViewMode] = useState('login'); // 'login' | 'register'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Register / Request Access State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Full Stack');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    const cleanInput = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    // 1. Try Backend MySQL Login first
    try {
      const res = await api.login({
        email: cleanInput,
        username: cleanInput,
        password: cleanPass
      });

      if (res) {
        setLoading(false);
        if (res.success && res.user) {
          setSuccessMessage(`Welcome back, ${res.user.name}! Logging you in...`);
          setTimeout(() => {
            onLogin(res.user);
          }, 300);
          return;
        } else {
          // Backend returned error (Incorrect password, pending approval, etc.)
          setErrorMessage(res.message || 'Incorrect email or password. Please try again.');
          return;
        }
      }
    } catch (err) {
      console.warn('Backend login request error:', err.message);
    }

    // 2. Offline Fallback ONLY when backend server is completely unreachable (res is null)
    setLoading(false);
    const user = usersList.find(u => 
      (u.email && u.email.toLowerCase() === cleanInput) ||
      (u.username && u.username.toLowerCase() === cleanInput) ||
      (u.role === 'admin' && (cleanInput === 'admin' || cleanInput.includes('bharath')))
    );

    if (!user) {
      setErrorMessage('Account not found with this email / username. Click "Request Access" below to register.');
      return;
    }

    const expectedUserPass = (user.password || '').trim();
    const isExact = expectedUserPass && expectedUserPass === cleanPass;
    const isCase = expectedUserPass && expectedUserPass.toLowerCase() === cleanPass.toLowerCase();
    const isUserPassMatch = isExact || isCase;

    if (!isUserPassMatch) {
      setErrorMessage('Incorrect password. Please try again.');
      return;
    }

    if (user.role !== 'admin' && (user.active === false || user.active === 0 || user.accessGranted === false)) {
      setErrorMessage('🔒 Your account is currently Pending Admin Approval. Please contact Administrator (Bharath) to grant access.');
      return;
    }

    setSuccessMessage(`Welcome back, ${user.name}! Logging you in...`);
    setTimeout(() => {
      onLogin(user);
    }, 300);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);

    const payload = {
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      department: regDepartment,
      password: regPassword.trim()
    };

    try {
      // Direct call to MySQL register endpoint
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      setLoading(false);

      if (data.success && data.user) {
        if (onRegister) onRegister(data.user);
        setSuccessMessage(`✅ Access Request Submitted for ${regName}! Your account is pending approval by Administrator (Bharath).`);
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        setTimeout(() => {
          setViewMode('login');
        }, 3000);
      } else {
        setErrorMessage(data.message || 'Error submitting access request. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      // Local fallback
      const newUser = {
        id: `usr-${Date.now()}`,
        name: regName.trim(),
        username: regEmail.split('@')[0],
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role: 'employee',
        department: regDepartment,
        active: false,
        accessGranted: false,
        avatarInitials: regName.substring(0, 2).toUpperCase(),
        avatarColor: '#3b82f6',
        workspace: 'DigiPlus'
      };
      if (onRegister) onRegister(newUser);
      setSuccessMessage(`✅ Access Request Submitted for ${regName}! Your account is pending approval by Administrator (Bharath).`);
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setTimeout(() => {
        setViewMode('login');
      }, 3000);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card-wrapper">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-logo">
            <div className="login-logo-icon">
              <Clock size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div className="login-logo-text">
              <span>CLOCK</span><span style={{ color: '#00cc00' }}>ODO</span>
            </div>
          </div>
          <p className="login-brand-tagline">
            DigiPlus Workspace • Operations & Time Tracking
          </p>
        </div>

        {/* Alert Messages */}
        {errorMessage && (
          <div className="login-alert-banner error">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="login-alert-banner success">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN FORM */}
        {viewMode === 'login' ? (
          <form className="login-form" onSubmit={handleLoginSubmit}>
            <div className="login-input-group">
              <label className="login-label">Email Address / Username</label>
              <div className="login-input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="text"
                  className="login-input"
                  placeholder="name@digiplusagency.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">Password</label>
              <div className="login-input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              <span>{loading ? 'Verifying...' : 'Enter Workspace'}</span>
              <ArrowRight size={16} />
            </button>

            {/* Bottom New Employee Request Access Link */}
            <div style={{
              marginTop: '18px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}>
              <button
                type="button"
                onClick={() => {
                  setViewMode('register');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#00cc00',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <UserPlus size={14} />
                <span>New employee? Request Access →</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW 2: REQUEST ACCESS FORM */
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '14px', textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
                Request Workspace Access
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                Fill your details to register as a new team member
              </p>
            </div>

            <div className="login-input-group">
              <label className="login-label">Full Name</label>
              <div className="login-input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  className="login-input"
                  placeholder="e.g. Sridhar Raman"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">Work Email</label>
              <div className="login-input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  type="email"
                  className="login-input"
                  placeholder="sridhar@digiplusagency.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-input-group">
              <label className="login-label">Department / Group</label>
              <select
                className="login-select"
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
              >
                <option value="Frontend Dev">Frontend Dev</option>
                <option value="Backend Engineering">Backend Engineering</option>
                <option value="Full Stack">Full Stack</option>
                <option value="Mobile Apps">Mobile Apps</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Design & UI">Design & UI</option>
                <option value="DevOps & Cloud">DevOps & Cloud</option>
              </select>
            </div>

            <div className="login-input-group">
              <label className="login-label">Create Password</label>
              <div className="login-input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="At least 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="login-info-box">
              🔒 <strong>Approval Notice:</strong> After submitting, your profile is saved to MySQL database with <em>Pending Admin Approval</em>. Admin (Bharath) can grant access in the Team page.
            </div>

            <button type="submit" className="login-submit-btn" disabled={loading}>
              <span>{loading ? 'Submitting...' : 'Submit Access Request →'}</span>
            </button>

            {/* Back to Sign In button */}
            <div style={{
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textAlign: 'center'
            }}>
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={14} />
                <span>Already registered? Back to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="login-card-footer">
          <span>Protected by DigiPlus Enterprise Security • MySQL Backend</span>
        </div>
      </div>
    </div>
  );
}
