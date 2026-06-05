import React, { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function CallbackPage({ onSuccess, onError }) {
  const { handleCallback } = useAuth();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      onError(params.get('error_description') || error);
      return;
    }

    if (!code || !state) {
      onError('Missing code or state in callback');
      return;
    }

    handleCallback(code, state)
      .then(() => onSuccess())
      .catch(e => onError(e.message));
  }, [handleCallback, onSuccess, onError]);

  return (
    <div style={styles.wrap}>
      <div style={styles.card} className="animate-fade-up">
        <div style={styles.iconWrap}>
          <div style={styles.ring} />
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
              stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 style={styles.title}>Authenticating…</h2>
        <p style={styles.sub}>Exchanging tokens with Salesforce</p>
        <div style={styles.progress}>
          <div style={styles.progressBar} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg)',
  },
  card: {
    background: 'var(--bg-2)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '48px 40px', textAlign: 'center',
    maxWidth: 360, width: '100%',
  },
  iconWrap: {
    position: 'relative', display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, marginBottom: 24,
  },
  ring: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    border: '2px solid var(--accent)',
    animation: 'spin 1.5s linear infinite',
    borderTopColor: 'transparent',
  },
  title: { fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 },
  progress: {
    height: 3, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden',
  },
  progressBar: {
    height: '100%', width: '60%',
    background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease infinite',
  },
};
