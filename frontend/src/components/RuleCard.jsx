import React from 'react';

export default function RuleCard({ rule, onToggle, pending, changed }) {
  const isActive = rule.active;

  return (
    <div style={{
      ...styles.card,
      borderColor: changed ? 'rgba(99,102,241,0.4)' : isActive ? 'rgba(16,185,129,0.2)' : 'var(--border)',
      background: changed ? 'rgba(99,102,241,0.04)' : 'var(--bg-2)',
    }}>
      {/* Status indicator */}
      <div style={styles.header}>
        <div style={styles.nameRow}>
          <span style={{
            ...styles.dot,
            background: isActive ? 'var(--green)' : 'var(--text-dim)',
            boxShadow: isActive ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
          }} />
          <div>
            <h3 style={styles.name} className="mono">{rule.name}</h3>
            <p style={styles.id} className="mono">{rule.id}</p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => !pending && onToggle(rule.id, !rule.active)}
          disabled={pending}
          style={styles.toggleWrap}
          title={isActive ? 'Deactivate rule' : 'Activate rule'}
        >
          {pending ? (
            <span style={styles.miniSpinner} />
          ) : (
            <div style={{
              ...styles.toggle,
              background: isActive
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'var(--bg-4)',
              boxShadow: isActive ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
            }}>
              <div style={{
                ...styles.toggleKnob,
                transform: isActive ? 'translateX(20px)' : 'translateX(2px)',
              }} />
            </div>
          )}
        </button>
      </div>

      {/* Meta */}
      <div style={styles.body}>
        {rule.description && (
          <p style={styles.desc}>{rule.description}</p>
        )}
        <div style={styles.tags}>
          <span style={{
            ...styles.badge,
            background: isActive ? 'var(--green-dim)' : 'rgba(68,68,90,0.3)',
            color: isActive ? 'var(--green)' : 'var(--text-dim)',
            borderColor: isActive ? 'rgba(16,185,129,0.2)' : 'var(--border)',
          }}>
            {isActive ? '● Active' : '○ Inactive'}
          </span>
          {rule.errorDisplayField && (
            <span style={styles.fieldTag} className="mono">
              {rule.errorDisplayField}
            </span>
          )}
          {changed && (
            <span style={styles.pendingBadge}>Pending deploy</span>
          )}
        </div>
        {rule.errorMessage && (
          <div style={styles.errorMsg}>
            <span style={styles.errorIcon}>!</span>
            <span className="mono" style={styles.errorText}>{rule.errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '20px 22px',
    transition: 'border-color 0.25s, background 0.25s, transform 0.15s',
    cursor: 'default',
  },
  header: {
    display: 'flex', alignItems: 'flex-start',
    justifyContent: 'space-between', gap: 16,
    marginBottom: 14,
  },
  nameRow: { display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 },
  dot: {
    width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
    transition: 'background 0.25s, box-shadow 0.25s',
  },
  name: {
    fontSize: '0.95rem', fontWeight: 500, color: 'var(--text)',
    letterSpacing: '-0.01em', marginBottom: 2,
  },
  id: {
    fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.02em',
  },
  toggleWrap: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: 4, flexShrink: 0,
    display: 'flex', alignItems: 'center',
  },
  toggle: {
    width: 44, height: 24, borderRadius: 12, position: 'relative',
    transition: 'background 0.25s, box-shadow 0.25s',
  },
  toggleKnob: {
    position: 'absolute', top: 2, width: 20, height: 20,
    borderRadius: '50%', background: '#fff',
    transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },
  miniSpinner: {
    display: 'inline-block', width: 18, height: 18,
    border: '2px solid var(--border)',
    borderTopColor: 'var(--accent)', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  body: {},
  desc: { fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: {
    fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.04em',
    padding: '3px 9px', borderRadius: 6, border: '1px solid',
    transition: 'all 0.25s',
  },
  fieldTag: {
    fontSize: '0.73rem', color: 'var(--text-dim)',
    padding: '3px 9px', borderRadius: 6,
    background: 'var(--bg-4)', border: '1px solid var(--border)',
  },
  pendingBadge: {
    fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.04em',
    padding: '3px 9px', borderRadius: 6,
    background: 'rgba(99,102,241,0.15)', color: 'var(--accent)',
    border: '1px solid rgba(99,102,241,0.3)',
  },
  errorMsg: {
    display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8,
    background: 'var(--red-dim)', borderRadius: 8, padding: '8px 10px',
    border: '1px solid rgba(239,68,68,0.15)',
  },
  errorIcon: {
    color: 'var(--red)', fontSize: '0.75rem', fontWeight: 700,
    flexShrink: 0, marginTop: 1,
  },
  errorText: {
    fontSize: '0.78rem', color: 'var(--red)', lineHeight: 1.4, wordBreak: 'break-word',
  },
};
