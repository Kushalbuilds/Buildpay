import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Phone,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';
import './AuthModal.css';

const USERS_STORAGE_KEY = 'buildpay-registered-users-v1';
const CURRENT_USER_KEY = 'buildpay-current-user-v1';

// Seed default admin account if not existing
const DEFAULT_ACCOUNTS = [
  {
    fullName: 'Builder Admin',
    username: 'admin',
    phone: '9876543210',
    password: 'admin',
    role: 'Administrator'
  }
];

export function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch {}
}

export default function AuthModal({ onLoginSuccess }) {
  // Mode: 'login' | 'signup'
  const [mode, setMode] = useState('login');

  // Login identifier selection mode: 'username' | 'phone' | 'both'
  const [loginMethod, setLoginMethod] = useState('username');

  // Form states for login
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPhone, setLoginPhone] = useState('9876543210');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states for signup
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const users = getStoredUsers();

    if (loginMethod === 'username') {
      if (!loginUsername.trim()) {
        setErrorMsg('Please enter your username');
        return;
      }
    } else if (loginMethod === 'phone') {
      if (!loginPhone.trim()) {
        setErrorMsg('Please enter your phone number');
        return;
      }
    } else if (loginMethod === 'both') {
      if (!loginUsername.trim() || !loginPhone.trim()) {
        setErrorMsg('Please enter both your username and phone number');
        return;
      }
    }

    if (!loginPassword) {
      setErrorMsg('Please enter your password');
      return;
    }

    // Match credentials
    const found = users.find((u) => {
      const matchPass = u.password === loginPassword;
      if (!matchPass) return false;

      if (loginMethod === 'username') {
        return u.username.toLowerCase() === loginUsername.trim().toLowerCase();
      } else if (loginMethod === 'phone') {
        const cleanPhone = u.phone.replace(/\D/g, '');
        const targetCleanPhone = loginPhone.replace(/\D/g, '');
        return cleanPhone === targetCleanPhone;
      } else {
        // both
        const cleanPhone = u.phone.replace(/\D/g, '');
        const targetCleanPhone = loginPhone.replace(/\D/g, '');
        return (
          u.username.toLowerCase() === loginUsername.trim().toLowerCase() &&
          cleanPhone === targetCleanPhone
        );
      }
    });

    if (!found) {
      setErrorMsg('Invalid login credentials. Please check details or sign up.');
      return;
    }

    setSuccessMsg(`Welcome back, ${found.fullName || found.username}!`);
    setCurrentUser(found);
    setTimeout(() => {
      onLoginSuccess(found);
    }, 500);
  };

  // Handle Signup Submit
  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupFullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!signupUsername.trim()) {
      setErrorMsg('Please choose an admin username');
      return;
    }
    if (signupUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters');
      return;
    }
    if (!signupPhone.trim()) {
      setErrorMsg('Please enter your 10-digit phone number');
      return;
    }
    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit phone number');
      return;
    }
    if (!signupPassword) {
      setErrorMsg('Please enter a password');
      return;
    }
    if (signupPassword.length < 4) {
      setErrorMsg('Password should be at least 4 characters');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    const users = getStoredUsers();

    // Check duplicate username or phone
    const usernameExists = users.some(
      (u) => u.username.toLowerCase() === signupUsername.trim().toLowerCase()
    );
    if (usernameExists) {
      setErrorMsg('This username is already registered. Please choose another or login.');
      return;
    }

    const phoneExists = users.some((u) => u.phone.replace(/\D/g, '') === cleanPhone);
    if (phoneExists) {
      setErrorMsg('This phone number is already registered. Please log in.');
      return;
    }

    const newUser = {
      fullName: signupFullName.trim(),
      username: signupUsername.trim(),
      phone: cleanPhone,
      password: signupPassword,
      role: 'Administrator'
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    setSuccessMsg('Registration successful! Logging you in...');
    setCurrentUser(newUser);

    setTimeout(() => {
      onLoginSuccess(newUser);
    }, 700);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card">
        {/* Header / Brand */}
        <div className="auth-header">
          <div className="auth-brand-badge">
            <Building2 className="brand-icon" size={26} />
            <span className="brand-dot"></span>
          </div>
          <h2 className="auth-title">BuildPay Admin Portal</h2>
          <p className="auth-subtitle">
            Secure Construction Finance & Payment Management System
          </p>

          {/* Mode Switch Tabs */}
          <div className="auth-mode-tabs" role="tablist">
            <button
              type="button"
              className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <LogIn size={16} />
              <span>Admin Login</span>
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <UserPlus size={16} />
              <span>New User Signup</span>
            </button>
          </div>
        </div>

        {/* Alert banners */}
        {errorMsg && (
          <div className="auth-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="auth-alert success" role="status">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ─── LOGIN FORM ─── */}
        {mode === 'login' ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="auth-selection-section">
              <label className="field-label">
                <span>Select Login Credential:</span>
                <span className="label-hint">Choose any 1 option</span>
              </label>
              <div className="credential-options">
                <button
                  type="button"
                  className={`credential-choice-pill ${
                    loginMethod === 'username' ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setLoginMethod('username');
                    setErrorMsg('');
                  }}
                >
                  <User size={15} />
                  <span>Username</span>
                </button>
                <button
                  type="button"
                  className={`credential-choice-pill ${
                    loginMethod === 'phone' ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setLoginMethod('phone');
                    setErrorMsg('');
                  }}
                >
                  <Phone size={15} />
                  <span>Phone Number</span>
                </button>
                <button
                  type="button"
                  className={`credential-choice-pill ${
                    loginMethod === 'both' ? 'selected' : ''
                  }`}
                  onClick={() => {
                    setLoginMethod('both');
                    setErrorMsg('');
                  }}
                >
                  <ShieldCheck size={15} />
                  <span>Both (Username & Phone)</span>
                </button>
              </div>
            </div>

            {/* Username Input if applicable */}
            {(loginMethod === 'username' || loginMethod === 'both') && (
              <div className="form-group">
                <label className="input-label" htmlFor="login-username">
                  Username
                </label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    id="login-username"
                    type="text"
                    className="auth-input"
                    placeholder="Enter admin username (e.g. admin)"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            {/* Phone Input if applicable */}
            {(loginMethod === 'phone' || loginMethod === 'both') && (
              <div className="form-group">
                <label className="input-label" htmlFor="login-phone">
                  Phone Number
                </label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input
                    id="login-phone"
                    type="tel"
                    className="auth-input"
                    placeholder="10-digit phone number (e.g. 9876543210)"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            {/* Password input with eye toggle functionality */}
            <div className="form-group">
              <div className="input-label-row">
                <label className="input-label" htmlFor="login-password">
                  Password
                </label>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  className="auth-input has-eye"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  title={showLoginPassword ? 'Hide password' : 'View password'}
                  aria-label={showLoginPassword ? 'Hide password' : 'View password'}
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="demo-hint-box">
              <Sparkles size={14} />
              <span>
                Default demo: <strong>admin</strong> (Phone: <strong>9876543210</strong>) / Pass: <strong>admin</strong>
              </span>
            </div>

            <button type="submit" className="auth-primary-btn">
              <span>Sign In to Admin Portal</span>
              <ArrowRight size={18} />
            </button>

            <div className="auth-footer-prompt">
              <span>Don't have an admin account?</span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                }}
              >
                Sign up here
              </button>
            </div>
          </form>
        ) : (
          /* ─── SIGNUP FORM ─── */
          <form className="auth-form" onSubmit={handleSignupSubmit}>
            <div className="form-group">
              <label className="input-label" htmlFor="signup-name">
                Full Name
              </label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  id="signup-name"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="input-label" htmlFor="signup-user">
                  Username
                </label>
                <div className="input-wrapper">
                  <User className="input-icon" size={18} />
                  <input
                    id="signup-user"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. ramesh_admin"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="signup-phone">
                  Phone Number
                </label>
                <div className="input-wrapper">
                  <Phone className="input-icon" size={18} />
                  <input
                    id="signup-phone"
                    type="tel"
                    className="auth-input"
                    placeholder="10-digit mobile"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Password input with view password eye functionality */}
            <div className="form-group">
              <label className="input-label" htmlFor="signup-password">
                Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="signup-password"
                  type={showSignupPassword ? 'text' : 'password'}
                  className="auth-input has-eye"
                  placeholder="Create strong password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  title={showSignupPassword ? 'Hide password' : 'View password'}
                  aria-label={showSignupPassword ? 'Hide password' : 'View password'}
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                >
                  {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password input with view password eye functionality */}
            <div className="form-group">
              <label className="input-label" htmlFor="signup-confirm-password">
                Confirm Password
              </label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  id="signup-confirm-password"
                  type={showSignupConfirmPassword ? 'text' : 'password'}
                  className="auth-input has-eye"
                  placeholder="Repeat your password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  title={showSignupConfirmPassword ? 'Hide password' : 'View password'}
                  aria-label={showSignupConfirmPassword ? 'Hide password' : 'View password'}
                  onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                >
                  {showSignupConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-primary-btn">
              <span>Register Admin Account</span>
              <ArrowRight size={18} />
            </button>

            <div className="auth-footer-prompt">
              <span>Already registered?</span>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
              >
                Sign in directly
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
