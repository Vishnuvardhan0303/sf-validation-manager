import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try { await login(); }
    catch (e) { setLoading(false); }
  };

  return (
    <div style={styles.wrapper}>
      {/* Background grid */}
      <div style={styles.grid} />
      {/* Glow orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.card} className="animate-fade-up">
        {/* Logo */}
        <div style={styles.logoWrap}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="14" fill="url(#lg)" />
            <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 30L20 24L26 30L32 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 style={styles.title}>SF Validation<br/>Manager</h1>
        <p style={styles.sub}>Manage Salesforce Account validation rules with live toggle and deploy — powered by PKCE OAuth 2.0</p>

        <div style={styles.features}>
          {['OAuth 2.0 PKCE flow', 'Tooling API integration', 'Live toggle & deploy'].map(f => (
            <div key={f} style={styles.featureItem}>
              <span style={styles.featureDot} />
              <span>{f}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.target.style.transform = 'translateY(0)')}
        >
          {loading ? (
            <span style={styles.spinnerWrap}>
              <span style={styles.spinner} />
              Connecting…
            </span>
          ) : (
            <>
              <SalesforceIcon />
              Connect to Salesforce
            </>
          )}
        </button>

        <p style={styles.note}>
          You'll be redirected to Salesforce to authorize access. No passwords are stored.
        </p>
      </div>
    </div>
  );
}

function SalesforceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
      <path d="M10 6.5C10 4.57 11.57 3 13.5 3C14.89 3 16.1 3.78 16.74 4.93C17.23 4.66 17.8 4.5 18.4 4.5C20.39 4.5 22 6.11 22 8.1C22 10.09 20.39 11.7 18.4 11.7H6C4.34 11.7 3 10.36 3 8.7C3 7.07 4.3 5.75 5.92 5.7C5.63 5.2 5.46 4.62 5.46 4C5.46 2.34 6.8 1 8.46 1C9.33 1 10.11 1.37 10.67 1.96" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 12V21M8 17L12 21L16 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    zIndex: 0,
  },
  orb1: {
    position: 'absolute', top: '15%', left: '10%',
    width: 400, height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
    filter: 'blur(40px)',
    zIndex: 0,
  },
  orb2: {
    position: 'absolute', bottom: '15%', right: '10%',
    width: 300, height: 300,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
    filter: 'blur(40px)',
    zIndex: 0,
  },
  card: {
    position: 'relative', zIndex: 1,
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '48px 40px',
    width: '100%', maxWidth: 460,
    boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: 24 },
  title: {
    fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em',
    lineHeight: 1.15, marginBottom: 16,
    background: 'linear-gradient(135deg, #f0f0f8 0%, #a5a5c8 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  sub: {
    color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 28,
  },
  features: {
    display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32,
    textAlign: 'left', padding: '20px 24px',
    background: 'var(--bg-3)', borderRadius: 12,
    border: '1px solid var(--border)',
  },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    fontSize: '0.85rem', color: 'var(--text-muted)',
  },
  featureDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: 'var(--accent)', flexShrink: 0,
  },
  btn: {
    width: '100%', padding: '14px 24px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none', borderRadius: 12, cursor: 'pointer',
    color: '#fff', fontSize: '0.95rem', fontWeight: 700,
    fontFamily: 'inherit', letterSpacing: '0.02em',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
    marginBottom: 16,
  },
  btnDisabled: {
    opacity: 0.7, cursor: 'not-allowed',
    boxShadow: 'none',
  },
  spinnerWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  spinner: {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  note: { fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.5 },
};
