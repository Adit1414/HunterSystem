/**
 * Signup Page
 * Solo Leveling themed registration screen
 */

import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Auth.css';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(4, strength);
  }, [password]);

  const strengthLabel = ['', 'weak', 'weak', 'medium', 'strong'][passwordStrength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError.message);
      } else if (data?.user?.identities?.length === 0) {
        setError('An account with this email already exists.');
      } else {
        // Check if email confirmation is required
        if (data?.user && !data?.session) {
          setSuccess(true);
        } else {
          // Auto-confirmed, redirect to dashboard
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-logo">⚔ Hunter System ⚔</div>
              <h1 className="auth-title">Awakening Initiated</h1>
            </div>
            <div className="auth-success">
              <span className="auth-success-icon">✉️</span>
              <strong>Check your email!</strong>
              <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                We've sent a confirmation link to <strong>{email}</strong>. 
                Click it to complete your registration and begin your journey.
              </p>
            </div>
            <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
              <p>Already confirmed? <Link to="/login">Log in</Link></p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">⚔ Hunter System ⚔</div>
            <h1 className="auth-title">Begin Your Awakening</h1>
            <p className="auth-subtitle">Create an account to start your hunter journey</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="auth-field">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                placeholder="hunter@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              {password && (
                <div className="password-strength">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`password-strength-bar ${level <= passwordStrength ? `active ${strengthLabel}` : ''}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <><span className="auth-spinner"></span> Creating Account...</>
              ) : (
                'Awaken as a Hunter'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already a hunter? <Link to="/login">Log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
